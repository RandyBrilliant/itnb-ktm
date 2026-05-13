"""Parse Excel files for bulk student account creation."""

from __future__ import annotations

import io
import re
from typing import Any

from openpyxl import load_workbook

EMAIL_HEADERS = frozenset({"email", "e-mail", "e mail", "surel"})
FULL_NAME_HEADERS = frozenset(
    {
        "full name",
        "full_name",
        "name",
        "nama",
        "nama lengkap",
        "student name",
    }
)
INST_HEADERS = frozenset(
    {
        "institutional id",
        "institutional_id",
        "nim",
        "student id",
        "official id",
        "nomor induk",
        "nim/nip",
    }
)
DEPT_HEADERS = frozenset({"department", "departemen", "jurusan", "program studi", "fakultas"})
PWD_HEADERS = frozenset({"password", "kata sandi", "pass"})


def _norm(cell_value: Any) -> str:
    if cell_value is None:
        return ""
    s = str(cell_value).strip()
    s = re.sub(r"\s+", " ", s)
    return s.lower()


def _cell_str(cell_value: Any) -> str:
    if cell_value is None:
        return ""
    return str(cell_value).strip()


def parse_student_import_xlsx(
    raw: bytes,
    *,
    max_rows: int = 5_000,
) -> tuple[list[dict[str, Any]], list[str]]:
    """
    Read first sheet; row 1 = headers. Returns (rows, parse_errors).
    Each row: {"row", "email", "full_name", "institutional_id", "department", "password"}.
    """
    errors: list[str] = []
    rows_out: list[dict[str, Any]] = []

    try:
        wb = load_workbook(filename=io.BytesIO(raw), read_only=True, data_only=True)
    except Exception as exc:
        return [], [f"Could not read Excel file: {exc}"]

    try:
        ws = wb.active
        header_map: dict[str, int] = {}
        header_row_idx = 1

        first = next(ws.iter_rows(min_row=1, max_row=1, values_only=True), None)
        if not first:
            return [], ["The spreadsheet is empty."]

        for ci, cell in enumerate(first):
            key = _norm(cell)
            if not key:
                continue
            if key in EMAIL_HEADERS:
                header_map["email"] = ci
            elif key in FULL_NAME_HEADERS:
                header_map["full_name"] = ci
            elif key in INST_HEADERS:
                header_map["institutional_id"] = ci
            elif key in DEPT_HEADERS:
                header_map["department"] = ci
            elif key in PWD_HEADERS:
                header_map["password"] = ci

        if "email" not in header_map or "full_name" not in header_map:
            return [], [
                "Missing required columns. The first row must include headers for Email and Full name "
                "(e.g. columns labeled Email and Full name)."
            ]

        seen_emails: set[str] = set()

        def col(row: tuple[Any, ...], name: str) -> str:
            if name not in header_map:
                return ""
            idx = header_map[name]
            if idx >= len(row):
                return ""
            return _cell_str(row[idx])

        for ri, row in enumerate(
            ws.iter_rows(min_row=header_row_idx + 1, max_row=header_row_idx + max_rows, values_only=True),
            start=header_row_idx + 1,
        ):
            if not row:
                continue
            email = col(row, "email")
            full_name = col(row, "full_name")
            if not email and not full_name:
                continue
            if not email:
                errors.append(f"Row {ri}: missing email.")
                continue
            if not full_name:
                errors.append(f"Row {ri}: missing full name.")
                continue
            el = email.strip().lower()
            if el in seen_emails:
                errors.append(f"Row {ri}: duplicate email in file ({email}).")
                continue
            seen_emails.add(el)

            inst_raw = col(row, "institutional_id")
            rows_out.append(
                {
                    "row": ri,
                    "email": email.strip(),
                    "full_name": full_name.strip(),
                    "institutional_id": inst_raw.strip() if inst_raw else None,
                    "department": col(row, "department") or "",
                    "password": col(row, "password") or None,
                }
            )
    finally:
        wb.close()

    return rows_out, errors
