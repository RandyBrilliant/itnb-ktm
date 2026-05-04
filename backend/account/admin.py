"""
Django admin configuration for account app.
Registers all models for admin panel access.
"""

from django.contrib import admin
from django.utils.translation import gettext_lazy as _

from .models import (
    CustomUser,
    LecturerProfile,
    StaffProfile,
    AlumniProfile,
    DigitalCard,
)


@admin.register(CustomUser)
class CustomUserAdmin(admin.ModelAdmin):
    list_display = ("email", "full_name", "role", "is_active", "joined_date")
    list_filter = ("role", "is_active", "joined_date")
    search_fields = ("email", "full_name")
    readonly_fields = ("updated_at", "email_verified_at", "date_joined", "last_login")
    fieldsets = (
        (_("Account"), {
            "fields": ("email", "password", "role", "is_active", "is_superuser"),
        }),
        (_("Profile"), {
            "fields": ("full_name", "photo", "department", "alumni_year"),
        }),
        (_("Important Dates"), {
            "fields": ("date_joined", "last_login", "updated_at"),
        }),
    )
    ordering = ("-date_joined",)


@admin.register(LecturerProfile)
class LecturerProfileAdmin(admin.ModelAdmin):
    list_display = ("user", "created_at")
    search_fields = ("user__email", "user__full_name")
    readonly_fields = ("created_at", "updated_at")


@admin.register(StaffProfile)
class StaffProfileAdmin(admin.ModelAdmin):
    list_display = ("user", "can_issue_certificates", "can_manage_benefits", "updated_at")
    list_filter = ("can_issue_certificates", "can_manage_benefits")
    search_fields = ("user__email", "user__full_name")
    readonly_fields = ("created_at", "updated_at")


@admin.register(AlumniProfile)
class AlumniProfileAdmin(admin.ModelAdmin):
    list_display = ("user", "graduation_year", "updated_at")
    list_filter = ("graduation_year", "updated_at")
    search_fields = ("user__email", "user__full_name")
    readonly_fields = ("created_at", "updated_at")


@admin.register(DigitalCard)
class DigitalCardAdmin(admin.ModelAdmin):
    list_display = ("card_number", "user", "card_type", "is_active", "valid_until")
    list_filter = ("card_type", "is_active", "valid_until")
    search_fields = ("card_number", "user__email")
    readonly_fields = ("created_at", "updated_at")


