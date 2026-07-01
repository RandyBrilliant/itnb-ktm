"""
API views (ViewSets and APIViews) for multi-role digital hub.
Includes endpoints for users, certificates, cards, benefits, posts, and events.
"""

import io
import logging
from datetime import timedelta
from pathlib import Path
from django.conf import settings
from django.core.mail import send_mail
from django.core.files.base import ContentFile
from django.contrib.auth.tokens import default_token_generator
from django.utils.http import urlsafe_base64_encode
from django.utils.encoding import force_bytes

from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.pagination import PageNumberPagination
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter
from django.utils import timezone
from django.http import HttpResponse
from django.core.exceptions import ValidationError as DjangoValidationError
from django.contrib.auth.password_validation import validate_password
from rest_framework.parsers import FormParser, MultiPartParser

from .models import (
    CustomUser,
    UserRole,
    LecturerProfile,
    StaffProfile,
    AlumniProfile,
    DigitalCard,
    EmailVerificationCode,
)
from .serializers import (
    UserDetailSerializer,
    UserCreateSerializer,
    UserAdminUpdateSerializer,
    LecturerProfileSerializer,
    StaffProfileSerializer,
    AlumniProfileSerializer,
    DigitalCardSerializer,
    ForgotPasswordRequestSerializer,
    PasswordResetConfirmSerializer,
    ChangePasswordSerializer,
    RequestEmailChangeSerializer,
    VerifyEmailCodeSerializer,
    HubTokenObtainPairSerializer,
)
from .permissions import (
    IsAdmin,
    IsBackofficeRole,
)
from .throttles import AuthPublicRateThrottle, AuthRateThrottle
from .api_responses import (
    success_response,
    error_response,
    ApiCode,
    ApiMessage,
)
from .exceptions import DeleteNotAllowed
from .services.qr_generation import generate_qr_code, save_qr_to_bytes
from .services.email_verification import create_and_send_verification_code
from .placeholder_email import user_requires_email_setup
from .services.student_import import build_student_import_workbook, parse_student_import_xlsx
from .services.student_photo_import import extract_photo_entries, normalize_avatar
from .services.card_generation import (
    generate_digital_card_image,
    save_card_image_to_bytes,
)
from .services.card_validity import effective_card_valid_until, student_card_valid_until

logger = logging.getLogger(__name__)

try:
    from rest_framework_simplejwt.tokens import RefreshToken, TokenError
    from rest_framework_simplejwt.views import TokenObtainPairView
except Exception:  # pragma: no cover - optional in some environments
    RefreshToken = None
    TokenError = Exception
    TokenObtainPairView = None


# ---------------------------------------------------------------------------
# Pagination
# ---------------------------------------------------------------------------

class StandardResultsSetPagination(PageNumberPagination):
    page_size = 20
    page_size_query_param = "page_size"
    max_page_size = 100


# ---------------------------------------------------------------------------
# User Endpoints
# ---------------------------------------------------------------------------

if TokenObtainPairView is not None:

    class HubTokenObtainPairView(TokenObtainPairView):
        """Login with email or institutional ID (student / lecturer / alumni)."""

        serializer_class = HubTokenObtainPairSerializer
        throttle_classes = [AuthRateThrottle]


