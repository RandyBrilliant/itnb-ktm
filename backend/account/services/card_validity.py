"""Student digital card validity derived from institutional ID (NIM)."""

from datetime import date


def student_card_valid_until(institutional_id: str) -> date | None:
    """
    Derive card expiry from the first two digits of the student ID.

    Example: ID starting with ``18`` → cohort 2018 → valid until 31 Dec 2022.
    """
    raw = (institutional_id or "").strip()
    if len(raw) < 2 or not raw[:2].isdigit():
        return None

    cohort_year = 2000 + int(raw[:2])
    return date(cohort_year + 4, 12, 31)


def effective_card_valid_until(card) -> date:
    """Return the authoritative valid-until date for a digital card."""
    user = card.user
    card_type = getattr(card, "card_type", None)
    role = getattr(user, "role", None)

    if card_type == "STUDENT" or role == "STUDENT":
        computed = student_card_valid_until(getattr(user, "institutional_id", "") or "")
        if computed is not None:
            return computed

    return card.valid_until
