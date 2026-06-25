"""
Digital card image generation service.

Design goals:
- deterministic output for caching/CDN friendliness
- template-based rendering for brand consistency
- cheap repeated renders with cached templates/fonts
"""

from functools import lru_cache
from io import BytesIO
from pathlib import Path
from typing import Optional

from django.conf import settings
from PIL import Image, ImageDraw, ImageFont


CARD_SIZE = (672, 1024)
FONT_FALLBACK = "arial.ttf"
LABEL_COLOR = "#b11324"
VALUE_COLOR = "#111111"


@lru_cache(maxsize=4)
def _load_template(path: Optional[str]) -> Optional[Image.Image]:
    if not path:
        return None
    template_path = Path(path)
    if not template_path.exists():
        return None
    with Image.open(template_path) as img:
        return img.convert("RGBA")


@lru_cache(maxsize=8)
def _load_font(size: int) -> ImageFont.ImageFont:
    try:
        return ImageFont.truetype(FONT_FALLBACK, size)
    except Exception:
        return ImageFont.load_default()


def _fit_cover(image: Image.Image, target_w: int, target_h: int) -> Image.Image:
    src_w, src_h = image.size
    target_ratio = target_w / target_h
    src_ratio = src_w / src_h

    if src_ratio > target_ratio:
        new_h = target_h
        new_w = int(new_h * src_ratio)
    else:
        new_w = target_w
        new_h = int(new_w / src_ratio)

    resized = image.resize((new_w, new_h), Image.Resampling.LANCZOS)
    left = (new_w - target_w) // 2
    top = (new_h - target_h) // 2
    return resized.crop((left, top, left + target_w, top + target_h))


def _draw_field(draw, x: int, label_y: int, label: str, value: str, label_font, value_font):
    draw.text((x, label_y), label, fill=LABEL_COLOR, font=label_font)
    bbox = draw.textbbox((x, label_y), label, font=label_font)
    draw.text((x, bbox[3] + 6), value, fill=VALUE_COLOR, font=value_font)


def generate_digital_card_image(user, card_type: str) -> Image.Image:
    """Generate a digital card front image from card-bg.jpg with user data overlays."""
    template = _load_template(getattr(settings, "ID_CARD_FRONT_TEMPLATE_PATH", None))
    canvas = template.copy() if template else Image.new("RGBA", CARD_SIZE, "#f4f4f4")
    if canvas.size != CARD_SIZE:
        canvas = _fit_cover(canvas, CARD_SIZE[0], CARD_SIZE[1])

    draw = ImageDraw.Draw(canvas)
    label_font = _load_font(22)
    value_font = _load_font(34)
    name_font = _load_font(38)
    degree_font = _load_font(40)
    valid_font = _load_font(30)

    name = (user.full_name or "Student").strip()
    department = (user.department or card_type.title()).strip()
    card_number = getattr(getattr(user, "digital_card", None), "card_number", None) or "-"
    valid_until = getattr(getattr(user, "digital_card", None), "valid_until", None)
    valid_until_text = valid_until.strftime("%B %Y") if valid_until else "-"

    content_x = 112
    _draw_field(draw, content_x, 400, "Name", name, label_font, name_font)
    _draw_field(draw, content_x, 470, "Student ID", card_number, label_font, value_font)
    _draw_field(draw, content_x, 535, "Major", department, label_font, value_font)
    _draw_field(draw, content_x, 600, "Place, Date of Birth", "-", label_font, value_font)

    draw.line((content_x, 680, 430, 680), fill="#21212133", width=1)
    draw.text((content_x, 700), "Bachelor Degree", fill=LABEL_COLOR, font=degree_font)
    draw.text((content_x, 752), "Valid Thru", fill=LABEL_COLOR, font=label_font)
    draw.text((content_x, 778), valid_until_text, fill=VALUE_COLOR, font=valid_font)

    photo_field = (218, 132, 454, 368)
    if getattr(user, "photo", None):
        try:
            with Image.open(user.photo.path) as photo:
                photo = _fit_cover(
                    photo.convert("RGB"),
                    photo_field[2] - photo_field[0],
                    photo_field[3] - photo_field[1],
                )
                canvas.paste(photo, photo_field[:2])
        except Exception:
            pass

    qr_field = (433, 798, 621, 975)
    qr_path = getattr(getattr(user, "digital_card", None), "qr_code", None)
    qr_path = getattr(qr_path, "path", None)
    if qr_path:
        try:
            with Image.open(qr_path) as qr:
                qr = _fit_cover(
                    qr.convert("RGB"),
                    qr_field[2] - qr_field[0],
                    qr_field[3] - qr_field[1],
                )
                canvas.paste(qr, qr_field[:2])
        except Exception:
            pass

    return canvas.convert("RGB")


def save_card_image_to_bytes(card_image: Image.Image) -> BytesIO:
    """
    Convert card image to bytes for saving.

    Args:
        card_image: PIL Image object

    Returns:
        BytesIO object ready for FileField
    """
    buffer = BytesIO()
    card_image.save(buffer, format="PNG", optimize=True)
    buffer.seek(0)
    return buffer
