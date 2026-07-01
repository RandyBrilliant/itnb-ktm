"""Serializers for main domain resources."""

import json

from django.http import QueryDict
from django.utils import timezone
from rest_framework import serializers

from account.models import CustomUser, UserRole
from main.models import (
    Benefit,
    BenefitCategory,
    Certificate,
    CertificateProgram,
    Event,
    Post,
    PostCategory,
    Webinar,
    WebinarRegistration,
    WebinarStatus,
)
from main.services.certificate_layout import normalize_certificate_layout
from main.services.webinar_certificate import ensure_webinar_certificate_program
from main.services.webinar_schedule import (
    attendance_qr_available,
    attendance_qr_opens_at,
    check_in_opens_at,
    check_in_window_open,
    normalize_registration_closes,
    normalize_registration_opens,
    validate_registration_against_start,
)

ROLE_CHOICES = [choice.value for choice in UserRole]


class UserSummarySerializer(serializers.ModelSerializer):
    class Meta:
        model = CustomUser
        fields = ["id", "email", "full_name", "role", "photo", "joined_date", "institutional_id"]
        read_only_fields = fields


class CertificateProgramStubSerializer(serializers.ModelSerializer):
    layout = serializers.SerializerMethodField()

    class Meta:
        model = CertificateProgram
        fields = ["id", "title", "template_image", "valid_until", "issued_date", "layout"]

    def get_layout(self, obj) -> dict:
        return normalize_certificate_layout(obj.layout)


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
        attrs["layout"] = normalize_certificate_layout(layout)
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


class PostWebinarSummarySerializer(serializers.ModelSerializer):
    """Minimal webinar info embedded on a news/announcement post."""

    mode_display = serializers.CharField(source="get_mode_display", read_only=True)
    is_registration_open = serializers.BooleanField(read_only=True)
    is_full = serializers.BooleanField(read_only=True)
    certificate_program = CertificateProgramStubSerializer(read_only=True)
    check_in_open = serializers.SerializerMethodField()
    attendance_qr_available = serializers.SerializerMethodField()
    check_in_opens_at = serializers.SerializerMethodField()
    attendance_qr_opens_at = serializers.SerializerMethodField()
    my_registration = serializers.SerializerMethodField()

    class Meta:
        model = Webinar
        fields = [
            "id",
            "mode",
            "mode_display",
            "starts_at",
            "location",
            "online_url",
            "is_registration_open",
            "is_full",
            "auto_issue_certificate",
            "certificate_program",
            "check_in_open",
            "attendance_qr_available",
            "check_in_opens_at",
            "attendance_qr_opens_at",
            "my_registration",
        ]
        read_only_fields = fields

    def get_check_in_open(self, obj):
        return check_in_window_open(obj)

    def get_attendance_qr_available(self, obj):
        return attendance_qr_available(obj)

    def get_check_in_opens_at(self, obj):
        return check_in_opens_at(obj)

    def get_attendance_qr_opens_at(self, obj):
        return attendance_qr_opens_at(obj)

    def get_my_registration(self, obj):
        request = self.context.get("request")
        if not request or not request.user or not request.user.is_authenticated:
            return None
        reg = obj.registrations.filter(user=request.user).first()
        if not reg:
            return None
        return {
            "id": reg.id,
            "status": reg.status,
            "status_display": reg.get_status_display(),
            "registered_at": reg.registered_at,
            "checked_in_at": reg.checked_in_at,
            "checked_out_at": reg.checked_out_at,
            "attended": reg.attended,
            "certificate_id": reg.certificate_id,
        }


class PostSerializer(serializers.ModelSerializer):
    author = UserSummarySerializer(read_only=True)
    category_display = serializers.CharField(source="get_category_display", read_only=True)
    webinar = serializers.SerializerMethodField()

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
            "webinar",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "author", "published_at", "webinar", "created_at", "updated_at"]

    def get_webinar(self, obj):
        try:
            webinar = obj.webinar
        except Webinar.DoesNotExist:
            return None
        return PostWebinarSummarySerializer(webinar, context=self.context).data


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


class WebinarRegistrationBriefSerializer(serializers.ModelSerializer):
    """Compact view of the current user's own registration (nested in Webinar)."""

    status_display = serializers.CharField(source="get_status_display", read_only=True)
    attended = serializers.BooleanField(read_only=True)
    certificate_id = serializers.IntegerField(read_only=True, allow_null=True)

    class Meta:
        model = WebinarRegistration
        fields = [
            "id",
            "status",
            "status_display",
            "registered_at",
            "checked_in_at",
            "checked_out_at",
            "attended",
            "certificate_id",
        ]
        read_only_fields = fields


