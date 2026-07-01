from datetime import datetime, timedelta

from django.test import SimpleTestCase
from django.utils import timezone

from main.services.webinar_schedule import (
    ATTENDANCE_QR_LEAD_MINUTES,
    CHECK_IN_LEAD_HOURS,
    attendance_qr_available,
    attendance_qr_opens_at,
    check_in_opens_at,
    check_in_window_open,
    normalize_registration_closes,
    normalize_registration_opens,
    validate_registration_against_start,
    webinar_session_contains,
)


def _stub_webinar(start: datetime):
    return type("WebinarStub", (), {"starts_at": start})()


class WebinarScheduleTests(SimpleTestCase):
    def test_normalize_registration_opens_to_midnight(self):
        tz = timezone.get_current_timezone()
        value = timezone.make_aware(datetime(2026, 7, 15, 14, 30), tz)
        normalized = normalize_registration_opens(value)
        local = timezone.localtime(normalized)
        self.assertEqual(local.hour, 0)
        self.assertEqual(local.minute, 0)
        self.assertEqual(local.date().isoformat(), "2026-07-15")

    def test_normalize_registration_closes_to_end_of_day(self):
        tz = timezone.get_current_timezone()
        value = timezone.make_aware(datetime(2026, 7, 20, 9, 0), tz)
        normalized = normalize_registration_closes(value)
        local = timezone.localtime(normalized)
        self.assertEqual(local.hour, 23)
        self.assertEqual(local.minute, 59)
        self.assertEqual(local.date().isoformat(), "2026-07-20")

    def test_webinar_session_contains_same_day(self):
        tz = timezone.get_current_timezone()
        webinar = _stub_webinar(timezone.make_aware(datetime(2026, 7, 1, 10, 0), tz))
        during = timezone.make_aware(datetime(2026, 7, 1, 15, 0), tz)
        before = timezone.make_aware(datetime(2026, 7, 1, 9, 0), tz)
        after = timezone.make_aware(datetime(2026, 7, 2, 0, 30), tz)

        self.assertTrue(webinar_session_contains(webinar, during))
        self.assertFalse(webinar_session_contains(webinar, before))
        self.assertFalse(webinar_session_contains(webinar, after))

    def test_check_in_window_one_hour_before(self):
        tz = timezone.get_current_timezone()
        start = timezone.make_aware(datetime(2026, 7, 1, 10, 0), tz)
        webinar = _stub_webinar(start)
        too_early = start - timedelta(hours=1, minutes=1)
        opens = start - timedelta(hours=1)
        during = start + timedelta(minutes=30)

        self.assertFalse(check_in_window_open(webinar, too_early))
        self.assertTrue(check_in_window_open(webinar, opens))
        self.assertTrue(check_in_window_open(webinar, during))
        self.assertEqual(check_in_opens_at(webinar), opens)

    def test_attendance_qr_thirty_minutes_before(self):
        tz = timezone.get_current_timezone()
        start = timezone.make_aware(datetime(2026, 7, 1, 10, 0), tz)
        webinar = _stub_webinar(start)
        too_early = start - timedelta(minutes=31)
        opens = start - timedelta(minutes=ATTENDANCE_QR_LEAD_MINUTES)
        during = start

        self.assertFalse(attendance_qr_available(webinar, too_early))
        self.assertTrue(attendance_qr_available(webinar, opens))
        self.assertTrue(attendance_qr_available(webinar, during))
        self.assertEqual(attendance_qr_opens_at(webinar), opens)

    def test_validate_registration_against_start(self):
        tz = timezone.get_current_timezone()
        starts = timezone.make_aware(datetime(2026, 7, 10, 14, 0), tz)
        opens_ok = timezone.make_aware(datetime(2026, 7, 1, 0, 0), tz)
        closes_ok = timezone.make_aware(datetime(2026, 7, 9, 0, 0), tz)
        closes_bad = timezone.make_aware(datetime(2026, 7, 10, 0, 0), tz)

        self.assertEqual(
            validate_registration_against_start(
                starts_at=starts,
                registration_opens_at=opens_ok,
                registration_closes_at=closes_ok,
            ),
            {},
        )
        errors = validate_registration_against_start(
            starts_at=starts,
            registration_opens_at=opens_ok,
            registration_closes_at=closes_bad,
        )
        self.assertIn("registration_closes_at", errors)

    def test_check_in_lead_constant(self):
        self.assertEqual(CHECK_IN_LEAD_HOURS, 1)
