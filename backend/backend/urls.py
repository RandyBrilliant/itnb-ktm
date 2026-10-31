"""
URL configuration for backend project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/5.2/topics/http/urls/
"""

from functools import wraps

from django.contrib import admin
from django.http import HttpResponse
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from rest_framework_simplejwt.views import TokenRefreshView
from account.throttles import AuthRateThrottle
from account.views import HealthCheckView, HubTokenObtainPairView


def _throttle_login_attempts(login_view):
    """Apply the API login rate limit (per IP) to admin login attempts."""

    @wraps(login_view)
    def wrapper(request, *args, **kwargs):
        if request.method == "POST":
            throttle = AuthRateThrottle()
            if not throttle.allow_request(request, None):
                response = HttpResponse("Too many login attempts. Try again later.", status=429)
                response["Retry-After"] = str(int(throttle.wait() or 60))
                return response
        return login_view(request, *args, **kwargs)

    return wrapper


admin.site.login = _throttle_login_attempts(admin.site.login)

urlpatterns = [
    # Admin panel
    path("admin/", admin.site.urls),
    
    # JWT Token endpoints
    path("api/token/", HubTokenObtainPairView.as_view(), name="token_obtain_pair"),
    path("api/token/refresh/", TokenRefreshView.as_view(), name="token_refresh"),
    path("api/auth/token/", HubTokenObtainPairView.as_view(), name="auth_token_obtain_pair"),
    path("api/auth/token/refresh/", TokenRefreshView.as_view(), name="auth_token_refresh"),
    path("health/", HealthCheckView.as_view(), name="health"),
    
    # Account app (users, profiles, certificates, etc.)
    path("api/", include("account.urls")),
    
    # Main app (if needed)
    path("api/", include("main.urls")),

    # Academic (SIS read-only scores)
    path("api/", include("academic.urls")),
]

# Serve media files in development
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
