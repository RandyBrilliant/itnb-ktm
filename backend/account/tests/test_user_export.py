import io
from datetime import date

from django.test import TestCase
from openpyxl import load_workbook
from rest_framework.test import APIClient

from account.models import CustomUser, LecturerProfile, StaffProfile, UserRole


def _rows(response):
    wb = load_workbook(io.BytesIO(response.content))
    return [list(r) for r in wb.active.iter_rows(values_only=True)]


class UserExportTests(TestCase):
    url = "/api/users/export/"

    @classmethod
    def setUpTestData(cls):
        cls.admin = CustomUser.objects.create_user(
            email="admin@example.com", password="pw", role=UserRole.ADMIN, full_name="Admin"
        )
        cls.student = CustomUser.objects.create_user(
            email="21001@import.student.itnb.ac.id",
            password="pw",
            role=UserRole.STUDENT,
            full_name="=HYPERLINK(\"http://evil\")",
            institutional_id="21001",
            department="Management",
            date_of_birth=date(2003, 5, 15),
        )
        cls.alumni = CustomUser.objects.create_user(
            email="alumni@example.com",
            password="pw",
            role=UserRole.ALUMNI,
            full_name="Ani Alumni",
            institutional_id="18002",
            alumni_year=2022,
            is_active=False,
        )
        cls.staff = CustomUser.objects.create_user(
            email="staff@example.com", password="pw", role=UserRole.STAFF, full_name="Sam Staff"
        )
        StaffProfile.objects.create(user=cls.staff, staff_role="Finance", can_issue_certificates=True)
        cls.lecturer = CustomUser.objects.create_user(
            email="lect@example.com", password="pw", role=UserRole.LECTURER, full_name="Lee Lecturer"
        )
        LecturerProfile.objects.create(user=cls.lecturer, contact_phone="0812", address="Jl. Merdeka 1")

    def setUp(self):
        self.client = APIClient()
        self.client.force_authenticate(self.admin)

    def test_requires_admin(self):
        self.client.force_authenticate(self.staff)
        self.assertEqual(self.client.get(self.url, {"role": "STUDENT"}).status_code, 403)

    def test_rejects_missing_or_mixed_roles(self):
        self.assertEqual(self.client.get(self.url).status_code, 400)
        self.assertEqual(self.client.get(self.url, {"role": "ADMIN"}).status_code, 400)
        self.assertEqual(self.client.get(self.url, {"roles": "STUDENT,STAFF"}).status_code, 400)

    def test_student_export_uses_filters_and_import_headers(self):
        response = self.client.get(self.url, {"roles": "STUDENT,ALUMNI"})
        self.assertEqual(response.status_code, 200)
        self.assertIn("student_records_", response["Content-Disposition"])
        rows = _rows(response)
        self.assertEqual(
            rows[0][:8],
            ["Email", "Full name", "Institutional ID", "Department", "Place of birth",
             "Date of birth", "Record type", "Graduation year"],
        )
        by_id = {r[2]: r for r in rows[1:]}
        self.assertEqual(set(by_id), {"21001", "18002"})
        # Placeholder email is left blank; formula-looking text stays text.
        self.assertIsNone(by_id["21001"][0])
        self.assertEqual(by_id["21001"][1], '=HYPERLINK("http://evil")')
        self.assertEqual(by_id["18002"][7], 2022)
        self.assertEqual(by_id["18002"][8], 2018)

        inactive = _rows(self.client.get(self.url, {"roles": "STUDENT,ALUMNI", "is_active": "false"}))
        self.assertEqual([r[2] for r in inactive[1:]], ["18002"])

        searched = _rows(self.client.get(self.url, {"role": "ALUMNI", "search": "Ani"}))
        self.assertEqual(len(searched), 2)

    def test_formula_text_is_not_stored_as_formula(self):
        response = self.client.get(self.url, {"role": "STUDENT"})
        cell = load_workbook(io.BytesIO(response.content)).active["B2"]
        self.assertEqual(cell.data_type, "s")

    def test_staff_and_lecturer_exports(self):
        staff_rows = _rows(self.client.get(self.url, {"role": "STAFF"}))
        self.assertEqual(staff_rows[0][5], "Staff role")
        self.assertEqual(staff_rows[1][0], "Sam Staff")
        self.assertEqual(staff_rows[1][5:7], ["Finance", "Yes"])

        lect_rows = _rows(self.client.get(self.url, {"role": "LECTURER"}))
        self.assertEqual(lect_rows[1][0], "Lee Lecturer")
        self.assertEqual(lect_rows[1][5:7], ["0812", "Jl. Merdeka 1"])
