from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ("main", "0005_webinar_webinarregistration"),
    ]

    operations = [
        migrations.RemoveField(
            model_name="webinar",
            name="ends_at",
        ),
    ]
