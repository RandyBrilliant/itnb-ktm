"""Parse and import certificates from the legacy itnb_certificate MySQL dump."""

from __future__ import annotations

import re
from dataclasses import dataclass
from datetime import date
from pathlib import Path

from django.db import transaction
from django.utils import timezone

from account.models import CustomUser
from main.models import Certificate, CertificateStatus

_LEGACY_ROW_RE = re.compile(
    r"\('([0-9a-f]{64})','((?:[^'\\]|\\.)*)',(\d+),'((?:[^'\\]|\\.)*)','((?:[^'\\]|\\.)*)',"
    r"'((?:[^'\\]|\\.)*)','((?:[^'\\]|\\.)*)','((?:[^'\\]|\\.)*)','((?:[^'\\]|\\.)*)',(\d+),"
    r"(NULL|'(?:[^'\\]|\\.)*'),'((?:[^'\\]|\\.)*)'\)"
)

_MONTHS = {
    "january": 1,
    "february": 2,
    "march": 3,
    "april": 4,
    "may": 5,
    "june": 6,
    "july": 7,
    "august": 8,
    "september": 9,
    "october": 10,
    "november": 11,
    "december": 12,
}


@dataclass(frozen=True)
class LegacyCertificateRow:
    code: str
    certificate_no: str
    sequence_no: int
    recipient_name: str
    institutional_id: str
    institution: str
    event_title: str
    role: str
    event_date_raw: str
    download_count: int
    scanned_on: str | None
    pdf_url: str


@dataclass
class LegacyImportStats:
    parsed: int = 0
    created: int = 0
    updated: int = 0
    skipped_no_id: int = 0
    skipped_no_user: int = 0
    errors: int = 0


def _unescape_mysql(value: str) -> str:
    return value.replace("\\'", "'").replace("\\\\", "\\")


def parse_legacy_certificate_sql(path: Path) -> list[LegacyCertificateRow]:
    content = path.read_text(encoding="utf-8", errors="replace")
    rows: list[LegacyCertificateRow] = []
    for match in _LEGACY_ROW_RE.finditer(content):
        scanned_raw = match.group(11)
        scanned_on = None if scanned_raw == "NULL" else _unescape_mysql(scanned_raw.strip("'"))
        rows.append(
            LegacyCertificateRow(
                code=match.group(1),
                certificate_no=_unescape_mysql(match.group(2)),
                sequence_no=int(match.group(3)),
                recipient_name=_unescape_mysql(match.group(4)),
                institutional_id=_unescape_mysql(match.group(5)).strip(),
                institution=_unescape_mysql(match.group(6)).strip(),
                event_title=_unescape_mysql(match.group(7)).strip(),
                role=_unescape_mysql(match.group(8)).strip(),
                event_date_raw=_unescape_mysql(match.group(9)).strip(),
                download_count=int(match.group(10)),
                scanned_on=scanned_on,
                pdf_url=_unescape_mysql(match.group(12)).strip(),
            )
        )
    return rows


def parse_legacy_certificate_date(raw: str) -> date | None:
    """Parse strings like '16th September 2020' or '25th - 26th November 2023'."""
    text = (raw or "").strip()
    if not text:
        return None

    match = re.match(
        r"^(\d{1,2})(?:st|nd|rd|th)?\s*(?:-\s*\d{1,2}(?:st|nd|rd|th)?\s+)?([A-Za-z]+)\s+(\d{4})$",
        text,
    )
    if not match:
        return None

    day = int(match.group(1))
    month = _MONTHS.get(match.group(2).lower())
    year = int(match.group(3))
    if not month:
        return None

    try:
        return date(year, month, day)
    except ValueError:
        return None


def resolve_import_user(row: LegacyCertificateRow) -> CustomUser | None:
    """Match portal users by institutional ID only."""
    inst = row.institutional_id.strip()
    if not inst:
        return None
    return CustomUser.objects.filter(institutional_id__iexact=inst).first()


def build_legacy_description(row: LegacyCertificateRow) -> str:
    parts: list[str] = []
    if row.role:
        parts.append(f"Role: {row.role}")
    if row.institution:
        parts.append(f"Institution: {row.institution}")
    if row.certificate_no:
        parts.append(f"Certificate no.: {row.certificate_no}")
    if row.event_date_raw:
        parts.append(f"Event date: {row.event_date_raw}")
    if row.download_count:
        parts.append(f"Legacy downloads: {row.download_count}")
    return "\n".join(parts)


def import_legacy_certificate_row(row: LegacyCertificateRow) -> str:
    """
    Import one legacy row. Returns 'created', 'updated', 'skipped_no_id',
    'skipped_no_user', or 'error'. Idempotent on legacy_code.
    """
    inst = row.institutional_id.strip()
    if not inst:
        return "skipped_no_id"

    user = resolve_import_user(row)
    if not user:
        return "skipped_no_user"

    issued_date = parse_legacy_certificate_date(row.event_date_raw) or timezone.localdate()

    defaults = {
        "user": user,
        "program": None,
        "title": row.event_title or "Certificate",
        "description": build_legacy_description(row),
        "recipient_name": row.recipient_name,
        "recipient_id_display": inst,
        "image_url": row.pdf_url,
        "legacy_pdf_url": row.pdf_url,
        "issued_date": issued_date,
        "valid_until": None,
        "status": CertificateStatus.ISSUED,
        "is_suspended": False,
    }

    cert, created = Certificate.objects.update_or_create(
        legacy_code=row.code,
        defaults=defaults,
    )
    return "created" if created else "updated"


def analyze_legacy_import(path: Path, *, limit: int | None = None) -> LegacyImportStats:
    """Dry-run: count how many rows would import vs skip."""
    rows = parse_legacy_certificate_sql(path)
    if limit is not None:
        rows = rows[:limit]

    stats = LegacyImportStats(parsed=len(rows))
    known_ids = set(
        CustomUser.objects.exclude(institutional_id__isnull=True)
        .exclude(institutional_id="")
        .values_list("institutional_id", flat=True)
    )
    known_ids_lower = {value.lower() for value in known_ids}

    for row in rows:
        inst = row.institutional_id.strip()
        if not inst:
            stats.skipped_no_id += 1
        elif inst.lower() not in known_ids_lower:
            stats.skipped_no_user += 1
        else:
            stats.created += 1

    return stats


def import_legacy_certificates_from_sql(
    path: Path,
    *,
    dry_run: bool = False,
    limit: int | None = None,
) -> LegacyImportStats:
    rows = parse_legacy_certificate_sql(path)
    if limit is not None:
        rows = rows[:limit]

    stats = LegacyImportStats(parsed=len(rows))
    if dry_run:
        return analyze_legacy_import(path, limit=limit)

    with transaction.atomic():
        for row in rows:
            try:
                result = import_legacy_certificate_row(row)
                if result == "created":
                    stats.created += 1
                elif result == "updated":
                    stats.updated += 1
                elif result == "skipped_no_id":
                    stats.skipped_no_id += 1
                elif result == "skipped_no_user":
                    stats.skipped_no_user += 1
                else:
                    stats.errors += 1
            except Exception:
                stats.errors += 1

    return stats


__all__ = [
    "LegacyCertificateRow",
    "LegacyImportStats",
    "analyze_legacy_import",
    "import_legacy_certificates_from_sql",
    "parse_legacy_certificate_date",
    "parse_legacy_certificate_sql",
]
