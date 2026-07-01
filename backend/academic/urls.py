"""Academic app URL configuration."""

from django.urls import path

from . import views

app_name = "academic"

urlpatterns = [
    path("academic/me/", views.MyAcademicView.as_view(), name="academic-me"),
]
