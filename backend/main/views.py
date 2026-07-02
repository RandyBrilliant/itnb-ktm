"""ViewSets for main domain resources."""

import base64
import logging

from django.db import transaction
from django.http import HttpResponse
from django.utils import timezone
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import mixins, status, viewsets
from rest_framework.decorators import action
from rest_framework.filters import OrderingFilter, SearchFilter
from rest_framework.pagination import PageNumberPagination
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from account.api_responses import ApiCode, ApiMessage, error_response, success_response
from account.exceptions import RolePermissionDenied
from account.permissions import (
    CanIssueCertificates,
    CanManageBenefits,
    CanPostNews,
    IsAuthenticatedOrReadOnly,
    user_can_manage_benefits,
)
from account.models import UserRole
from account.services.qr_generation import generate_qr_code, save_qr_to_bytes
from main.models import (
    Benefit,
    BenefitCategory,
    Certificate,
    CertificateProgram,
    CertificateProgramBatchStatus,
    CertificateStatus,
    Event,
    Post,
    Webinar,
    WebinarMode,
    WebinarRegistration,
    WebinarRegistrationStatus,
)
from main.tasks import issue_webinar_certificate, process_certificate_program_batch
from main.services.benefit_filtering import get_benefits_for_user
from main.services.certificate_generation import generate_certificate_pdf_bytes
from main.services.certificate_issuance import issue_program_certificate
from main.services.webinar_attendance import (
    TOKEN_STEP_SECONDS,
    VALID_PHASES,
    build_attendance_scan_url,
    generate_attendance_token,
    seconds_until_next_window,
    verify_attendance_token,
)
from main.services.webinar_export import build_webinar_participants_workbook
from main.services.webinar_schedule import (
    attendance_qr_available,
    attendance_qr_opens_at,
    check_in_opens_at,
    check_in_window_open,
    normalize_registration_closes,
    normalize_registration_opens,
    validate_registration_against_start,
    webinar_session_contains,
)
from main.serializers import (
    BenefitCategorySerializer,
    BenefitSerializer,
    BenefitWriteSerializer,
    CertificateCreateSerializer,
    CertificateProgramAddRecipientSerializer,
    CertificateProgramCreateSerializer,
    CertificateProgramSerializer,
    CertificateSerializer,
    CertificateUpdateSerializer,
    EventSerializer,
    PostCreateUpdateSerializer,
    PostSerializer,
    WebinarCreateUpdateSerializer,
    WebinarRegistrationSerializer,
    WebinarSerializer,
)

logger = logging.getLogger(__name__)


class StandardResultsSetPagination(PageNumberPagination):
    page_size = 20
    page_size_query_param = "page_size"
    max_page_size = 100


