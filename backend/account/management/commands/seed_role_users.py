from django.core.management.base import BaseCommand
from django.db import transaction
from django.utils import timezone

from account.models import (
    AlumniProfile,
    CustomUser,
    LecturerProfile,
    StaffProfile,
    UserRole,
)


DEFAULT_PASSWORD = "Pass1234!"
ROLE_FIXTURES = [
    {
        "email": "admin@itnb.local",
        "full_name": "ITNB Admin",
        "role": UserRole.ADMIN,
        "is_staff": True,
        "is_superuser": True,
    },
    {
        "email": "staff@itnb.local",
        "full_name": "ITNB Staff",
        "role": UserRole.STAFF,
        "is_staff": True,
        "is_superuser": False,
    },
    {
        "email": "lecturer@itnb.local",
        "full_name": "ITNB Lecturer",
        "role": UserRole.LECTURER,
        "is_staff": False,
        "is_superuser": False,
    },
    {
        "email": "student@itnb.local",
        "full_name": "ITNB Student",
        "role": UserRole.STUDENT,
        "is_staff": False,
        "is_superuser": False,
    },
    {
        "email": "alumni@itnb.local",
        "full_name": "ITNB Alumni",
        "role": UserRole.ALUMNI,
        "is_staff": False,
        "is_superuser": False,
    },
]


class Command(BaseCommand):
    help = "Seed role-based login users for local/dev environments."

    def add_arguments(self, parser):
        parser.add_argument(
            "--password",
            type=str,
            default=DEFAULT_PASSWORD,
            help=f"Password used for all seeded users (default: {DEFAULT_PASSWORD})",
        )

    @transaction.atomic
    def handle(self, *args, **options):
        password = options["password"]
        seeded = []

        for item in ROLE_FIXTURES:
            user, created = CustomUser.objects.get_or_create(
                email=item["email"],
                defaults={
                    "full_name": item["full_name"],
                    "role": item["role"],
                },
            )

            # Keep records deterministic on repeated runs.
            user.full_name = item["full_name"]
            user.role = item["role"]
            user.is_active = True
            user.is_staff = item["is_staff"]
            user.is_superuser = item["is_superuser"]
            user.email_verified = True
            user.email_verified_at = user.email_verified_at or timezone.now()
            user.set_password(password)
            user.save()

            self._ensure_profile(user)
            seeded.append((user, created))

        self.stdout.write(self.style.SUCCESS("Seed complete. Login credentials:"))
        for user, created in seeded:
            marker = "created" if created else "updated"
            self.stdout.write(
                f"- {user.role:<8} {user.email:<22} password={password} ({marker})"
            )

    def _ensure_profile(self, user: CustomUser) -> None:
        if user.role == UserRole.STAFF:
            StaffProfile.objects.get_or_create(
                user=user,
                defaults={
                    "staff_role": "Administrator",
                    "can_issue_certificates": True,
                    "can_manage_benefits": True,
                },
            )
            return

        if user.role == UserRole.LECTURER:
            LecturerProfile.objects.get_or_create(
                user=user,
                defaults={
                    "contact_phone": "+62-000-000-000",
                    "address": "ITNB Campus",
                },
            )
            return

        if user.role == UserRole.ALUMNI:
            AlumniProfile.objects.get_or_create(
                user=user,
                defaults={
                    "graduation_year": timezone.now().year - 1,
                    "alumni_membership_status": "active",
                },
            )
