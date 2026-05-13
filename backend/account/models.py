"""
Account models for the multi-role digital hub.

- CustomUser: email-based auth with role (Admin, Staff, Lecturer, Student, Alumni)
- Role-specific profiles: LecturerProfile, StaffProfile, AlumniProfile
- Digital ID Cards: DigitalCard with QR code generation
- EmailVerificationCode: OTP-based email verification
"""

from django.db import models
from django.contrib.auth.models import AbstractUser
from django.utils import timezone
from django.utils.translation import gettext_lazy as _

from .managers import CustomUserManager


# ---------------------------------------------------------------------------
# Choices (single source of truth; max length must fit longest value)
# ---------------------------------------------------------------------------

class UserRole(models.TextChoices):
    """User roles for access control and profile differentiation."""

    ADMIN = "ADMIN", _("Admin")
    STAFF = "STAFF", _("Staff")
    LECTURER = "LECTURER", _("Lecturer")
    STUDENT = "STUDENT", _("Student")
    ALUMNI = "ALUMNI", _("Alumni")

# Longest choice value length for CharField max_length
USER_ROLE_MAX_LENGTH = max(len(choice.value) for choice in UserRole)


# ---------------------------------------------------------------------------
# User
# ---------------------------------------------------------------------------

class CustomUser(AbstractUser):
    """
    Email-based user with a single role: Admin, Staff, Lecturer, Student, or Alumni.
    Photo, department, and joined_date fields support role-specific profiles.
    """

    email = models.EmailField(
        _("email address"),
        unique=True,
        db_index=True,
        help_text=_("Used for login and notifications."),
    )
    full_name = models.CharField(
        _("full name"),
        max_length=255,
        blank=True,
        help_text=_("User's complete name."),
    )
    role = models.CharField(
        _("role"),
        max_length=USER_ROLE_MAX_LENGTH,
        choices=UserRole.choices,
        default=UserRole.STUDENT,
        db_index=True,
        help_text=_("Determines access level and profile type."),
    )
    photo = models.ImageField(
        _("profile photo"),
        upload_to="profile_photos/%Y/%m/",
        null=True,
        blank=True,
        help_text=_("User profile picture."),
    )
    department = models.CharField(
        _("department"),
        max_length=100,
        blank=True,
        help_text=_("Department (for Staff/Lecturer)."),
    )
    joined_date = models.DateTimeField(
        _("date joined"),
        default=timezone.now,
        help_text=_("When user joined the institution."),
    )
    alumni_year = models.IntegerField(
        _("alumni year"),
        null=True,
        blank=True,
        help_text=_("Graduation year (for Alumni only)."),
    )
    email_verified = models.BooleanField(
        _("email verified"),
        default=False,
        db_index=True,
        help_text=_("Whether email has been verified."),
    )
    email_verified_at = models.DateTimeField(
        _("email verified at"),
        null=True,
        blank=True,
        help_text=_("Timestamp of email verification."),
    )
    google_id = models.CharField(
        _("Google ID"),
        max_length=255,
        null=True,
        blank=True,
        unique=True,
        db_index=True,
        help_text=_("Google OAuth ID for social login."),
    )
    institutional_id = models.CharField(
        _("student / staff ID"),
        max_length=64,
        null=True,
        blank=True,
        unique=True,
        db_index=True,
        help_text=_("Official ID (NIM/NIP/etc.) for matching certificates and records."),
    )
    updated_at = models.DateTimeField(_("updated at"), auto_now=True)

    username = None
    first_name = None
    last_name = None

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = []

    objects = CustomUserManager()

    class Meta:
        ordering = ["-is_active", "email"]
        verbose_name = _("user")
        verbose_name_plural = _("users")
        indexes = [
            models.Index(fields=["role", "is_active"]),
            models.Index(fields=["email", "is_active"]),
        ]

    def __str__(self) -> str:
        return f"{self.email} ({self.get_role_display()})"
    
    def __repr__(self) -> str:
        return f"<CustomUser: {self.email} ({self.role})>"

    # ---- Role helper properties ----

    @property
    def is_admin_user(self) -> bool:
        """True if user has Admin role."""
        return self.role == UserRole.ADMIN

    @property
    def is_staff_user(self) -> bool:
        """True if user has Staff role."""
        return self.role == UserRole.STAFF
    
    @property
    def is_lecturer_user(self) -> bool:
        """True if user has Lecturer role."""
        return self.role == UserRole.LECTURER
    
    @property
    def is_student_user(self) -> bool:
        """True if user has Student role."""
        return self.role == UserRole.STUDENT
    
    @property
    def is_alumni_user(self) -> bool:
        """True if user has Alumni role."""
        return self.role == UserRole.ALUMNI


