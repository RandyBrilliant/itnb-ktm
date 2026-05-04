"""ViewSets for main domain resources."""

import logging

from django.utils import timezone
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import status, viewsets
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
)
from account.models import UserRole
from main.models import Benefit, BenefitCategory, Certificate, CertificateStatus, Event, Post
from main.services.benefit_filtering import get_benefits_for_user
from main.services.certificate_generation import generate_certificate_pdf_bytes
from main.serializers import (
    BenefitCategorySerializer,
    BenefitSerializer,
    CertificateCreateSerializer,
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
    filterset_fields = ["status", "user"]
    search_fields = ["title", "user__email"]
    ordering_fields = ["issued_date", "created_at"]
    ordering = ["-issued_date"]

    def get_queryset(self):
        if self.request.user.role in (UserRole.STAFF, UserRole.ADMIN):
            return Certificate.objects.select_related("user", "issued_by").all()
        return Certificate.objects.select_related("user", "issued_by").filter(
            user=self.request.user,
            status=CertificateStatus.ISSUED,
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

        try:
            pdf_bytes = generate_certificate_pdf_bytes(certificate)
            certificate.pdf_file.save(f"cert_{certificate.id}.pdf", pdf_bytes, save=True)
            certificate.status = CertificateStatus.DRAFT
            certificate.save()
        except Exception as exc:
            logger.error("Failed to generate certificate PDF: %s", exc)

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
    def download(self, request, pk=None):
        certificate = self.get_object()
        if certificate.user != request.user and request.user.role not in (UserRole.STAFF, UserRole.ADMIN):
            raise RolePermissionDenied()

        if not certificate.pdf_file:
            return Response(error_response(detail="PDF not available."), status=status.HTTP_404_NOT_FOUND)

        return Response({"download_url": certificate.pdf_file.url})


class BenefitCategoryViewSet(viewsets.ModelViewSet):
    queryset = BenefitCategory.objects.all()
    serializer_class = BenefitCategorySerializer
    permission_classes = [IsAuthenticatedOrReadOnly, CanManageBenefits]
    pagination_class = StandardResultsSetPagination


class BenefitViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = BenefitSerializer
    permission_classes = [IsAuthenticated]
    pagination_class = StandardResultsSetPagination
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ["category", "is_active"]
    search_fields = ["title", "partner"]
    ordering_fields = ["title", "category"]
    ordering = ["category", "title"]

    def get_queryset(self):
        return get_benefits_for_user(self.request.user).select_related("category")


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
        serializer.save(author=self.request.user)

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
