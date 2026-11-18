"""
Server-rendered sign-in page for the OAuth/OIDC authorize step.

The SPA authenticates with JWTs, but /o/authorize/ needs a Django session, so
apps signing in "with ITNB Portal" send the user here first (settings.LOGIN_URL).
Accepts email or institutional ID (NIM/NIP), like the SPA login.
"""

from urllib.parse import parse_qs, urlparse

from django import forms
from django.conf import settings
from django.contrib.auth.forms import AuthenticationForm
from django.contrib.auth.views import LoginView
from django.utils.translation import gettext_lazy as _

from .models import CustomUser, UserRole

_INSTITUTIONAL_ID_ROLES = (UserRole.STUDENT, UserRole.LECTURER, UserRole.ALUMNI)


class PortalAuthenticationForm(AuthenticationForm):
    username = forms.CharField(
        label=_("Student ID / Email"),
        max_length=254,
        widget=forms.TextInput(
            attrs={
                "autofocus": True,
                "autocomplete": "username",
                "placeholder": "NIM, NIP, or email address",
            }
        ),
    )
    password = forms.CharField(
        label=_("Password"),
        strip=False,
        widget=forms.PasswordInput(
            attrs={"autocomplete": "current-password", "placeholder": "••••••••"}
        ),
    )

    def clean(self):
        raw = (self.cleaned_data.get("username") or "").strip()
        if raw and "@" not in raw:
            email = (
                CustomUser.objects.filter(
                    institutional_id__iexact=raw,
                    role__in=_INSTITUTIONAL_ID_ROLES,
                    is_active=True,
                )
                .values_list("email", flat=True)
                .first()
            )
            if email:
                self.cleaned_data["username"] = email
        return super().clean()


class PortalLoginView(LoginView):
    template_name = "account/oauth_login.html"
    authentication_form = PortalAuthenticationForm
    # Always show the form, even with an existing session, so a client app can
    # send the user here to sign in again (or as someone else).
    redirect_authenticated_user = False

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context["client_app_name"] = self._client_app_name()
        context["forgot_password_url"] = (
            f"{settings.FRONTEND_URL.rstrip('/')}/forgot-password"
        )
        return context

    def _client_app_name(self):
        """Name of the app the user is signing in to, from the /o/authorize/ `next` URL."""
        next_url = urlparse(self.get_redirect_url() or "")
        client_id = parse_qs(next_url.query).get("client_id", [""])[0]
        if not client_id:
            return ""
        from oauth2_provider.models import get_application_model

        return (
            get_application_model()
            .objects.filter(client_id=client_id)
            .values_list("name", flat=True)
            .first()
            or ""
        )
