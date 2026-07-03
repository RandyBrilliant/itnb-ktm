from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("main", "0008_alter_certificateprogram_recipients_file"),
    ]

    operations = [
        migrations.AddField(
            model_name="certificate",
            name="legacy_code",
            field=models.CharField(
                blank=True,
                db_index=True,
                help_text="SHA-256 code from the previous certificate system.",
                max_length=64,
                null=True,
                unique=True,
                verbose_name="legacy verification code",
            ),
        ),
        migrations.AddField(
            model_name="certificate",
            name="legacy_pdf_url",
            field=models.URLField(
                blank=True,
                help_text="Original itnb.ac.id certificate download URL when PDFs were pre-generated.",
                max_length=500,
                verbose_name="legacy PDF URL",
            ),
        ),
    ]
