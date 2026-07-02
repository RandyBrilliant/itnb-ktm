"""
Serializers for multi-role digital hub API.
Includes user serializers, profile serializers, and model serializers for all resources.
"""

from rest_framework import serializers
from django.contrib.auth.password_validation import validate_password
from django.utils.http import urlsafe_base64_decode
from django.contrib.auth.tokens import default_token_generator
from django.utils.translation import gettext_lazy as _
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

from .services.card_validity import effective_card_valid_until
from .models import (
    CustomUser,
    UserRole,
    LecturerProfile,
    StaffProfile,
    AlumniProfile,
    DigitalCard,
    EmailVerificationCode,
)
from .student_departments import resolve_student_department
from .services.image_processing import process_uploaded_avatar
from .placeholder_email import is_placeholder_email, user_requires_email_setup


def _compress_photo(value):
    """Normalize an uploaded profile photo to a compressed WebP.

    Returns the value unchanged when it is empty/None (e.g. photo removal).
    """
    if not value:
        return value
    try:
        return process_uploaded_avatar(value)
    except Exception:
        # If the image can't be processed, fall back to the original upload so
        # DRF's own image validation surfaces a meaningful error.
        if hasattr(value, "seek"):
            value.seek(0)
        return value


def _validate_student_role_department(attrs, role: str | UserRole, *, instance=None):
    """Enforce fixed department choices for student and alumni records."""
    if role not in (UserRole.STUDENT, UserRole.ALUMNI):
        return attrs
    if "department" not in attrs:
        return attrs

    department, error = resolve_student_department(attrs.get("department"))
    if error:
        raise serializers.ValidationError({"department": error})
    attrs["department"] = department
    return attrs


# ---------------------------------------------------------------------------
# User Serializers
# ---------------------------------------------------------------------------

class UserBaseSerializer(serializers.ModelSerializer):
    """Minimal user data for nested responses (safe read-only fields)."""

    class Meta:
        model = CustomUser
        fields = ["id", "email", "full_name", "role", "photo", "joined_date"]
        read_only_fields = ["id", "role", "joined_date"]


class UserDetailSerializer(serializers.ModelSerializer):
    """
    Full user profile serializer for authenticated users.
    Returns role-specific profile data.
    """

    role_display = serializers.CharField(
        source="get_role_display",
        read_only=True,
    )
    last_login = serializers.DateTimeField(read_only=True)
    date_joined = serializers.DateTimeField(read_only=True)
    is_staff = serializers.BooleanField(read_only=True)
    is_superuser = serializers.BooleanField(read_only=True)
    staff_profile = serializers.SerializerMethodField()
    lecturer_profile = serializers.SerializerMethodField()
    pending_email_change = serializers.SerializerMethodField()
    requires_email_setup = serializers.SerializerMethodField()

    class Meta:
        model = CustomUser
        fields = [
            "id",
            "email",
            "full_name",
            "role",
            "role_display",
            "photo",
            "department",
            "institutional_id",
            "place_of_birth",
            "date_of_birth",
            "joined_date",
            "alumni_year",
            "email_verified",
            "pending_email_change",
            "requires_email_setup",
            "is_active",
            "is_staff",
            "is_superuser",
            "last_login",
            "date_joined",
            "updated_at",
            "staff_profile",
            "lecturer_profile",
        ]
        read_only_fields = [
            "id",
            "role",
            "is_active",
            "is_staff",
            "is_superuser",
            "last_login",
            "date_joined",
            "updated_at",
        ]

    def to_representation(self, instance):
        data = super().to_representation(instance)
        if instance.role == UserRole.ADMIN:
            data["department"] = ""
        return data

    def validate_institutional_id(self, value):
        if value in (None, ""):
            return None
        text = str(value).strip()
        return text or None

    def validate_photo(self, value):
        return _compress_photo(value)

    def validate(self, attrs):
        inst = attrs.get("institutional_id")
        if inst:
            qs = CustomUser.objects.exclude(pk=self.instance.pk).filter(institutional_id__iexact=inst.strip())
            if qs.exists():
                raise serializers.ValidationError({"institutional_id": "This ID is already registered."})
        if self.instance.role == UserRole.ADMIN:
            attrs["department"] = ""
        role = attrs.get("role", self.instance.role)
        return _validate_student_role_department(attrs, role, instance=self.instance)

    def get_staff_profile(self, obj):
        """Staff directory privileges are not exposed on user payloads; use staff profile APIs as admin."""
        return None

    def get_lecturer_profile(self, obj):
        if obj.role != UserRole.LECTURER:
            return None
        try:
            lp = obj.lecturer_profile
        except LecturerProfile.DoesNotExist:
            return None
        return {
            "contact_phone": lp.contact_phone,
            "address": lp.address,
        }

    def get_pending_email_change(self, obj):
        return EmailVerificationCode.get_pending_email_change(obj)

    def get_requires_email_setup(self, obj):
        return user_requires_email_setup(obj)


class UserCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating new users (admin endpoint)."""

    password = serializers.CharField(
        write_only=True,
        required=True,
        validators=[validate_password],
        help_text="User password",
    )
    password_confirm = serializers.CharField(
        write_only=True,
        required=True,
        help_text="Confirm password",
    )
    contact_phone = serializers.CharField(write_only=True, required=False, allow_blank=True, default="")
    address = serializers.CharField(write_only=True, required=False, allow_blank=True, default="")
    alumni_year = serializers.IntegerField(required=False, allow_null=True)

    class Meta:
        model = CustomUser
        fields = [
            "email",
            "full_name",
            "role",
            "password",
            "password_confirm",
            "department",
            "institutional_id",
            "is_active",
            "alumni_year",
            "contact_phone",
            "address",
        ]

    def validate_is_active(self, value):
        # New accounts are always created active; use deactivate endpoint later if needed.
        return True

    def validate_institutional_id(self, value):
        if value in (None, ""):
            return None
        text = str(value).strip()
        return text or None

    def validate(self, attrs):
        if attrs["password"] != attrs.pop("password_confirm"):
            raise serializers.ValidationError(
                {"password_confirm": "Passwords do not match."}
            )
        inst = attrs.get("institutional_id")
        if inst:
            if CustomUser.objects.filter(institutional_id__iexact=str(inst).strip()).exists():
                raise serializers.ValidationError({"institutional_id": "This ID is already registered."})

        role = attrs.get("role")
        if role == UserRole.ADMIN:
            attrs["department"] = ""

        return _validate_student_role_department(attrs, role or UserRole.STUDENT)

    def create(self, validated_data):
        password = validated_data.pop("password")
        contact_phone = validated_data.pop("contact_phone", "")
        address = validated_data.pop("address", "")

        role = validated_data.get("role")
        if role == UserRole.STUDENT:
            validated_data["alumni_year"] = None
        if role == UserRole.ADMIN:
            validated_data.setdefault("is_staff", True)
            validated_data["department"] = ""
        elif role == UserRole.STAFF:
            validated_data.setdefault("is_staff", True)
        elif role == UserRole.LECTURER:
            validated_data.setdefault("is_staff", False)

        validated_data["is_active"] = True

        user = CustomUser.objects.create_user(
            password=password,
            **validated_data,
        )

        if user.role == UserRole.STAFF:
            StaffProfile.objects.create(
                user=user,
                staff_role="",
                can_issue_certificates=False,
                can_manage_benefits=False,
            )
        elif user.role == UserRole.LECTURER:
            LecturerProfile.objects.create(
                user=user,
                contact_phone=(contact_phone or "").strip(),
                address=(address or "").strip(),
            )

        return user


class UserAdminUpdateSerializer(serializers.ModelSerializer):
    """PATCH user + lecturer profile fields. Staff privileges are not updated via user PATCH."""

    photo = serializers.ImageField(required=False, allow_null=True)
    contact_phone = serializers.CharField(required=False, allow_blank=True)
    address = serializers.CharField(required=False, allow_blank=True)
    role = serializers.ChoiceField(
        choices=[UserRole.STUDENT.value, UserRole.ALUMNI.value],
        required=False,
    )
    alumni_year = serializers.IntegerField(required=False, allow_null=True)

    class Meta:
        model = CustomUser
        fields = [
            "email",
            "full_name",
            "photo",
            "department",
            "institutional_id",
            "place_of_birth",
            "date_of_birth",
            "is_active",
            "role",
            "alumni_year",
            "contact_phone",
            "address",
        ]

    def validate_institutional_id(self, value):
        if value in (None, ""):
            return None
        text = str(value).strip()
        return text or None

    def validate_photo(self, value):
        return _compress_photo(value)

    def validate(self, attrs):
        inst = attrs.get("institutional_id")
        if inst:
            qs = CustomUser.objects.exclude(pk=self.instance.pk).filter(
                institutional_id__iexact=str(inst).strip()
            )
            if qs.exists():
                raise serializers.ValidationError({"institutional_id": "This ID is already registered."})

        if self.instance.role == UserRole.ADMIN:
            attrs["department"] = ""

        if "role" in attrs:
            if self.instance.role not in (UserRole.STUDENT, UserRole.ALUMNI):
                raise serializers.ValidationError(
                    {"role": "Only student or alumni records can change role here."}
                )
            if attrs["role"] == UserRole.STUDENT.value:
                attrs["role"] = UserRole.STUDENT
            elif attrs["role"] == UserRole.ALUMNI.value:
                attrs["role"] = UserRole.ALUMNI
            else:
                raise serializers.ValidationError({"role": "Role must be Student or Alumni."})

        role = attrs.get("role", self.instance.role)
        return _validate_student_role_department(attrs, role, instance=self.instance)

    def update(self, instance, validated_data):
        lec_keys = ("contact_phone", "address")
        lec_payload = {k: validated_data.pop(k) for k in lec_keys if k in validated_data}

        if validated_data.get("role") == UserRole.STUDENT:
            validated_data["alumni_year"] = None

        user = super().update(instance, validated_data)

        if lec_payload and user.role == UserRole.LECTURER:
            profile, _ = LecturerProfile.objects.get_or_create(user=user)
            for key, val in lec_payload.items():
                setattr(profile, key, val)
            profile.save()

        return user


class RequestEmailChangeSerializer(serializers.Serializer):
    """Request a verification code to change the authenticated user's email."""

    new_email = serializers.EmailField()

    def validate_new_email(self, value):
        email = value.strip().lower()
        user = self.context["request"].user
        if email == user.email.lower():
            raise serializers.ValidationError("This is already your current email address.")
        if is_placeholder_email(email):
            raise serializers.ValidationError("Enter your personal email address, not a system placeholder.")
        if CustomUser.objects.filter(email__iexact=email).exists():
            raise serializers.ValidationError("This email address is already in use.")
        return email


