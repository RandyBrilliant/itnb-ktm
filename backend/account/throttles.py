"""
Rate limiting for account/auth endpoints.

Email-sending endpoints use stricter per-IP / per-user limits to protect
the Mailgun API from abuse (forgot-password, verification resends).
"""
from rest_framework.throttling import SimpleRateThrottle


class AuthRateThrottle(SimpleRateThrottle):
    """
    Stricter throttle for auth endpoints (login).
    Scope: auth (e.g. 10/min per IP).
    """
    scope = "auth"

    def get_cache_key(self, request, view):
        if request.user and request.user.is_authenticated:
            return None
        return self.cache_format % {
            "scope": self.scope,
            "ident": self.get_ident(request),
        }


class AuthPublicRateThrottle(SimpleRateThrottle):
    """
    Throttle for sensitive public endpoints (e.g. card verification).
    Scope: auth_public (e.g. 5/min per IP).
    """
    scope = "auth_public"

    def get_cache_key(self, request, view):
        return self.cache_format % {
            "scope": self.scope,
            "ident": self.get_ident(request),
        }


class EmailSendRateThrottle(SimpleRateThrottle):
    """
    Outbound email from public endpoints (forgot-password).
    Scope: email_send (e.g. 3/hour per IP).
    """
    scope = "email_send"

    def get_cache_key(self, request, view):
        return self.cache_format % {
            "scope": self.scope,
            "ident": self.get_ident(request),
        }


class EmailSendUserRateThrottle(SimpleRateThrottle):
    """
    Outbound email for authenticated users (verification resend, email change).
    Scope: email_send_user (e.g. 5/hour per user).
    """
    scope = "email_send_user"

    def get_cache_key(self, request, view):
        if request.user and request.user.is_authenticated:
            ident = f"user-{request.user.pk}"
        else:
            ident = self.get_ident(request)
        return self.cache_format % {
            "scope": self.scope,
            "ident": ident,
        }


class EmailVerifyRateThrottle(SimpleRateThrottle):
    """
    Email OTP verification attempts (brute-force protection).
    Scope: email_verify (e.g. 10/min per user).
    """
    scope = "email_verify"

    def get_cache_key(self, request, view):
        if request.user and request.user.is_authenticated:
            ident = f"user-{request.user.pk}"
        else:
            ident = self.get_ident(request)
        return self.cache_format % {
            "scope": self.scope,
            "ident": ident,
        }
