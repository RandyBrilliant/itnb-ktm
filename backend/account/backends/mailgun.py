"""Django email backend for the Mailgun Messages API."""

from __future__ import annotations

import logging

import requests
from django.conf import settings
from django.core.mail.backends.base import BaseEmailBackend
from django.core.mail.message import EmailMessage, EmailMultiAlternatives

logger = logging.getLogger(__name__)


class MailgunEmailBackend(BaseEmailBackend):
    """Send email via Mailgun's HTTP API."""

    def __init__(self, fail_silently: bool = False, **kwargs):
        super().__init__(fail_silently=fail_silently, **kwargs)
        self.api_key = getattr(settings, "MAILGUN_API_KEY", "")
        self.domain = getattr(settings, "MAILGUN_DOMAIN", "")
        self.api_url = getattr(
            settings,
            "MAILGUN_API_URL",
            "https://api.mailgun.net/v3",
        ).rstrip("/")

    def send_messages(self, email_messages):
        if not self.api_key or not self.domain:
            if not self.fail_silently:
                raise ValueError("MAILGUN_API_KEY and MAILGUN_DOMAIN must be set.")
            return 0

        sent_count = 0
        for message in email_messages:
            if self._send(message):
                sent_count += 1
        return sent_count

    def _send(self, message: EmailMessage) -> bool:
        url = f"{self.api_url}/{self.domain}/messages"
        data: list[tuple[str, str]] = [
            ("from", message.from_email),
            ("subject", message.subject),
        ]

        for recipient in message.to:
            data.append(("to", recipient))

        text_body = message.body or ""
        html_body = ""
        if isinstance(message, EmailMultiAlternatives):
            for content, mimetype in message.alternatives:
                if mimetype == "text/html":
                    html_body = content
                    break

        if text_body:
            data.append(("text", text_body))
        if html_body:
            data.append(("html", html_body))
        if not text_body and not html_body:
            data.append(("text", ""))

        for recipient in message.cc:
            data.append(("cc", recipient))
        for recipient in message.bcc:
            data.append(("bcc", recipient))
        if message.reply_to:
            data.append(("h:Reply-To", ", ".join(message.reply_to)))

        try:
            response = requests.post(
                url,
                auth=("api", self.api_key),
                data=data,
                timeout=30,
            )
            response.raise_for_status()
            return True
        except requests.RequestException as exc:
            response_detail = ""
            if exc.response is not None:
                response_detail = exc.response.text
            logger.exception(
                "Mailgun API request failed for subject=%r recipients=%r response=%s",
                message.subject,
                message.to,
                response_detail,
            )
            if not self.fail_silently:
                raise
            return False
