"""
Server-rendered sign-in page for the OAuth/OIDC authorize step.

The SPA authenticates with JWTs, but /o/authorize/ needs a Django session, so
apps signing in "with ITNB Portal" send the user here first (settings.LOGIN_URL).
Accepts email or institutional ID (NIM/NIP), like the SPA login.
"""

from django import forms
from django.contrib.auth.forms import AuthenticationForm
from django.contrib.auth.views import LoginView
from django.utils.translation import gettext_lazy as _

from .models import CustomUser, UserRole

_INSTITUTIONAL_ID_ROLES = (UserRole.STUDENT, UserRole.LECTURER, UserRole.ALUMNI)


class PortalAuthenticationForm(AuthenticationForm):
    username = forms.CharField(
        label=_("Email or NIM"),
        max_length=254,
        widget=forms.TextInput(attrs={"autofocus": True, "autocomplete": "username"}),
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
    redirect_authenticated_user = True
