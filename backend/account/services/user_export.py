"""Build .xlsx exports of student, staff, and lecturer records for admins."""

from __future__ import annotations

import io
from collections.abc import Callable, Iterable
from typing import Any

from django.utils import timezone
from openpyxl import Workbook
from openpyxl.styles import Alignment, Font, PatternFill
from openpyxl.utils import get_column_letter

from account.models import CustomUser, UserRole
from account.placeholder_email import is_placeholder_email

XLSX_CONTENT_TYPE = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"

# Roles that can be exported, grouped the way the admin pages list them.
EXPORTABLE_ROLES = frozenset({UserRole.STUDENT, UserRole.ALUMNI, UserRole.STAFF, UserRole.LECTURER})

Column = tuple[str, int, Callable[[CustomUser], Any]]


def _yes_no(value: bool) -> str:
    return "Yes" if value else "No"


def _status(user: CustomUser) -> str:
    return "Active" if user.is_active else "Inactive"


def _real_email(user: CustomUser) -> str:
    # Placeholder addresses from bulk import are not real inboxes; leave the cell empty
    # (which is also what the import template expects for "no email").
    return "" if is_placeholder_email(user.email) else user.email


def _card(user: CustomUser):
    # Accessing a missing reverse one-to-one raises instead of returning None.
    try:
        return user.digital_card
    except CustomUser.digital_card.RelatedObjectDoesNotExist:
        return None


def _card_number(user: CustomUser) -> str:
    card = _card(user)
    return card.card_number if card else ""


def _card_valid_until(user: CustomUser):
    card = _card(user)
    return card.valid_until if card else None


def _joined(user: CustomUser):
    return timezone.localtime(user.joined_date).date() if user.joined_date else None


def _intake_year(user: CustomUser):
    nim = (user.institutional_id or "").strip()
    if len(nim) >= 2 and nim[:2].isdigit():
        return 2000 + int(nim[:2])
    return None


def _staff_profile(user: CustomUser):
    try:
        return user.staff_profile
    except CustomUser.staff_profile.RelatedObjectDoesNotExist:
        return None


def _lecturer_profile(user: CustomUser):
    try:
        return user.lecturer_profile
    except CustomUser.lecturer_profile.RelatedObjectDoesNotExist:
        return None


# The first eight student columns use the import template's header names, so an
# exported sheet can be edited and re-imported.
STUDENT_COLUMNS: list[Column] = [
    ("Email", 30, _real_email),
    ("Full name", 28, lambda u: u.full_name),
    ("Institutional ID", 18, lambda u: u.institutional_id or ""),
    ("Department", 24, lambda u: u.department),
    ("Place of birth", 18, lambda u: u.place_of_birth),
    ("Date of birth", 14, lambda u: u.date_of_birth),
    ("Record type", 13, lambda u: u.role),
    ("Graduation year", 16, lambda u: u.alumni_year),
    ("Intake year", 12, _intake_year),
    ("Status", 11, _status),
    ("Email verified", 14, lambda u: _yes_no(u.email_verified)),
    ("Card number", 22, _card_number),
    ("Card valid until", 16, _card_valid_until),
    ("Joined", 14, _joined),
]

STAFF_COLUMNS: list[Column] = [
    ("Full name", 28, lambda u: u.full_name),
    ("Institutional ID", 18, lambda u: u.institutional_id or ""),
    ("Email", 30, _real_email),
    ("Department", 24, lambda u: u.department),
    ("Position", 22, lambda u: u.position),
    ("Staff role", 22, lambda u: getattr(_staff_profile(u), "staff_role", "")),
    (
        "Can issue certificates",
        20,
        lambda u: _yes_no(getattr(_staff_profile(u), "can_issue_certificates", False)),
    ),
    (
        "Can manage benefits",
        19,
        lambda u: _yes_no(getattr(_staff_profile(u), "can_manage_benefits", False)),
    ),
    ("Status", 11, _status),
    ("Email verified", 14, lambda u: _yes_no(u.email_verified)),
    ("Card number", 22, _card_number),
    ("Joined", 14, _joined),
]

LECTURER_COLUMNS: list[Column] = [
    ("Full name", 28, lambda u: u.full_name),
    ("Institutional ID", 18, lambda u: u.institutional_id or ""),
    ("Email", 30, _real_email),
    ("Department", 24, lambda u: u.department),
    ("Position", 22, lambda u: u.position),
    ("Phone / WhatsApp", 18, lambda u: getattr(_lecturer_profile(u), "contact_phone", "")),
    ("Address", 40, lambda u: getattr(_lecturer_profile(u), "address", "")),
    ("Status", 11, _status),
    ("Email verified", 14, lambda u: _yes_no(u.email_verified)),
    ("Card number", 22, _card_number),
    ("Joined", 14, _joined),
]

# Sheet title, columns, and download filename stem per export kind.
EXPORT_KINDS: dict[str, tuple[str, list[Column], str]] = {
    "students": ("Student records", STUDENT_COLUMNS, "student_records"),
    "staff": ("Staff records", STAFF_COLUMNS, "staff_records"),
    "lecturers": ("Lecturer records", LECTURER_COLUMNS, "lecturer_records"),
}


def export_kind_for_roles(roles: set[str]) -> str | None:
    """Pick the column layout for a set of roles, or None if they can't be exported together."""
    if not roles or not roles <= EXPORTABLE_ROLES:
        return None
    if roles <= {UserRole.STUDENT, UserRole.ALUMNI}:
        return "students"
    if roles == {UserRole.STAFF}:
        return "staff"
    if roles == {UserRole.LECTURER}:
        return "lecturers"
    return None


def build_user_export_workbook(kind: str, users: Iterable[CustomUser]) -> tuple[io.BytesIO, str]:
    """Return the .xlsx bytes and a dated filename for the given export kind."""
    sheet_title, columns, filename_stem = EXPORT_KINDS[kind]

    wb = Workbook()
    ws = wb.active
    ws.title = sheet_title

    header_font = Font(bold=True, color="FFFFFF")
    header_fill = PatternFill("solid", fgColor="AF0F24")
    for col_idx, (header, width, _) in enumerate(columns, start=1):
        cell = ws.cell(row=1, column=col_idx, value=header)
        cell.font = header_font
        cell.fill = header_fill
        cell.alignment = Alignment(horizontal="center", vertical="center", wrap_text=True)
        ws.column_dimensions[get_column_letter(col_idx)].width = width

    row_idx = 1
    for user in users:
        row_idx += 1
        for col_idx, (_, _, getter) in enumerate(columns, start=1):
            value = getter(user)
            cell = ws.cell(row=row_idx, column=col_idx, value=value if value != "" else None)
            if isinstance(value, str):
                # openpyxl stores text starting with "=" as a formula; force plain text so
                # user-entered names/addresses can never run as formulas in Excel.
                cell.data_type = "s"
            elif hasattr(value, "year") and hasattr(value, "month"):
                cell.number_format = "yyyy-mm-dd"

    ws.freeze_panes = "A2"
    if row_idx > 1:
        ws.auto_filter.ref = f"A1:{get_column_letter(len(columns))}{row_idx}"

    buf = io.BytesIO()
    wb.save(buf)
    buf.seek(0)
    filename = f"{filename_stem}_{timezone.localdate():%Y-%m-%d}.xlsx"
    return buf, filename
