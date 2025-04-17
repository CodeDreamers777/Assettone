# admin_api/urls.py

from django.urls import path
from .views import (
    AdminLoginAPIView,
    AdminDashboardAPIView,
    LandlordListAPIView,
    LandlordDetailAPIView,
    LandlordCreateAPIView,
    LandlordUpdateAPIView,
    ActivateDeactivateLandlordAPIView,
    PropertyListAPIView,
    PropertyDetailAPIView,
    PropertyCreateAPIView,
    PropertyUpdateAPIView,
    PropertyDeleteAPIView,
    PropertyStatisticsAPIView,
)

urlpatterns = [
    # Admin authentication
    path("login/", AdminLoginAPIView.as_view(), name="admin-login"),
    # Admin dashboard
    path("dashboard/", AdminDashboardAPIView.as_view(), name="admin-dashboard"),
    # Landlord management
    path("landlords/", LandlordListAPIView.as_view(), name="landlord-list"),
    path("landlords/create/", LandlordCreateAPIView.as_view(), name="landlord-create"),
    path(
        "landlords/<uuid:id>/", LandlordDetailAPIView.as_view(), name="landlord-detail"
    ),
    path(
        "landlords/<uuid:id>/update/",
        LandlordUpdateAPIView.as_view(),
        name="landlord-update",
    ),
    path(
        "landlords/<uuid:pk>/toggle-status/",
        ActivateDeactivateLandlordAPIView.as_view(),
        name="landlord-toggle-status",
    ),
    # Property endpoints
    path("properties/", PropertyListAPIView.as_view(), name="admin-property-list"),
    path(
        "properties/<uuid:id>/",
        PropertyDetailAPIView.as_view(),
        name="admin-property-detail",
    ),
    path(
        "properties/create/",
        PropertyCreateAPIView.as_view(),
        name="admin-property-create",
    ),
    path(
        "properties/<uuid:id>/update/",
        PropertyUpdateAPIView.as_view(),
        name="admin-property-update",
    ),
    path(
        "properties/<uuid:id>/delete/",
        PropertyDeleteAPIView.as_view(),
        name="admin-property-delete",
    ),
    path(
        "properties/<uuid:pk>/statistics/",
        PropertyStatisticsAPIView.as_view(),
        name="admin-property-statistics",
    ),
]
