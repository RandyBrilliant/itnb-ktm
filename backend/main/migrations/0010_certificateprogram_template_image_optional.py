from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("main", "0009_certificate_legacy_fields"),
    ]

    operations = [
        migrations.AlterField(
            model_name="certificateprogram",
            name="template_image",
            field=models.ImageField(
                blank=True,
                help_text="Optional A4 artwork. When omitted, a generic PDF is generated.",
                null=True,
                upload_to="certificate_templates/%Y/%m/",
                verbose_name="template image",
            ),
        ),
    ]
