"""Fixed department choices for student and alumni records."""

from __future__ import annotations

STUDENT_DEPARTMENTS: tuple[str, ...] = (
    "Management",
    "Information Systems",
    "Accounting",
    "International Trade",
    "Entrepreneurship",
    "Master in Management",
    "Hospitality Management",
)

STUDENT_DEPARTMENT_SET = frozenset(STUDENT_DEPARTMENTS)


def format_student_department_choices() -> str:
    return ", ".join(STUDENT_DEPARTMENTS)


def normalize_student_department(value: object | None) -> str:
    if value is None:
        return ""
    return str(value).strip()


def resolve_student_department(value: object | None) -> tuple[str | None, str | None]:
    """Return (normalized department, error message). Empty department is allowed."""
    text = normalize_student_department(value)
    if not text:
        return "", None
    if text not in STUDENT_DEPARTMENT_SET:
        return None, f"Invalid department. Choose one of: {format_student_department_choices()}."
    return text, None
