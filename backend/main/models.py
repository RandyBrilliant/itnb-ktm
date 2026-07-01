"""Main domain models (non-auth concerns)."""

from django.core.exceptions import ValidationError
from django.db import models
from django.utils import timezone
from django.utils.translation import gettext_lazy as _

from account.models import CustomUser, UserRole


class CertificateStatus(models.TextChoices):
    DRAFT = "DRAFT", _("Draft")
    ISSUED = "ISSUED", _("Issued")
    REVOKED = "REVOKED", _("Revoked")


class PostCategory(models.TextChoices):
    ANNOUNCEMENT = "ANNOUNCEMENT", _("Announcement")
    NEWS = "NEWS", _("News")
    EVENT = "EVENT", _("Event")
    ACADEMIC = "ACADEMIC", _("Academic")


class NotificationType(models.TextChoices):
    INFO = "INFO", _("Informasi")
    SUCCESS = "SUCCESS", _("Sukses")
    WARNING = "WARNING", _("Peringatan")
    ERROR = "ERROR", _("Error")
    BROADCAST = "BROADCAST", _("Broadcast")


class NotificationPriority(models.TextChoices):
    LOW = "LOW", _("Rendah")
    NORMAL = "NORMAL", _("Normal")
    HIGH = "HIGH", _("Tinggi")
    URGENT = "URGENT", _("Mendesak")


class CertificateProgramBatchStatus(models.TextChoices):
    PENDING = "PENDING", _("Pending")
    PROCESSING = "PROCESSING", _("Processing")
    COMPLETED = "COMPLETED", _("Completed")
    FAILED = "FAILED", _("Failed")


class WebinarMode(models.TextChoices):
    ONLINE = "ONLINE", _("Online")
    OFFLINE = "OFFLINE", _("In-person")
    HYBRID = "HYBRID", _("Hybrid")


class WebinarStatus(models.TextChoices):
    DRAFT = "DRAFT", _("Draft")
    PUBLISHED = "PUBLISHED", _("Published")
    COMPLETED = "COMPLETED", _("Completed")
    CANCELLED = "CANCELLED", _("Cancelled")


class WebinarRegistrationStatus(models.TextChoices):
    REGISTERED = "REGISTERED", _("Registered")
    WAITLISTED = "WAITLISTED", _("Waitlisted")
    CANCELLED = "CANCELLED", _("Cancelled")


def generate_attendance_secret() -> str:
    """Random per-webinar key used to sign rotating check-in/out tokens."""
    import secrets

    return secrets.token_urlsafe(32)


def default_certificate_layout():
    """Relative coordinates (0–1) for text on the template image."""
    return {
        "name_y_ratio": 0.42,
        "id_y_ratio": 0.48,
        "name_font_ratio": 0.038,
        "id_font_ratio": 0.024,
        "text_color": "#1a1a1a",
    }


class CertificateProgram(models.Model):
    """
    One certificate offering (e.g. seminar): admin uploads an A4 template and a recipient Excel file.
    Celery generates one Certificate per matched portal user (by institutional_id).
    """

    title = models.CharField(_("program title"), max_length=255)
    description = models.TextField(_("description"), blank=True)
    template_image = models.ImageField(_("template image"), upload_to="certificate_templates/%Y/%m/")
    layout = models.JSONField(_("text layout"), default=default_certificate_layout)
    issued_date = models.DateField(_("issued date"))
    valid_until = models.DateField(_("valid until"), null=True, blank=True)
    issued_by = models.ForeignKey(
        CustomUser,
        on_delete=models.SET_NULL,
        null=True,
        related_name="certificate_programs_issued",
        limit_choices_to={"role__in": [UserRole.STAFF, UserRole.ADMIN]},
    )
    recipients_file = models.FileField(
        _("recipients spreadsheet"),
        upload_to="certificate_batches/%Y/%m/",
        help_text=_("Excel file with Name and ID columns."),
    )
    batch_status = models.CharField(
        _("batch status"),
        max_length=20,
        choices=CertificateProgramBatchStatus.choices,
        default=CertificateProgramBatchStatus.PENDING,
        db_index=True,
    )
    batch_summary = models.JSONField(_("batch summary"), default=dict, blank=True)
    created_at = models.DateTimeField(_("created at"), auto_now_add=True)
    updated_at = models.DateTimeField(_("updated at"), auto_now=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self) -> str:
        return self.title