class MeView(APIView):
    """
    Endpoint for authenticated users to view/update their own profile.
    GET: returns role-specific user data
    PATCH: update own profile
    """

    permission_classes = [IsAuthenticated]

    def get(self, request):
        """Get current user profile."""
        serializer = UserDetailSerializer(
            request.user,
            context={"request": request},
        )
        return Response(
            success_response(data=serializer.data),
            status=status.HTTP_200_OK,
        )

    def patch(self, request):
        """Update current user profile."""
        if request.user.role == UserRole.STUDENT:
            return Response(
                error_response(
                    detail="Student profiles are managed by campus administration and cannot be edited here.",
                    code=ApiCode.PERMISSION_DENIED,
                ),
                status=status.HTTP_403_FORBIDDEN,
            )

        serializer = UserDetailSerializer(
            request.user,
            data=request.data,
            partial=True,
            context={"request": request},
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()

        return Response(
            success_response(
                data=serializer.data,
                detail=ApiMessage.PROFILE_UPDATED,
                code=ApiCode.PROFILE_UPDATED,
            ),
            status=status.HTTP_200_OK,
        )


class StudentImportView(APIView):
    """Bulk-create student accounts from Excel (.xlsx). Admin only."""

    permission_classes = [IsAdmin]
    parser_classes = [MultiPartParser, FormParser]

    def get(self, request):
        """Download a blank import template (.xlsx)."""
        buf = build_student_import_workbook()
        resp = HttpResponse(
            buf.getvalue(),
            content_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        )
        resp["Content-Disposition"] = 'attachment; filename="student_import_template.xlsx"'
        return resp

    def post(self, request):
        upload = request.FILES.get("file")
        if not upload:
            return Response(
                error_response(detail='Missing file field "file".', code=ApiCode.VALIDATION_ERROR),
                status=status.HTTP_400_BAD_REQUEST,
            )
        raw = upload.read()

        rows, parse_errors = parse_student_import_xlsx(raw)
        if not rows:
            detail = (
                "; ".join(parse_errors)
                if parse_errors
                else "No student rows found. Add rows below the header or fix column headers."
            )
            return Response(
                error_response(detail=detail, code=ApiCode.VALIDATION_ERROR),
                status=status.HTTP_400_BAD_REQUEST,
            )

        row_errors: list[dict] = [{"message": m} for m in parse_errors]
        created = 0
        skipped = 0

        for r in rows:
            inst = r["institutional_id"]
            pwd = r["password"] or inst
            if r["password"]:
                try:
                    validate_password(pwd)
                except DjangoValidationError as exc:
                    row_errors.append(
                        {
                            "row": r["row"],
                            "email": r["email"],
                            "message": "; ".join(exc.messages),
                        }
                    )
                    skipped += 1
                    continue

            if CustomUser.objects.filter(email__iexact=r["email"]).exists():
                row_errors.append(
                    {
                        "row": r["row"],
                        "email": r["email"],
                        "message": "Email already registered.",
                    }
                )
                skipped += 1
                continue

            if CustomUser.objects.filter(institutional_id__iexact=inst).exists():
                row_errors.append(
                    {
                        "row": r["row"],
                        "email": r["email"],
                        "message": f"Institutional ID already in use: {inst}",
                    }
                )
                skipped += 1
                continue

            try:
                CustomUser.objects.create_user(
                    email=r["email"],
                    password=pwd,
                    role=r["role"],
                    full_name=r["full_name"],
                    department=r["department"] or "",
                    institutional_id=inst,
                    place_of_birth=r.get("place_of_birth") or "",
                    date_of_birth=r.get("date_of_birth"),
                    alumni_year=r.get("alumni_year"),
                )
                created += 1
            except Exception as exc:
                logger.exception("student import row failed")
                row_errors.append(
                    {"row": r["row"], "email": r["email"], "message": str(exc)}
                )
                skipped += 1

        return Response(
            success_response(
                data={
                    "created": created,
                    "skipped": skipped,
                    "errors": row_errors,
                },
                detail=f"Import finished: {created} created, {skipped} skipped.",
            ),
            status=status.HTTP_200_OK,
        )


class StudentPhotoBulkImportView(APIView):
    """Bulk-assign profile photos from a .zip named by institutional ID. Admin only.

    Each image in the archive must be named after the student's institutional ID
    (NIM), e.g. ``2021001234.jpg``. Photos are matched to accounts by institutional
    ID and stored as the user's profile photo used on the digital card.
    """

    permission_classes = [IsAdmin]
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request):
        upload = request.FILES.get("file")
        if not upload:
            return Response(
                error_response(detail='Missing file field "file".', code=ApiCode.VALIDATION_ERROR),
                status=status.HTTP_400_BAD_REQUEST,
            )

        raw = upload.read()
        entries, parse_errors = extract_photo_entries(raw)
        if not entries:
            detail = (
                "; ".join(parse_errors)
                if parse_errors
                else "No usable images found. Name each file after the student's institutional ID."
            )
            return Response(
                error_response(detail=detail, code=ApiCode.VALIDATION_ERROR),
                status=status.HTTP_400_BAD_REQUEST,
            )

        row_errors: list[dict] = [{"message": m} for m in parse_errors]
        updated = 0
        skipped = 0

        for entry in entries:
            stem = entry["stem"]
            user = CustomUser.objects.filter(institutional_id__iexact=stem).first()
            if user is None:
                row_errors.append(
                    {
                        "file": entry["filename"],
                        "message": f"No account found with institutional ID {stem}.",
                    }
                )
                skipped += 1
                continue

            try:
                normalized = normalize_avatar(entry["data"])
            except Exception:
                row_errors.append(
                    {
                        "file": entry["filename"],
                        "message": "Could not read the image (it may be corrupt or unsupported).",
                    }
                )
                skipped += 1
                continue

            try:
                user.photo.save(f"{stem}.webp", ContentFile(normalized), save=True)
                updated += 1
            except Exception as exc:
                logger.exception("student photo import failed for %s", stem)
                row_errors.append({"file": entry["filename"], "message": str(exc)})
                skipped += 1

        return Response(
            success_response(
                data={
                    "updated": updated,
                    "skipped": skipped,
                    "errors": row_errors,
                },
                detail=f"Photo import finished: {updated} updated, {skipped} skipped.",
            ),
            status=status.HTTP_200_OK,
        )


