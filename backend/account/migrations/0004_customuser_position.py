from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("account", "0003_customuser_birth_fields_emailverification_pending_email"),
    ]

    operations = [
        migrations.AddField(
            model_name="customuser",
            name="position",
            field=models.CharField(
                blank=True,
                help_text="Job title shown on the Staff/Lecturer ID card.",
                max_length=100,
                verbose_name="position",
            ),
        ),
    ]
