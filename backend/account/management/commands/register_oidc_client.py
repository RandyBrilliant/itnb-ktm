"""
Register an app that signs users in with their portal account (OpenID Connect).

    python manage.py register_oidc_client "ITNB Library" \
        --redirect-uri https://library.itnb.ac.id/auth/portal/callback

Prints the client ID and secret once. The secret is stored hashed, so copy it
immediately; re-run with --rotate-secret to issue a new one.
"""

from django.core.management.base import BaseCommand, CommandError
from django.db import transaction
from oauth2_provider.generators import generate_client_secret
from oauth2_provider.models import get_application_model


class Command(BaseCommand):
    help = "Create (or update) a confidential OIDC client and print its credentials."

    def add_arguments(self, parser):
        parser.add_argument("name", help='Application name, e.g. "ITNB Library".')
        parser.add_argument(
            "--redirect-uri",
            action="append",
            required=True,
            dest="redirect_uris",
            help="Allowed redirect URI (repeat for several).",
        )
        parser.add_argument(
            "--post-logout-redirect-uri",
            action="append",
            default=[],
            dest="post_logout_redirect_uris",
            help="Allowed post-logout redirect URI (repeat for several).",
        )
        parser.add_argument(
            "--ask-consent",
            action="store_true",
            help="Show a consent screen (default: skip it for first-party campus apps).",
        )
        parser.add_argument(
            "--rotate-secret",
            action="store_true",
            help="Issue a new secret for an existing application with this name.",
        )

    @transaction.atomic
    def handle(self, *args, **opts):
        Application = get_application_model()
        name = opts["name"]
        app = Application.objects.filter(name=name).first()

        if app is not None and not opts["rotate_secret"]:
            raise CommandError(
                f'Application "{name}" already exists (client ID {app.client_id}). '
                "Use --rotate-secret to issue a new secret, or edit it in the admin."
            )

        secret = generate_client_secret()
        if app is None:
            app = Application(name=name)
        app.client_type = Application.CLIENT_CONFIDENTIAL
        app.authorization_grant_type = Application.GRANT_AUTHORIZATION_CODE
        app.algorithm = Application.RS256_ALGORITHM
        app.redirect_uris = " ".join(opts["redirect_uris"])
        app.post_logout_redirect_uris = " ".join(opts["post_logout_redirect_uris"])
        app.skip_authorization = not opts["ask_consent"]
        app.client_secret = secret  # hashed on save
        app.full_clean(exclude=["user", "client_secret"])
        app.save()

        self.stdout.write(self.style.SUCCESS(f'Registered "{name}".'))
        self.stdout.write(f"Client ID:     {app.client_id}")
        self.stdout.write(f"Client secret: {secret}")
        self.stdout.write(
            self.style.WARNING("Copy the secret now — it is stored hashed and cannot be shown again.")
        )
