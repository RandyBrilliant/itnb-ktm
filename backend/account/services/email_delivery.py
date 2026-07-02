"""Transactional email delivery (Mailgun API or Django console backend)."""

from __future__ import annotations

import logging

from django.conf import settings
from django.core.mail import send_mail

logger = logging.getLogger(__name__)


class EmailDeliveryError(Exception):
    """Raised when outbound email cannot be sent or queued."""


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


def _should_queue_email() -> bool:
    """Use Celery for outbound mail unless explicitly disabled or using console in DEBUG."""
    if not getattr(settings, "EMAIL_DELIVERY_ASYNC", True):
        return False
    if settings.DEBUG and "console" in settings.EMAIL_BACKEND:
        return False
    return True


def _send_email_sync(
    *,
    to_email: str,
    subject: str,
    message: str,
    html_message: str | None,
) -> None:
    send_mail(
        subject=subject,
        message=message,
        from_email=settings.DEFAULT_FROM_EMAIL,
        recipient_list=[to_email],
        html_message=html_message,
        fail_silently=False,
    )


def send_transactional_email(
    *,
    to_email: str,
    subject: str,
    message: str,
    html_message: str | None = None,
) -> None:
    """Queue or send a transactional email.

    Production mail is queued on Celery so API requests are not blocked by Mailgun.
    Raises EmailDeliveryError when email is not configured or the queue is unavailable.
    """
    ensure_outbound_email_configured()

    try:
        if _should_queue_email():
            from account.tasks import send_email_async

            send_email_async.apply_async(
                kwargs={
                    "to_email": to_email,
                    "subject": subject,
                    "body": message,
                    "html_message": html_message,
                },
                ignore_result=True,
            )
            logger.info("Queued email %r to %s", subject, to_email)
            return

        _send_email_sync(
            to_email=to_email,
            subject=subject,
            message=message,
            html_message=html_message,
        )
    except Exception as exc:
        logger.exception("Failed to send email %r to %s", subject, to_email)
        raise EmailDeliveryError("Could not send email.") from exc