class CertificateViewSet(viewsets.ModelViewSet):
    serializer_class = CertificateSerializer
    permission_classes = [IsAuthenticated]
    pagination_class = StandardResultsSetPagination
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ["status", "user", "program"]
    search_fields = ["title", "user__email", "recipient_name", "recipient_id_display"]
    ordering_fields = ["issued_date", "created_at"]
    ordering = ["-issued_date"]

    def get_queryset(self):
        if self.request.user.role in (UserRole.STAFF, UserRole.ADMIN):
            return Certificate.objects.select_related("user", "issued_by", "program").all()
        return Certificate.objects.select_related("user", "issued_by", "program").filter(
            user=self.request.user,
            status=CertificateStatus.ISSUED,
            is_suspended=False,
        )

    def get_serializer_class(self):
        if self.action == "create":
            return CertificateCreateSerializer
        if self.action in ("update", "partial_update"):
            return CertificateUpdateSerializer
        return CertificateSerializer

    def get_permissions(self):
        if self.action in ("create", "destroy", "update", "partial_update"):
            permission_classes = [CanIssueCertificates]
        else:
            permission_classes = [IsAuthenticated]
        return [permission() for permission in permission_classes]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        certificate = serializer.save()
        certificate.status = CertificateStatus.DRAFT
        certificate.save()

        return Response(
            success_response(
                data=CertificateSerializer(certificate).data,
                detail=ApiMessage.CERTIFICATE_ISSUED,
                code=ApiCode.CERTIFICATE_ISSUED,
            ),
            status=status.HTTP_201_CREATED,
        )

    @action(detail=True, methods=["post"], permission_classes=[CanIssueCertificates])
    def issue(self, request, pk=None):
        certificate = self.get_object()
        if certificate.status == CertificateStatus.ISSUED:
            return Response(error_response(detail="Certificate already issued."), status=status.HTTP_400_BAD_REQUEST)

        certificate.status = CertificateStatus.ISSUED
        certificate.save()
        return Response(
            success_response(
                data=CertificateSerializer(certificate).data,
                detail=ApiMessage.CERTIFICATE_ISSUED,
                code=ApiCode.CERTIFICATE_ISSUED,
            ),
            status=status.HTTP_200_OK,
        )

    @action(detail=True, methods=["post"], permission_classes=[CanIssueCertificates])
    def revoke(self, request, pk=None):
        certificate = self.get_object()
        if certificate.status == CertificateStatus.REVOKED:
            return Response(error_response(detail="Certificate already revoked."), status=status.HTTP_400_BAD_REQUEST)

        certificate.status = CertificateStatus.REVOKED
        certificate.save()
        return Response(
            success_response(
                data=CertificateSerializer(certificate).data,
                detail=ApiMessage.CERTIFICATE_REVOKED,
                code=ApiCode.CERTIFICATE_REVOKED,
            ),
            status=status.HTTP_200_OK,
        )

    @action(detail=True, methods=["get"])
    def pdf(self, request, pk=None):
        """Return the certificate PDF bytes, generated on demand (no per-user file storage)."""
        certificate = self.get_object()
        if certificate.user != request.user and request.user.role not in (UserRole.STAFF, UserRole.ADMIN):
            raise RolePermissionDenied()

        if certificate.user == request.user and certificate.is_suspended:
            return Response(error_response(detail="Certificate unavailable."), status=status.HTTP_404_NOT_FOUND)

        try:
            bio = generate_certificate_pdf_bytes(certificate)
            bio.seek(0)
        except Exception as exc:
            logger.exception("Certificate PDF generation failed: %s", exc)
            return Response(
                error_response(detail="Could not generate certificate PDF."),
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

        response = HttpResponse(bio.getvalue(), content_type="application/pdf")
        response["Content-Disposition"] = f'inline; filename="certificate_{certificate.id}.pdf"'
        return response

    @action(detail=True, methods=["get"])
    def download(self, request, pk=None):
        """Legacy JSON with media URL when an old row still has pdf_file on disk; otherwise use GET …/pdf/."""
        certificate = self.get_object()
        if certificate.user != request.user and request.user.role not in (UserRole.STAFF, UserRole.ADMIN):
            raise RolePermissionDenied()

        if certificate.user == request.user and certificate.is_suspended:
            return Response(error_response(detail="Certificate unavailable."), status=status.HTTP_404_NOT_FOUND)

        if certificate.pdf_file:
            return Response({"download_url": certificate.pdf_file.url})

        return Response(
            {
                "download_url": None,
                "message": "PDF is generated on demand. Authenticated clients should GET /api/certificates/{id}/pdf/.",
            },
            status=status.HTTP_200_OK,
        )

    @action(detail=True, methods=["post"], permission_classes=[CanIssueCertificates])
    def suspend(self, request, pk=None):
        certificate = self.get_object()
        certificate.is_suspended = True
        certificate.save(update_fields=["is_suspended", "updated_at"])
        return Response(
            success_response(
                data=CertificateSerializer(certificate, context={"request": request}).data,
                detail="Certificate hidden from recipient portal.",
                code=ApiCode.SUCCESS,
            ),
            status=status.HTTP_200_OK,
        )

    @action(detail=True, methods=["post"], permission_classes=[CanIssueCertificates])
    def unsuspend(self, request, pk=None):
        certificate = self.get_object()
        certificate.is_suspended = False
        certificate.save(update_fields=["is_suspended", "updated_at"])
        return Response(
            success_response(
                data=CertificateSerializer(certificate, context={"request": request}).data,
                detail="Certificate visible again in recipient portal.",
                code=ApiCode.SUCCESS,
            ),
            status=status.HTTP_200_OK,
        )


class CertificateProgramViewSet(
    mixins.CreateModelMixin,
    mixins.ListModelMixin,
    mixins.RetrieveModelMixin,
    mixins.DestroyModelMixin,
    viewsets.GenericViewSet,
):
    """Admin/staff: define template + Excel list; workers generate personalized PDFs."""

    permission_classes = [IsAuthenticated, CanIssueCertificates]
    pagination_class = StandardResultsSetPagination
    queryset = CertificateProgram.objects.select_related("issued_by").all()
    ordering = ["-created_at"]

    def get_serializer_class(self):
        if self.action == "create":
            return CertificateProgramCreateSerializer
        return CertificateProgramSerializer

    def perform_create(self, serializer):
        program = serializer.save(issued_by=self.request.user)
        transaction.on_commit(lambda: process_certificate_program_batch.delay(program.id))

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        headers = self.get_success_headers(serializer.data)
        output = CertificateProgramSerializer(serializer.instance, context={"request": request})
        return Response(
            success_response(
                data=output.data,
                detail="Certificate batch queued for processing.",
                code=ApiCode.SUCCESS,
            ),
            status=status.HTTP_201_CREATED,
            headers=headers,
        )

    @action(detail=True, methods=["post"])
    def retry(self, request, pk=None):
        program = self.get_object()
        if program.batch_status == CertificateProgramBatchStatus.PROCESSING:
            return Response(
                error_response(detail="Batch is still processing."),
                status=status.HTTP_400_BAD_REQUEST,
            )
        program.batch_status = CertificateProgramBatchStatus.PENDING
        program.batch_summary = {}
        program.save(update_fields=["batch_status", "batch_summary", "updated_at"])
        transaction.on_commit(lambda: process_certificate_program_batch.delay(program.id))
        program.refresh_from_db()
        return Response(
            success_response(
                data=CertificateProgramSerializer(program, context={"request": request}).data,
                detail="Batch queued.",
                code=ApiCode.SUCCESS,
            ),
            status=status.HTTP_200_OK,
        )

    @action(detail=True, methods=["post"])
    def add_recipient(self, request, pk=None):
        program = self.get_object()
        serializer = CertificateProgramAddRecipientSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        try:
            certificate, err = issue_program_certificate(
                program,
                serializer.validated_data["display_name"],
                serializer.validated_data["id_raw"],
                clear_suspension=True,
            )
        except Exception as exc:
            logger.exception("add_recipient failed: %s", exc)
            return Response(
                error_response(detail="Could not generate certificate PDF."),
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )
        if err == "no_user":
            return Response(
                error_response(
                    detail=(
                        "No portal user matches this ID. Use the same value as the user’s institutional ID on their "
                        "profile, their login email, or an active digital card number."
                    ),
                ),
                status=status.HTTP_400_BAD_REQUEST,
            )
        return Response(
            success_response(
                data=CertificateSerializer(certificate, context={"request": request}).data,
                detail="Recipient added and certificate issued.",
                code=ApiCode.SUCCESS,
            ),
            status=status.HTTP_200_OK,
        )


class BenefitCategoryViewSet(viewsets.ModelViewSet):
    queryset = BenefitCategory.objects.all()
    serializer_class = BenefitCategorySerializer
    permission_classes = [IsAuthenticatedOrReadOnly]
    pagination_class = StandardResultsSetPagination

    def get_permissions(self):
        if self.action in ("create", "update", "partial_update", "destroy"):
            return [CanManageBenefits()]
        return [IsAuthenticatedOrReadOnly()]


class BenefitViewSet(viewsets.ModelViewSet):
    serializer_class = BenefitSerializer
    permission_classes = [IsAuthenticated]
    pagination_class = StandardResultsSetPagination
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ["category", "is_active"]
    search_fields = ["title", "partner", "description"]
    ordering_fields = ["title", "category", "created_at", "updated_at"]
    ordering = ["category", "title"]

    def get_queryset(self):
        base = Benefit.objects.select_related("category")
        if user_can_manage_benefits(self.request.user):
            return base.all()
        return get_benefits_for_user(self.request.user).select_related("category")

    def get_serializer_class(self):
        if self.action in ("create", "update", "partial_update"):
            return BenefitWriteSerializer
        return BenefitSerializer

    def get_permissions(self):
        if self.action in ("create", "update", "partial_update", "destroy"):
            return [IsAuthenticated(), CanManageBenefits()]
        return [IsAuthenticated()]


class PostViewSet(viewsets.ModelViewSet):
    queryset = Post.objects.filter(is_published=True)
    serializer_class = PostSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]
    pagination_class = StandardResultsSetPagination
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ["category", "is_published"]
    search_fields = ["title", "body"]
    ordering_fields = ["published_at", "created_at"]
    ordering = ["-published_at", "-created_at"]

    def get_queryset(self):
        base = Post.objects.select_related("author", "webinar", "webinar__certificate_program")
        user = self.request.user
        if user.is_authenticated and user.role in (UserRole.STAFF, UserRole.ADMIN):
            return base.all()
        return base.filter(is_published=True)

    def get_serializer_class(self):
        if self.action in ["create", "update", "partial_update"]:
            return PostCreateUpdateSerializer
        return PostSerializer

    def get_permissions(self):
        if self.action in ["create", "update", "partial_update", "destroy"]:
            permission_classes = [CanPostNews]
        else:
            permission_classes = [IsAuthenticatedOrReadOnly]
        return [permission() for permission in permission_classes]

    def perform_create(self, serializer):
        payload = {"author": self.request.user}
        if serializer.validated_data.get("is_published"):
            payload["published_at"] = timezone.now()
        serializer.save(**payload)

    def perform_update(self, serializer):
        post = self.get_object()
        is_published = serializer.validated_data.get("is_published", post.is_published)
        publish_toggle_on = not post.is_published and is_published
        publish_toggle_off = post.is_published and not is_published

        payload = {}
        if publish_toggle_on:
            payload["published_at"] = timezone.now()
        elif publish_toggle_off:
            payload["published_at"] = None

        serializer.save(**payload)

    @action(detail=True, methods=["post"], permission_classes=[IsAuthenticated])
    def publish(self, request, pk=None):
        post = self.get_object()
        if post.author != request.user and request.user.role not in (UserRole.STAFF, UserRole.ADMIN):
            raise RolePermissionDenied()

        post.is_published = True
        post.published_at = timezone.now()
        post.save()
        return Response(
            success_response(
                data=PostSerializer(post).data,
                detail=ApiMessage.POST_PUBLISHED,
                code=ApiCode.POST_PUBLISHED,
            ),
            status=status.HTTP_200_OK,
        )

    @action(detail=True, methods=["post"], permission_classes=[IsAuthenticated])
    def unpublish(self, request, pk=None):
        post = self.get_object()
        if post.author != request.user and request.user.role not in (UserRole.STAFF, UserRole.ADMIN):
            raise RolePermissionDenied()

        post.is_published = False
        post.save()
        return Response(
            success_response(
                data=PostSerializer(post).data,
                detail=ApiMessage.POST_UNPUBLISHED,
                code=ApiCode.POST_UNPUBLISHED,
            ),
            status=status.HTTP_200_OK,
        )


