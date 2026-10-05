import time

from django.core.cache import cache
from django.test import RequestFactory, SimpleTestCase

from account.views import HealthCheckView


class HealthCheckTests(SimpleTestCase):
    def test_health_ignores_anon_rate_limit(self):
        cache.set("throttle_anon_127.0.0.1", [time.time()] * 100, 3600)
        request = RequestFactory().get("/health/")
        response = HealthCheckView.as_view()(request)

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["status"], "ok")
