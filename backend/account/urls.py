"""
Account app URL configuration.
Registers all ViewSets and custom paths for the multi-role digital hub API.
Routes: /api/...
"""

from django.urls import path, include
from rest_framework.routers import DefaultRouter

from . import views

app_name = "account"

# DefaultRouter for ViewSets
router = DefaultRouter()

# User management
router.register(r"users", views.UserViewSet, basename="user")

# Profiles
router.register(r"lecturer-profiles", views.LecturerProfileViewSet, basename="lecturer-profile")
router.register(r"staff-profiles", views.StaffProfileViewSet, basename="staff-profile")
router.register(r"alumni-profiles", views.AlumniProfileViewSet, basename="alumni-profile")

# Digital Cards
router.register(r"cards", views.DigitalCardViewSet, basename="digital-card")

# Custom paths (outside router)
urlpatterns = [
    path("users/import-students/", views.StudentImportView.as_view(), name="student-import"),
    # Auth endpoints
    path("auth/me/", views.MeView.as_view(), name="auth-me"),
    path("auth/logout/", views.LogoutView.as_view(), name="auth-logout"),
    path("auth/forgot-password/", views.ForgotPasswordRequestView.as_view(), name="auth-forgot-password"),
    path("auth/reset-password/", views.PasswordResetConfirmView.as_view(), name="auth-reset-password"),
    path("auth/change-password/", views.ChangePasswordView.as_view(), name="auth-change-password"),
    path("health/", views.HealthCheckView.as_view(), name="health"),
    
    # Router paths
    path("", include(router.urls)),
]