class LogoutView(APIView):
    """
    Logout endpoint.
    If refresh token blacklisting is available and token is provided, blacklist it.
    Always returns success so client can clear local session safely.
    """

    permission_classes = [IsAuthenticated]

    def post(self, request):
        refresh_token = request.data.get("refresh")
        if refresh_token and RefreshToken is not None:
            try:
                RefreshToken(refresh_token).blacklist()
            except TokenError:
                logger.warning("Invalid refresh token received for logout.")
            except Exception as exc:
                logger.warning("Refresh token blacklist failed: %s", exc)

        return Response(
            success_response(detail="Logged out successfully."),
            status=status.HTTP_200_OK,
        )


class HealthCheckView(APIView):
    """Lightweight health endpoint for load balancers and container checks."""

    permission_classes = [AllowAny]
    authentication_classes = []

    def get(self, request):
        return Response({"status": "ok", "success": True}, status=status.HTTP_200_OK)


class ForgotPasswordRequestView(APIView):
    """Send password reset link to email if account exists."""

    permission_classes = [AllowAny]
    authentication_classes = []

    def post(self, request):
        serializer = ForgotPasswordRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        email = serializer.validated_data["email"].strip().lower()
        user = CustomUser.objects.filter(email=email, is_active=True).first()

        if user:
            uid = urlsafe_base64_encode(force_bytes(user.pk))
            token = default_token_generator.make_token(user)
            base_url = getattr(settings, "FRONTEND_URL", "http://localhost:5173").rstrip("/")
            reset_url = f"{base_url}/reset-password?uid={uid}&token={token}"

            try:
                send_mail(
                    subject="ITNB Hub Password Reset",
                    message=(
                        "We received a request to reset your password.\n\n"
                        f"Use this link to set a new password:\n{reset_url}\n\n"
                        "If you did not request this, you can ignore this email."
                    ),
                    from_email=getattr(settings, "DEFAULT_FROM_EMAIL", "noreply@itnb.local"),
                    recipient_list=[user.email],
                    fail_silently=False,
                )
            except Exception as exc:
                logger.exception("Failed to send password reset email: %s", exc)

        return Response(
            success_response(
                detail="If that email exists, a password reset link has been sent."
            ),
            status=status.HTTP_200_OK,
        )


class PasswordResetConfirmView(APIView):
    """Reset password using uid/token reset link."""

    permission_classes = [AllowAny]
    authentication_classes = []

    def post(self, request):
        serializer = PasswordResetConfirmSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        user = serializer.validated_data["user"]
        user.set_password(serializer.validated_data["new_password"])
        user.save(update_fields=["password"])

        return Response(
            success_response(detail="Password has been reset successfully."),
            status=status.HTTP_200_OK,
        )


class ChangePasswordView(APIView):
    """Change password for authenticated users."""

    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = ChangePasswordSerializer(data=request.data, context={"request": request})
        serializer.is_valid(raise_exception=True)

        request.user.set_password(serializer.validated_data["new_password"])
        request.user.save(update_fields=["password"])

        return Response(
            success_response(detail="Password changed successfully."),
            status=status.HTTP_200_OK,
        )


