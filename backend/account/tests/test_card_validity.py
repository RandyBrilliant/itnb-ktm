from datetime import date

from django.test import SimpleTestCase

from account.services.card_validity import student_card_valid_until


class StudentCardValidUntilTests(SimpleTestCase):
    def test_cohort_18_expires_end_of_2022(self):
        self.assertEqual(student_card_valid_until("18012345"), date(2022, 12, 31))

    def test_cohort_22_expires_end_of_2026(self):
        self.assertEqual(student_card_valid_until("22123456"), date(2026, 12, 31))

    def test_ignores_non_digit_prefix(self):
        self.assertIsNone(student_card_valid_until("DEMO-STU-001"))

    def test_requires_at_least_two_characters(self):
        self.assertIsNone(student_card_valid_until("1"))