# ---------------------------------------------------------------------------
# Role-Specific Profiles
# ---------------------------------------------------------------------------

class StaffProfile(models.Model):
    """Extended profile for Staff users."""

    user = models.OneToOneField(
        CustomUser,
        on_delete=models.CASCADE,
        related_name="staff_profile",
        limit_choices_to={"role": UserRole.STAFF},
    )
    staff_role = models.CharField(
        _("staff role"),
        max_length=100,
        blank=True,
        help_text=_("e.g., Academic Administrator, Finance Officer."),
    )
    can_issue_certificates = models.BooleanField(
        _("can issue certificates"),
        default=False,
        help_text=_("Whether this staff can issue/revoke certificates."),
    )
    can_manage_benefits = models.BooleanField(
        _("can manage benefits"),
        default=False,
        help_text=_("Whether this staff can manage benefits directory."),
    )
    created_at = models.DateTimeField(_("created at"), auto_now_add=True)
    updated_at = models.DateTimeField(_("updated at"), auto_now=True)

    class Meta:
        verbose_name = _("staff profile")
        verbose_name_plural = _("staff profiles")

    def __str__(self) -> str:
        return f"Staff: {self.user.email}"


class AlumniProfile(models.Model):
    """Extended profile for Alumni users."""

    user = models.OneToOneField(
        CustomUser,
        on_delete=models.CASCADE,
        related_name="alumni_profile",
        limit_choices_to={"role": UserRole.ALUMNI},
    )
    graduation_year = models.IntegerField(
        _("graduation year"),
        null=True,
        blank=True,
        help_text=_("Year of graduation."),
    )
    graduation_date = models.DateField(
        _("graduation date"),
        null=True,
        blank=True,
        help_text=_("Date of graduation."),
    )
    alumni_membership_status = models.CharField(
        _("membership status"),
        max_length=50,
        default="active",
        choices=[("active", _("Active")), ("inactive", _("Inactive"))],
        help_text=_("Alumni membership status."),
    )
    created_at = models.DateTimeField(_("created at"), auto_now_add=True)
    updated_at = models.DateTimeField(_("updated at"), auto_now=True)

    class Meta:
        verbose_name = _("alumni profile")
        verbose_name_plural = _("alumni profiles")

    def __str__(self) -> str:
        return f"Alumni: {self.user.email}"


# ---------------------------------------------------------------------------
# Digital Cards (ID Cards with QR Code)
# ---------------------------------------------------------------------------

class DigitalCard(models.Model):
    """
    Digital ID card for users with unique card number and QR code.
    Card type is derived from user role.
    """

    CARD_TYPES = [
        ("STUDENT", _("Student Card")),
        ("LECTURER", _("Staff Card")),
        ("STAFF", _("Staff Card")),
        ("ALUMNI", _("Alumni Card")),
    ]

    user = models.OneToOneField(
        CustomUser,
        on_delete=models.CASCADE,
        related_name="digital_card",
    )
    card_number = models.CharField(
        _("card number"),
        max_length=50,
        unique=True,
        db_index=True,
        help_text=_("Unique identifier for the card."),
    )
    card_type = models.CharField(
        _("card type"),
        max_length=20,
        choices=CARD_TYPES,
        help_text=_("Type of card (auto-derived from user role)."),
    )
    qr_code = models.ImageField(
        _("QR code"),
        upload_to="qr_codes/%Y/%m/",
        help_text=_("QR code image for card verification."),
    )
    card_image = models.ImageField(
        _("card image"),
        upload_to="cards/%Y/%m/",
        null=True,
        blank=True,
        help_text=_("Generated digital card image."),
    )
    valid_until = models.DateField(
        _("valid until"),
        help_text=_("Card expiration date."),
    )
    is_active = models.BooleanField(
        _("is active"),
        default=True,
        help_text=_("Whether card is currently valid and active."),
    )
    created_at = models.DateTimeField(_("created at"), auto_now_add=True)
    updated_at = models.DateTimeField(_("updated at"), auto_now=True)

    class Meta:
        verbose_name = _("digital card")
        verbose_name_plural = _("digital cards")
        indexes = [
            models.Index(fields=["card_number"]),
            models.Index(fields=["user", "is_active"]),
        ]

    def __str__(self) -> str:
        return f"Card: {self.card_number} ({self.user.email})"


# TEMPORARILY DISABLED - StudentProfile uses regions app (not yet created)
# Uncomment when regions app is set up
# class StudentProfile(models.Model):...

# ---------------------------------------------------------------------------
# Lecturer profile 
# ---------------------------------------------------------------------------

