"""Webinar schedule helpers (WIB / Asia-Jakarta)."""

from __future__ import annotations

from datetime import datetime, time, timedelta

from django.utils import timezone

ATTENDANCE_QR_LEAD_MINUTES = 30
CHECK_IN_LEAD_HOURS = 1


def normalize_registration_opens(value: datetime) -> datetime:
    """Snap registration open time to 00:00:00 on the selected local date."""
    local = timezone.localtime(value)
    return timezone.make_aware(
        datetime.combine(local.date(), time.min),
        timezone.get_current_timezone(),
    )


def normalize_registration_closes(value: datetime) -> datetime:
    """Snap registration close time to 23:59:59 on the selected local date."""
    local = timezone.localtime(value)
    return timezone.make_aware(
        datetime.combine(local.date(), time(23, 59, 59)),
        timezone.get_current_timezone(),
    )


def _aware_start(webinar) -> datetime:
    start = webinar.starts_at
    if timezone.is_naive(start):
        start = timezone.make_aware(start, timezone.get_current_timezone())
    return start


def _session_end(webinar) -> datetime:
    """End of the webinar day in local time (23:59:59.999999)."""
    local_start = timezone.localtime(_aware_start(webinar))
    return local_start.replace(hour=23, minute=59, second=59, microsecond=999999)


def webinar_session_contains(webinar, now: datetime | None = None) -> bool:
    """True while the webinar is in session (from start time through end of that day, WIB)."""
    now = now or timezone.now()
    start = _aware_start(webinar)
    local_start = timezone.localtime(start)
    local_now = timezone.localtime(now)
    end_of_day = local_start.replace(hour=23, minute=59, second=59, microsecond=999999)
    return local_start <= local_now <= end_of_day


def attendance_qr_opens_at(webinar) -> datetime:
    """When the admin attendance QR/code may be shown (30 minutes before start)."""
    return _aware_start(webinar) - timedelta(minutes=ATTENDANCE_QR_LEAD_MINUTES)


def check_in_opens_at(webinar) -> datetime:
    """When students may begin checking in (1 hour before start)."""
    return _aware_start(webinar) - timedelta(hours=CHECK_IN_LEAD_HOURS)


def attendance_qr_available(webinar, now: datetime | None = None) -> bool:
    """QR polling is allowed from 30 minutes before start through end of session day."""
    now = now or timezone.now()
    return attendance_qr_opens_at(webinar) <= now <= _session_end(webinar)


def check_in_window_open(webinar, now: datetime | None = None) -> bool:
    """Students may check in from 1 hour before start through end of session day."""
    now = now or timezone.now()
    return check_in_opens_at(webinar) <= now <= _session_end(webinar)


def validate_registration_against_start(
    *,
    starts_at: datetime,
    registration_opens_at: datetime | None,
    registration_closes_at: datetime | None,
) -> dict[str, str]:
    """
    Ensure registration dates are not on or after the webinar start.
    Returns field → message errors (empty dict if valid).
    """
    errors: dict[str, str] = {}
    if registration_opens_at is not None:
        opens = normalize_registration_opens(registration_opens_at)
        if opens >= starts_at:
            errors["registration_opens_at"] = (
                "Registration open date must be before the webinar start date and time."
            )
    if registration_closes_at is not None:
        closes = normalize_registration_closes(registration_closes_at)
        if closes >= starts_at:
            errors["registration_closes_at"] = (
                "Registration must close before the webinar starts. "
                "Choose an earlier registration end date."
            )
    return errors