class Certificate(models.Model):
    user = models.ForeignKey(
        CustomUser,
        on_delete=models.CASCADE,
        related_name="certificates",
    )
    program = models.ForeignKey(
        CertificateProgram,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name="certificates",
    )
    title = models.CharField(_("certificate title"), max_length=255)
    description = models.TextField(_("description"), blank=True)
    recipient_name = models.CharField(_("recipient name on certificate"), max_length=255, blank=True)
    recipient_id_display = models.CharField(_("recipient ID on certificate"), max_length=64, blank=True)
    image_url = models.URLField(_("cover image URL"), blank=True)
    issued_by = models.ForeignKey(
        CustomUser,
        on_delete=models.SET_NULL,
        null=True,
        related_name="issued_certificates",
        limit_choices_to={"role__in": [UserRole.STAFF, UserRole.ADMIN]},
    )
    issued_date = models.DateField(_("issued date"))
    valid_until = models.DateField(_("valid until"), null=True, blank=True)
    pdf_file = models.FileField(_("PDF file"), upload_to="certificates/%Y/%m/", null=True, blank=True)
    status = models.CharField(_("status"), max_length=20, choices=CertificateStatus.choices, default=CertificateStatus.DRAFT)
    is_suspended = models.BooleanField(
        _("hidden from recipient portal"),
        default=False,
        db_index=True,
        help_text=_("When true, the recipient does not see this certificate in their list."),
    )
    created_at = models.DateTimeField(_("created at"), auto_now_add=True)
    updated_at = models.DateTimeField(_("updated at"), auto_now=True)

    class Meta:
        ordering = ["-issued_date"]
        constraints = [
            models.UniqueConstraint(
                fields=["program", "user"],
                condition=models.Q(program__isnull=False),
                name="uniq_certificate_program_user",
            ),
        ]

    def __str__(self) -> str:
        label = self.recipient_name or self.user.full_name or self.user.email
        return f"{self.title} - {label}"


class BenefitCategory(models.Model):
    name = models.CharField(_("category name"), max_length=100, unique=True)
    description = models.TextField(_("description"), blank=True)
    icon = models.CharField(_("icon"), max_length=50, blank=True)
    created_at = models.DateTimeField(_("created at"), auto_now_add=True)
    updated_at = models.DateTimeField(_("updated at"), auto_now=True)

    class Meta:
        ordering = ["name"]

    def __str__(self) -> str:
        return self.name


class Benefit(models.Model):
    title = models.CharField(_("benefit title"), max_length=255)
    description = models.TextField(_("description"))
    description_short = models.CharField(_("short description"), max_length=200, blank=True)
    partner = models.CharField(_("partner"), max_length=255, blank=True)
    image_url = models.URLField(_("cover image URL"), blank=True)
    image = models.ImageField(_("cover image"), upload_to="benefits/%Y/%m/", null=True, blank=True)
    category = models.ForeignKey(BenefitCategory, on_delete=models.SET_NULL, null=True, related_name="benefits")
    eligible_roles = models.CharField(_("eligible roles"), max_length=255, default="STUDENT,LECTURER,STAFF,ALUMNI")
    is_active = models.BooleanField(_("is active"), default=True)
    created_at = models.DateTimeField(_("created at"), auto_now_add=True)
    updated_at = models.DateTimeField(_("updated at"), auto_now=True)

    class Meta:
        ordering = ["category", "title"]

    def __str__(self) -> str:
        return self.title

    def is_eligible_for_role(self, role: str) -> bool:
        eligible = [item.strip() for item in self.eligible_roles.split(",") if item.strip()]
        return role in eligible


