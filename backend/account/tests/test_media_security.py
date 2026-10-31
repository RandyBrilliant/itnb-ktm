import shutil
import tempfile
from io import StringIO

from django.core.cache import cache
from django.core.files.base import ContentFile
from django.core.files.storage import default_storage
from django.core.management import call_command
from django.test import SimpleTestCase, TestCase, override_settings

from account.models import CustomUser
from backend.uploads import RANDOM_NAME_RE, RandomFilename


class RandomFilenameTests(SimpleTestCase):
    def test_name_is_random_and_keeps_folder_and_extension(self):
        upload_to = RandomFilename("profile_photos/%Y/%m/")
        first = upload_to(None, "123456789.WEBP")
        second = upload_to(None, "123456789.WEBP")

        self.assertRegex(first, r"^profile_photos/\d{4}/\d{2}/[0-9a-f]{32}\.webp$")
        self.assertNotEqual(first, second)
        self.assertNotIn("123456789", first)


class AdminLoginThrottleTests(TestCase):
    def setUp(self):
        cache.clear()

    def test_login_posts_are_rate_limited(self):
        statuses = [
            self.client.post("/admin/login/", {"username": "x@example.com", "password": "wrong"}).status_code
            for _ in range(11)
        ]

        self.assertNotIn(429, statuses[:10])
        self.assertEqual(statuses[10], 429)

    def test_login_page_is_not_rate_limited(self):
        cache.set("throttle_auth_127.0.0.1", [9e18] * 100, 3600)

        self.assertEqual(self.client.get("/admin/login/").status_code, 200)


class RandomizeMediaFilenamesCommandTests(TestCase):
    def setUp(self):
        self.media_root = tempfile.mkdtemp()
        self.addCleanup(shutil.rmtree, self.media_root)
        override = override_settings(MEDIA_ROOT=self.media_root)
        override.enable()
        self.addCleanup(override.disable)

        self.user = CustomUser.objects.create_user(email="student@example.com", full_name="Student")
        old = default_storage.save("profile_photos/2026/07/123456789.webp", ContentFile(b"photo"))
        CustomUser.objects.filter(pk=self.user.pk).update(photo=old)
        self.old = old

    def test_dry_run_changes_nothing(self):
        out = StringIO()
        call_command("randomize_media_filenames", stdout=out)

        self.user.refresh_from_db()
        self.assertEqual(self.user.photo.name, self.old)
        self.assertIn("Would rename 1 file(s)", out.getvalue())

    def test_apply_renames_file_and_updates_reference(self):
        call_command("randomize_media_filenames", "--apply", stdout=StringIO())

        self.user.refresh_from_db()
        new = self.user.photo.name
        self.assertRegex(new, r"^profile_photos/2026/07/")
        self.assertRegex(new, RANDOM_NAME_RE)
        self.assertFalse(default_storage.exists(self.old))
        with default_storage.open(new, "rb") as f:
            self.assertEqual(f.read(), b"photo")

        out = StringIO()
        call_command("randomize_media_filenames", "--apply", stdout=out)
        self.assertIn("Renamed 0 file(s); already random: 1", out.getvalue())
