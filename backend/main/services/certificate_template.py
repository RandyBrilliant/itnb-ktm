"""Render personalized certificates from a PNG/JPG template using Pillow + ReportLab."""

from __future__ import annotations

import logging
from io import BytesIO
from pathlib import Path

from django.conf import settings
from PIL import Image, ImageDraw, ImageFont
from reportlab.lib.utils import ImageReader
from reportlab.pdfgen import canvas

from main.models import Certificate
from main.services.certificate_generation import generate_certificate_pdf
from main.services.certificate_layout import normalize_certificate_layout

logger = logging.getLogger(__name__)


def _resolve_font_path() -> Path | None:
    configured = getattr(settings, "CERTIFICATE_FONT_PATH", None)
    if configured:
        p = Path(configured)
        if p.is_file():
            return p
    base = Path(settings.BASE_DIR) / "main" / "fonts" / "DejaVuSans.ttf"
    if base.is_file():
        return base
    candidates = [
        Path("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"),
        Path("/usr/share/fonts/TTF/DejaVuSans.ttf"),
        Path(r"C:\Windows\Fonts\arial.ttf"),
        Path(r"C:\Windows\Fonts\calibri.ttf"),
    ]
    for c in candidates:
        if c.is_file():
            return c
    return None


def _hex_to_rgb(color: str) -> tuple[int, int, int]:
    c = (color or "#000000").strip().lstrip("#")
    if len(c) == 6:
        return int(c[0:2], 16), int(c[2:4], 16), int(c[4:6], 16)
    return 26, 26, 26


def _draw_field(
    draw: ImageDraw.ImageDraw,
    text: str,
    field: dict,
    *,
    width: int,
    height: int,
    font,
    fill: tuple[int, int, int, int],
) -> None:
    if not text:
        return

    bbox = draw.textbbox((0, 0), text, font=font)
    tw = bbox[2] - bbox[0]
    th = bbox[3] - bbox[1]
    anchor_x = width * float(field["x_ratio"])
    anchor_y = height * float(field["y_ratio"]) - th / 2
    align = field.get("align", "center")

    if align == "right":
        x = anchor_x - tw
    elif align == "left":
        x = anchor_x
    else:
        x = anchor_x - tw / 2

    draw.text((x, anchor_y), text, fill=fill, font=font)


def render_template_certificate_pdf(certificate: Certificate) -> bytes:
    """Build a single-page PDF from program.template_image with name + ID overlay."""
    program = certificate.program
    if not program or not program.template_image:
        return generate_certificate_pdf(certificate)

    template_path = certificate.program.template_image.path
    layout = normalize_certificate_layout(program.layout)
    font_path = _resolve_font_path()

    try:
        img = Image.open(template_path).convert("RGBA")
    except OSError as exc:
        logger.exception("Failed to open certificate template: %s", exc)
        return generate_certificate_pdf(certificate)

    draw = ImageDraw.Draw(img)
    w, h = img.size

    name = (certificate.recipient_name or certificate.user.full_name or certificate.user.email or "").strip()
    rid = (certificate.recipient_id_display or "").strip()

    name_font_size = max(12, int(h * float(layout["name"]["font_ratio"])))
    id_font_size = max(10, int(h * float(layout["id"]["font_ratio"])))

    if font_path:
        try:
            font_name = ImageFont.truetype(str(font_path), name_font_size)
            font_id = ImageFont.truetype(str(font_path), id_font_size)
        except OSError:
            font_name = ImageFont.load_default()
            font_id = ImageFont.load_default()
    else:
        logger.warning("No TrueType font found for certificates; using bitmap font (low quality).")
        font_name = ImageFont.load_default()
        font_id = ImageFont.load_default()

    fill = _hex_to_rgb(str(layout["text_color"])) + (255,)

    _draw_field(draw, name, layout["name"], width=w, height=h, font=font_name, fill=fill)
    _draw_field(draw, rid, layout["id"], width=w, height=h, font=font_id, fill=fill)

    rgb = img.convert("RGB")
    png_buf = BytesIO()
    rgb.save(png_buf, format="PNG", dpi=(300, 300))
    png_buf.seek(0)

    pdf_buf = BytesIO()
    page_size = (w, h)
    c = canvas.Canvas(pdf_buf, pagesize=page_size)
    c.drawImage(ImageReader(png_buf), 0, 0, width=w, height=h)
    c.showPage()
    c.save()
    pdf_buf.seek(0)
    return pdf_buf.getvalue()


def render_template_certificate_pdf_bytes(certificate: Certificate) -> BytesIO:
    raw = BytesIO(render_template_certificate_pdf(certificate))
    raw.seek(0)
    return raw
