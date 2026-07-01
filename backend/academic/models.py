"""Local fallback storage for external SIS (myitnb) academic data.

The external MariaDB at db.itnb.ac.id is occasionally unreachable (connection
timeouts). To keep students from seeing errors, every successful fetch is
snapshotted here and served as a stale-but-usable fallback when the live
database cannot be reached.
"""

from django.db import models


class AcademicSnapshot(models.Model):
    """Most recent successful academic payload for a given student NIM."""

    student_id = models.CharField(
        "student ID (NIM)",
        max_length=64,
        unique=True,
        db_index=True,
    )
    payload = models.JSONField(
        "academic payload",
        help_text="Cached {summary, scores} from the external SIS.",
    )
    synced_at = models.DateTimeField(
        "last synced at",
        auto_now=True,
        help_text="When this snapshot was last refreshed from the live SIS.",
    )

    class Meta:
        verbose_name = "academic snapshot"
        verbose_name_plural = "academic snapshots"

    def __str__(self) -> str:
        return f"AcademicSnapshot({self.student_id} @ {self.synced_at:%Y-%m-%d %H:%M})"
