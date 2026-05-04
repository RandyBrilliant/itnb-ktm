"""Benefit filtering service for main domain."""

from django.db.models import QuerySet

from main.models import Benefit


def get_benefits_for_role(role: str) -> QuerySet:
    """Return active benefits eligible for the provided role."""
    benefits = Benefit.objects.filter(is_active=True)
    eligible_ids = [benefit.id for benefit in benefits if benefit.is_eligible_for_role(role)]
    return Benefit.objects.filter(id__in=eligible_ids)


def get_benefits_for_user(user) -> QuerySet:
    """Return active benefits eligible for an authenticated user."""
    if not user or not user.is_authenticated:
        return Benefit.objects.none()
    return get_benefits_for_role(user.role)


def filter_benefits_by_category(benefits: QuerySet, category_id: int) -> QuerySet:
    """Filter an existing benefits queryset by category id."""
    return benefits.filter(category_id=category_id)
