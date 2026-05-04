"""
Serializers for multi-role digital hub API.
Includes user serializers, profile serializers, and model serializers for all resources.
"""

from rest_framework import serializers
from django.contrib.auth.password_validation import validate_password
from django.utils.http import urlsafe_base64_decode
from django.contrib.auth.tokens import default_token_generator

from .models import (
    CustomUser,
    LecturerProfile,
    StaffProfile,
    AlumniProfile,
    DigitalCard,
)


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
            "joined_date",
            "alumni_year",
            "email_verified",
            "is_active",
            "updated_at",
        ]
        read_only_fields = ["id", "role", "is_active", "updated_at"]


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

    class Meta:
        model = CustomUser
        fields = [
            "email",
            "full_name",
            "role",
            "password",
            "password_confirm",
            "department",
            "is_active",
        ]

    def validate(self, attrs):
        if attrs["password"] != attrs.pop("password_confirm"):
            raise serializers.ValidationError(
                {"password_confirm": "Passwords do not match."}
            )
        return attrs

    def create(self, validated_data):
        password = validated_data.pop("password")
        user = CustomUser.objects.create_user(
            password=password,
            **validated_data,
        )
        return user


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


