"""
Role-based permission classes for DRF viewsets.
Each permission checks if user is authenticated and has appropriate role.
"""

from rest_framework import permissions
from .models import UserRole
from .api_responses import ApiMessage


# ---------------------------------------------------------------------------
# Role Check Helpers
# ---------------------------------------------------------------------------

def user_is_admin(user) -> bool:
    """True if user is authenticated and has Admin role."""
    return user and user.is_authenticated and user.role == UserRole.ADMIN


def user_is_staff(user) -> bool:
    """True if user is authenticated and has Staff role."""
    return user and user.is_authenticated and user.role == UserRole.STAFF


def user_is_lecturer(user) -> bool:
    """True if user is authenticated and has Lecturer role."""
    return user and user.is_authenticated and user.role == UserRole.LECTURER


def user_is_student(user) -> bool:
    """True if user is authenticated and has Student role."""
    return user and user.is_authenticated and user.role == UserRole.STUDENT


def user_is_alumni(user) -> bool:
    """True if user is authenticated and has Alumni role."""
    return user and user.is_authenticated and user.role == UserRole.ALUMNI


def user_is_backoffice(user) -> bool:
    """True if user is Admin, Staff, or Lecturer (dashboard access)."""
    return user and user.is_authenticated and user.role in (UserRole.ADMIN, UserRole.STAFF, UserRole.LECTURER)


# ---------------------------------------------------------------------------
# Permission Classes
# ---------------------------------------------------------------------------

class IsAdmin(permissions.BasePermission):
    """Only Admin role or superuser."""
    
    message = ApiMessage.PERMISSION_DENIED

    def has_permission(self, request, view):
        return bool(
            request.user
            and request.user.is_authenticated
            and (request.user.is_superuser or user_is_admin(request.user))
        )


class IsStaff(permissions.BasePermission):
    """Only Staff role or superuser."""
    
    message = ApiMessage.PERMISSION_DENIED

    def has_permission(self, request, view):
        return bool(
            request.user
            and request.user.is_authenticated
            and (request.user.is_superuser or user_is_staff(request.user))
        )


class IsLecturer(permissions.BasePermission):
    """Only Lecturer role or superuser."""
    
    message = ApiMessage.PERMISSION_DENIED

    def has_permission(self, request, view):
        return bool(
            request.user
            and request.user.is_authenticated
            and (request.user.is_superuser or user_is_lecturer(request.user))
        )


class IsStudent(permissions.BasePermission):
    """Only Student role or superuser."""
    
    message = ApiMessage.PERMISSION_DENIED

    def has_permission(self, request, view):
        return bool(
            request.user
            and request.user.is_authenticated
            and (request.user.is_superuser or user_is_student(request.user))
        )


class IsAlumni(permissions.BasePermission):
    """Only Alumni role or superuser."""
    
    message = ApiMessage.PERMISSION_DENIED

    def has_permission(self, request, view):
        return bool(
            request.user
            and request.user.is_authenticated
            and (request.user.is_superuser or user_is_alumni(request.user))
        )


class IsBackofficeRole(permissions.BasePermission):
    """Admin, Staff, or Lecturer (dashboard access)."""
    
    message = ApiMessage.NO_PERMISSION_FOR_ROLE

    def has_permission(self, request, view):
        return bool(
            request.user
            and request.user.is_authenticated
            and (request.user.is_superuser or user_is_backoffice(request.user))
        )


class CanIssueCertificates(permissions.BasePermission):
    """Only Staff with can_issue_certificates permission."""
    
    message = ApiMessage.PERMISSION_DENIED

    def has_permission(self, request, view):
        if not (request.user and request.user.is_authenticated):
            return False
        
        if request.user.is_superuser:
            return True
        
        if not user_is_staff(request.user):
            return False
        
        try:
            staff_profile = request.user.staff_profile
            return staff_profile.can_issue_certificates
        except:
            return False


class CanManageBenefits(permissions.BasePermission):
    """Only Staff with can_manage_benefits permission."""
    
    message = ApiMessage.PERMISSION_DENIED

    def has_permission(self, request, view):
        if not (request.user and request.user.is_authenticated):
            return False
        
        if request.user.is_superuser:
            return True
        
        if not user_is_staff(request.user):
            return False
        
        try:
            staff_profile = request.user.staff_profile
            return staff_profile.can_manage_benefits
        except:
            return False


class CanPostNews(permissions.BasePermission):
    """Only Lecturer/Staff with permission to post news."""
    
    message = ApiMessage.PERMISSION_DENIED

    def has_permission(self, request, view):
        if not (request.user and request.user.is_authenticated):
            return False
        
        if request.user.is_superuser:
            return True
        
        # Lecturers with permission
        if user_is_lecturer(request.user):
            try:
                # Current LecturerProfile schema does not include granular posting flags.
                # Keep lecturer posting disabled by default unless elevated elsewhere.
                request.user.lecturer_profile
                return False
            except:
                return False
        
        # Staff can always post
        if user_is_staff(request.user):
            return True
        
        return False


class IsOwnProfileOrStaff(permissions.BasePermission):
    """User can edit own profile, or is Staff/Admin."""
    
    message = ApiMessage.PERMISSION_DENIED

    def has_object_permission(self, request, view, obj):
        # Allow if user is editing own profile
        if request.user == obj:
            return True
        
        # Allow if user is staff or admin
        return bool(
            request.user.is_superuser
            or user_is_staff(request.user)
            or user_is_admin(request.user)
        )


class IsAuthenticatedOrReadOnly(permissions.BasePermission):
    """
    Allow any access to safe methods (GET, HEAD, OPTIONS).
    Require authentication for write methods.
    """
    
    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return True
        return bool(request.user and request.user.is_authenticated)
