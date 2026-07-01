"""Celery tasks for main app (certificate batches, etc.)."""

from __future__ import annotations

import logging

from celery import shared_task
from django.db import close_old_connections

logger = logging.getLogger(__name__)


@shared_task(ignore_result=True)
def issue_webinar_certificate(registration_id: int) -> None:
    """Issue a certificate for a checked-in webinar attendee (idempotent)."""
    from main.models import WebinarRegistration
    from main.services.certificate_issuance import issue_program_certificate_for_user

    try:
        registration = WebinarRegistration.objects.select_related(
            "webinar", "webinar__certificate_program", "user", "certificate"
        ).get(pk=registration_id)
    except WebinarRegistration.DoesNotExist:
        logger.error("WebinarRegistration %s not found", registration_id)
        return

    webinar = registration.webinar
    program = webinar.certificate_program

    if registration.certificate_id:
        return
    if not webinar.auto_issue_certificate or not program:
        return
    if registration.checked_in_at is None:
        return

    try:
        cert = issue_program_certificate_for_user(program, registration.user)
    except Exception as exc:
        logger.exception("issue_webinar_certificate failed for %s: %s", registration_id, exc)
        return

    registration.certificate = cert
    registration.save(update_fields=["certificate", "updated_at"])


@shared_task(ignore_result=True)
def process_certificate_program_batch(program_id: int) -> None:
    """Generate personalized PDFs for every spreadsheet row that maps to a portal user."""
    from main.models import (
        CertificateProgram,
        CertificateProgramBatchStatus,
    )
    from main.services.certificate_excel import parse_recipients_xlsx
    from main.services.certificate_issuance import issue_program_certificate

    try:
        program = CertificateProgram.objects.get(pk=program_id)
    except CertificateProgram.DoesNotExist:
        logger.error("CertificateProgram %s not found", program_id)
        return

    try:
        program.batch_status = CertificateProgramBatchStatus.PROCESSING
        program.batch_summary = {}
        program.save(update_fields=["batch_status", "batch_summary", "updated_at"])

        path = program.recipients_file.path
        rows, sheet_errors = parse_recipients_xlsx(path)

        summary = {
            "total_rows": len(rows),
            "matched": 0,
            "skipped_no_user": 0,
            "sheet_errors": sheet_errors[:50],
            "generation_errors": [],
        }

        if sheet_errors and not rows:
            program.batch_status = CertificateProgramBatchStatus.FAILED
            program.batch_summary = summary
            program.save(update_fields=["batch_status", "batch_summary", "updated_at"])
            return

        processed = 0
        for row in rows:
            processed += 1
            if processed % 75 == 0:
                close_old_connections()

            try:
                cert, err = issue_program_certificate(
                    program,
                    row.display_name,
                    row.id_raw,
                    clear_suspension=False,
                )
                if err == "no_user":
                    summary["skipped_no_user"] += 1
                    continue
                if cert:
                    summary["matched"] += 1
            except Exception as exc:
                logger.exception("Certificate row failed for program %s: %s", program_id, exc)
                errs = summary["generation_errors"]
                if len(errs) < 50:
                    errs.append(f"{row.id_raw}: {exc}")

        program.batch_status = CertificateProgramBatchStatus.COMPLETED
        program.batch_summary = summary
        program.save(update_fields=["batch_status", "batch_summary", "updated_at"])
    except Exception as exc:
        logger.exception("Certificate batch %s failed", program_id)
        try:
            program = CertificateProgram.objects.get(pk=program_id)
            program.batch_status = CertificateProgramBatchStatus.FAILED
            program.batch_summary = {"fatal": str(exc)}
            program.save(update_fields=["batch_status", "batch_summary", "updated_at"])
        except CertificateProgram.DoesNotExist:
            pass
