"""Shared avatar/profile-photo processing.

Every profile photo — whether uploaded one at a time or in bulk — is normalized
to a 3:4 portrait, resized, and encoded as a compressed WebP so stored files stay
small and consistent with the 3:4 photo slot on the digital ID card.
"""

from __future__ import annotations

import io
from pathlib import PurePosixPath

from django.core.files.base import ContentFile
from PIL import Image, ImageOps

# Portrait avatar output (3:4, matching the ID-card photo slot).
AVATAR_WIDTH = 480
AVATAR_HEIGHT = 640
AVATAR_RATIO = AVATAR_WIDTH / AVATAR_HEIGHT  # 0.75
# WebP quality: 80 is visually lossless for portraits at this size while keeping
# files small.
AVATAR_QUALITY = 80


def process_avatar_bytes(raw: bytes) -> bytes:
    """Center-crop to a 3:4 portrait, resize, and encode as an optimized WebP."""
    with Image.open(io.BytesIO(raw)) as img:
        # Respect camera orientation (phones store rotation in EXIF).
        img = ImageOps.exif_transpose(img)
        img = img.convert("RGB")

        width, height = img.size
        current_ratio = width / height

        if current_ratio > AVATAR_RATIO:
            # Too wide: trim the sides.
            new_width = round(height * AVATAR_RATIO)
            left = (width - new_width) // 2
            box = (left, 0, left + new_width, height)
        else:
            # Too tall: trim top/bottom.
            new_height = round(width / AVATAR_RATIO)
            top = (height - new_height) // 2
            box = (0, top, width, top + new_height)

        img = img.crop(box)
        if img.size != (AVATAR_WIDTH, AVATAR_HEIGHT):
            img = img.resize((AVATAR_WIDTH, AVATAR_HEIGHT), Image.Resampling.LANCZOS)

        buf = io.BytesIO()
        img.save(buf, format="WEBP", quality=AVATAR_QUALITY, method=6)
        return buf.getvalue()


def process_uploaded_avatar(uploaded, *, fallback_stem: str = "photo") -> ContentFile:
    """Convert an uploaded image file into a compressed WebP ContentFile.

    Accepts any Django uploaded file / file-like object with a ``read`` method.
    Returns a ``ContentFile`` named ``<original-stem>.webp`` ready to assign to an
    ImageField.
    """
    if hasattr(uploaded, "seek"):
        uploaded.seek(0)
    raw = uploaded.read()

    data = process_avatar_bytes(raw)

    name = getattr(uploaded, "name", "") or fallback_stem
    stem = PurePosixPath(name).stem or fallback_stem
    return ContentFile(data, name=f"{stem}.webp")