class Post(models.Model):
    title = models.CharField(_("title"), max_length=255)
    body = models.TextField(_("content"))
    author = models.ForeignKey(
        CustomUser,
        on_delete=models.SET_NULL,
        null=True,
        related_name="posts",
        limit_choices_to={"role__in": [UserRole.LECTURER, UserRole.STAFF]},
    )
    category = models.CharField(_("category"), max_length=50, choices=PostCategory.choices, default=PostCategory.ANNOUNCEMENT)
    is_published = models.BooleanField(_("is published"), default=False)
    published_at = models.DateTimeField(_("published at"), null=True, blank=True)
    image = models.ImageField(_("cover image"), upload_to="posts/%Y/%m/", null=True, blank=True)
    image_url = models.URLField(_("cover image URL"), blank=True)
    created_at = models.DateTimeField(_("created at"), auto_now_add=True)
    updated_at = models.DateTimeField(_("updated at"), auto_now=True)

    class Meta:
        ordering = ["-published_at", "-created_at"]

    def __str__(self) -> str:
        return self.title


class Event(models.Model):
    post = models.OneToOneField(Post, on_delete=models.CASCADE, related_name="event")
    event_date = models.DateTimeField(_("event date & time"))
    event_location = models.CharField(_("location"), max_length=255, blank=True)
    capacity = models.IntegerField(_("capacity"), null=True, blank=True)
    rsvp_count = models.IntegerField(_("RSVP count"), default=0, editable=False)
    created_at = models.DateTimeField(_("created at"), auto_now_add=True)
    updated_at = models.DateTimeField(_("updated at"), auto_now=True)

    class Meta:
        ordering = ["event_date"]

    def __str__(self) -> str:
        return f"Event: {self.post.title}"


class Webinar(models.Model):
    """
    A webinar/seminar. Backed by a Post (category EVENT) so it appears in the
    news feed / announcements automatically. Optionally linked to a
    CertificateProgram whose template is used to auto-issue certificates to
    attendees when they check in.
    """

    post = models.OneToOneField(Post, on_delete=models.CASCADE, related_name="webinar")
    certificate_program = models.ForeignKey(
        CertificateProgram,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="webinars",
        help_text=_("Template used to auto-issue certificates to attendees."),
    )
    mode = models.CharField(
        _("mode"), max_length=10, choices=WebinarMode.choices, default=WebinarMode.OFFLINE
    )
    starts_at = models.DateTimeField(_("starts at"))
    ends_at = models.DateTimeField(_("ends at"))
    location = models.CharField(_("location"), max_length=255, blank=True)
    online_url = models.URLField(_("online meeting URL"), blank=True)
    capacity = models.PositiveIntegerField(_("capacity"), null=True, blank=True)
    registration_opens_at = models.DateTimeField(_("registration opens at"), null=True, blank=True)
    registration_closes_at = models.DateTimeField(_("registration closes at"), null=True, blank=True)
    auto_issue_certificate = models.BooleanField(
        _("auto-issue certificate on check-in"),
        default=True,
        help_text=_("Issue a certificate automatically once an attendee checks in."),
    )
    attendance_secret = models.CharField(
        _("attendance signing secret"), max_length=64, default=generate_attendance_secret
    )
    status = models.CharField(
        _("status"),
        max_length=20,
        choices=WebinarStatus.choices,
        default=WebinarStatus.DRAFT,
        db_index=True,
    )
    created_at = models.DateTimeField(_("created at"), auto_now_add=True)
    updated_at = models.DateTimeField(_("updated at"), auto_now=True)

    class Meta:
        ordering = ["-starts_at"]

    def __str__(self) -> str:
        return f"Webinar: {self.post.title}"

    @property
    def is_registration_open(self) -> bool:
        if self.status != WebinarStatus.PUBLISHED:
            return False
        now = timezone.now()
        if self.registration_opens_at and now < self.registration_opens_at:
            return False
        if self.registration_closes_at and now > self.registration_closes_at:
            return False
        return True

    @property
    def is_full(self) -> bool:
        if not self.capacity:
            return False
        return (
            self.registrations.filter(status=WebinarRegistrationStatus.REGISTERED).count()
            >= self.capacity
        )


