from django.contrib import admin

from .models import (
    Benefit,
    BenefitCategory,
    Certificate,
    CertificateProgram,
    Event,
    Post,
    Webinar,
    WebinarRegistration,
)


@admin.register(Certificate)
class CertificateAdmin(admin.ModelAdmin):
    list_display = ("title", "user", "program", "status", "is_suspended", "issued_date", "valid_until")
    list_filter = ("status", "is_suspended", "issued_date", "valid_until")
    search_fields = ("title", "user__email", "recipient_name", "recipient_id_display")
    readonly_fields = ("created_at", "updated_at")


@admin.register(CertificateProgram)
class CertificateProgramAdmin(admin.ModelAdmin):
    list_display = ("title", "batch_status", "issued_date", "created_at")
    list_filter = ("batch_status", "issued_date")
    search_fields = ("title", "description")
    readonly_fields = ("created_at", "updated_at", "batch_summary")


@admin.register(BenefitCategory)
class BenefitCategoryAdmin(admin.ModelAdmin):
    list_display = ("name", "created_at")
    search_fields = ("name",)
    readonly_fields = ("created_at", "updated_at")


@admin.register(Benefit)
class BenefitAdmin(admin.ModelAdmin):
    list_display = ("title", "category", "partner", "created_at")
    list_filter = ("category", "created_at")
    search_fields = ("title", "partner", "description")
    readonly_fields = ("created_at", "updated_at")


@admin.register(Post)
class PostAdmin(admin.ModelAdmin):
    list_display = ("title", "author", "published_at", "is_published")
    list_filter = ("is_published", "published_at")
    search_fields = ("title", "body", "author__email")
    readonly_fields = ("created_at", "updated_at")


@admin.register(Event)
class EventAdmin(admin.ModelAdmin):
    list_display = ("post", "event_date", "event_location", "rsvp_count")
    list_filter = ("event_date", "created_at")
    search_fields = ("post__title", "event_location")
    readonly_fields = ("created_at", "updated_at", "rsvp_count")


class WebinarRegistrationInline(admin.TabularInline):
    model = WebinarRegistration
    extra = 0
    autocomplete_fields = ("user",)
    readonly_fields = ("registered_at", "checked_in_at", "checked_out_at", "certificate")


@admin.register(Webinar)
class WebinarAdmin(admin.ModelAdmin):
    list_display = ("post", "mode", "status", "starts_at", "certificate_program")
    list_filter = ("mode", "status", "starts_at")
    search_fields = ("post__title",)
    readonly_fields = ("created_at", "updated_at", "attendance_secret")
    inlines = [WebinarRegistrationInline]


@admin.register(WebinarRegistration)
class WebinarRegistrationAdmin(admin.ModelAdmin):
    list_display = ("webinar", "user", "status", "checked_in_at", "checked_out_at", "certificate")
    list_filter = ("status", "checked_in_at")
    search_fields = ("webinar__post__title", "user__email", "user__full_name")
    readonly_fields = ("registered_at", "created_at", "updated_at")
