"""Derive intake (cohort) year from institutional ID (NIM) prefixes."""

from __future__ import annotations


def parse_intake_year(value: object | None) -> int | None:
    if value is None:
        return None
    text = str(value).strip()
    if not text or not text.isdigit():
        return None
    year = int(text)
    if year < 2000 or year > 2099:
        return None
    return year


def institutional_id_prefix_for_intake_year(year: int) -> str:
    """First two NIM digits for a cohort year, e.g. 2018 → ``18``."""
    return f"{year % 100:02d}"
