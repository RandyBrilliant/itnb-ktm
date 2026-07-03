from django.test import SimpleTestCase

from account.intake_year import institutional_id_prefix_for_intake_year, parse_intake_year


class IntakeYearTests(SimpleTestCase):
    def test_parse_intake_year(self):
        self.assertEqual(parse_intake_year("2021"), 2021)
        self.assertIsNone(parse_intake_year(""))
        self.assertIsNone(parse_intake_year("abc"))
        self.assertIsNone(parse_intake_year("1999"))

    def test_institutional_id_prefix(self):
        self.assertEqual(institutional_id_prefix_for_intake_year(2018), "18")
        self.assertEqual(institutional_id_prefix_for_intake_year(2025), "25")
