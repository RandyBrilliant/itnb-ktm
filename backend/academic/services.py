"""Read-only queries against the external myitnb MariaDB (student GPA and scores)."""

from __future__ import annotations

import logging
from typing import Any

from django.conf import settings

from .db import myitnb_cursor

logger = logging.getLogger(__name__)

GPA_SUMMARY_SQL = """
SELECT
  UCASE(CONCAT(profile_student.first_name, ' ', profile_student.last_name)) AS student_name,
  profile_class.name AS student_class,
  UCASE(profile_major.name) AS student_major,
  profile_class.intake_year AS student_year,
  ROUND(
    SUM(study_result.result_weight * study_result.result_credit)
    / SUM(study_result.result_credit),
    2
  ) AS student_gpa
FROM study
LEFT JOIN study_result ON
  (study.record_id = study_result.study_record_id) AND
  (study_result.void_status = 0) AND
  (study_result.default_status = 0) AND
  (study_result.delete_datetime IS NULL)
LEFT JOIN profile_student ON
  (profile_student.record_id = study_result.student_record_id) AND
  (profile_student.void_status = 0) AND
  (profile_student.default_status = 0) AND
  (profile_student.delete_datetime IS NULL)
LEFT JOIN profile_major ON
  (profile_major.record_id = study.major_record_id) AND
  (profile_major.void_status = 0) AND
  (profile_major.default_status = 0) AND
  (profile_major.delete_datetime IS NULL)
LEFT JOIN profile_class ON
  (profile_class.record_id = profile_student.class_record_id) AND
  (profile_class.void_status = 0) AND
  (profile_class.default_status = 0) AND
  (profile_class.delete_datetime IS NULL)
WHERE profile_student.student_id = %s
  AND study.subject_record_id IS NOT NULL
  AND study.delete_datetime IS NULL
  AND study.void_status = 0
  AND study.default_status = 0
  AND study_result.publish_status = TRUE
  AND study_result.result_weight <> 0
  AND study_result.result_grade <> 0
"""

SCORE_LIST_SQL_TEMPLATE = """
SELECT
  profile_subject.name_eng AS subject,
  profile_subject.semester_no AS semester,
  study_result.result_alpha AS grade,
  TRUNCATE(study_result.result_grade, 0) AS score
FROM study
LEFT JOIN profile_subject ON
  (profile_subject.record_id = study.subject_record_id) AND
  (profile_subject.default_status = 0) AND
  (profile_subject.void_status = 0) AND
  (profile_subject.delete_datetime IS NULL)
LEFT JOIN profile_major ON
  (profile_major.record_id = study.major_record_id) AND
  (profile_major.default_status = 0) AND
  (profile_major.void_status = 0) AND
  (profile_major.delete_datetime IS NULL)
LEFT JOIN profile_curicullum ON
  (profile_curicullum.record_id = study.curicullum_record_id) AND
  (profile_curicullum.default_status = 0) AND
  (profile_curicullum.void_status = 0) AND
  (profile_curicullum.delete_datetime IS NULL)
LEFT JOIN study_result ON
  (study_result.study_record_id = study.record_id) AND
  (study_result.default_status = 0) AND
  (study_result.void_status = 0) AND
  (study_result.delete_datetime IS NULL)
LEFT JOIN profile_student ON
  (profile_student.record_id = study_result.student_record_id) AND
  (profile_student.default_status = 0) AND
  (profile_student.void_status = 0) AND
  (profile_student.delete_datetime IS NULL)
WHERE profile_student.student_id = %s
  AND study_result.result_alpha <> ''
  AND study.subject_record_id IS NOT NULL
  AND study.delete_datetime IS NULL
  AND study.void_status = 0
  AND study.default_status = 0
  AND profile_curicullum.record_id IN ({curriculum_placeholders})
  AND study_result.result_grade <> 0
  AND study_result.publish_status = TRUE
GROUP BY study.study_id
ORDER BY semester, subject
"""


def _parse_curriculum_ids() -> tuple[int, ...]:
    raw = getattr(settings, "MYITNB_CURRICULUM_IDS", "1,23,55") or "1,23,55"
    ids: list[int] = []
    for part in raw.split(","):
        part = part.strip()
        if not part:
            continue
        ids.append(int(part))
    return tuple(ids) if ids else (1, 23, 55)


