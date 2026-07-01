from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = []

    operations = [
        migrations.CreateModel(
            name="AcademicSnapshot",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("student_id", models.CharField(db_index=True, max_length=64, unique=True, verbose_name="student ID (NIM)")),
                ("payload", models.JSONField(help_text="Cached {summary, scores} from the external SIS.", verbose_name="academic payload")),
                ("synced_at", models.DateTimeField(auto_now=True, help_text="When this snapshot was last refreshed from the live SIS.", verbose_name="last synced at")),
            ],
            options={
                "verbose_name": "academic snapshot",
                "verbose_name_plural": "academic snapshots",
            },
        ),
    ]
