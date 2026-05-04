"""Serializers for main domain resources."""

from rest_framework import serializers

from account.models import CustomUser
from main.models import Benefit, BenefitCategory, Certificate, Event, Post


class UserSummarySerializer(serializers.ModelSerializer):
    class Meta:
        model = CustomUser
        fields = ["id", "email", "full_name", "role", "photo", "joined_date"]
        read_only_fields = fields


class CertificateSerializer(serializers.ModelSerializer):
    user = UserSummarySerializer(read_only=True)
    issued_by = UserSummarySerializer(read_only=True)
    status_display = serializers.CharField(source="get_status_display", read_only=True)

    class Meta:
        model = Certificate
        fields = [
            "id",
            "user",
            "title",
            "description",
            "image_url",
            "issued_by",
            "issued_date",
            "valid_until",
            "pdf_file",
            "status",
            "status_display",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "user", "issued_by", "pdf_file", "created_at", "updated_at"]


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


class BenefitCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = BenefitCategory
        fields = ["id", "name", "description", "icon", "created_at"]
        read_only_fields = ["id", "created_at"]


class BenefitSerializer(serializers.ModelSerializer):
    category = BenefitCategorySerializer(read_only=True)
    eligible_roles = serializers.SerializerMethodField()

    class Meta:
        model = Benefit
        fields = [
            "id",
            "title",
            "description",
            "description_short",
            "image_url",
            "partner",
            "category",
            "eligible_roles",
            "is_active",
            "created_at",
        ]
        read_only_fields = ["id", "created_at"]

    def get_eligible_roles(self, obj):
        return [role.strip() for role in obj.eligible_roles.split(",")]


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
