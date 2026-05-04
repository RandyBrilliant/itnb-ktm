from django.contrib import admin

from .models import Benefit, BenefitCategory, Certificate, Event, Post


@admin.register(Certificate)
class CertificateAdmin(admin.ModelAdmin):
    list_display = ("title", "user", "status", "issued_date", "valid_until")
    list_filter = ("status", "issued_date", "valid_until")
    search_fields = ("title", "user__email")
    readonly_fields = ("created_at", "updated_at")


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