class RequestEmailVerificationView(APIView):
    """Send a verification code to the authenticated user's current email."""

    permission_classes = [IsAuthenticated]
    throttle_classes = [AuthPublicRateThrottle]

    def post(self, request):
        user = request.user
        if user_requires_email_setup(user):
            return Response(
                error_response(
                    detail="Add and verify your personal email address to continue.",
                    code=ApiCode.VALIDATION_ERROR,
                ),
                status=status.HTTP_400_BAD_REQUEST,
            )
        if user.email_verified:
            return Response(
                error_response(
                    detail="Your email address is already verified.",
                    code=ApiCode.EMAIL_ALREADY_VERIFIED,
                ),
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            create_and_send_verification_code(user)
        except Exception:
            logger.exception("Failed to send email verification code to %s", user.email)
            return Response(
                error_response(
                    detail="Could not send verification email. Please try again later.",
                    code=ApiCode.INTERNAL_ERROR,
                ),
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )

        return Response(
            success_response(
                detail=f"A verification code has been sent to {user.email}.",
                code=ApiCode.EMAIL_SENT,
            ),
            status=status.HTTP_200_OK,
        )


class RequestEmailChangeView(APIView):
    """Send a verification code to a new email address (applied after verification)."""

    permission_classes = [IsAuthenticated]
    throttle_classes = [AuthPublicRateThrottle]

    def post(self, request):
        serializer = RequestEmailChangeSerializer(data=request.data, context={"request": request})
        serializer.is_valid(raise_exception=True)
        new_email = serializer.validated_data["new_email"]

        try:
            create_and_send_verification_code(request.user, pending_email=new_email)
        except Exception:
            logger.exception("Failed to send email change verification to %s", new_email)
            return Response(
                error_response(
                    detail="Could not send verification email. Please try again later.",
                    code=ApiCode.INTERNAL_ERROR,
                ),
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )

        return Response(
            success_response(
                detail=f"A verification code has been sent to {new_email}. Enter the code to confirm the change.",
                code=ApiCode.EMAIL_SENT,
            ),
            status=status.HTTP_200_OK,
        )


class VerifyEmailView(APIView):
    """Verify a 6-digit code for the current email or a pending email change."""

    permission_classes = [IsAuthenticated]
    throttle_classes = [AuthPublicRateThrottle]

    def post(self, request):
        serializer = VerifyEmailCodeSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        code = serializer.validated_data["code"]

        user = EmailVerificationCode.verify_code_for_user(request.user, code)
        if not user:
            return Response(
                error_response(
                    detail="Invalid or expired verification code.",
                    code=ApiCode.VALIDATION_ERROR,
                ),
                status=status.HTTP_400_BAD_REQUEST,
            )

        response_serializer = UserDetailSerializer(user, context={"request": request})
        return Response(
            success_response(
                data=response_serializer.data,
                detail="Email verified successfully.",
                code=ApiCode.SUCCESS,
            ),
            status=status.HTTP_200_OK,
        )


class UserViewSet(viewsets.ModelViewSet):
    """CRUD operations for users (admin-only)."""

    queryset = CustomUser.objects.all()
    serializer_class = UserDetailSerializer
    permission_classes = [IsAdmin]
    pagination_class = StandardResultsSetPagination
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ["role", "is_active"]
    search_fields = ["email", "full_name"]
    ordering_fields = ["date_joined", "updated_at", "email"]
    ordering = ["-date_joined"]

    def get_queryset(self):
        return CustomUser.objects.select_related("staff_profile", "lecturer_profile").all()

    def filter_queryset(self, queryset):
        queryset = super().filter_queryset(queryset)
        roles_csv = self.request.query_params.get("roles")
        if roles_csv:
            raw = [r.strip() for r in roles_csv.split(",") if r.strip()]
            allowed = {choice.value for choice in UserRole}
            parts = [r for r in raw if r in allowed]
            if parts:
                queryset = queryset.filter(role__in=parts)
        return queryset

    def get_serializer_class(self):
        if self.action == "create":
            return UserCreateSerializer
        if self.action in ("update", "partial_update"):
            return UserAdminUpdateSerializer
        return UserDetailSerializer

    @action(detail=False, methods=["post"], permission_classes=[IsAdmin])
    def create_user(self, request):
        """Create new user (admin only)."""
        serializer = UserCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()

        return Response(
            success_response(
                data=UserDetailSerializer(user).data,
                detail=ApiMessage.SUCCESS,
                code=ApiCode.SUCCESS,
            ),
            status=status.HTTP_201_CREATED,
        )

    @action(detail=True, methods=["post"])
    def deactivate(self, request, pk=None):
        """Deactivate a user account."""
        user = self.get_object()

        if not user.is_active:
            return Response(
                error_response(
                    detail=ApiMessage.ALREADY_DEACTIVATED,
                    code=ApiCode.ALREADY_DEACTIVATED,
                ),
                status=status.HTTP_400_BAD_REQUEST,
            )

        user.is_active = False
        user.save()

        return Response(
            success_response(
                data=UserDetailSerializer(user).data,
                detail=ApiMessage.DEACTIVATED,
            ),
            status=status.HTTP_200_OK,
        )

    @action(detail=True, methods=["post"])
    def activate(self, request, pk=None):
        """Activate a user account."""
        user = self.get_object()

        if user.is_active:
            return Response(
                error_response(
                    detail=ApiMessage.ALREADY_ACTIVATED,
                    code=ApiCode.ALREADY_ACTIVATED,
                ),
                status=status.HTTP_400_BAD_REQUEST,
            )

        user.is_active = True
        user.save()

        return Response(
            success_response(
                data=UserDetailSerializer(user).data,
                detail=ApiMessage.ACTIVATED,
            ),
            status=status.HTTP_200_OK,
        )

    def destroy(self, request, *args, **kwargs):
        """Prevent hard deletion of users."""
        raise DeleteNotAllowed()


# ---------------------------------------------------------------------------
# Profile Endpoints
# ---------------------------------------------------------------------------

class LecturerProfileViewSet(viewsets.ModelViewSet):
    """Manage lecturer-specific profiles."""

    queryset = LecturerProfile.objects.all()
    serializer_class = LecturerProfileSerializer
    permission_classes = [IsBackofficeRole]
    pagination_class = StandardResultsSetPagination

    def get_queryset(self):
        """Lecturers see own profile; staff see all."""
        if self.request.user.role == UserRole.LECTURER:
            return LecturerProfile.objects.filter(user=self.request.user)
        return super().get_queryset()


class StaffProfileViewSet(viewsets.ModelViewSet):
    """Manage staff-specific profiles (privileges). Admin-only; not exposed on user CRUD."""

    queryset = StaffProfile.objects.all()
    serializer_class = StaffProfileSerializer
    permission_classes = [IsAdmin]
    pagination_class = StandardResultsSetPagination


class AlumniProfileViewSet(viewsets.ReadOnlyModelViewSet):
    """View alumni profiles (read-only for most)."""

    queryset = AlumniProfile.objects.all()
    serializer_class = AlumniProfileSerializer
    permission_classes = [IsAuthenticated]
    pagination_class = StandardResultsSetPagination

    def get_queryset(self):
        """Alumni see own profile; staff/admin see all."""
        if self.request.user.role == UserRole.ALUMNI:
            return AlumniProfile.objects.filter(user=self.request.user)
        elif self.request.user.role in (UserRole.STAFF, UserRole.ADMIN):
            return super().get_queryset()
        return AlumniProfile.objects.none()


# ---------------------------------------------------------------------------
# Digital Card Endpoints
# ---------------------------------------------------------------------------

class DigitalCardViewSet(viewsets.ReadOnlyModelViewSet):
    """View and manage digital ID cards."""

    queryset = DigitalCard.objects.all()
    serializer_class = DigitalCardSerializer
    permission_classes = [IsAuthenticated]
    pagination_class = StandardResultsSetPagination

    def get_queryset(self):
        """Users see own card; staff see all."""
        if self.request.user.role in (UserRole.STAFF, UserRole.ADMIN):
            return super().get_queryset()
        return DigitalCard.objects.filter(user=self.request.user)

    @action(detail=False, methods=["get"])
    def my_card(self, request):
        """Get current user's digital card."""
        card = DigitalCard.objects.filter(user=request.user).first()
        if card is None:
            card = self._create_card_for_user(request.user, request)

        serializer = self.get_serializer(card)
        return Response(
            success_response(data=serializer.data),
            status=status.HTTP_200_OK,
        )

    @action(detail=False, methods=["get"])
    def templates(self, request):
        """Get digital card template image URLs."""
        front_path = getattr(settings, "ID_CARD_FRONT_TEMPLATE_PATH", "")
        back_path = getattr(settings, "ID_CARD_BACK_TEMPLATE_PATH", "")
        front_exists = bool(front_path and Path(front_path).exists())
        back_exists = bool(back_path and Path(back_path).exists())

        front_url = getattr(settings, "ID_CARD_FRONT_TEMPLATE_URL", "") if front_exists else ""
        back_url = getattr(settings, "ID_CARD_BACK_TEMPLATE_URL", "") if back_exists else ""

        if front_url and not front_url.startswith(("http://", "https://")):
            front_url = request.build_absolute_uri(front_url)
        if back_url and not back_url.startswith(("http://", "https://")):
            back_url = request.build_absolute_uri(back_url)

        return Response(
            success_response(
                data={
                    "front_url": front_url,
                    "back_url": back_url,
                }
            ),
            status=status.HTTP_200_OK,
        )

    def _create_card_for_user(self, user, request):
        """Create a default digital card with a fast request path."""
        role = user.role if user.role in {"STUDENT", "LECTURER", "STAFF", "ALUMNI"} else "STUDENT"
        card_number = f"{role[:3]}-{timezone.now().strftime('%Y%m%d')}-{user.id:06d}"
        if role == "STUDENT":
            valid_until = student_card_valid_until(user.institutional_id or "")
            if valid_until is None:
                valid_until = timezone.now().date() + timedelta(days=365 * 4)
        else:
            valid_until = timezone.now().date() + timedelta(days=365 * 4)

        card = DigitalCard.objects.create(
            user=user,
            card_number=card_number,
            card_type=role,
            valid_until=valid_until,
            is_active=True,
        )

        try:
            qr_payload = f"{settings.FRONTEND_URL}/verify-card/{card.card_number}"
            qr_image = generate_qr_code(qr_payload)
            qr_bytes = save_qr_to_bytes(qr_image)
            card.qr_code.save(f"qr-{card.card_number}.png", ContentFile(qr_bytes.read()), save=False)

            update_fields = ["qr_code"]
            if getattr(settings, "GENERATE_CARD_IMAGE_ON_CREATE", False):
                card_image = generate_digital_card_image(user, card.card_type)
                card_bytes = save_card_image_to_bytes(card_image)
                card.card_image.save(
                    f"card-{card.card_number}.png",
                    ContentFile(card_bytes.read()),
                    save=False,
                )
                update_fields.append("card_image")

            card.save(update_fields=update_fields)
        except Exception as exc:
            logger.warning(
                "Card assets generation failed for user_id=%s card_id=%s: %s",
                user.id,
                card.id,
                exc,
            )

        return card


class VerifyCardView(APIView):
    """Public digital card verification (QR scan). Returns minimal non-sensitive fields only."""

    permission_classes = [AllowAny]
    authentication_classes = []
    throttle_classes = [AuthPublicRateThrottle]

    def get(self, request, card_number: str):
        card = (
            DigitalCard.objects.select_related("user")
            .filter(card_number=card_number)
            .first()
        )
        if card is None:
            return Response(
                error_response(detail="Card not found.", code=ApiCode.NOT_FOUND),
                status=status.HTTP_404_NOT_FOUND,
            )

        user = card.user
        today = timezone.localdate()
        valid_until = effective_card_valid_until(card)
        verified = bool(
            card.is_active
            and user.is_active
            and valid_until >= today
        )

        return Response(
            success_response(
                data={
                    "student_id": user.institutional_id or "",
                    "verified": verified,
                    "valid_until": valid_until.isoformat(),
                }
            ),
            status=status.HTTP_200_OK,
        )

