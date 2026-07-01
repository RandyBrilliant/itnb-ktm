"""Placeholder emails assigned during bulk student import (no real inbox)."""

from __future__ import annotations

import re

IMPORT_PLACEHOLDER_EMAIL_DOMAIN = "import.student.itnb.ac.id"


def is_placeholder_email(email: str | None) -> bool:
    if not email:
        return False
    return email.strip().lower().endswith(f"@{IMPORT_PLACEHOLDER_EMAIL_DOMAIN}")


def user_requires_email_setup(user) -> bool:
    """True until the user replaces a bulk-import placeholder with a verified real email."""
    return is_placeholder_email(getattr(user, "email", None))


def synthetic_student_email(institutional_id: str) -> str:
    """Build a unique internal email when the spreadsheet has no address."""
    local = re.sub(r"[^a-zA-Z0-9]+", ".", institutional_id.strip()).strip(".").lower()
    if not local:
        local = "student"
    return f"{local}@{IMPORT_PLACEHOLDER_EMAIL_DOMAIN}"
