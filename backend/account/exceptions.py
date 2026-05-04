"""
Custom exception classes for API error handling.
"""

from rest_framework.exceptions import APIException
from rest_framework import status
from .api_responses import ApiCode, ApiMessage
from .api_responses import custom_exception_handler as _custom_exception_handler


class RolePermissionDenied(APIException):
    """Raised when user's role does not have permission."""
    
    status_code = status.HTTP_403_FORBIDDEN
    default_detail = ApiMessage.NO_PERMISSION_FOR_ROLE
    default_code = ApiCode.NO_PERMISSION_FOR_ROLE


class DeleteNotAllowed(APIException):
    """Raised when attempting to delete a resource."""
    
    status_code = status.HTTP_400_BAD_REQUEST
    default_detail = ApiMessage.DELETE_NOT_ALLOWED
    default_code = ApiCode.DELETE_NOT_ALLOWED


class ResourceAlreadyDeactivated(APIException):
    """Raised when attempting to deactivate already-deactivated resource."""
    
    status_code = status.HTTP_400_BAD_REQUEST
    default_detail = ApiMessage.ALREADY_DEACTIVATED
    default_code = ApiCode.ALREADY_DEACTIVATED


class ResourceAlreadyActivated(APIException):
    """Raised when attempting to activate already-active resource."""
    
    status_code = status.HTTP_400_BAD_REQUEST
    default_detail = ApiMessage.ALREADY_ACTIVATED
    default_code = ApiCode.ALREADY_ACTIVATED


class InvalidCertificateTransition(APIException):
    """Raised for invalid certificate status transitions."""
    
    status_code = status.HTTP_400_BAD_REQUEST
    default_detail = "Invalid certificate status transition."
    default_code = "invalid_certificate_transition"


def custom_exception_handler(exc, context):
    """
    Backward-compatible import path for DRF EXCEPTION_HANDLER setting.

    The canonical implementation lives in `account.api_responses`.
    """
    return _custom_exception_handler(exc, context)
