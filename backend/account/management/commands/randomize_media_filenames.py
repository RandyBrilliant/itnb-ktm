"""
Rename existing private media files to random names (see backend/uploads.py).

New uploads already get random names; this migrates files stored before that,
whose names are guessable (e.g. profile_photos/2026/07/<institutional id>.webp).

Dry run by default:
    python manage.py randomize_media_filenames
    python manage.py randomize_media_filenames --apply
"""
import posixpath

from django.core.management.base import BaseCommand

from account.models import CustomUser, DigitalCard
from backend.uploads import RANDOM_NAME_RE, random_name
from main.models import Certificate, CertificateProgram

FIELDS = [
    (CustomUser, "photo"),
    (DigitalCard, "qr_code"),
    (DigitalCard, "card_image"),
    (CertificateProgram, "template_image"),
    (CertificateProgram, "recipients_file"),
    (Certificate, "pdf_file"),
]


class Command(BaseCommand):
    help = "Rename private media files with guessable names to random names."

    def add_arguments(self, parser):
        parser.add_argument("--apply", action="store_true", help="Rename files (default: dry run).")

    def handle(self, *args, apply=False, **options):
        totals = {"renamed": 0, "skipped": 0, "missing": 0, "failed": 0}

        for model, field_name in FIELDS:
            label = f"{model.__name__}.{field_name}"
            qs = model.objects.exclude(**{f"{field_name}__isnull": True}).exclude(**{field_name: ""})
            for obj in qs.only("pk", field_name).iterator():
                old = getattr(obj, field_name).name
                if RANDOM_NAME_RE.search(old):
                    totals["skipped"] += 1
                    continue

                storage = getattr(obj, field_name).storage
                if not storage.exists(old):
                    totals["missing"] += 1
                    self.stdout.write(self.style.WARNING(f"{label} pk={obj.pk}: file missing ({old})"))
                    continue

                new = random_name(posixpath.dirname(old), old)
                if not apply:
                    totals["renamed"] += 1
                    continue

                saved = None
                try:
                    with storage.open(old, "rb") as src:
                        saved = storage.save(new, src)
                    # update() avoids save() side effects (card regeneration, signals).
                    model.objects.filter(pk=obj.pk).update(**{field_name: saved})
                except Exception as exc:
                    if saved:
                        storage.delete(saved)
                    totals["failed"] += 1
                    self.stderr.write(f"{label} pk={obj.pk}: {exc}")
                    continue

                storage.delete(old)
                totals["renamed"] += 1

        verb = "Renamed" if apply else "Would rename"
        self.stdout.write(
            f"{verb} {totals['renamed']} file(s); already random: {totals['skipped']}; "
            f"missing: {totals['missing']}; failed: {totals['failed']}"
        )
        if not apply and totals["renamed"]:
            self.stdout.write("Re-run with --apply to rename.")