class LecturerProfile(models.Model):
    """
    Profil tambahan untuk pengguna Dosen. Menghubungkan pengguna peran LECTURER
    dengan data dosen. Model lecturers.Lecturer dapat ditambah nanti dan dihubungkan
    lewat FK jika diperlukan untuk jadwal/mata kuliah.
    """

    user = models.OneToOneField(
        CustomUser,
        on_delete=models.CASCADE,
        related_name="lecturer_profile",
        limit_choices_to={"role": UserRole.LECTURER},
        verbose_name=_("pengguna"),
    )
    contact_phone = models.CharField(
        _("no. HP / WA yang aktif"),
        max_length=50,
        blank=True,
        help_text=_("Nomor HP/WA yang aktif."),
    )
    address = models.TextField(
        _("alamat"),
        blank=True,
    )
    created_at = models.DateTimeField(_("dibuat pada"), auto_now_add=True)
    updated_at = models.DateTimeField(_("diperbarui pada"), auto_now=True)

    class Meta:
        verbose_name = _("profil dosen")
        verbose_name_plural = _("daftar profil dosen")
        indexes = [
            models.Index(fields=["user"]),
            models.Index(fields=["address"]),
        ]

    def __str__(self) -> str:
        return f"{self.user.full_name} ({self.user.email})"

    def __repr__(self) -> str:
        return f"<LecturerProfile: {self.user.full_name} ({self.user.email})>"


# ---------------------------------------------------------------------------
# Email Verification Code (6-digit OTP)
# ---------------------------------------------------------------------------

class EmailVerificationCode(models.Model):
    """
    6-digit verification code for email verification.
    Replaces the old link-based verification for mobile-friendly UX.
    Codes expire after a configurable number of minutes.
    """

    user = models.ForeignKey(
        CustomUser,
        on_delete=models.CASCADE,
        related_name="verification_codes",
        verbose_name=_("pengguna"),
        db_index=True,
    )
    code = models.CharField(
        _("kode verifikasi"),
        max_length=6,
        db_index=True,
        help_text=_("6-digit kode verifikasi email."),
    )
    created_at = models.DateTimeField(_("dibuat pada"), auto_now_add=True)
    expires_at = models.DateTimeField(
        _("kedaluwarsa pada"),
        db_index=True,
        help_text=_("Waktu kedaluwarsa kode."),
    )
    is_used = models.BooleanField(
        _("sudah digunakan"),
        default=False,
        help_text=_("Kode sudah diverifikasi."),
    )
    attempts = models.PositiveSmallIntegerField(
        _("percobaan"),
        default=0,
        help_text=_("Jumlah percobaan verifikasi gagal."),
    )

    MAX_ATTEMPTS = 5
    CODE_EXPIRY_MINUTES = 10

    class Meta:
        verbose_name = _("kode verifikasi email")
        verbose_name_plural = _("kode verifikasi email")
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["user", "is_used"]),
            models.Index(fields=["code", "is_used"]),
        ]

    def __str__(self) -> str:
        return f"{self.user.email} - {self.code} ({'used' if self.is_used else 'active'})"

    @property
    def is_expired(self) -> bool:
        return timezone.now() >= self.expires_at

    @property
    def is_valid(self) -> bool:
        return not self.is_used and not self.is_expired and self.attempts < self.MAX_ATTEMPTS

    @classmethod
    def generate_code(cls) -> str:
        """Generate a secure random 6-digit code."""
        import secrets
        return f"{secrets.randbelow(1000000):06d}"

    @classmethod
    def create_for_user(cls, user):
        """
        Create a new verification code for a user.
        Invalidates any existing unused codes for this user.
        """
        from datetime import timedelta

        # Invalidate existing unused codes
        cls.objects.filter(user=user, is_used=False).update(is_used=True)

        code = cls.generate_code()
        expires_at = timezone.now() + timedelta(minutes=cls.CODE_EXPIRY_MINUTES)

        return cls.objects.create(
            user=user,
            code=code,
            expires_at=expires_at,
        )

    @classmethod
    def verify_code(cls, email: str, code: str):
        """
        Verify a code for the given email.
        Returns the user if valid, None otherwise.
        Also increments attempt count on failure.
        """
        try:
            verification = cls.objects.select_related("user").get(
                user__email__iexact=email,
                code=code,
                is_used=False,
            )
        except cls.DoesNotExist:
            # Increment attempts on all active codes for this email
            cls.objects.filter(
                user__email__iexact=email,
                is_used=False,
            ).update(attempts=models.F("attempts") + 1)
            return None

        if not verification.is_valid:
            return None

        # Mark as used and verify the user's email
        verification.is_used = True
        verification.save(update_fields=["is_used"])

        user = verification.user
        if not user.email_verified:
            user.email_verified = True
            user.email_verified_at = timezone.now()
            user.save(update_fields=["email_verified", "email_verified_at"])

        return user

