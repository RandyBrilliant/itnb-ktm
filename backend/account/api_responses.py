"""
Shared API response format and codes for consistent frontend integration.
All responses follow: {success: bool, data?: T, detail?: str, code?: str, errors?: {field: [msg]}}
"""

from rest_framework.response import Response
from rest_framework.views import exception_handler as drf_exception_handler
from rest_framework import status


# ---------------------------------------------------------------------------
# API Codes (for frontend i18n, conditional logic, etc.)
# ---------------------------------------------------------------------------

class ApiCode:
    """String codes for response identification and frontend handling."""

    # General
    SUCCESS = "success"
    VALIDATION_ERROR = "validation_error"
    NOT_FOUND = "not_found"
    PERMISSION_DENIED = "permission_denied"
    METHOD_NOT_ALLOWED = "method_not_allowed"
    INTERNAL_ERROR = "internal_error"

    # Resources
    DELETE_NOT_ALLOWED = "delete_not_allowed"
    ALREADY_DEACTIVATED = "already_deactivated"
    ALREADY_ACTIVATED = "already_activated"
    PROFILE_UPDATED = "profile_updated"
    EMAIL_SENT = "email_sent"
    EMAIL_ALREADY_VERIFIED = "email_already_verified"

    # Authorization
    NO_PERMISSION_FOR_ROLE = "no_permission_for_role"
    UNAUTHORIZED = "unauthorized"

    # Certificates
    CERTIFICATE_ISSUED = "certificate_issued"
    CERTIFICATE_REVOKED = "certificate_revoked"
    CERTIFICATE_NOT_FOUND = "certificate_not_found"

    # Digital Cards
    CARD_GENERATED = "card_generated"
    CARD_ACTIVE = "card_active"
    CARD_EXPIRED = "card_expired"

    # Posts & Events
    POST_PUBLISHED = "post_published"
    POST_UNPUBLISHED = "post_unpublished"
    EVENT_CREATED = "event_created"
    RSVP_RECORDED = "rsvp_recorded"


# ---------------------------------------------------------------------------
# API Messages (single source of truth for frontend)
# ---------------------------------------------------------------------------

class ApiMessage:
    """User-facing messages in English."""

    # General
    SUCCESS = "Request successful."
    VALIDATION_ERROR = "Invalid data. Please check the fields and try again."
    NOT_FOUND = "Resource not found."
    PERMISSION_DENIED = "You do not have permission to perform this action."
    METHOD_NOT_ALLOWED = "Method not allowed."
    INTERNAL_ERROR = "An unexpected error occurred. Please try again later."

    # Resources
    DELETE_NOT_ALLOWED = "Deletion is not allowed. Use deactivation instead."
    ALREADY_DEACTIVATED = "This resource is already deactivated."
    ALREADY_ACTIVATED = "This resource is already active."
    PROFILE_UPDATED = "Profile updated successfully."
    EMAIL_SENT = "Email sent successfully."
    EMAIL_ALREADY_VERIFIED = "Email is already verified."

    # Authorization
    NO_PERMISSION_FOR_ROLE = "Your role does not have permission to access this resource."
    UNAUTHORIZED = "Authentication required."

    # Certificates
    CERTIFICATE_ISSUED = "Certificate issued successfully."
    CERTIFICATE_REVOKED = "Certificate revoked successfully."
    CERTIFICATE_NOT_FOUND = "Certificate not found."

    # Digital Cards
    CARD_GENERATED = "Digital card generated successfully."
    CARD_ACTIVE = "Your card is active and valid."
    CARD_EXPIRED = "Your card has expired."

    # Posts & Events
    POST_PUBLISHED = "Post published successfully."
    POST_UNPUBLISHED = "Post unpublished successfully."
    EVENT_CREATED = "Event created successfully."
    RSVP_RECORDED = "Your RSVP has been recorded."


# ---------------------------------------------------------------------------
# Response Builders
# ---------------------------------------------------------------------------

def success_response(
    data=None,
    detail: str = ApiMessage.SUCCESS,
    code: str = ApiCode.SUCCESS,
    status_code: int = status.HTTP_200_OK,
) -> dict:
    """
    Build a success response.
    
    Args:
        data: Response payload (optional)
        detail: Human-readable message
        code: Machine-readable code
        status_code: HTTP status code
    """
    return {
        "success": True,
        "code": code,
        "detail": detail,
        "data": data,
    }


def error_response(
    detail: str = ApiMessage.INTERNAL_ERROR,
    code: str = ApiCode.INTERNAL_ERROR,
    errors: dict = None,
    status_code: int = status.HTTP_400_BAD_REQUEST,
) -> dict:
    """
    Build an error response.
    
    Args:
        detail: Human-readable error message
        code: Machine-readable error code
        errors: Dict of field-level errors {field: [msg, ...]}
        status_code: HTTP status code
    """
    return {
        "success": False,
        "code": code,
        "detail": detail,
        "errors": errors or {},
    }


# ---------------------------------------------------------------------------
# Custom Exception Handler
# ---------------------------------------------------------------------------

def custom_exception_handler(exc, context):
    """
    Custom DRF exception handler that formats all errors consistently.
    Converts DRF exceptions to our standard response format.
    """
    response = drf_exception_handler(exc, context)
    
    if response is not None:
        # Extract error details from DRF response
        detail = response.data.get("detail", ApiMessage.INTERNAL_ERROR) if isinstance(response.data, dict) else str(response.data)
        errors = {}
        code = ApiCode.INTERNAL_ERROR
        
        # Map common error types to our codes
        if response.status_code == status.HTTP_404_NOT_FOUND:
            code = ApiCode.NOT_FOUND
            detail = ApiMessage.NOT_FOUND
        elif response.status_code == status.HTTP_403_FORBIDDEN:
            code = ApiCode.PERMISSION_DENIED
            detail = ApiMessage.PERMISSION_DENIED
        elif response.status_code == status.HTTP_401_UNAUTHORIZED:
            code = ApiCode.UNAUTHORIZED
            detail = ApiMessage.UNAUTHORIZED
        elif response.status_code == status.HTTP_400_BAD_REQUEST:
            code = ApiCode.VALIDATION_ERROR
            detail = ApiMessage.VALIDATION_ERROR
            # Capture field-level errors
            if isinstance(response.data, dict):
                errors = response.data
        elif response.status_code == status.HTTP_405_METHOD_NOT_ALLOWED:
            code = ApiCode.METHOD_NOT_ALLOWED
            detail = ApiMessage.METHOD_NOT_ALLOWED
        
        # Rebuild response with our format
        response.data = error_response(
            detail=detail,
            code=code,
            errors=errors,
        )
    
    return response


# ---------------------------------------------------------------------------
# Validation Helpers
# ---------------------------------------------------------------------------

def validate_email_unique(model, email: str, exclude_instance=None) -> str:
    """
    Validate email uniqueness, optionally excluding an instance (for updates).
    Raises serializer ValidationError if email exists.
    """
    from django.core.exceptions import ValidationError as DjangoValidationError
    from rest_framework.serializers import ValidationError
    
    query = model.objects.filter(email=email)
    if exclude_instance:
        query = query.exclude(pk=exclude_instance.pk)
    
    if query.exists():
        raise ValidationError(ApiMessage.EMAIL_TAKEN)
    
    return email
