from pathlib import Path

from django.core.management.base import BaseCommand, CommandError

from main.services.legacy_certificate_import import (
    analyze_legacy_import,
    import_legacy_certificates_from_sql,
    parse_legacy_certificate_sql,
)


class Command(BaseCommand):
    help = (
        "Import certificates from the legacy itnb_certificate MySQL SQL dump. "
        "Only rows whose CertificateID matches an existing portal user are imported."
    )

    def add_arguments(self, parser):
        parser.add_argument(
            "sql_file",
            type=str,
            help="Path to the SQL dump (e.g. ~/Downloads/new.sql).",
        )
        parser.add_argument(
            "--dry-run",
            action="store_true",
            help="Report how many rows would import vs skip without writing to the database.",
        )
        parser.add_argument(
            "--limit",
            type=int,
            default=None,
            help="Process only the first N rows (for testing).",
        )

    def handle(self, *args, **options):
        sql_path = Path(options["sql_file"]).expanduser().resolve()
        if not sql_path.is_file():
            raise CommandError(f"SQL file not found: {sql_path}")

        if options["dry_run"]:
            stats = analyze_legacy_import(sql_path, limit=options["limit"])
            rows = parse_legacy_certificate_sql(sql_path)
            if options["limit"]:
                rows = rows[: options["limit"]]
            self.stdout.write(
                self.style.SUCCESS(
                    f"Parsed {stats.parsed} row(s) from {sql_path}: "
                    f"would_import={stats.created}, "
                    f"skip_no_id={stats.skipped_no_id}, "
                    f"skip_no_user={stats.skipped_no_user}"
                )
            )
            if rows:
                sample = rows[0]
                self.stdout.write(
                    f"Sample: {sample.recipient_name} | {sample.institutional_id or '(no ID)'} | "
                    f"{sample.event_title}"
                )
            return

        stats = import_legacy_certificates_from_sql(
            sql_path,
            dry_run=False,
            limit=options["limit"],
        )
        self.stdout.write(
            self.style.SUCCESS(
                "Legacy certificate import complete: "
                f"parsed={stats.parsed}, created={stats.created}, updated={stats.updated}, "
                f"skipped_no_id={stats.skipped_no_id}, skipped_no_user={stats.skipped_no_user}, "
                f"errors={stats.errors}"
            )
        )
