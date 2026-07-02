from django.test import SimpleTestCase, override_settings

from main.services.webinar_attendance import (
    build_attendance_scan_url,
    generate_attendance_token,
    verify_attendance_token,
)


class WebinarAttendanceTests(SimpleTestCase):
    def test_generate_and_verify_token(self):
        secret = "test-secret"
        token = generate_attendance_token(secret, "in")
        self.assertTrue(verify_attendance_token(secret, "in", token))

    @override_settings(FRONTEND_URL="http://localhost:5173")
    def test_build_attendance_scan_url(self):
        url = build_attendance_scan_url(12, "in", "ABCD1234")
        self.assertEqual(
            url,
            "http://localhost:5173/webinars/12/attend?token=ABCD1234&phase=in",
        )