class VerifyEmailCodeSerializer(serializers.Serializer):
    """Verify a 6-digit email code for the authenticated user."""

    code = serializers.RegexField(regex=r"^\d{6}$", min_length=6, max_length=6)


class HubTokenObtainPairSerializer(TokenObtainPairSerializer):
    """
    JWT login for the public hub.

    Accepts email (default) or institutional ID (NIM/NIP) for student, lecturer,
    and alumni accounts. Staff and admin must sign in with email.
    """

    _INSTITUTIONAL_ID_ROLES = (
        UserRole.STUDENT,
        UserRole.LECTURER,
        UserRole.ALUMNI,
    )

    def validate(self, attrs):
        raw = (attrs.get(self.username_field) or "").strip()
        if not raw:
            raise serializers.ValidationError(
                {self.username_field: _("This field is required.")}
            )

        if "@" not in raw:
            user = CustomUser.objects.filter(
                institutional_id__iexact=raw,
                role__in=self._INSTITUTIONAL_ID_ROLES,
                is_active=True,
            ).first()
            if user is None:
                raise serializers.ValidationError(
                    _("No active account found with the given credentials")
                )
            attrs[self.username_field] = user.email

        return super().validate(attrs)


class ForgotPasswordRequestSerializer(serializers.Serializer):
    """Request a password reset link by email."""

    email = serializers.EmailField()


