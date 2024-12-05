from django.urls import path, include
from . import views
from rest_framework.routers import DefaultRouter
from rest_framework_nested.routers import NestedDefaultRouter

# Create a router for properties
property_router = DefaultRouter()
property_router.register(r"properties", views.PropertyViewSet)

# Create a nested router for units within properties
property_unit_router = NestedDefaultRouter(
    property_router, r"properties", lookup="property"
)
property_unit_router.register(r"units", views.UnitViewSet, basename="property-units")

# Create a router for standalone units
unit_router = DefaultRouter()
unit_router.register(r"units", views.UnitViewSet)

router = DefaultRouter()
router.register(r"tenants", views.TenantViewSet, basename="tenant")
router.register(r"leases", views.LeaseViewSet, basename="lease")

urlpatterns = [
    # Authentication and user-related endpoints
    path("health/", views.HealthCheckApiview.as_view(), name="health-check"),
    path("register/", views.UserRegistrationView.as_view(), name="user_register"),
    path("login/", views.UserLoginView.as_view(), name="user_login"),
    path("profile/", views.UserProfileView.as_view(), name="user_profile"),
    # Property-related routes
    path("", include(property_router.urls)),
    path("", include(property_unit_router.urls)),
    # Standalone unit routes
    path("", include(unit_router.urls)),
    path("", include(router.urls)),
]
