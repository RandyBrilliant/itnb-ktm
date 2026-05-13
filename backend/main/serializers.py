"""Serializers for main domain resources."""

import json

from django.http import QueryDict
from rest_framework import serializers

from account.models import CustomUser, UserRole
from main.models import (
    Benefit,
    BenefitCategory,
    Certificate,
    CertificateProgram,
    default_certificate_layout,
    Event,
    Post,
)

ROLE_CHOICES = [choice.value for choice in UserRole]


class UserSummarySerializer(serializers.ModelSerializer):
    class Meta:
        model = CustomUser
        fields = ["id", "email", "full_name", "role", "photo", "joined_date", "institutional_id"]
        read_only_fields = fields


class CertificateProgramStubSerializer(serializers.ModelSerializer):
    class Meta:
        model = CertificateProgram
        fields = ["id", "title"]


class CertificateSerializer(serializers.ModelSerializer):
    user = UserSummarySerializer(read_only=True)
    issued_by = UserSummarySerializer(read_only=True)
    program = CertificateProgramStubSerializer(read_only=True)
    status_display = serializers.CharField(source="get_status_display", read_only=True)

    class Meta:
        model = Certificate
        fields = [
            "id",
            "user",
            "program",
            "title",
            "description",
            "recipient_name",
            "recipient_id_display",
            "image_url",
            "issued_by",
            "issued_date",
            "valid_until",
            "pdf_file",
            "status",
            "status_display",
            "is_suspended",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "user",
            "program",
            "issued_by",
            "pdf_file",
            "is_suspended",
            "created_at",
            "updated_at",
        ]


class CertificateCreateSerializer(serializers.ModelSerializer):
    user_email = serializers.EmailField(write_only=True, help_text="Email of user to issue certificate to")
    issued_date = serializers.DateField(required=True, help_text="Date certificate is issued")

    class Meta:
        model = Certificate
        fields = ["user_email", "title", "description", "issued_date", "valid_until"]

    def create(self, validated_data):
        user_email = validated_data.pop("user_email")
        try:
            user = CustomUser.objects.get(email=user_email)
        except CustomUser.DoesNotExist as exc:
            raise serializers.ValidationError({"user_email": f"User with email '{user_email}' not found."}) from exc

        return Certificate.objects.create(
            user=user,
            issued_by=self.context["request"].user,
            **validated_data,
        )


class CertificateProgramSerializer(serializers.ModelSerializer):
    issued_by = UserSummarySerializer(read_only=True)
    batch_status_display = serializers.CharField(source="get_batch_status_display", read_only=True)

    class Meta:
        model = CertificateProgram
        fields = [
            "id",
            "title",
            "description",
            "template_image",
            "layout",
            "issued_date",
            "valid_until",
            "issued_by",
            "recipients_file",
            "batch_status",
            "batch_status_display",
            "batch_summary",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "issued_by",
            "recipients_file",
            "batch_status",
            "batch_status_display",
            "batch_summary",
            "created_at",
            "updated_at",
        ]


class CertificateProgramCreateSerializer(serializers.ModelSerializer):
    """Multipart create: A4 template image + Excel recipients."""

    layout = serializers.JSONField(required=False)

    class Meta:
        model = CertificateProgram
        fields = [
            "title",
            "description",
            "template_image",
            "recipients_file",
            "issued_date",
            "valid_until",
            "layout",
        ]

    def validate_recipients_file(self, value):
        name = getattr(value, "name", "") or ""
        if not name.lower().endswith(".xlsx"):
            raise serializers.ValidationError("Upload an Excel .xlsx file.")
        return value

    def validate(self, attrs):
        layout = attrs.get("layout")
        if isinstance(layout, str):
            if not layout.strip():
                layout = None
            else:
                try:
                    layout = json.loads(layout)
                except json.JSONDecodeError as exc:
                    raise serializers.ValidationError({"layout": "Invalid JSON for layout."}) from exc
        if layout is not None and not isinstance(layout, dict):
            raise serializers.ValidationError({"layout": "layout must be a JSON object."})
        attrs["layout"] = {**default_certificate_layout(), **(layout or {})}
        return attrs


