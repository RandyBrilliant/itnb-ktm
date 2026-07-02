"""Send and validate email verification codes."""

from __future__ import annotations

import logging

from account.models import EmailVerificationCode
from account.services.email_delivery import EmailDeliveryError, send_transactional_email

logger = logging.getLogger(__name__)


def send_verification_code_email(
    *,
    target_email: str,
    code: str,
    purpose: str = "verify",
) -> None:
    """Send a 6-digit verification code to the given address."""
    expiry = EmailVerificationCode.CODE_EXPIRY_MINUTES
    if purpose == "change":
        subject = "ITNB Hub — Confirm your new email address"
        message = (
            "You requested to change your ITNB Hub account email to this address.\n\n"
            f"Your verification code is: {code}\n\n"
            f"This code expires in {expiry} minutes.\n"
            "If you did not request this change, you can ignore this email."
        )
    else:
        subject = "ITNB Hub — Verify your email address"
        message = (
            "Please verify your ITNB Hub email address.\n\n"
            f"Your verification code is: {code}\n\n"
            f"This code expires in {expiry} minutes.\n"
            "If you did not request this, you can ignore this email."
        )

    send_transactional_email(
        to_email=target_email,
        subject=subject,
        message=message,
    )


def create_and_send_verification_code(user, *, pending_email: str | None = None) -> EmailVerificationCode:
    """Create a verification code and email it to the appropriate address."""
    verification = EmailVerificationCode.create_for_user(user, pending_email=pending_email)
    target_email = (pending_email or user.email).strip().lower()
    purpose = "change" if pending_email else "verify"

    try:
        send_verification_code_email(
            target_email=target_email,
            code=verification.code,
            purpose=purpose,
        )
    except EmailDeliveryError:
        raise
    except Exception:
        logger.exception("Failed to send verification email to %s", target_email)
        raise

    return verification
