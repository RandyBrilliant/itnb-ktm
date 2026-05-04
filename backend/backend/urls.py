"""
URL configuration for backend project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/5.2/topics/http/urls/
"""

from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from account.views import HealthCheckView

urlpatterns = [
    # Admin panel
    path("admin/", admin.site.urls),
    
    # JWT Token endpoints
    path("api/token/", TokenObtainPairView.as_view(), name="token_obtain_pair"),
    path("api/token/refresh/", TokenRefreshView.as_view(), name="token_refresh"),
    path("api/auth/token/", TokenObtainPairView.as_view(), name="auth_token_obtain_pair"),
    path("api/auth/token/refresh/", TokenRefreshView.as_view(), name="auth_token_refresh"),
    path("health/", HealthCheckView.as_view(), name="health"),
    
    # Account app (users, profiles, certificates, etc.)
    path("api/", include("account.urls")),
    
    # Main app (if needed)
    path("api/", include("main.urls")),
]

# Serve media files in development
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