class CertificateProgramAddRecipientSerializer(serializers.Serializer):
    """Add one recipient to a program by name + ID (same matching rules as Excel)."""

    display_name = serializers.CharField(max_length=255)
    id_raw = serializers.CharField(max_length=64, help_text="Institutional ID, email, or active digital card number.")


class BenefitCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = BenefitCategory
        fields = ["id", "name", "description", "icon", "created_at"]
        read_only_fields = ["id", "created_at"]


class BenefitSerializer(serializers.ModelSerializer):
    category = BenefitCategorySerializer(read_only=True, allow_null=True)
    eligible_roles = serializers.SerializerMethodField()

    class Meta:
        model = Benefit
        fields = [
            "id",
            "title",
            "description",
            "description_short",
            "image",
            "image_url",
            "partner",
            "category",
            "eligible_roles",
            "is_active",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]

    def get_eligible_roles(self, obj):
        return [role.strip() for role in obj.eligible_roles.split(",") if role.strip()]


class BenefitWriteSerializer(serializers.ModelSerializer):
    """Create/update benefits; eligible_roles accepted as a list of role codes."""

    category = serializers.PrimaryKeyRelatedField(
        queryset=BenefitCategory.objects.all(),
        allow_null=True,
        required=False,
    )
    eligible_roles = serializers.ListField(
        child=serializers.ChoiceField(choices=ROLE_CHOICES),
        allow_empty=False,
    )

    class Meta:
        model = Benefit
        fields = [
            "title",
            "description",
            "description_short",
            "partner",
            "image",
            "image_url",
            "category",
            "eligible_roles",
            "is_active",
        ]

    def to_internal_value(self, data):
        mutable = None
        if isinstance(data, QueryDict):
            mutable = data.dict()
        elif hasattr(data, "copy"):
            mutable = data.copy()
        elif isinstance(data, dict):
            mutable = dict(data)

        if mutable is not None:
            er = mutable.get("eligible_roles")
            if isinstance(er, str) and er.strip().startswith("["):
                try:
                    mutable["eligible_roles"] = json.loads(er)
                except json.JSONDecodeError:
                    pass
            cat = mutable.get("category")
            if cat == "":
                mutable["category"] = None
            return super().to_internal_value(mutable)

        return super().to_internal_value(data)

    def validate_eligible_roles(self, value):
        seen = set()
        ordered = []
        for role in value:
            if role not in seen:
                seen.add(role)
                ordered.append(role)
        return ordered

    def create(self, validated_data):
        roles = validated_data.pop("eligible_roles")
        validated_data["eligible_roles"] = ",".join(roles)
        return Benefit.objects.create(**validated_data)

    def update(self, instance, validated_data):
        if "eligible_roles" in validated_data:
            roles = validated_data.pop("eligible_roles")
            validated_data["eligible_roles"] = ",".join(roles)
        return super().update(instance, validated_data)


class PostSerializer(serializers.ModelSerializer):
    author = UserSummarySerializer(read_only=True)
    category_display = serializers.CharField(source="get_category_display", read_only=True)

    class Meta:
        model = Post
        fields = [
            "id",
            "title",
            "body",
            "author",
            "category",
            "category_display",
            "image",
            "image_url",
            "is_published",
            "published_at",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "author", "published_at", "created_at", "updated_at"]


class PostCreateUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Post
        fields = ["title", "body", "category", "image", "image_url", "is_published"]


class EventSerializer(serializers.ModelSerializer):
    post = PostSerializer(read_only=True)

    class Meta:
        model = Event
        fields = ["id", "post", "event_date", "event_location", "capacity", "rsvp_count", "created_at"]
        read_only_fields = ["id", "rsvp_count", "created_at"]


class EventCreateUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Event
        fields = ["event_date", "event_location", "capacity"]
