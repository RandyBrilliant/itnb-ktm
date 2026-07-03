"""Public certificate verification by institutional ID."""

from __future__ import annotations

from account.models import CustomUser
from main.models import Certificate, CertificateStatus


def _role_from_description(description: str) -> str:
    for line in (description or "").splitlines():
        if line.startswith("Role: "):
            return line.removeprefix("Role: ").strip()
    return ""


def verify_certificates_by_institutional_id(institutional_id: str) -> dict | None:
    """
    Look up issued certificates for a portal user by institutional ID (NIM/NIP).
    Returns None when no portal account exists for that ID.
    """
    inst = (institutional_id or "").strip()
    if not inst:
        return None

    user = CustomUser.objects.filter(institutional_id__iexact=inst).first()
    if not user:
        return None

    certificates = (
        Certificate.objects.filter(
            user=user,
            status=CertificateStatus.ISSUED,
            is_suspended=False,
        )
        .order_by("-issued_date", "-id")
    )

    items = [
        {
            "title": cert.title,
            "issued_date": cert.issued_date.isoformat(),
            "role": _role_from_description(cert.description),
            "recipient_name": cert.recipient_name or user.full_name or "",
        }
        for cert in certificates
    ]

    return {
        "institutional_id": user.institutional_id or inst,
        "recipient_name": user.full_name or (items[0]["recipient_name"] if items else ""),
        "verified": bool(items),
        "certificate_count": len(items),
        "certificates": items,
    }
