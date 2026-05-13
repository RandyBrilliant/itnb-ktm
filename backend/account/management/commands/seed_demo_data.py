from django.core.management import call_command
from django.core.management.base import BaseCommand


class Command(BaseCommand):
    help = "Seed login users (all roles) and related dashboard/content demo data."

    def add_arguments(self, parser):
        parser.add_argument(
            "--password",
            type=str,
            default="Pass1234!",
            help="Password used for all seeded role users.",
        )

    def handle(self, *args, **options):
        password = options["password"]

        self.stdout.write(self.style.NOTICE("Seeding role users..."))
        call_command("seed_role_users", password=password)

        self.stdout.write(self.style.NOTICE("Seeding related content data..."))
        call_command("seed_content_data")

        self.stdout.write("")
        self.stdout.write(self.style.SUCCESS("Demo seed complete."))
        self.stdout.write(
            "Login accounts: admin@itnb.local, staff@itnb.local, lecturer@itnb.local, "
            "student@itnb.local, alumni@itnb.local"
        )
        self.stdout.write(f"Password for all accounts: {password}")