class PasswordResetConfirmSerializer(serializers.Serializer):
    """Reset password using uid/token pair."""

    uid = serializers.CharField()
    token = serializers.CharField()
    new_password = serializers.CharField(write_only=True, validators=[validate_password])
    new_password_confirm = serializers.CharField(write_only=True)

    def validate(self, attrs):
        if attrs["new_password"] != attrs["new_password_confirm"]:
            raise serializers.ValidationError(
                {"new_password_confirm": "Passwords do not match."}
            )

        try:
            uid_decoded = urlsafe_base64_decode(attrs["uid"]).decode()
            user = CustomUser.objects.get(pk=uid_decoded, is_active=True)
        except Exception:
            raise serializers.ValidationError({"uid": "Invalid reset link."})

        if not default_token_generator.check_token(user, attrs["token"]):
            raise serializers.ValidationError({"token": "Reset link is invalid or expired."})

        attrs["user"] = user
        return attrs


class ChangePasswordSerializer(serializers.Serializer):
    """Authenticated password change serializer."""

    current_password = serializers.CharField(write_only=True)
    new_password = serializers.CharField(write_only=True, validators=[validate_password])
    new_password_confirm = serializers.CharField(write_only=True)

    def validate(self, attrs):
        user = self.context["request"].user

        if not user.check_password(attrs["current_password"]):
            raise serializers.ValidationError({"current_password": "Current password is incorrect."})

        if attrs["new_password"] != attrs["new_password_confirm"]:
            raise serializers.ValidationError({"new_password_confirm": "Passwords do not match."})

        if attrs["current_password"] == attrs["new_password"]:
            raise serializers.ValidationError({"new_password": "New password must be different from current password."})

        return attrs


# ---------------------------------------------------------------------------
# Profile Serializers
# ---------------------------------------------------------------------------

class LecturerProfileSerializer(serializers.ModelSerializer):
    """Lecturer-specific profile details."""

    user = UserBaseSerializer(read_only=True)

    class Meta:
        model = LecturerProfile
        fields = [
            "id",
            "user",
            "contact_phone",
            "address",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "user", "created_at", "updated_at"]


class StaffProfileSerializer(serializers.ModelSerializer):
    """Staff-specific profile details."""

    user = UserBaseSerializer(read_only=True)

    class Meta:
        model = StaffProfile
        fields = [
            "id",
            "user",
            "staff_role",
            "can_issue_certificates",
            "can_manage_benefits",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "user", "created_at", "updated_at"]


class AlumniProfileSerializer(serializers.ModelSerializer):
    """Alumni-specific profile details."""

    user = UserBaseSerializer(read_only=True)

    class Meta:
        model = AlumniProfile
        fields = [
            "id",
            "user",
            "graduation_year",
            "graduation_date",
            "alumni_membership_status",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "user", "created_at", "updated_at"]


# ---------------------------------------------------------------------------
# Digital Card Serializers
# ---------------------------------------------------------------------------

class DigitalCardSerializer(serializers.ModelSerializer):
    """Digital ID card with QR code."""

    user = UserBaseSerializer(read_only=True)
    card_type_display = serializers.CharField(
        source="get_card_type_display",
        read_only=True,
    )
    valid_until = serializers.SerializerMethodField()

    def get_valid_until(self, obj: DigitalCard) -> str:
        return effective_card_valid_until(obj).isoformat()

    class Meta:
        model = DigitalCard
        fields = [
            "id",
            "user",
            "card_number",
            "card_type",
            "card_type_display",
            "qr_code",
            "card_image",
            "valid_until",
            "is_active",
            "created_at",
        ]
        read_only_fields = [
            "id",
            "user",
            "card_number",
            "card_type",
            "qr_code",
            "card_image",
            "created_at",
        ]


