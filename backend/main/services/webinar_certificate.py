"""Create or update a certificate program linked to a webinar (no Excel batch)."""

from __future__ import annotations

from django.utils import timezone

from main.models import CertificateProgram, CertificateProgramBatchStatus, Webinar
from main.services.certificate_layout import normalize_certificate_layout


def ensure_webinar_certificate_program(
    *,
    webinar: Webinar,
    issued_by,
    template_image=None,
    valid_until=None,
    layout: dict | None = None,
    title: str | None = None,
) -> CertificateProgram:
    """
    Attach a template-only CertificateProgram to a webinar for auto-issue on check-in.
    Updates the existing linked program when one is already present.
    """
    program_title = (title or webinar.post.title).strip()
    issued_date = timezone.localtime(webinar.starts_at).date()
    layout_data = normalize_certificate_layout(layout)

    program = webinar.certificate_program
    if program:
        program.title = program_title
        program.description = webinar.post.body or ""
        program.issued_date = issued_date
        program.valid_until = valid_until
        program.layout = layout_data
        if template_image is not None:
            program.template_image = template_image
        program.batch_status = CertificateProgramBatchStatus.COMPLETED
        program.save()
        return program

    program = CertificateProgram.objects.create(
        title=program_title,
        description=webinar.post.body or "",
        template_image=template_image,
        layout=layout_data,
        issued_date=issued_date,
        valid_until=valid_until,
        issued_by=issued_by,
        batch_status=CertificateProgramBatchStatus.COMPLETED,
        batch_summary={"source": "webinar", "webinar_id": webinar.id},
    )
    webinar.certificate_program = program
    webinar.save(update_fields=["certificate_program", "updated_at"])
    return program
