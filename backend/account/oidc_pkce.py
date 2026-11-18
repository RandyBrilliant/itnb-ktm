"""PKCE policy for OAUTH2_PROVIDER["PKCE_REQUIRED"] (imported from settings, so no model imports at module level)."""


def pkce_required(client_id):
    """Require PKCE for public clients; confidential clients authenticate with their secret."""
    from oauth2_provider.models import get_application_model

    Application = get_application_model()
    client_type = (
        Application.objects.filter(client_id=client_id)
        .values_list("client_type", flat=True)
        .first()
    )
    return client_type != Application.CLIENT_CONFIDENTIAL
