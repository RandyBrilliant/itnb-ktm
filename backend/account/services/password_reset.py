"""Send password reset links to user inboxes."""

from __future__ import annotations

from django.conf import settings
from django.contrib.auth.tokens import default_token_generator
from django.utils.encoding import force_bytes
from django.utils.http import urlsafe_base64_encode

from account.services.email_delivery import EmailDeliveryError, ensure_outbound_email_configured, send_transactional_email


def build_password_reset_url(user) -> str:
    uid = urlsafe_base64_encode(force_bytes(user.pk))
    token = default_token_generator.make_token(user)
    base_url = getattr(settings, "FRONTEND_URL", "http://localhost:5173").rstrip("/")
    return f"{base_url}/reset-password?uid={uid}&token={token}"


def send_password_reset_email_to_user(user) -> None:
    """Email a password reset link to the given active user."""
    ensure_outbound_email_configured()
    reset_url = build_password_reset_url(user)
    send_transactional_email(
        to_email=user.email,
        subject="ITNB Hub Password Reset",
        message=(
            "We received a request to reset your password.\n\n"
            f"Use this link to set a new password:\n{reset_url}\n\n"
            "If you did not request this, you can ignore this email."
        ),
    )