class WebinarRegistrationSerializer(serializers.ModelSerializer):
    """Full registration row for the admin participant list."""

    user = UserSummarySerializer(read_only=True)
    status_display = serializers.CharField(source="get_status_display", read_only=True)
    attended = serializers.BooleanField(read_only=True)
    certificate = serializers.SerializerMethodField()

    class Meta:
        model = WebinarRegistration
        fields = [
            "id",
            "user",
            "status",
            "status_display",
            "registered_at",
            "checked_in_at",
            "checked_out_at",
            "check_in_method",
            "attended",
            "certificate",
        ]
        read_only_fields = fields

    def get_certificate(self, obj):
        if not obj.certificate_id:
            return None
        return {"id": obj.certificate_id, "title": obj.certificate.title}


class WebinarSerializer(serializers.ModelSerializer):
    post = PostSerializer(read_only=True)
    certificate_program = CertificateProgramStubSerializer(read_only=True)
    mode_display = serializers.CharField(source="get_mode_display", read_only=True)
    status_display = serializers.CharField(source="get_status_display", read_only=True)
    is_registration_open = serializers.BooleanField(read_only=True)
    is_full = serializers.BooleanField(read_only=True)
    registration_count = serializers.SerializerMethodField()
    attendee_count = serializers.SerializerMethodField()
    check_in_open = serializers.SerializerMethodField()
    attendance_qr_available = serializers.SerializerMethodField()
    check_in_opens_at = serializers.SerializerMethodField()
    attendance_qr_opens_at = serializers.SerializerMethodField()
    my_registration = serializers.SerializerMethodField()

    class Meta:
        model = Webinar
        fields = [
            "id",
            "post",
            "mode",
            "mode_display",
            "starts_at",
            "location",
            "online_url",
            "capacity",
            "registration_opens_at",
            "registration_closes_at",
            "certificate_program",
            "auto_issue_certificate",
            "status",
            "status_display",
            "is_registration_open",
            "is_full",
            "registration_count",
            "attendee_count",
            "check_in_open",
            "attendance_qr_available",
            "check_in_opens_at",
            "attendance_qr_opens_at",
            "my_registration",
            "created_at",
            "updated_at",
        ]
        read_only_fields = fields

    def get_check_in_open(self, obj):
        return check_in_window_open(obj)

    def get_attendance_qr_available(self, obj):
        return attendance_qr_available(obj)

    def get_check_in_opens_at(self, obj):
        return check_in_opens_at(obj)

    def get_attendance_qr_opens_at(self, obj):
        return attendance_qr_opens_at(obj)

    def get_registration_count(self, obj):
        return obj.registrations.exclude(status="CANCELLED").count()

    def get_attendee_count(self, obj):
        return obj.registrations.filter(checked_in_at__isnull=False).count()

    def get_my_registration(self, obj):
        request = self.context.get("request")
        if not request or not request.user or not request.user.is_authenticated:
            return None
        reg = obj.registrations.filter(user=request.user).first()
        if not reg:
            return None
        return WebinarRegistrationBriefSerializer(reg).data


