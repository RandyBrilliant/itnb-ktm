"""
QR code generation service for digital ID cards.
"""

import io
import qrcode
from PIL import Image
from django.core.files.base import ContentFile


def generate_qr_code(data: str, size: int = 10, box_size: int = 10) -> Image.Image:
    """
    Generate QR code image from data string.
    
    Args:
        data: Text/URL to encode in QR code
        size: QR box size
        box_size: Border size in pixels
    
    Returns:
        PIL Image object
    """
    qr = qrcode.QRCode(
        version=1,
        error_correction=qrcode.constants.ERROR_CORRECT_L,
        box_size=box_size,
        border=4,
    )
    qr.add_data(data)
    qr.make(fit=True)
    
    img = qr.make_image(fill_color="black", back_color="white")
    return img


def save_qr_code_to_field(qr_image: Image.Image, filename: str) -> bytes:
    """
    Convert PIL image to bytes for saving to FileField.
    
    Args:
        qr_image: PIL Image object
        filename: Name for the saved file
    
    Returns:
        BytesIO object ready for FileField
    """
    buffer = io.BytesIO()
    qr_image.save(buffer, format="PNG")
    buffer.seek(0)
    return buffer