class EventViewSet(viewsets.ModelViewSet):
    queryset = Event.objects.filter(post__is_published=True)
    serializer_class = EventSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]
    pagination_class = StandardResultsSetPagination
    filter_backends = [DjangoFilterBackend, OrderingFilter]
    ordering_fields = ["event_date"]
    ordering = ["event_date"]

    def get_queryset(self):
        user = self.request.user
        if user.is_authenticated and user.role in (UserRole.STAFF, UserRole.ADMIN):
            return Event.objects.select_related("post", "post__author").all()
        return Event.objects.select_related("post", "post__author").filter(post__is_published=True)

    def get_permissions(self):
        if self.action in ["create", "update", "partial_update", "destroy"]:
            permission_classes = [CanPostNews]
        else:
            permission_classes = [IsAuthenticatedOrReadOnly]
        return [permission() for permission in permission_classes]

    @action(detail=True, methods=["post"], permission_classes=[IsAuthenticated])
    def rsvp(self, request, pk=None):
        with transaction.atomic():
            event = Event.objects.select_for_update().get(pk=self.get_object().pk)
            if event.capacity is not None and event.rsvp_count >= event.capacity:
                return Response(
                    error_response(detail="Event is at capacity."),
                    status=status.HTTP_400_BAD_REQUEST,
                )

            event.rsvp_count += 1
            event.save(update_fields=["rsvp_count"])

        return Response(
            success_response(
                data=EventSerializer(event).data,
                detail=ApiMessage.RSVP_RECORDED,
                code=ApiCode.RSVP_RECORDED,
            ),
            status=status.HTTP_200_OK,
        )


