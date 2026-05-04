"""Main app URL configuration."""

from django.urls import include, path
from rest_framework.routers import DefaultRouter

from . import views

app_name = "main"

router = DefaultRouter()
router.register(r"certificates", views.CertificateViewSet, basename="certificate")
router.register(r"benefit-categories", views.BenefitCategoryViewSet, basename="benefit-category")
router.register(r"benefits", views.BenefitViewSet, basename="benefit")
router.register(r"posts", views.PostViewSet, basename="post")
router.register(r"events", views.EventViewSet, basename="event")

urlpatterns = [
    path("", include(router.urls)),
]
