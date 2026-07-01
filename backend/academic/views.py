"""Academic (SIS) API views — read-only student GPA and scores."""

import logging

from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from account.api_responses import ApiCode, error_response, success_response
from account.models import UserRole
from account.permissions import IsStudent

from .services import get_academic_profile_resilient

logger = logging.getLogger(__name__)


class MyAcademicView(APIView):
    """
    GET /api/academic/me/
    Returns the logged-in student's GPA summary and subject score list from myitnb (read-only).
    """

    permission_classes = [IsAuthenticated, IsStudent]

    def get(self, request):
        user = request.user
        if user.role != UserRole.STUDENT:
            return Response(
                error_response(
                    detail="Only students can view academic scores.",
                    code=ApiCode.PERMISSION_DENIED,
                    status_code=status.HTTP_403_FORBIDDEN,
                ),
                status=status.HTTP_403_FORBIDDEN,
            )

        student_id = (user.institutional_id or "").strip()
        if not student_id:
            return Response(
                error_response(
                    detail="Student ID is not linked to your account. Contact administration.",
                    code=ApiCode.VALIDATION_ERROR,
                    status_code=status.HTTP_400_BAD_REQUEST,
                ),
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            data = get_academic_profile_resilient(student_id)
        except Exception:
            # Live SIS unreachable and no snapshot exists for this student yet.
            logger.exception(
                "myitnb academic query failed with no snapshot for student_id=%s",
                student_id,
            )
            return Response(
                error_response(
                    detail="Scores are temporarily unavailable. Please try again later.",
                    code=ApiCode.INTERNAL_ERROR,
                    status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                ),
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )

        return Response(
            success_response(data=data),
            status=status.HTTP_200_OK,
        )
