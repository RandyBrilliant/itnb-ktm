import base64
import json
from io import StringIO
from urllib.parse import parse_qs, urlparse

from django.core.cache import cache
from django.core.management import call_command
from django.test import TestCase
from jwcrypto import jwk, jwt
from oauth2_provider.models import get_application_model

from account.models import CustomUser, UserRole

REDIRECT_URI = "https://library.itnb.ac.id/auth/portal/callback"
Application = get_application_model()


class OidcProviderTests(TestCase):
    def setUp(self):
        cache.clear()  # login throttle bucket is shared with other auth tests
        self.user = CustomUser.objects.create_user(
            email="student@itnb.ac.id",
            password="S3cure-pass!",
            full_name="Siti Student",
            role=UserRole.STUDENT,
            institutional_id="2301001",
            department="Information Systems",
            email_verified=True,
        )
        out = StringIO()
        call_command(
            "register_oidc_client", "ITNB Library", "--redirect-uri", REDIRECT_URI, stdout=out
        )
        lines = dict(
            line.split(":", 1) for line in out.getvalue().splitlines() if line.startswith("Client ")
        )
        self.client_id = lines["Client ID"].strip()
        self.client_secret = lines["Client secret"].strip()

    def _authorize(self, **extra):
        params = {
            "response_type": "code",
            "client_id": self.client_id,
            "redirect_uri": REDIRECT_URI,
            "scope": "openid profile email",
            "state": "xyz",
            "nonce": "n-0S6",
            **extra,
        }
        return self.client.get("/o/authorize/", params)

    def _exchange(self, code):
        basic = base64.b64encode(f"{self.client_id}:{self.client_secret}".encode()).decode()
        return self.client.post(
            "/o/token/",
            {"grant_type": "authorization_code", "code": code, "redirect_uri": REDIRECT_URI},
            HTTP_AUTHORIZATION=f"Basic {basic}",
        )

    def test_discovery_document(self):
        res = self.client.get("/o/.well-known/openid-configuration")
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertIn("authorization_endpoint", data)
        for claim in ("nim", "name", "email", "major", "role"):
            self.assertIn(claim, data["claims_supported"])

    def test_authorize_redirects_anonymous_user_to_login(self):
        res = self._authorize()
        self.assertEqual(res.status_code, 302)
        self.assertTrue(res["Location"].startswith("/accounts/login/?next="))

    def test_login_page_accepts_nim(self):
        res = self.client.post(
            "/accounts/login/", {"username": "2301001", "password": "S3cure-pass!", "next": "/o/"}
        )
        self.assertEqual(res.status_code, 302)
        self.assertEqual(int(self.client.session["_auth_user_id"]), self.user.pk)

    def test_login_page_shows_form_when_already_signed_in(self):
        self.client.force_login(self.user)
        res = self.client.get("/accounts/login/", {"next": "/o/userinfo/"})
        self.assertEqual(res.status_code, 200)
        self.assertContains(res, "Sign in with ITNB Portal")

    def test_full_code_flow_returns_claims(self):
        self.client.force_login(self.user)
        res = self._authorize()
        self.assertEqual(res.status_code, 302, res.content[:500])
        location = urlparse(res["Location"])
        self.assertEqual(f"{location.scheme}://{location.netloc}{location.path}", REDIRECT_URI)
        query = parse_qs(location.query)
        self.assertEqual(query["state"], ["xyz"])

        tokens = self._exchange(query["code"][0])
        self.assertEqual(tokens.status_code, 200, tokens.content)
        tokens = tokens.json()

        jwks = self.client.get("/o/.well-known/jwks.json").json()
        key = jwk.JWK(**jwks["keys"][0])
        claims = json.loads(jwt.JWT(jwt=tokens["id_token"], key=key).claims)
        self.assertEqual(claims["aud"], self.client_id)
        self.assertEqual(claims["nonce"], "n-0S6")
        self.assertEqual(claims["sub"], str(self.user.pk))
        self.assertEqual(claims["nim"], "2301001")
        self.assertEqual(claims["name"], "Siti Student")
        self.assertEqual(claims["email"], "student@itnb.ac.id")
        self.assertEqual(claims["major"], "Information Systems")
        self.assertEqual(claims["role"], "STUDENT")

        info = self.client.get(
            "/o/userinfo/", HTTP_AUTHORIZATION=f"Bearer {tokens['access_token']}"
        ).json()
        self.assertEqual(info["nim"], "2301001")
        self.assertEqual(info["email"], "student@itnb.ac.id")

    def test_profile_claims_require_profile_scope(self):
        self.client.force_login(self.user)
        res = self._authorize(scope="openid email")
        code = parse_qs(urlparse(res["Location"]).query)["code"][0]
        id_token = self._exchange(code).json()["id_token"]
        payload = json.loads(base64.urlsafe_b64decode(id_token.split(".")[1] + "=="))
        self.assertEqual(payload["email"], "student@itnb.ac.id")
        self.assertNotIn("nim", payload)
        self.assertNotIn("role", payload)

    def test_wrong_redirect_uri_is_rejected(self):
        self.client.force_login(self.user)
        res = self._authorize(redirect_uri="https://evil.example/callback")
        self.assertEqual(res.status_code, 400)

    def test_secret_is_stored_hashed(self):
        app = Application.objects.get(client_id=self.client_id)
        self.assertNotEqual(app.client_secret, self.client_secret)
        self.assertFalse(app.client_type == Application.CLIENT_PUBLIC)

    def test_register_command_refuses_duplicate_without_rotate(self):
        from django.core.management.base import CommandError

        with self.assertRaises(CommandError):
            call_command(
                "register_oidc_client", "ITNB Library", "--redirect-uri", REDIRECT_URI,
                stdout=StringIO(),
            )
