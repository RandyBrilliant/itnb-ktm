"""ViewSets for main domain resources."""

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
    IsBackofficeRole,
    user_can_manage_benefits,
)
from account.models import UserRole
from main.models import (
    Benefit,
    BenefitCategory,
    Certificate,
    CertificateProgram,
    CertificateProgramBatchStatus,
    CertificateStatus,
    Event,
    Post,
)
from main.tasks import process_certificate_program_batch
from main.services.benefit_filtering import get_benefits_for_user
from main.services.certificate_generation import generate_certificate_pdf_bytes
from main.services.certificate_issuance import issue_program_certificate
from main.serializers import (
    BenefitCategorySerializer,
    BenefitSerializer,
    BenefitWriteSerializer,
    CertificateCreateSerializer,
    CertificateProgramAddRecipientSerializer,
    CertificateProgramCreateSerializer,
    CertificateProgramSerializer,
    CertificateSerializer,
    EventSerializer,
    PostCreateUpdateSerializer,
    PostSerializer,
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
        return CertificateSerializer

    def get_permissions(self):
        if self.action == "create":
            permission_classes = [CanIssueCertificates]
        elif self.action in ["destroy", "update", "partial_update"]:
            permission_classes = [IsBackofficeRole]
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
    permission_classes = [IsAuthenticatedOrReadOnly, CanManageBenefits]
    pagination_class = StandardResultsSetPagination


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
        if self.request.user.role in (UserRole.STAFF, UserRole.ADMIN):
            return Post.objects.select_related("author").all()
        return Post.objects.select_related("author").filter(is_published=True)

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
        if self.request.user.role in (UserRole.STAFF, UserRole.ADMIN):
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
        event = self.get_object()
        if event.capacity and event.rsvp_count >= event.capacity:
            return Response(error_response(detail="Event is at capacity."), status=status.HTTP_400_BAD_REQUEST)

        event.rsvp_count += 1
        event.save()
        return Response(
            success_response(
                data=EventSerializer(event).data,
                detail=ApiMessage.RSVP_RECORDED,
                code=ApiCode.RSVP_RECORDED,
            ),
            status=status.HTTP_200_OK,
        )
