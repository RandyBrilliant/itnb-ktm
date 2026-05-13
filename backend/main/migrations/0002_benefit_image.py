from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("main", "0001_initial"),
    ]

    operations = [
        migrations.AddField(
            model_name="benefit",
            name="image",
            field=models.ImageField(
                blank=True,
                null=True,
                upload_to="benefits/%Y/%m/",
                verbose_name="cover image",
            ),
        ),
    ]
