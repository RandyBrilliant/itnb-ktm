# Generated manually for certificate recipient matching

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("account", "0001_initial"),
    ]

    operations = [
        migrations.AddField(
            model_name="customuser",
            name="institutional_id",
            field=models.CharField(
                blank=True,
                db_index=True,
                help_text="Official ID (NIM/NIP/etc.) for matching certificates and records.",
                max_length=64,
                null=True,
                unique=True,
                verbose_name="student / staff ID",
            ),
        ),
    ]
