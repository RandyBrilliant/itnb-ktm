"""Certificate PDF generation service using reportlab."""

from io import BytesIO

from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import inch
from reportlab.lib.enums import TA_CENTER
from reportlab.platypus import Paragraph, SimpleDocTemplate, Spacer


def generate_certificate_pdf(certificate) -> bytes:
    """Generate a PDF certificate and return raw bytes."""
    buffer = BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        rightMargin=0.5 * inch,
        leftMargin=0.5 * inch,
        topMargin=0.5 * inch,
        bottomMargin=0.5 * inch,
    )

    elements = []
    styles = getSampleStyleSheet()

    center_style = ParagraphStyle(
        "CustomCenter",
        parent=styles["Normal"],
        alignment=TA_CENTER,
        fontSize=12,
        leading=14,
    )
    title_style = ParagraphStyle(
        "Title",
        parent=styles["Normal"],
        alignment=TA_CENTER,
        fontSize=28,
        leading=34,
        textColor=colors.HexColor("#1E88E5"),
        spaceAfter=30,
        fontName="Helvetica-Bold",
    )
    certificate_text_style = ParagraphStyle(
        "CertText",
        parent=styles["Normal"],
        alignment=TA_CENTER,
        fontSize=16,
        leading=20,
        spaceAfter=20,
    )
    name_style = ParagraphStyle(
        "Name",
        parent=styles["Normal"],
        alignment=TA_CENTER,
        fontSize=20,
        leading=24,
        spaceAfter=30,
        fontName="Helvetica-Bold",
    )

    elements.append(Spacer(1, 1 * inch))
    elements.append(Paragraph("CERTIFICATE OF ACHIEVEMENT", title_style))
    elements.append(Paragraph("This is to certify that", certificate_text_style))
    elements.append(Paragraph(certificate.user.full_name or certificate.user.email, name_style))
    elements.append(Paragraph("Has successfully completed and received", certificate_text_style))
    elements.append(Paragraph(certificate.title, name_style))

    issued_by = certificate.issued_by.full_name if certificate.issued_by else "Institution"
    details = (
        f"<br/>Issued by: <b>{issued_by}</b>"
        f"<br/>Date of Issue: <b>{certificate.issued_date.strftime('%B %d, %Y')}</b>"
    )
    if certificate.valid_until:
        details += f"<br/>Valid Until: <b>{certificate.valid_until.strftime('%B %d, %Y')}</b>"

    elements.append(Spacer(1, 0.5 * inch))
    elements.append(Paragraph(details, center_style))

    if certificate.description:
        elements.append(Spacer(1, 0.3 * inch))
        elements.append(Paragraph(certificate.description, center_style))

    doc.build(elements)
    buffer.seek(0)
    return buffer.getvalue()


def generate_certificate_pdf_bytes(certificate) -> BytesIO:
    """Generate certificate PDF and return a seeked BytesIO object."""
    payload = BytesIO(generate_certificate_pdf(certificate))
    payload.seek(0)
    return payload
