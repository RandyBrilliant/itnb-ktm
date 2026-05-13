# Generated manually for template-based certificate batches

import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


def default_certificate_layout():
    return {
        "name_y_ratio": 0.42,
        "id_y_ratio": 0.48,
        "name_font_ratio": 0.038,
        "id_font_ratio": 0.024,
        "text_color": "#1a1a1a",
    }


class Migration(migrations.Migration):

    dependencies = [
        ("main", "0002_benefit_image"),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name="CertificateProgram",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("title", models.CharField(max_length=255, verbose_name="program title")),
                ("description", models.TextField(blank=True, verbose_name="description")),
                (
                    "template_image",
                    models.ImageField(upload_to="certificate_templates/%Y/%m/", verbose_name="template image"),
                ),
                ("layout", models.JSONField(default=default_certificate_layout, verbose_name="text layout")),
                ("issued_date", models.DateField(verbose_name="issued date")),
                ("valid_until", models.DateField(blank=True, null=True, verbose_name="valid until")),
                (
                    "recipients_file",
                    models.FileField(
                        help_text="Excel file with Name and ID columns.",
                        upload_to="certificate_batches/%Y/%m/",
                        verbose_name="recipients spreadsheet",
                    ),
                ),
                (
                    "batch_status",
                    models.CharField(
                        choices=[
                            ("PENDING", "Pending"),
                            ("PROCESSING", "Processing"),
                            ("COMPLETED", "Completed"),
                            ("FAILED", "Failed"),
                        ],
                        db_index=True,
                        default="PENDING",
                        max_length=20,
                        verbose_name="batch status",
                    ),
                ),
                ("batch_summary", models.JSONField(blank=True, default=dict, verbose_name="batch summary")),
                ("created_at", models.DateTimeField(auto_now_add=True, verbose_name="created at")),
                ("updated_at", models.DateTimeField(auto_now=True, verbose_name="updated at")),
                (
                    "issued_by",
                    models.ForeignKey(
                        limit_choices_to={"role__in": ["STAFF", "ADMIN"]},
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="certificate_programs_issued",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
            ],
            options={
                "ordering": ["-created_at"],
            },
        ),
        migrations.AddField(
            model_name="certificate",
            name="program",
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.CASCADE,
                related_name="certificates",
                to="main.certificateprogram",
            ),
        ),
        migrations.AddField(
            model_name="certificate",
            name="recipient_id_display",
            field=models.CharField(blank=True, max_length=64, verbose_name="recipient ID on certificate"),
        ),
        migrations.AddField(
            model_name="certificate",
            name="recipient_name",
            field=models.CharField(blank=True, max_length=255, verbose_name="recipient name on certificate"),
        ),
        migrations.AddConstraint(
            model_name="certificate",
            constraint=models.UniqueConstraint(
                condition=models.Q(program__isnull=False),
                fields=("program", "user"),
                name="uniq_certificate_program_user",
            ),
        ),
    ]
