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
]
