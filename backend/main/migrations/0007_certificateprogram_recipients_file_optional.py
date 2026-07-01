from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("main", "0006_remove_webinar_ends_at"),
    ]

    operations = [
        migrations.AlterField(
            model_name="certificateprogram",
            name="recipients_file",
            field=models.FileField(
                blank=True,
                help_text="Excel file with Name and ID columns.",
                null=True,
                upload_to="certificate_batches/%Y/%m/",
                verbose_name="recipients spreadsheet",
            ),
        ),
    ]