class WebinarViewSet(viewsets.ModelViewSet):
    """
    Webinars: admin/staff create them (auto-creating a published announcement
    Post), students register and check in/out, and certificates are auto-issued
    on a valid check-in when a certificate template is attached.
    """

    permission_classes = [IsAuthenticated]
    pagination_class = StandardResultsSetPagination
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ["mode", "status"]
    search_fields = ["post__title", "post__body"]
    ordering_fields = ["starts_at", "created_at"]
    ordering = ["-starts_at"]

    def get_queryset(self):
        base = Webinar.objects.select_related(
            "post", "post__author", "certificate_program"
        )
        if self.request.user.role in (UserRole.STAFF, UserRole.ADMIN):
            return base.all()
        return base.filter(status="PUBLISHED", post__is_published=True)

    def get_serializer_class(self):
        if self.action in ("create", "update", "partial_update"):
            return WebinarCreateUpdateSerializer
        return WebinarSerializer

    def get_permissions(self):
        admin_actions = {
            "create",
            "update",
            "partial_update",
            "destroy",
            "registrations",
            "participants",
            "attendance_token",
        }
        if self.action in admin_actions:
            return [CanPostNews()]
        return [IsAuthenticated()]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        webinar = serializer.save()
        output = WebinarSerializer(webinar, context=self.get_serializer_context())
        return Response(
            success_response(data=output.data, detail="Webinar created.", code=ApiCode.SUCCESS),
            status=status.HTTP_201_CREATED,
        )

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop("partial", False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        webinar = serializer.save()
        output = WebinarSerializer(webinar, context=self.get_serializer_context())
        return Response(
            success_response(data=output.data, detail="Webinar updated.", code=ApiCode.SUCCESS),
            status=status.HTTP_200_OK,
        )

    def perform_destroy(self, instance):
        post = instance.post
        instance.delete()
        post.delete()

    # -- Student: registration ------------------------------------------------

    @action(detail=True, methods=["post", "delete"], permission_classes=[IsAuthenticated])
    def register(self, request, pk=None):
        webinar = self.get_object()
        existing = WebinarRegistration.objects.filter(webinar=webinar, user=request.user).first()

        if request.method == "DELETE":
            if not existing or existing.status == WebinarRegistrationStatus.CANCELLED:
                return Response(
                    error_response(detail="You are not registered for this webinar."),
                    status=status.HTTP_400_BAD_REQUEST,
                )
            existing.status = WebinarRegistrationStatus.CANCELLED
            existing.save(update_fields=["status", "updated_at"])
            return Response(
                success_response(
                    data=WebinarSerializer(webinar, context=self.get_serializer_context()).data,
                    detail="Registration cancelled.",
                    code=ApiCode.SUCCESS,
                ),
                status=status.HTTP_200_OK,
            )

        if not webinar.is_registration_open:
            return Response(
                error_response(detail="Registration is not open for this webinar."),
                status=status.HTTP_400_BAD_REQUEST,
            )

        with transaction.atomic():
            locked_webinar = Webinar.objects.select_for_update().get(pk=webinar.pk)

            if not locked_webinar.is_registration_open:
                return Response(
                    error_response(detail="Registration is not open for this webinar."),
                    status=status.HTTP_400_BAD_REQUEST,
                )

            existing = WebinarRegistration.objects.filter(
                webinar=locked_webinar, user=request.user
            ).first()

            if existing and existing.status == WebinarRegistrationStatus.REGISTERED:
                return Response(
                    success_response(
                        data=WebinarSerializer(
                            locked_webinar, context=self.get_serializer_context()
                        ).data,
                        detail="You are already registered.",
                        code=ApiCode.SUCCESS,
                    ),
                    status=status.HTTP_200_OK,
                )

            registered_count = locked_webinar.registrations.filter(
                status=WebinarRegistrationStatus.REGISTERED
            ).count()
            if locked_webinar.capacity and registered_count >= locked_webinar.capacity:
                target = WebinarRegistrationStatus.WAITLISTED
            else:
                target = WebinarRegistrationStatus.REGISTERED

            if existing:
                existing.status = target
                existing.save(update_fields=["status", "updated_at"])
            else:
                WebinarRegistration.objects.create(
                    webinar=locked_webinar, user=request.user, status=target
                )

            detail = (
                "Added to the waitlist."
                if target == WebinarRegistrationStatus.WAITLISTED
                else "Registered."
            )
            return Response(
                success_response(
                    data=WebinarSerializer(
                        locked_webinar, context=self.get_serializer_context()
                    ).data,
                    detail=detail,
                    code=ApiCode.SUCCESS,
                ),
                status=status.HTTP_200_OK,
            )

    # -- Student: attendance --------------------------------------------------

    @action(detail=True, methods=["post"], url_path="check-in", permission_classes=[IsAuthenticated])
    def check_in(self, request, pk=None):
        return self._record_attendance(request, phase="in")

    @action(detail=True, methods=["post"], url_path="check-out", permission_classes=[IsAuthenticated])
    def check_out(self, request, pk=None):
        return self._record_attendance(request, phase="out")

    def _record_attendance(self, request, *, phase):
        webinar = self.get_object()
        now = timezone.now()

        if phase == "in" and not check_in_window_open(webinar, now):
            return Response(
                error_response(
                    detail="Check-in opens 1 hour before the webinar starts and closes at the end of the session day."
                ),
                status=status.HTTP_400_BAD_REQUEST,
            )

        if phase == "out" and not webinar_session_contains(webinar, now):
            return Response(
                error_response(detail="Check-out is only available during the webinar session."),
                status=status.HTTP_400_BAD_REQUEST,
            )

        raw = str(request.data.get("token") or "").strip()
        if ":" in raw:  # accept a scanned "WEBINAR:<id>:<phase>:<token>" payload
            raw = raw.split(":")[-1].strip()

        if not raw:
            return Response(
                error_response(detail="Invalid or expired attendance code."),
                status=status.HTTP_400_BAD_REQUEST,
            )

        window_ok = (
            check_in_window_open(webinar, now)
            if phase == "in"
            else webinar_session_contains(webinar, now)
        )
        if not window_ok:
            return Response(
                error_response(detail="Invalid or expired attendance code."),
                status=status.HTTP_400_BAD_REQUEST,
            )

        valid = verify_attendance_token(webinar.attendance_secret, phase, raw)
        method = "TOKEN"

        if not valid:
            return Response(
                error_response(detail="Invalid or expired attendance code."),
                status=status.HTTP_400_BAD_REQUEST,
            )

        reg, _created = WebinarRegistration.objects.get_or_create(
            webinar=webinar,
            user=request.user,
            defaults={"status": WebinarRegistrationStatus.REGISTERED},
        )
        if reg.status == WebinarRegistrationStatus.CANCELLED:
            reg.status = WebinarRegistrationStatus.REGISTERED

        if phase == "in":
            if reg.checked_in_at is None:
                reg.checked_in_at = now
                reg.check_in_method = method
        else:
            reg.checked_out_at = now
            if reg.checked_in_at is None:
                reg.checked_in_at = now
                reg.check_in_method = method
        reg.save()

        should_issue = (
            reg.checked_in_at is not None
            and not reg.certificate_id
            and webinar.auto_issue_certificate
            and webinar.certificate_program_id
        )
        if should_issue:
            reg_id = reg.id
            transaction.on_commit(lambda: issue_webinar_certificate.delay(reg_id))

        detail = "Checked in." if phase == "in" else "Checked out."
        return Response(
            success_response(
                data=WebinarSerializer(webinar, context=self.get_serializer_context()).data,
                detail=detail,
                code=ApiCode.SUCCESS,
            ),
            status=status.HTTP_200_OK,
        )

    # -- Admin: attendance token, participants --------------------------------

    @action(detail=True, methods=["get"], url_path="attendance-token", permission_classes=[CanPostNews])
    def attendance_token(self, request, pk=None):
        webinar = self.get_object()
        now = timezone.now()

        if not attendance_qr_available(webinar, now):
            opens = attendance_qr_opens_at(webinar)
            return Response(
                error_response(
                    detail=(
                        "Attendance QR is available from 30 minutes before the webinar starts "
                        f"({timezone.localtime(opens).strftime('%d %b %Y, %H:%M')} WIB)."
                    ),
                ),
                status=status.HTTP_400_BAD_REQUEST,
            )

        phase = request.query_params.get("phase", "in")
        if phase not in VALID_PHASES:
            phase = "in"

        token = generate_attendance_token(webinar.attendance_secret, phase)
        payload = build_attendance_scan_url(webinar.id, phase, token)
        qr_bytes = save_qr_to_bytes(generate_qr_code(payload))
        qr_data_url = "data:image/png;base64," + base64.b64encode(qr_bytes.getvalue()).decode()

        return Response(
            success_response(
                data={
                    "token": token,
                    "phase": phase,
                    "payload": payload,
                    "attendance_url": payload,
                    "qr_data_url": qr_data_url,
                    "step_seconds": TOKEN_STEP_SECONDS,
                    "expires_in": seconds_until_next_window(),
                },
                code=ApiCode.SUCCESS,
            ),
            status=status.HTTP_200_OK,
        )

    @action(detail=True, methods=["get"], permission_classes=[CanPostNews])
    def registrations(self, request, pk=None):
        webinar = self.get_object()
        queryset = webinar.registrations.select_related("user", "certificate").all()
        status_filter = request.query_params.get("status")
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        page = self.paginate_queryset(queryset)
        serializer = WebinarRegistrationSerializer(page, many=True)
        return self.get_paginated_response(serializer.data)

    @action(detail=True, methods=["get"], permission_classes=[CanPostNews])
    def participants(self, request, pk=None):
        webinar = self.get_object()
        buf = build_webinar_participants_workbook(webinar)
        response = HttpResponse(
            buf.getvalue(),
            content_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        )
        response["Content-Disposition"] = (
            f'attachment; filename="webinar_{webinar.id}_participants.xlsx"'
        )
        return response
