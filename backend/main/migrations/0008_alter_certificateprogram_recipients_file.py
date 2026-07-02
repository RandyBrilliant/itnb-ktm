from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("main", "0007_certificateprogram_recipients_file_optional"),
    ]

    operations = [
        migrations.AlterField(
            model_name="certificateprogram",
            name="recipients_file",
            field=models.FileField(
                blank=True,
                help_text="Excel file with Name and ID columns. Not required for webinar auto-issue.",
                null=True,
                upload_to="certificate_batches/%Y/%m/",
                verbose_name="recipients spreadsheet",
            ),
        ),
    ]
