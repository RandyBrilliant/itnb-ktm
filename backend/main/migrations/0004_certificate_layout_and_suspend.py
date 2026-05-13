# Merged: layout default callable + certificate.is_suspended (replaces duplicate 0004 leaves)

import main.models
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("main", "0003_certificate_program"),
    ]

    operations = [
        migrations.AlterField(
            model_name="certificateprogram",
            name="layout",
            field=models.JSONField(default=main.models.default_certificate_layout, verbose_name="text layout"),
        ),
        migrations.AddField(
            model_name="certificate",
            name="is_suspended",
            field=models.BooleanField(
                db_index=True,
                default=False,
                help_text="When true, the recipient does not see this certificate in their list.",
                verbose_name="hidden from recipient portal",
            ),
        ),
    ]
