"""Transactional email delivery (Mailgun API or Django console backend)."""

from __future__ import annotations

import logging

from django.conf import settings
from django.core.mail import send_mail

logger = logging.getLogger(__name__)


class EmailDeliveryError(Exception):
    """Raised when outbound email cannot be sent."""


def is_outbound_email_configured() -> bool:
    """Return True when the active backend can deliver email to real inboxes."""
    backend = settings.EMAIL_BACKEND

    if "mailgun" in backend:
        return bool(settings.MAILGUN_API_KEY and settings.MAILGUN_DOMAIN)

    if "console" in backend:
        return settings.DEBUG

    if "smtp" in backend:
        return bool(getattr(settings, "EMAIL_HOST", ""))

    return True


def ensure_outbound_email_configured() -> None:
    if not is_outbound_email_configured():
        raise EmailDeliveryError(
            "Email delivery is not configured. Set MAILGUN_API_KEY and MAILGUN_DOMAIN in the server environment."
        )


def send_transactional_email(
    *,
    to_email: str,
    subject: str,
    message: str,
    html_message: str | None = None,
) -> None:
    """Send a transactional email; raises EmailDeliveryError on failure."""
    ensure_outbound_email_configured()

    try:
        send_mail(
            subject=subject,
            message=message,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[to_email],
            html_message=html_message,
            fail_silently=False,
        )
    except Exception as exc:
        logger.exception("Failed to send email %r to %s", subject, to_email)
        raise EmailDeliveryError("Could not send email.") from exc
