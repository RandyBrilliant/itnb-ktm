"""Shared logic for issuing certificates from a program (Excel batch or manual add)."""

from __future__ import annotations

import logging

from django.db import transaction

from account.models import CustomUser, DigitalCard
from main.models import Certificate, CertificateProgram, CertificateStatus

logger = logging.getLogger(__name__)


def resolve_recipient_user(id_raw: str) -> CustomUser | None:
    """Match Excel/manual ID to a portal user (institutional ID, email, or digital card number)."""
    key = (id_raw or "").strip()
    if not key:
        return None

    user = CustomUser.objects.filter(institutional_id__iexact=key).first()
    if user:
        return user

    if "@" in key:
        user = CustomUser.objects.filter(email__iexact=key).first()
        if user:
            return user

    card = (
        DigitalCard.objects.filter(card_number__iexact=key, is_active=True)
        .select_related("user")
        .first()
    )
    if card:
        return card.user

    return None


def issue_program_certificate(
    program: CertificateProgram,
    display_name: str,
    id_raw: str,
    *,
    clear_suspension: bool = False,
) -> tuple[Certificate | None, str | None]:
    """
    Create or update an ISSUED certificate row for this program (metadata only).
    PDFs are generated on demand when the user downloads — see CertificateViewSet.pdf.
    Returns (certificate, None) or (None, error_code).
    """
    user = resolve_recipient_user(id_raw)
    if not user:
        return None, "no_user"

    defaults = {
        "title": program.title,
        "description": program.description,
        "recipient_name": display_name.strip(),
        "recipient_id_display": id_raw.strip(),
        "issued_by": program.issued_by,
        "issued_date": program.issued_date,
        "valid_until": program.valid_until,
        "status": CertificateStatus.ISSUED,
    }
    if clear_suspension:
        defaults["is_suspended"] = False

    try:
        with transaction.atomic():
            cert, _created = Certificate.objects.update_or_create(
                program=program,
                user=user,
                defaults=defaults,
            )
            if cert.pdf_file:
                cert.pdf_file.delete(save=False)
                cert.pdf_file = None
                cert.save(update_fields=["pdf_file", "updated_at"])
        return cert, None
    except Exception as exc:
        logger.exception("issue_program_certificate failed: %s", exc)
        raise