class WebinarRegistration(models.Model):
    """One participant per webinar; also carries their attendance record."""

    webinar = models.ForeignKey(Webinar, on_delete=models.CASCADE, related_name="registrations")
    user = models.ForeignKey(
        CustomUser, on_delete=models.CASCADE, related_name="webinar_registrations"
    )
    status = models.CharField(
        _("status"),
        max_length=20,
        choices=WebinarRegistrationStatus.choices,
        default=WebinarRegistrationStatus.REGISTERED,
        db_index=True,
    )
    registered_at = models.DateTimeField(_("registered at"), auto_now_add=True)
    checked_in_at = models.DateTimeField(_("checked in at"), null=True, blank=True)
    checked_out_at = models.DateTimeField(_("checked out at"), null=True, blank=True)
    check_in_method = models.CharField(_("check-in method"), max_length=20, blank=True)
    certificate = models.ForeignKey(
        Certificate,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="webinar_registration",
    )
    created_at = models.DateTimeField(_("created at"), auto_now_add=True)
    updated_at = models.DateTimeField(_("updated at"), auto_now=True)

    class Meta:
        ordering = ["-registered_at"]
        constraints = [
            models.UniqueConstraint(fields=["webinar", "user"], name="uniq_webinar_user"),
        ]

    def __str__(self) -> str:
        return f"{self.user.email} @ {self.webinar_id}"

    @property
    def attended(self) -> bool:
        return self.checked_in_at is not None


class Broadcast(models.Model):
    title = models.CharField(_("judul"), max_length=255)
    message = models.TextField(_("pesan"))
    notification_type = models.CharField(_("tipe"), max_length=20, choices=NotificationType.choices, default=NotificationType.INFO, db_index=True)
    priority = models.CharField(_("prioritas"), max_length=10, choices=NotificationPriority.choices, default=NotificationPriority.NORMAL, db_index=True)
    recipient_config = models.JSONField(_("konfigurasi penerima"), default=dict)
    send_email = models.BooleanField(_("kirim email"), default=False)
    send_push = models.BooleanField(_("kirim push notification"), default=True)
    created_by = models.ForeignKey(
        CustomUser,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="broadcasts_created",
        limit_choices_to={"role__in": [UserRole.ADMIN, UserRole.STAFF]},
        verbose_name=_("dibuat oleh"),
    )
    scheduled_at = models.DateTimeField(_("dijadwalkan pada"), null=True, blank=True)
    sent_at = models.DateTimeField(_("dikirim pada"), null=True, blank=True)
    total_recipients = models.PositiveIntegerField(_("total penerima"), default=0)
    created_at = models.DateTimeField(_("dibuat pada"), auto_now_add=True)
    updated_at = models.DateTimeField(_("diperbarui pada"), auto_now=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self) -> str:
        return f"{self.title} ({self.total_recipients} penerima)"

    def clean(self):
        if not self.send_email and not self.send_push:
            raise ValidationError(_("Pilih minimal satu metode pengiriman (email, atau push)."))


class Notification(models.Model):
    user = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name="notifications", db_index=True, verbose_name=_("pengguna"))
    broadcast = models.ForeignKey(Broadcast, on_delete=models.CASCADE, related_name="notifications", null=True, blank=True, verbose_name=_("broadcast"))
    title = models.CharField(_("judul"), max_length=255)
    message = models.TextField(_("pesan"))
    notification_type = models.CharField(_("tipe"), max_length=20, choices=NotificationType.choices, default=NotificationType.INFO, db_index=True)
    priority = models.CharField(_("prioritas"), max_length=10, choices=NotificationPriority.choices, default=NotificationPriority.NORMAL, db_index=True)
    action_url = models.URLField(_("URL aksi"), blank=True, null=True)
    action_label = models.CharField(_("label aksi"), max_length=100, blank=True)
    is_read = models.BooleanField(_("sudah dibaca"), default=False, db_index=True)
    read_at = models.DateTimeField(_("dibaca pada"), null=True, blank=True)
    email_sent = models.BooleanField(_("email terkirim"), default=False)
    email_sent_at = models.DateTimeField(_("email terkirim pada"), null=True, blank=True)
    created_at = models.DateTimeField(_("dibuat pada"), auto_now_add=True, db_index=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self) -> str:
        return f"{self.title} -> {self.user.email}"

    def mark_as_read(self):
        if not self.is_read:
            self.is_read = True
            self.read_at = timezone.now()
            self.save(update_fields=["is_read", "read_at"])
