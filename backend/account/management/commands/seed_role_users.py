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
        "department": "ICT Services",
        "institutional_id": "DEMO-ADM-001",
        "is_staff": True,
        "is_superuser": True,
    },
    {
        "email": "staff@itnb.local",
        "full_name": "ITNB Staff",
        "role": UserRole.STAFF,
        "department": "Academic Administration",
        "institutional_id": "DEMO-STA-001",
        "is_staff": True,
        "is_superuser": False,
    },
    {
        "email": "lecturer@itnb.local",
        "full_name": "ITNB Lecturer",
        "role": UserRole.LECTURER,
        "department": "Computer Science",
        "institutional_id": "DEMO-LEC-001",
        "is_staff": False,
        "is_superuser": False,
    },
    {
        "email": "student@itnb.local",
        "full_name": "ITNB Student",
        "role": UserRole.STUDENT,
        "department": "Information Technology",
        "institutional_id": "DEMO-STU-001",
        "is_staff": False,
        "is_superuser": False,
    },
    {
        "email": "alumni@itnb.local",
        "full_name": "ITNB Alumni",
        "role": UserRole.ALUMNI,
        "department": "Business Administration",
        "institutional_id": "DEMO-ALU-001",
        "alumni_year": timezone.now().year - 1,
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
                    "department": item.get("department", ""),
                    "institutional_id": item.get("institutional_id"),
                    "alumni_year": item.get("alumni_year"),
                },
            )

            # Keep records deterministic on repeated runs.
            user.full_name = item["full_name"]
            user.role = item["role"]
            user.department = item.get("department", "")
            user.institutional_id = item.get("institutional_id") or None
            user.alumni_year = item.get("alumni_year")
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
        self.stdout.write("")
        self.stdout.write(
            self.style.NOTICE(
                "Certificate Excel (ID column) demo values — pair with Name column using full_name above:"
            )
        )
        for item in ROLE_FIXTURES:
            iid = item.get("institutional_id")
            if iid:
                self.stdout.write(f"  {item['full_name']}: {iid}")

    def _ensure_profile(self, user: CustomUser) -> None:
        if user.role == UserRole.STAFF:
            profile, _ = StaffProfile.objects.get_or_create(
                user=user,
                defaults={
                    "staff_role": "Administrator",
                    "can_issue_certificates": True,
                    "can_manage_benefits": True,
                },
            )
            profile.staff_role = "Administrator"
            profile.can_issue_certificates = True
            profile.can_manage_benefits = True
            profile.save(
                update_fields=[
                    "staff_role",
                    "can_issue_certificates",
                    "can_manage_benefits",
                    "updated_at",
                ]
            )
            return

        if user.role == UserRole.LECTURER:
            profile, _ = LecturerProfile.objects.get_or_create(
                user=user,
                defaults={
                    "contact_phone": "+62-000-000-000",
                    "address": "ITNB Campus",
                },
            )
            profile.contact_phone = "+62-000-000-000"
            profile.address = "ITNB Campus"
            profile.save(update_fields=["contact_phone", "address", "updated_at"])
            return

        if user.role == UserRole.ALUMNI:
            profile, _ = AlumniProfile.objects.get_or_create(
                user=user,
                defaults={
                    "graduation_year": timezone.now().year - 1,
                    "alumni_membership_status": "active",
                },
            )
            profile.graduation_year = timezone.now().year - 1
            profile.alumni_membership_status = "active"
            profile.save(update_fields=["graduation_year", "alumni_membership_status", "updated_at"])
