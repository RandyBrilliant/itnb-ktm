"""
OpenID Connect provider glue for django-oauth-toolkit.

Other campus apps (e.g. the library at library.itnb.ac.id) sign users in with
their portal account via the authorization-code flow. The claims below are
returned in the ID token and from /o/userinfo/ according to the granted scopes.
"""

from oauth2_provider.oauth2_validators import OAuth2Validator


class PortalOAuth2Validator(OAuth2Validator):
    # Claim -> scope that must be granted for the claim to be released.
    oidc_claim_scope = {
        **OAuth2Validator.oidc_claim_scope,
        "nim": "profile",
        "major": "profile",
        "role": "profile",
    }

    def get_additional_claims(self):
        # Request-agnostic form (callables) so the claims are also advertised
        # in the discovery document's claims_supported.
        return {
            "name": lambda r: r.user.full_name or r.user.email,
            "email": lambda r: r.user.email,
            "email_verified": lambda r: bool(r.user.email_verified),
            "nim": lambda r: r.user.institutional_id or "",
            "major": lambda r: r.user.department or "",
            "role": lambda r: r.user.role,
        }