_ROMAN_SEMESTER = {
    "I": 1,
    "II": 2,
    "III": 3,
    "IV": 4,
    "V": 5,
    "VI": 6,
    "VII": 7,
    "VIII": 8,
    "IX": 9,
    "X": 10,
    "XI": 11,
    "XII": 12,
}


def _normalize_semester(value: Any) -> int | None:
    """Map Arabic (1) and Roman (I) semester labels to a single integer."""
    if value is None:
        return None
    if isinstance(value, int):
        return value
    text = str(value).strip().upper()
    if text.isdigit():
        return int(text)
    return _ROMAN_SEMESTER.get(text)


def _row_to_dict(cursor, row: tuple[Any, ...]) -> dict[str, Any]:
    columns = [col[0] for col in cursor.description]
    return dict(zip(columns, row, strict=True))


def _fetch_gpa_summary(cursor, student_id: str) -> dict[str, Any] | None:
    cursor.execute(GPA_SUMMARY_SQL, [student_id])
    row = cursor.fetchone()
    if row is None:
        return None
    data = _row_to_dict(cursor, row)
    return {
        "student_name": data.get("student_name"),
        "student_class": data.get("student_class"),
        "student_major": data.get("student_major"),
        "student_year": data.get("student_year"),
        "student_gpa": float(data["student_gpa"]) if data.get("student_gpa") is not None else None,
    }


def _fetch_score_list(cursor, student_id: str) -> list[dict[str, Any]]:
    curriculum_ids = _parse_curriculum_ids()
    placeholders = ", ".join(["%s"] * len(curriculum_ids))
    sql = SCORE_LIST_SQL_TEMPLATE.format(curriculum_placeholders=placeholders)
    params: list[Any] = [student_id, *curriculum_ids]

    cursor.execute(sql, params)
    rows = cursor.fetchall()

    results: list[dict[str, Any]] = []
    for row in rows:
        data = _row_to_dict(cursor, row)
        score_val = data.get("score")
        results.append(
            {
                "subject": data.get("subject") or "",
                "semester": _normalize_semester(data.get("semester")),
                "grade": data.get("grade") or "",
                "score": int(score_val) if score_val is not None else None,
            }
        )
    return results


def get_gpa_summary(student_id: str) -> dict[str, Any] | None:
    """Return GPA summary for a student_id (NIM), or None if no published results."""
    with myitnb_cursor() as cursor:
        return _fetch_gpa_summary(cursor, student_id)


def get_score_list(student_id: str) -> list[dict[str, Any]]:
    """Return published subject scores for a student_id (NIM)."""
    with myitnb_cursor() as cursor:
        return _fetch_score_list(cursor, student_id)


def get_academic_profile(student_id: str) -> dict[str, Any]:
    """Combined GPA summary and score list for API responses (single DB connection)."""
    with myitnb_cursor() as cursor:
        return {
            "summary": _fetch_gpa_summary(cursor, student_id),
            "scores": _fetch_score_list(cursor, student_id),
        }


def get_academic_profile_resilient(student_id: str) -> dict[str, Any]:
    """
    Fetch academic profile, falling back to the last saved snapshot when the
    external SIS is unreachable.

    Returns the {summary, scores} payload augmented with:
      - ``stale``: False for live data, True when served from a snapshot.
      - ``synced_at``: ISO timestamp of the snapshot (None for fresh live data).

    Raises the underlying connection error only when live fetch fails AND no
    snapshot exists for this student.
    """
    # Imported here to avoid import-time Django app loading issues.
    from .models import AcademicSnapshot

    try:
        data = get_academic_profile(student_id)
    except Exception:
        logger.warning(
            "Live SIS fetch failed for student_id=%s; attempting snapshot fallback.",
            student_id,
        )
        snapshot = AcademicSnapshot.objects.filter(student_id=student_id).first()
        if snapshot is None:
            raise
        payload = dict(snapshot.payload or {})
        payload["stale"] = True
        payload["synced_at"] = snapshot.synced_at.isoformat()
        return payload

    # Persist a fresh snapshot for future fallback (best-effort).
    try:
        AcademicSnapshot.objects.update_or_create(
            student_id=student_id,
            defaults={"payload": data},
        )
    except Exception:
        logger.exception("Failed to persist academic snapshot for student_id=%s", student_id)

    data["stale"] = False
    data["synced_at"] = None
    return data