class WebinarCreateUpdateSerializer(serializers.ModelSerializer):
    """
    Create/update a webinar together with its backing Post (announcement).
    `is_published` toggles both the post visibility and the webinar status.
    """

    title = serializers.CharField(max_length=255, required=False)
    body = serializers.CharField(required=False, allow_blank=True)
    image = serializers.ImageField(required=False, allow_null=True)
    image_url = serializers.URLField(required=False, allow_blank=True)
    is_published = serializers.BooleanField(required=False, default=False)
    certificate_program = serializers.PrimaryKeyRelatedField(
        queryset=CertificateProgram.objects.all(), required=False, allow_null=True
    )
    certificate_template_image = serializers.ImageField(required=False, allow_null=True, write_only=True)
    certificate_valid_until = serializers.DateField(required=False, allow_null=True, write_only=True)
    certificate_layout = serializers.JSONField(required=False, write_only=True)

    class Meta:
        model = Webinar
        fields = [
            "title",
            "body",
            "image",
            "image_url",
            "is_published",
            "mode",
            "starts_at",
            "location",
            "online_url",
            "capacity",
            "registration_opens_at",
            "registration_closes_at",
            "certificate_program",
            "certificate_template_image",
            "certificate_valid_until",
            "certificate_layout",
            "auto_issue_certificate",
        ]

    def _parse_certificate_layout(self, layout):
        if layout is None:
            return None
        if isinstance(layout, str):
            if not layout.strip():
                return None
            try:
                layout = json.loads(layout)
            except json.JSONDecodeError as exc:
                raise serializers.ValidationError({"certificate_layout": "Invalid JSON for layout."}) from exc
        if not isinstance(layout, dict):
            raise serializers.ValidationError({"certificate_layout": "layout must be a JSON object."})
        return normalize_certificate_layout(layout)

    def _pop_certificate_fields(self, validated_data):
        return {
            "template_image": validated_data.pop("certificate_template_image", None),
            "valid_until": validated_data.pop("certificate_valid_until", None),
            "layout": self._parse_certificate_layout(validated_data.pop("certificate_layout", None)),
        }

    def validate(self, attrs):
        opens = attrs.get(
            "registration_opens_at",
            getattr(self.instance, "registration_opens_at", None),
        )
        closes = attrs.get(
            "registration_closes_at",
            getattr(self.instance, "registration_closes_at", None),
        )

        if "registration_opens_at" in attrs and attrs["registration_opens_at"] is not None:
            attrs["registration_opens_at"] = normalize_registration_opens(attrs["registration_opens_at"])
            opens = attrs["registration_opens_at"]
        if "registration_closes_at" in attrs and attrs["registration_closes_at"] is not None:
            attrs["registration_closes_at"] = normalize_registration_closes(attrs["registration_closes_at"])
            closes = attrs["registration_closes_at"]

        if opens and closes and closes < opens:
            raise serializers.ValidationError(
                {"registration_closes_at": "Registration end date must be on or after the start date."}
            )

        starts_at = attrs.get("starts_at", getattr(self.instance, "starts_at", None))
        if starts_at:
            reg_errors = validate_registration_against_start(
                starts_at=starts_at,
                registration_opens_at=opens,
                registration_closes_at=closes,
            )
            if reg_errors:
                raise serializers.ValidationError(reg_errors)

        if self.instance is None and not attrs.get("title"):
            raise serializers.ValidationError({"title": "This field is required."})
        if self.instance is None and not attrs.get("starts_at"):
            raise serializers.ValidationError({"starts_at": "This field is required."})

        if "certificate_layout" in attrs:
            attrs["certificate_layout"] = self._parse_certificate_layout(attrs.get("certificate_layout"))

        auto_issue = attrs.get(
            "auto_issue_certificate",
            getattr(self.instance, "auto_issue_certificate", True),
        )
        cert_template = attrs.get("certificate_template_image")
        has_program = bool(
            attrs.get("certificate_program")
            or (self.instance and self.instance.certificate_program_id)
        )
        if auto_issue and not cert_template and not has_program:
            raise serializers.ValidationError(
                {
                    "certificate_template_image": (
                        "Upload a certificate template image when auto-issue is enabled."
                    )
                }
            )
        if cert_template and not auto_issue:
            raise serializers.ValidationError(
                {
                    "auto_issue_certificate": (
                        "Enable auto-issue when uploading a certificate template."
                    )
                }
            )

        return attrs

    def _pop_post_fields(self, validated):
        return {
            key: validated.pop(key)
            for key in ("title", "body", "image", "image_url")
            if key in validated
        }

    def create(self, validated_data):
        request = self.context["request"]
        is_published = validated_data.pop("is_published", False)
        cert_fields = self._pop_certificate_fields(validated_data)
        post_fields = self._pop_post_fields(validated_data)
        post_fields.setdefault("body", "")

        post = Post.objects.create(
            author=request.user,
            category=PostCategory.EVENT,
            is_published=is_published,
            published_at=timezone.now() if is_published else None,
            **post_fields,
        )
        webinar = Webinar.objects.create(
            post=post,
            status=WebinarStatus.PUBLISHED if is_published else WebinarStatus.DRAFT,
            **validated_data,
        )

        if cert_fields["template_image"] is not None:
            ensure_webinar_certificate_program(
                webinar=webinar,
                issued_by=request.user,
                template_image=cert_fields["template_image"],
                valid_until=cert_fields["valid_until"],
                layout=cert_fields["layout"],
                title=post.title,
            )
        return webinar

    def update(self, instance, validated_data):
        is_published = validated_data.pop("is_published", None)
        cert_fields = self._pop_certificate_fields(validated_data)
        post_fields = self._pop_post_fields(validated_data)

        post = instance.post
        for key, value in post_fields.items():
            setattr(post, key, value)

        if is_published is not None:
            post.is_published = is_published
            if is_published and post.published_at is None:
                post.published_at = timezone.now()
            elif not is_published:
                post.published_at = None
            if instance.status in (WebinarStatus.DRAFT, WebinarStatus.PUBLISHED):
                instance.status = (
                    WebinarStatus.PUBLISHED if is_published else WebinarStatus.DRAFT
                )
        post.save()

        for key, value in validated_data.items():
            setattr(instance, key, value)
        instance.save()

        if (
            cert_fields["template_image"] is not None
            or cert_fields["valid_until"] is not None
            or (
                cert_fields["layout"] is not None
                and (
                    instance.certificate_program_id
                    or cert_fields["template_image"] is not None
                )
            )
        ):
            ensure_webinar_certificate_program(
                webinar=instance,
                issued_by=self.context["request"].user,
                template_image=cert_fields["template_image"],
                valid_until=cert_fields["valid_until"],
                layout=cert_fields["layout"],
                title=post.title,
            )

        return instance
