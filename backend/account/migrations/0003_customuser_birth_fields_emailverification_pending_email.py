from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("account", "0002_customuser_institutional_id"),
    ]

    operations = [
        migrations.AddField(
            model_name="customuser",
            name="date_of_birth",
            field=models.DateField(
                blank=True,
                help_text="Birth date shown on student ID card.",
                null=True,
                verbose_name="date of birth",
            ),
        ),
        migrations.AddField(
            model_name="customuser",
            name="place_of_birth",
            field=models.CharField(
                blank=True,
                help_text="Birth city/place shown on student ID card.",
                max_length=120,
                verbose_name="place of birth",
            ),
        ),
        migrations.AddField(
            model_name="emailverificationcode",
            name="pending_email",
            field=models.EmailField(
                blank=True,
                help_text="New email address to apply after successful verification.",
                null=True,
                verbose_name="pending email",
            ),
        ),
    ]
