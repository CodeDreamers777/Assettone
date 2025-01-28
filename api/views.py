from requests import request
from rest_framework import status, viewsets
from django_filters import rest_framework as filters
from decimal import Decimal

from rest_framework import serializers
import re
import threading
from django.db import transaction
from django.utils import timezone
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from django.contrib.auth import authenticate
from django.contrib.auth.models import User

from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework.permissions import IsAuthenticated
from django.db.models import Sum, Count, F, Q
from django.db.models.functions import TruncMonth
from rest_framework.decorators import (
    api_view,
    permission_classes,
    authentication_classes,
)


from .models import (
    Profile,
    Property,
    Unit,
    UserType,
    Tenant,
    TenantStatus,
    Lease,
    LeaseStatus,
    RentPayment,
    MaintenanceStatus,
    MaintenanceRequest,
    CommunicationHistory,
    CommunicationType,
    RentPeriodStatus,
    PaymentPeriod,
)
from .serializers import (
    UserRegistrationSerializer,
    UserProfileUpdateSerializer,
    PropertySerializer,
    PropertyDetailSerializer,
    UnitSerializer,
    LeaseSerializer,
    LeaseCreateSerializer,
    LeaseTransferSerializer,
    TenantSerializer,
    MaintenanceRequestSerializer,
    MaintenanceRequestCreateSerializer,
    ChangePasswordSerializer,
    CommunicationHistorySerializer,
    StaffAccountSerializer,
    StaffProfileSerializer,
    RentPaymentSerializer,
)
from rest_framework.decorators import action
from .utils.decorator import jwt_required
from django.utils.decorators import method_decorator
import os
from .utils.send_mail import EmailService
from datetime import datetime, timedelta
from django.shortcuts import get_object_or_404


class HealthCheckApiview(APIView):
    def get(self, request):
        message = "If you can see this the server is running on v1.0.0"
        return Response({"success": True, "message": message})


class UserRegistrationView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        """
        Handle user registration
        """
        serializer = UserRegistrationSerializer(data=request.data)

        if serializer.is_valid():
            try:
                # Create the user
                user = serializer.save()

                # Generate tokens
                refresh = RefreshToken.for_user(user)

                return Response(
                    {
                        "success": True,
                        "message": "User registered successfully",
                        "user_id": str(user.id),
                        "username": user.username,
                        "tokens": {
                            "refresh": str(refresh),
                            "access": str(refresh.access_token),
                        },
                    },
                    status=status.HTTP_201_CREATED,
                )

            except Exception as e:
                return Response(
                    {"success": False, "message": str(e)},
                    status=status.HTTP_400_BAD_REQUEST,
                )

        return Response(
            {"success": False, "message": serializer.errors},
            status=status.HTTP_400_BAD_REQUEST,
        )


class UserLoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        """
        Handle user login with comprehensive error handling
        """
        username = request.data.get("username")
        password = request.data.get("password")

        # Validate input
        if not username or not password:
            return Response(
                {
                    "success": False,
                    "message": "Both username and password are required",
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            # Check if user exists
            try:
                user = User.objects.get(username=username)
            except User.DoesNotExist:
                return Response(
                    {
                        "success": False,
                        "message": "User does not exist",
                    },
                    status=status.HTTP_404_NOT_FOUND,
                )

            # Authenticate user
            authenticated_user = authenticate(username=username, password=password)

            if authenticated_user is None:
                return Response(
                    {
                        "success": False,
                        "message": "Invalid password",
                    },
                    status=status.HTTP_401_UNAUTHORIZED,
                )

            # Retrieve or create profile
            try:
                profile = Profile.objects.get(user=authenticated_user)
            except Profile.DoesNotExist:
                return Response(
                    {
                        "success": False,
                        "message": "Profile not found for the user",
                    },
                    status=status.HTTP_404_NOT_FOUND,
                )

            # Update last session timestamp
            profile.last_session = timezone.now()
            profile.save()

            # Generate tokens
            refresh = RefreshToken.for_user(authenticated_user)

            return Response(
                {
                    "success": True,
                    "message": "Login successful",
                    "user_id": str(authenticated_user.id),
                    "last_session": profile.last_session.isoformat()
                    if profile.last_session
                    else None,
                    "profile": {
                        "user_id": str(profile.user.id),
                        "username": profile.user.username,
                        "email": profile.user.email,
                        "phone_number": profile.phone_number,
                        "user_type": profile.user_type,
                        "identification_type": profile.identification_type,
                        "identification_number": profile.identification_number,
                        "permissions": {
                            "can_manage_properties": profile.can_manage_properties,
                            "can_add_units": profile.can_add_units,
                            "can_edit_units": profile.can_edit_units,
                            "can_delete_units": profile.can_delete_units,
                            "can_view_financial_data": profile.can_view_financial_data,
                        },
                    },
                    "username": authenticated_user.username,
                    "tokens": {
                        "refresh": str(refresh),
                        "access": str(refresh.access_token),
                    },
                },
                status=status.HTTP_200_OK,
            )

        except Exception as e:
            # Catch any unexpected errors
            return Response(
                {
                    "success": False,
                    "message": "An unexpected error occurred",
                    "error": str(e),
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )


class UserProfileView(APIView):
    permission_classes = [IsAuthenticated]
    authentication_classes = [JWTAuthentication]

    def get(self, request):
        """
        Get current user's profile
        """
        try:
            profile = Profile.objects.get(user=request.user)
            return Response(
                {
                    "success": True,
                    "message": "Profile retrieved successfully",
                    "profile": {
                        "user_id": str(profile.user.id),
                        "username": profile.user.username,
                        "email": profile.user.email,
                        "phone_number": profile.phone_number,
                        "user_type": profile.user_type,
                        "identification_type": profile.identification_type,
                        "identification_number": profile.identification_number,
                        "permissions": {
                            "can_manage_properties": profile.can_manage_properties,
                            "can_add_units": profile.can_add_units,
                            "can_edit_units": profile.can_edit_units,
                            "can_delete_units": profile.can_delete_units,
                            "can_view_financial_data": profile.can_view_financial_data,
                        },
                    },
                }
            )
        except Profile.DoesNotExist:
            return Response(
                {"success": False, "message": "Profile not found"},
                status=status.HTTP_404_NOT_FOUND,
            )

    def patch(self, request):
        """
        Update user profile and user information
        """
        try:
            profile = Profile.objects.get(user=request.user)
            serializer = UserProfileUpdateSerializer(
                profile, data=request.data, partial=True
            )

            if serializer.is_valid():
                try:
                    serializer.save()
                    return Response(
                        {
                            "success": True,
                            "message": "Profile and user information updated successfully",
                            "updated_fields": list(request.data.keys()),
                        },
                        status=status.HTTP_200_OK,
                    )
                except serializers.ValidationError as e:
                    return Response(
                        {"success": False, "message": e.detail},
                        status=status.HTTP_400_BAD_REQUEST,
                    )

            return Response(
                {"success": False, "message": serializer.errors},
                status=status.HTTP_400_BAD_REQUEST,
            )

        except Profile.DoesNotExist:
            return Response(
                {"success": False, "message": "Profile not found"},
                status=status.HTTP_404_NOT_FOUND,
            )


class ChangePasswordView(APIView):
    permission_classes = [IsAuthenticated]
    authentication_classes = [JWTAuthentication]

    def post(self, request):
        """
        Change user password
        """
        serializer = ChangePasswordSerializer(
            data=request.data, context={"user": request.user}
        )

        if serializer.is_valid():
            user = request.user

            # Check if old password is correct
            if not user.check_password(serializer.validated_data["old_password"]):
                return Response(
                    {"success": False, "message": "Current password is incorrect"},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            # Set new password
            user.set_password(serializer.validated_data["new_password"])
            user.save()

            # Optional: Invalidate all existing JWT tokens
            # If you're using SimpleJWT, you can update the user's last_login
            # which is often used as part of the token validation
            user.last_login = timezone.now()
            user.save(update_fields=["last_login"])

            return Response(
                {"success": True, "message": "Password updated successfully"},
                status=status.HTTP_200_OK,
            )

        return Response(
            {"success": False, "message": serializer.errors},
            status=status.HTTP_400_BAD_REQUEST,
        )


class PropertyViewSet(viewsets.ModelViewSet):
    """Viewset for Property model with comprehensive CRUD operations"""

    queryset = Property.objects.all()
    permission_classes = [IsAuthenticated]
    authentication_classes = [JWTAuthentication]

    def get_queryset(self):
        """Custom queryset method to return properties based on user role"""
        user = self.request.user
        try:
            profile = user.profile
        except Profile.DoesNotExist:
            return Property.objects.none()

        if user.is_superuser or profile.user_type == UserType.ADMIN:
            return Property.objects.all()
        if profile.user_type == UserType.ADMIN:
            return Property.objects.filter(owner=profile)
        if profile.user_type == UserType.MANAGER:
            return Property.objects.filter(manager=profile)
        return Property.objects.none()

    def get_serializer_class(self):
        """Return different serializers based on the action"""
        if self.action == "retrieve":
            return PropertyDetailSerializer
        return PropertySerializer

    def list(self, request, *args, **kwargs):
        """Custom list method to return all properties with success message"""
        queryset = self.filter_queryset(self.get_queryset())
        serializer = self.get_serializer(queryset, many=True)
        return Response(
            {
                "success": True,
                "message": "Properties retrieved successfully",
                "properties": serializer.data,
            }
        )

    def create(self, request, *args, **kwargs):
        """
        Custom create method to set owner and validate data
        """
        serializer = self.get_serializer(
            data=request.data, context={"request": request}
        )
        serializer.is_valid(raise_exception=True)

        with transaction.atomic():
            property_instance = serializer.save()

        return Response(
            {
                "success": True,
                "message": "Property created successfully",
                "property_id": str(property_instance.id),
                "property_details": serializer.data,
            },
            status=status.HTTP_201_CREATED,
        )

    def update(self, request, *args, **kwargs):
        """
        Custom update method with structured response
        """
        try:
            partial = kwargs.pop("partial", False)
            instance = self.get_object()
            serializer = self.get_serializer(
                instance, data=request.data, partial=partial
            )
            serializer.is_valid(raise_exception=True)

            with transaction.atomic():
                updated_property = serializer.save()

            return Response(
                {
                    "success": True,
                    "message": "Property updated successfully",
                    "property_id": str(updated_property.id),
                    "property_details": serializer.data,
                },
                status=status.HTTP_200_OK,
            )
        except Exception as e:
            return Response(
                {
                    "success": False,
                    "message": "Property update failed",
                    "errors": str(e),
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

    @action(detail=True, methods=["GET"])
    def units(self, request, pk=None):
        """
        Retrieve all units for a specific property
        """
        try:
            property_instance = self.get_object()
            units = property_instance.units.all()
            serializer = UnitSerializer(units, many=True)

            return Response(
                {
                    "success": True,
                    "message": f"Units retrieved for property {property_instance.name}",
                    "total_units": units.count(),
                    "units": serializer.data,
                },
                status=status.HTTP_200_OK,
            )
        except Exception as e:
            return Response(
                {
                    "success": False,
                    "message": "Failed to retrieve property units",
                    "errors": str(e),
                },
                status=status.HTTP_404_NOT_FOUND,
            )


class UnitViewSet(viewsets.ModelViewSet):
    """
    Viewset for Unit model with comprehensive CRUD operations
    """

    queryset = Unit.objects.all()
    serializer_class = UnitSerializer
    permission_classes = [IsAuthenticated]
    authentication_classes = [JWTAuthentication]

    def get_serializer_context(self):
        """
        Add property_id to serializer context for validation
        """
        context = super().get_serializer_context()
        context["property_id"] = self.kwargs.get("property_pk")
        return context

    def create(self, request, *args, **kwargs):
        """
        Custom create method with structured response
        """
        try:
            serializer = self.get_serializer(data=request.data)
            serializer.is_valid(raise_exception=True)

            with transaction.atomic():
                unit_instance = serializer.save()

                # Update property's total units count
                property_instance = unit_instance.property
                property_instance.total_units = property_instance.units.count()
                property_instance.save()

            return Response(
                {
                    "success": True,
                    "message": "Unit created successfully",
                    "unit_id": str(unit_instance.id),
                    "unit_details": serializer.data,
                },
                status=status.HTTP_201_CREATED,
            )
        except Exception as e:
            return Response(
                {"success": False, "message": "Unit creation failed", "errors": str(e)},
                status=status.HTTP_400_BAD_REQUEST,
            )

    def update(self, request, *args, **kwargs):
        """
        Custom update method with structured response
        """
        try:
            partial = kwargs.pop("partial", False)
            instance = self.get_object()
            serializer = self.get_serializer(
                instance, data=request.data, partial=partial
            )
            serializer.is_valid(raise_exception=True)

            with transaction.atomic():
                updated_unit = serializer.save()

            return Response(
                {
                    "success": True,
                    "message": "Unit updated successfully",
                    "unit_id": str(updated_unit.id),
                    "unit_details": serializer.data,
                },
                status=status.HTTP_200_OK,
            )
        except Exception as e:
            return Response(
                {"success": False, "message": "Unit update failed", "errors": str(e)},
                status=status.HTTP_400_BAD_REQUEST,
            )

    def destroy(self, request, *args, **kwargs):
        """
        Custom delete method with structured response
        """
        try:
            instance = self.get_object()
            property_instance = instance.property

            with transaction.atomic():
                # Delete the unit
                instance.delete()

                # Update property's total units count
                property_instance.total_units = property_instance.units.count()
                property_instance.save()

            return Response(
                {
                    "success": True,
                    "message": "Unit deleted successfully",
                    "unit_id": str(instance.id),
                },
                status=status.HTTP_200_OK,
            )
        except Exception as e:
            return Response(
                {"success": False, "message": "Unit deletion failed", "errors": str(e)},
                status=status.HTTP_400_BAD_REQUEST,
            )

    @action(detail=True, methods=["GET"])
    def details(self, request, pk=None):
        """
        Retrieve detailed information for a specific unit
        """
        try:
            unit = self.get_object()
            serializer = self.get_serializer(unit)

            return Response(
                {
                    "success": True,
                    "message": f"Details retrieved for Unit {unit.unit_number}",
                    "unit_details": serializer.data,
                },
                status=status.HTTP_200_OK,
            )
        except Exception as e:
            return Response(
                {
                    "success": False,
                    "message": "Failed to retrieve unit details",
                    "errors": str(e),
                },
                status=status.HTTP_404_NOT_FOUND,
            )

    @action(detail=False, methods=["GET"])
    def available_units(self, request):
        """
        Retrieve all available (unoccupied) units
        """
        try:
            available_units = Unit.objects.filter(is_occupied=False)
            serializer = self.get_serializer(available_units, many=True)

            return Response(
                {
                    "success": True,
                    "message": "Available units retrieved successfully",
                    "total_available_units": available_units.count(),
                    "available_units": serializer.data,
                },
                status=status.HTTP_200_OK,
            )
        except Exception as e:
            return Response(
                {
                    "success": False,
                    "message": "Failed to retrieve available units",
                    "errors": str(e),
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

    @action(detail=False, methods=["GET"])
    def by_type(self, request):
        """
        Retrieve units filtered by unit type
        """
        unit_type = request.query_params.get("type")

        try:
            if not unit_type:
                return Response(
                    {"success": False, "message": "Unit type parameter is required"},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            # Handle custom type separately
            if unit_type.upper() == "CUSTOM":
                units = Unit.objects.filter(unit_type="CUSTOM")
            else:
                units = Unit.objects.filter(unit_type=unit_type.upper())

            serializer = self.get_serializer(units, many=True)

            return Response(
                {
                    "success": True,
                    "message": f"Units of type {unit_type} retrieved successfully",
                    "total_units": units.count(),
                    "units": serializer.data,
                },
                status=status.HTTP_200_OK,
            )
        except Exception as e:
            return Response(
                {
                    "success": False,
                    "message": f"Failed to retrieve units of type {unit_type}",
                    "errors": str(e),
                },
                status=status.HTTP_400_BAD_REQUEST,
            )


class TenantViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing tenants
    Supports CRUD operations and additional actions
    Ensures users only see tenants from properties they own or manage
    """

    queryset = Tenant.objects.all()
    serializer_class = TenantSerializer
    permission_classes = [IsAuthenticated]
    authentication_classes = [JWTAuthentication]

    def get_queryset(self):
        """
        Filter tenants to only those in properties owned or managed by the user
        """
        # Get the current user's profile
        user_profile = Profile.objects.get(user=self.request.user)

        # Find properties owned or managed by the user
        if user_profile.user_type in [UserType.ADMIN, UserType.MANAGER]:
            if user_profile.user_type == UserType.ADMIN:
                # For admins, get properties they own
                owned_properties = Property.objects.filter(owner=user_profile)
            else:
                # For managers, get properties they manage
                owned_properties = Property.objects.filter(manager=user_profile)

            # Get units in these properties
            property_units = Unit.objects.filter(property__in=owned_properties)

            # Get leases for these units
            property_leases = Lease.objects.filter(unit__in=property_units)

            # Filter tenants to those with leases in these units
            queryset = Tenant.objects.filter(leases__in=property_leases).distinct()
        else:
            # For other user types, return an empty queryset
            queryset = Tenant.objects.none()

        # Apply additional filtering if status or search is provided
        status = self.request.query_params.get("status")
        search = self.request.query_params.get("search")

        if status:
            queryset = queryset.filter(status=status)

        if search:
            queryset = queryset.filter(
                Q(first_name__icontains=search)
                | Q(last_name__icontains=search)
                | Q(email__icontains=search)
                | Q(phone_number__icontains=search)
            )

        return queryset

    def list(self, request, *args, **kwargs):
        """
        Override list method to group tenants by property
        """
        # Get the base queryset
        queryset = self.get_queryset()

        # Group tenants by property
        tenants_by_property = {}

        for tenant in queryset:
            # Get the properties for this tenant through their leases and units
            tenant_properties = Property.objects.filter(
                units__leases__tenant=tenant
            ).distinct()

            # For each property, add the tenant to the group
            for property_obj in tenant_properties:
                if property_obj not in tenants_by_property:
                    tenants_by_property[property_obj] = []

                # Serialize the tenant
                serializer = self.get_serializer(tenant)
                tenants_by_property[property_obj].append(serializer.data)

        # Convert property objects to dictionary keys
        result = {
            prop.name: tenants  # Using property name as key
            for prop, tenants in tenants_by_property.items()
        }

        return Response(result)

    @action(detail=True, methods=["patch"])
    def update_status(self, request, pk=None):
        """
        Custom action to update tenant status
        Ensures the user has permission to modify this tenant
        """
        tenant = self.get_object()

        # Verify user has permission to modify this tenant
        user_profile = Profile.objects.get(user=request.user)

        # Get the properties the user owns or manages
        if user_profile.user_type in [UserType.ADMIN, UserType.MANAGER]:
            # Get leases for this tenant
            tenant_leases = tenant.leases.all()

            # Check if any of the tenant's leases are in properties owned or managed by the user
            if user_profile.user_type == UserType.ADMIN:
                valid_leases = tenant_leases.filter(unit__property__owner=user_profile)
            else:
                valid_leases = tenant_leases.filter(
                    unit__property__manager=user_profile
                )

            # If no valid leases found, deny permission
            if not valid_leases.exists():
                return Response(
                    {"error": "You do not have permission to modify this tenant"},
                    status=status.HTTP_403_FORBIDDEN,
                )
        else:
            return Response(
                {"error": "You do not have permission to modify tenants"},
                status=status.HTTP_403_FORBIDDEN,
            )

        # Process status update
        new_status = request.data.get("status")

        if new_status in dict(TenantStatus.choices):
            tenant.status = new_status
            tenant.save()
            return Response(
                {"status": "Tenant status updated", "new_status": new_status}
            )

        return Response({"error": "Invalid status"}, status=status.HTTP_400_BAD_REQUEST)

    def destroy(self, request, *args, **kwargs):
        tenant = self.get_object()

        # Get tenant's user account if it exists (using exact username format from serializer)
        username = f"tenant_{tenant.id}"[
            :30
        ]  # Match the username format used in create
        try:
            user = User.objects.get(username=username)
            # Delete user profile and user
            Profile.objects.filter(user=user).delete()
            user.delete()
        except User.DoesNotExist:
            pass

        # Mark units as unoccupied
        tenant_leases = tenant.leases.all()
        for lease in tenant_leases:
            unit = lease.unit
            unit.is_occupied = False
            unit.save()

        # Delete tenant
        tenant.delete()

        return Response(status=status.HTTP_204_NO_CONTENT)


class LeaseViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing leases
    Supports CRUD operations and additional custom actions
    Ensures users only see leases from properties they own or manage
    """

    permission_classes = [IsAuthenticated]
    authentication_classes = [JWTAuthentication]

    def get_serializer_class(self):
        """
        Use different serializers for different actions
        """
        if self.action == "create" or self.action == "update":
            return LeaseCreateSerializer
        return LeaseSerializer

    def get_queryset(self):
        """
        Filter leases to only those in properties owned or managed by the user
        """
        # Get the current user's profile
        user_profile = Profile.objects.get(user=self.request.user)

        # Find properties owned or managed by the user
        if user_profile.user_type in [UserType.ADMIN, UserType.MANAGER]:
            if user_profile.user_type == UserType.ADMIN:
                # For admins, get properties they own
                owned_properties = Property.objects.filter(owner=user_profile)
            else:
                # For managers, get properties they manage
                owned_properties = Property.objects.filter(manager=user_profile)

            # Get units in these properties
            property_units = Unit.objects.filter(property__in=owned_properties)

            # Filter leases to those for units in owned/managed properties
            queryset = Lease.objects.filter(unit__in=property_units)
        else:
            # For other user types, return an empty queryset
            queryset = Lease.objects.none()

        # Apply additional filtering if provided
        status = self.request.query_params.get("status")
        unit_id = self.request.query_params.get("unit")
        tenant_id = self.request.query_params.get("tenant")

        if status:
            queryset = queryset.filter(status=status)
        if unit_id:
            queryset = queryset.filter(unit_id=unit_id)
        if tenant_id:
            queryset = queryset.filter(tenant_id=tenant_id)

        return queryset

    def list(self, request, *args, **kwargs):
        """
        Override list method to group leases by property
        """
        # Get the base queryset
        queryset = self.get_queryset()

        # Group leases by property
        leases_by_property = {}

        for lease in queryset:
            # Get the property for this lease through its unit
            property_obj = lease.unit.property

            # Add the lease to the appropriate property group
            if property_obj not in leases_by_property:
                leases_by_property[property_obj] = []

            # Serialize the lease
            serializer = self.get_serializer(lease)
            leases_by_property[property_obj].append(serializer.data)

        # Convert property objects to dictionary keys
        result = {
            prop.name: leases  # Using property name as key
            for prop, leases in leases_by_property.items()
        }

        return Response(result)

    @action(detail=False, methods=["GET"])
    def active_leases(self, request):
        """
        Retrieve all active leases for properties owned or managed by the user
        """
        # Get the current user's profile
        user_profile = Profile.objects.get(user=request.user)

        # Find properties owned or managed by the user
        if user_profile.user_type in [UserType.ADMIN, UserType.MANAGER]:
            if user_profile.user_type == UserType.ADMIN:
                # For admins, get properties they own
                owned_properties = Property.objects.filter(owner=user_profile)
            else:
                # For managers, get properties they manage
                owned_properties = Property.objects.filter(manager=user_profile)

            # Get units in these properties
            property_units = Unit.objects.filter(property__in=owned_properties)

            # Filter active leases to those for units in owned/managed properties
            active_leases = Lease.objects.filter(
                unit__in=property_units, status=LeaseStatus.ACTIVE
            )

            serializer = self.get_serializer(active_leases, many=True)
            return Response(serializer.data)
        else:
            # For other user types, return an empty list
            return Response([])

    @action(detail=True, methods=["POST"])
    def terminate_lease(self, request, pk=None):
        """
        Terminate an active lease
        Ensures the user has permission to modify this lease and automatically updates related statuses
        """
        lease = self.get_object()
        # Verify user has permission to modify this lease
        user_profile = Profile.objects.get(user=request.user)

        # Check if the user owns or manages the property of this lease
        if user_profile.user_type in [UserType.ADMIN, UserType.MANAGER]:
            # Validate ownership/management based on user type
            if user_profile.user_type == UserType.ADMIN:
                if lease.unit.property.owner != user_profile:
                    return Response(
                        {"error": "You do not have permission to terminate this lease"},
                        status=status.HTTP_403_FORBIDDEN,
                    )
            else:
                if lease.unit.property.manager != user_profile:
                    return Response(
                        {"error": "You do not have permission to terminate this lease"},
                        status=status.HTTP_403_FORBIDDEN,
                    )
        else:
            return Response(
                {"error": "You do not have permission to terminate leases"},
                status=status.HTTP_403_FORBIDDEN,
            )

        # Check lease status
        if lease.status != LeaseStatus.ACTIVE:
            return Response(
                {"error": "Only active leases can be terminated"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Update lease status
        lease.status = LeaseStatus.TERMINATED
        lease.end_date = timezone.now().date()
        lease.save()  # This will trigger the automatic status updates

        return Response(
            {
                "status": "Lease terminated successfully",
                "lease_id": lease.id,
                "unit_status": "Unoccupied",
                "tenant_status": lease.tenant.status,
            }
        )

    @action(detail=True, methods=["POST"])
    def transfer_lease(self, request, pk=None):
        """
        Transfer a lease to a new tenant while maintaining lease history
        """
        print(f"Looking for lease: {pk}")
        print(f"Lease exists: {Lease.objects.filter(id=pk).exists()}")
        try:
            current_lease = self.get_object()

            # Permission checks
            user_profile = Profile.objects.get(user=request.user)
            if user_profile.user_type in [UserType.ADMIN, UserType.MANAGER]:
                if user_profile.user_type == UserType.ADMIN:
                    if current_lease.unit.property.owner != user_profile:
                        return Response(
                            {
                                "error": "You do not have permission to transfer this lease"
                            },
                            status=status.HTTP_403_FORBIDDEN,
                        )
                else:
                    if current_lease.unit.property.manager != user_profile:
                        return Response(
                            {
                                "error": "You do not have permission to transfer this lease"
                            },
                            status=status.HTTP_403_FORBIDDEN,
                        )
            else:
                return Response(
                    {"error": "You do not have permission to transfer leases"},
                    status=status.HTTP_403_FORBIDDEN,
                )

            # Validate current lease status
            if current_lease.status != LeaseStatus.ACTIVE:
                return Response(
                    {"error": "Only active leases can be transferred"},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            serializer = LeaseTransferSerializer(
                data=request.data,
                context={"current_lease": current_lease, "request": request},
            )

            if serializer.is_valid():
                try:
                    with transaction.atomic():
                        # Get old and new tenants
                        old_tenant = current_lease.tenant
                        new_tenant = serializer.validated_data["tenant"]
                        notes = serializer.validated_data.get("notes", "")

                        print(f"Old tenant ID: {old_tenant.id}")
                        print(f"New tenant ID: {new_tenant.id}")
                        print(f"Current lease ID: {current_lease.id}")
                        print(f"Notes: {notes}")

                        # First, update current lease status
                        # This needs to happen before creating the new lease
                        current_lease.status = LeaseStatus.TERMINATED
                        current_lease.end_date = timezone.now().date()
                        current_lease.save()
                        print("Current lease updated successfully")

                        # Force refresh from database to ensure status is updated
                        current_lease.refresh_from_db()

                        # Create new lease
                        try:
                            new_lease = Lease.objects.create(
                                tenant=new_tenant,
                                unit=current_lease.unit,
                                start_date=timezone.now().date(),
                                end_date=current_lease.end_date,
                                monthly_rent=current_lease.monthly_rent,
                                security_deposit=current_lease.security_deposit,
                                payment_period=current_lease.payment_period,
                                status=LeaseStatus.ACTIVE,
                                previous_lease=current_lease,
                                notes=notes,
                            )
                            print(f"New lease created successfully: {new_lease.id}")
                        except Exception as e:
                            print(f"Error creating new lease: {str(e)}")
                            raise

                        # Update tenant statuses
                        old_tenant_active_leases = (
                            Lease.objects.filter(
                                tenant=old_tenant, status=LeaseStatus.ACTIVE
                            )
                            .exclude(pk=current_lease.pk)
                            .exists()
                        )

                        if not old_tenant_active_leases:
                            old_tenant.status = TenantStatus.INACTIVE
                            old_tenant.save()
                            print(
                                f"Old tenant {old_tenant.id} status updated to INACTIVE"
                            )

                        new_tenant.status = TenantStatus.ACTIVE
                        new_tenant.save()
                        print(f"New tenant {new_tenant.id} status updated to ACTIVE")

                        return Response(
                            {
                                "status": "Lease transferred successfully",
                                "previous_lease_id": current_lease.id,
                                "new_lease_id": new_lease.id,
                                "new_tenant_id": new_tenant.id,
                                "old_tenant_id": old_tenant.id,
                                "transfer_date": timezone.now().date().isoformat(),
                                "lease_end_date": new_lease.end_date.isoformat(),
                            },
                            status=status.HTTP_201_CREATED,
                        )

                except Exception as e:
                    print(f"Transaction failed: {str(e)}")
                    return Response(
                        {"error": f"Failed to transfer lease: {str(e)}"},
                        status=status.HTTP_400_BAD_REQUEST,
                    )

            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        except Lease.DoesNotExist:
            return Response(
                {"error": "Lease not found"}, status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            print(f"Unexpected error: {str(e)}")
            return Response(
                {"error": f"An error occurred: {str(e)}"},
                status=status.HTTP_400_BAD_REQUEST,
            )


class BookDemoView(APIView):
    """
    API endpoint to book a demo.
    """

    def post(self, request):
        # Extract data from the request
        name = request.data.get("name")
        email = request.data.get("email")
        message = request.data.get("message")

        # Validate the input
        if not name or not email or not message:
            return Response(
                {"error": "Name, email, and message are required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Prepare context for the email template
        context = {
            "name": name,
            "email": email,
            "message": message,
        }

        # Sales email (could also come from settings)
        sales_email = os.getenv("SALES_EMAIL", "crispusgikonyo@gmail.com")

        # Use the EmailService to send the email
        email_service = EmailService()
        try:
            email_service.send_email(
                recipient_email=sales_email,
                recipient_name="Sales Team",
                subject="New Demo Booking Request",
                template_name="emails/bookdemo.html",
                context=context,
            )
            return Response(
                {"message": "Demo booking request sent successfully."},
                status=status.HTTP_200_OK,
            )
        except ValueError as e:
            return Response(
                {"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class ContactUsView(APIView):
    """
    API endpoint to handle contact form submissions.
    """

    def post(self, request):
        # Extract data from the request
        name = request.data.get("name")
        email = request.data.get("email")
        message = request.data.get("message")

        # Validate the input
        if not name or not email or not message:
            return Response(
                {"error": "Name, email, and message are required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Basic email validation
        if not re.match(r"[^@]+@[^@]+\.[^@]+", email):
            return Response(
                {"error": "Please provide a valid email address."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Prepare context for the email template
        context = {
            "name": name,
            "email": email,
            "message": message,
        }

        # Get contact email from environment variables
        contact_email = os.getenv("CONTACT_EMAIL", "crispusgikonyo@gmail.com")

        # Use the EmailService to send the email
        email_service = EmailService()
        try:
            email_service.send_email(
                recipient_email=contact_email,
                recipient_name="Support Team",
                subject="New Contact Form Submission",
                template_name="emails/contact.html",
                context=context,
            )

            # Send confirmation email to the user
            email_service.send_email(
                recipient_email=email,
                recipient_name=name,
                subject="We've Received Your Message",
                template_name="emails/contact_confirmation.html",
                context=context,
            )

            return Response(
                {"message": "Your message has been sent successfully."},
                status=status.HTTP_200_OK,
            )
        except ValueError as e:
            return Response(
                {"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class RentalNoticeViewSet(viewsets.ViewSet):
    permission_classes = [IsAuthenticated]
    authentication_classes = [JWTAuthentication]

    @action(detail=True, methods=["post"])
    def send_notice(self, request, pk=None):
        try:
            unit = get_object_or_404(Unit, id=pk)
            active_lease = (
                Lease.objects.filter(unit=unit, status="ACTIVE")
                .select_related("tenant")
                .first()
            )

            if not active_lease:
                return Response(
                    {"message": "No active lease for this unit"},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            current_date = timezone.now().date()
            period_start = datetime(current_date.year, current_date.month, 1).date()
            period_end = period_start.replace(
                month=period_start.month + 1 if period_start.month < 12 else 1,
                year=period_start.year
                if period_start.month < 12
                else period_start.year + 1,
            ) - timezone.timedelta(days=1)

            total_paid = (
                RentPayment.objects.filter(
                    lease=active_lease,
                    payment_date__gte=period_start,
                    payment_date__lte=period_end,
                ).aggregate(total=Sum("amount"))["total"]
                or 0
            )

            if total_paid < active_lease.monthly_rent and current_date >= period_start:
                days_overdue = (current_date - period_start).days
                remaining_balance = active_lease.monthly_rent - total_paid

                context = {
                    "tenant_name": f"{active_lease.tenant.first_name} {active_lease.tenant.last_name}",
                    "unit_number": unit.unit_number,
                    "property_name": unit.property.name,
                    "days_overdue": days_overdue,
                    "amount_due": remaining_balance,
                    "due_date": period_start.strftime("%B %d, %Y"),
                    "payment_period": active_lease.payment_period.lower(),
                }

                email_service = EmailService()
                email_service.send_email(
                    recipient_email=active_lease.tenant.email,
                    recipient_name=f"{active_lease.tenant.first_name} {active_lease.tenant.last_name}",
                    subject="Important: Rent Payment Reminder",
                    template_name="emails/rental_notice.html",
                    context=context,
                )

                return Response(
                    {"message": "Rental notice sent successfully"},
                    status=status.HTTP_200_OK,
                )

            return Response(
                {"message": "No overdue rent for this unit"}, status=status.HTTP_200_OK
            )

        except Exception as e:
            return Response(
                {"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class MaintenanceRequestViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    authentication_classes = [JWTAuthentication]

    def get_serializer_class(self):
        if self.action == "create":
            return MaintenanceRequestCreateSerializer
        return MaintenanceRequestSerializer

    def get_queryset(self):
        user_profile = self.request.user.profile

        # If user is tenant, show only their requests
        if user_profile.user_type == UserType.TENANT:
            return MaintenanceRequest.objects.filter(
                tenant__email=self.request.user.email
            )

        # If user is admin/manager, show requests for their properties
        elif user_profile.user_type in [UserType.ADMIN, UserType.MANAGER]:
            return MaintenanceRequest.objects.filter(
                property__in=user_profile.managed_properties.all()
                | user_profile.owned_properties.all()
            )

        # For other staff (clerks), show all requests
        return MaintenanceRequest.objects.all()

    def perform_create(self, serializer):
        try:
            # Get the tenant using the user's email
            tenant = Tenant.objects.get(email=self.request.user.email)

            # Get the tenant's current active lease
            active_lease = Lease.objects.filter(
                tenant=tenant, status=LeaseStatus.ACTIVE
            ).first()

            if not active_lease:
                raise serializers.ValidationError(
                    {
                        "detail": "You must have an active lease to submit maintenance requests"
                    }
                )

            serializer.save(
                tenant=tenant,
                unit=active_lease.unit,
                property=active_lease.unit.property,
            )

        except Tenant.DoesNotExist:
            raise serializers.ValidationError(
                {
                    "detail": "Only tenants can create maintenance requests. No tenant record found for this user."
                }
            )
        except Exception as e:
            raise serializers.ValidationError({"detail": str(e)})

    @action(detail=True, methods=["post"])
    def approve(self, request, pk=None):
        maintenance_request = self.get_object()
        user_profile = request.user.profile

        # Check authorization
        if user_profile.user_type not in [UserType.ADMIN, UserType.MANAGER]:
            return Response(
                {"error": "You don't have permission to approve maintenance requests"},
                status=status.HTTP_403_FORBIDDEN,
            )

        if maintenance_request.status != MaintenanceStatus.PENDING:
            return Response(
                {"error": "Can only approve pending maintenance requests"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        maintenance_request.status = MaintenanceStatus.APPROVED
        maintenance_request.approved_rejected_by = user_profile
        maintenance_request.approved_rejected_date = timezone.now()
        maintenance_request.save()

        return Response(self.get_serializer(maintenance_request).data)

    @action(detail=True, methods=["post"])
    def reject(self, request, pk=None):
        maintenance_request = self.get_object()
        user_profile = request.user.profile

        if user_profile.user_type not in [UserType.ADMIN, UserType.MANAGER]:
            return Response(
                {"error": "You don't have permission to reject maintenance requests"},
                status=status.HTTP_403_FORBIDDEN,
            )

        if maintenance_request.status != MaintenanceStatus.PENDING:
            return Response(
                {"error": "Can only reject pending maintenance requests"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        maintenance_request.status = MaintenanceStatus.REJECTED
        maintenance_request.approved_rejected_by = user_profile
        maintenance_request.approved_rejected_date = timezone.now()
        maintenance_request.save()

        return Response(self.get_serializer(maintenance_request).data)

    @action(detail=True, methods=["post"])
    def complete(self, request, pk=None):
        maintenance_request = self.get_object()
        user_profile = request.user.profile

        if user_profile.user_type not in [UserType.ADMIN, UserType.MANAGER]:
            return Response(
                {"error": "You don't have permission to complete maintenance requests"},
                status=status.HTTP_403_FORBIDDEN,
            )

        if maintenance_request.status != MaintenanceStatus.APPROVED:
            return Response(
                {"error": "Can only complete approved maintenance requests"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Validate repair cost is provided
        repair_cost = request.data.get("repair_cost")
        if not repair_cost:
            return Response(
                {"error": "Repair cost is required to complete maintenance request"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            repair_cost = float(repair_cost)
            if repair_cost < 0:
                raise ValueError("Repair cost cannot be negative")
        except (TypeError, ValueError):
            return Response(
                {"error": "Invalid repair cost value"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        maintenance_request.status = MaintenanceStatus.COMPLETED
        maintenance_request.completed_date = timezone.now()
        maintenance_request.repair_cost = repair_cost
        maintenance_request.save()

        return Response(self.get_serializer(maintenance_request).data)

    @action(detail=False, methods=["get"])
    def by_property(self, request):
        property_id = request.query_params.get("property_id")
        if not property_id:
            return Response(
                {"error": "property_id query parameter is required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        property_instance = get_object_or_404(Property, id=property_id)
        queryset = self.get_queryset().filter(property=property_instance)
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=["get"])
    def by_tenant(self, request):
        tenant_id = request.query_params.get("tenant_id")
        if not tenant_id:
            return Response(
                {"error": "tenant_id query parameter is required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        tenant = get_object_or_404(Tenant, id=tenant_id)
        queryset = self.get_queryset().filter(tenant=tenant)
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=["get"])
    def by_unit(self, request):
        unit_id = request.query_params.get("unit_id")
        if not unit_id:
            return Response(
                {"error": "unit_id query parameter is required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        unit = get_object_or_404(Unit, id=unit_id)
        queryset = self.get_queryset().filter(unit=unit)
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)


def get_date_range():
    today = timezone.now().date()
    start_of_month = today.replace(day=1)
    end_of_month = (start_of_month + timedelta(days=32)).replace(day=1) - timedelta(
        days=1
    )
    return start_of_month, end_of_month


@api_view(["GET"])
@permission_classes([IsAuthenticated])
@authentication_classes([JWTAuthentication])
def dashboard_metrics(request):
    # Get current date range
    start_date, end_date = get_date_range()

    # Get user profile and related properties
    user_profile = request.user.profile

    # Base queryset for properties (filtered by user role)
    if user_profile.user_type == "ADMIN":
        properties = Property.objects.filter(owner=user_profile)
    elif user_profile.user_type == "MANAGER":
        properties = Property.objects.filter(manager=user_profile)
    else:
        properties = Property.objects.none()

    # Property metrics
    property_metrics = {
        "total_properties": properties.count(),
        "total_units": Unit.objects.filter(property__in=properties).count(),
    }

    # Occupancy metrics
    units = Unit.objects.filter(property__in=properties)
    occupancy_metrics = {
        "total_units": units.count(),
        "occupied_units": units.filter(is_occupied=True).count(),
        "vacant_units": units.filter(is_occupied=False).count(),
    }
    if occupancy_metrics["total_units"] > 0:
        occupancy_metrics["occupancy_rate"] = round(
            (occupancy_metrics["occupied_units"] / occupancy_metrics["total_units"])
            * 100,
            2,
        )
    else:
        occupancy_metrics["occupancy_rate"] = 0

    # Financial metrics - Current month
    active_leases = Lease.objects.filter(
        unit__property__in=properties,
        status=LeaseStatus.ACTIVE,
        start_date__lte=end_date,
        end_date__gte=start_date,
    )

    # Expected rent
    expected_rent = active_leases.aggregate(total=Sum("monthly_rent"))["total"] or 0

    # Actual rent collected
    rent_collected = (
        RentPayment.objects.filter(
            lease__in=active_leases, payment_date__range=(start_date, end_date)
        ).aggregate(total=Sum("amount"))["total"]
        or 0
    )

    # Maintenance expenses
    maintenance_expenses = (
        MaintenanceRequest.objects.filter(
            property__in=properties,
            status=MaintenanceStatus.COMPLETED,
            completed_date__range=(start_date, end_date),
        ).aggregate(total=Sum("repair_cost"))["total"]
        or 0
    )

    # Calculate rent collection rate
    rent_collection_rate = (
        round((rent_collected / expected_rent * 100), 2) if expected_rent > 0 else 0
    )

    financial_metrics = {
        "expected_rent": expected_rent,
        "rent_collected": rent_collected,
        "rent_collection_rate": rent_collection_rate,
        "maintenance_expenses": maintenance_expenses,
        "net_income": rent_collected - maintenance_expenses,
    }

    # Maintenance metrics
    maintenance_metrics = {
        "total_requests": MaintenanceRequest.objects.filter(
            property__in=properties
        ).count(),
        "pending_requests": MaintenanceRequest.objects.filter(
            property__in=properties, status=MaintenanceStatus.PENDING
        ).count(),
        "in_progress_requests": MaintenanceRequest.objects.filter(
            property__in=properties, status=MaintenanceStatus.IN_PROGRESS
        ).count(),
    }

    # Monthly trend data (last 6 months)
    six_months_ago = start_date - timedelta(days=180)

    # Get rent payments by month
    monthly_rent = (
        RentPayment.objects.filter(
            lease__unit__property__in=properties, payment_date__gte=six_months_ago
        )
        .annotate(month=TruncMonth("payment_date"))
        .values("month")
        .annotate(rent_collected=Sum("amount"))
        .order_by("month")
    )

    # Get maintenance costs by month
    monthly_maintenance = (
        MaintenanceRequest.objects.filter(
            property__in=properties,
            status=MaintenanceStatus.COMPLETED,
            completed_date__gte=six_months_ago,
        )
        .annotate(month=TruncMonth("completed_date"))
        .values("month")
        .annotate(maintenance_cost=Sum("repair_cost"))
        .order_by("month")
    )

    # Combine the data
    monthly_data = {}

    for item in monthly_rent:
        month_str = item["month"].strftime("%Y-%m")
        if month_str not in monthly_data:
            monthly_data[month_str] = {
                "month": item["month"].strftime("%B %Y"),
                "rent_collected": 0,
                "maintenance_cost": 0,
            }
        monthly_data[month_str]["rent_collected"] = item["rent_collected"] or 0

    for item in monthly_maintenance:
        month_str = item["month"].strftime("%Y-%m")
        if month_str not in monthly_data:
            monthly_data[month_str] = {
                "month": item["month"].strftime("%B %Y"),
                "rent_collected": 0,
                "maintenance_cost": 0,
            }
        monthly_data[month_str]["maintenance_cost"] = item["maintenance_cost"] or 0

    # Convert to list and calculate net income
    trend_data = []
    for month_str in sorted(monthly_data.keys()):
        data = monthly_data[month_str]
        data["net_income"] = data["rent_collected"] - data["maintenance_cost"]
        trend_data.append(data)

    return Response(
        {
            "property_metrics": property_metrics,
            "occupancy_metrics": occupancy_metrics,
            "financial_metrics": financial_metrics,
            "maintenance_metrics": maintenance_metrics,
            "monthly_trends": trend_data,
            "date_range": {
                "start_date": start_date.strftime("%Y-%m-%d"),
                "end_date": end_date.strftime("%Y-%m-%d"),
            },
        }
    )


class EmailTenantsView(APIView):
    permission_classes = [IsAuthenticated]
    authentication_classes = [JWTAuthentication]

    def send_tenant_email(
        self, tenant_email: str, tenant_name: str, subject: str, message: str
    ):
        """Helper method to send email to a single tenant"""
        context = {"name": tenant_name, "message": message, "email": tenant_email}
        email_service = EmailService()
        try:
            email_service.send_email(
                recipient_email=tenant_email,
                recipient_name=tenant_name,
                subject=subject,
                template_name="emails/tenant_message.html",
                context=context,
            )
            return True, None
        except Exception as e:
            return False, str(e)

    def post(self, request):
        """
        Send emails to multiple tenants using threading and store communication history
        """
        try:
            # Validate request data
            required_fields = ["message", "subject", "tenants"]
            if not all(field in request.data for field in required_fields):
                return Response(
                    {"success": False, "message": "Missing required fields"},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            message = request.data["message"]
            subject = request.data["subject"]
            tenant_ids = request.data["tenants"]

            # Get all tenants
            tenants = Tenant.objects.filter(id__in=tenant_ids)
            if not tenants:
                return Response(
                    {"success": False, "message": "No valid tenants found"},
                    status=status.HTTP_404_NOT_FOUND,
                )

            # Prepare recipients list for history
            recipients_list = []
            success_count = 0
            failed_recipients = []

            # Create threads for sending emails
            threads = []
            results = {}  # Dictionary to store results for each tenant

            for tenant in tenants:
                if tenant.email:
                    tenant_name = f"{tenant.first_name} {tenant.last_name}"
                    recipient_info = {
                        "id": str(tenant.id),
                        "name": tenant_name,
                        "email": tenant.email,
                    }
                    recipients_list.append(recipient_info)

                    thread = threading.Thread(
                        target=lambda: results.update(
                            {
                                str(tenant.id): self.send_tenant_email(
                                    tenant.email, tenant_name, subject, message
                                )
                            }
                        )
                    )
                    threads.append(thread)
                    thread.start()

            # Wait for all threads to complete
            for thread in threads:
                thread.join()

            # Process results
            for tenant_id, (success, error) in results.items():
                if success:
                    success_count += 1
                else:
                    failed_recipients.append({"tenant_id": tenant_id, "error": error})

            # Determine overall status
            if success_count == len(recipients_list):
                status_value = "SUCCESS"
            elif success_count == 0:
                status_value = "FAILED"
            else:
                status_value = "PARTIAL"

            # Store communication history
            CommunicationHistory.objects.create(
                type=CommunicationType.EMAIL,
                subject=subject,
                message=message,
                sent_by=request.user.profile,
                recipients=recipients_list,
                status=status_value,
                error_message=str(failed_recipients) if failed_recipients else None,
            )

            return Response(
                {
                    "success": True,
                    "message": f"Emails sent successfully to {success_count} tenants",
                    "failed": failed_recipients,
                },
                status=status.HTTP_200_OK,
            )

        except Exception as e:
            return Response(
                {"success": False, "message": str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )


class CommunicationHistoryView(APIView):
    permission_classes = [IsAuthenticated]
    authentication_classes = [JWTAuthentication]

    def get(self, request):
        """
        Retrieve communication history with optional filters
        """
        try:
            # Get query parameters
            type_filter = request.query_params.get("type")
            start_date = request.query_params.get("start_date")
            end_date = request.query_params.get("end_date")
            tenant_id = request.query_params.get("tenant_id")

            # Base queryset
            queryset = CommunicationHistory.objects.all().order_by("-sent_at")

            # Apply filters
            if type_filter:
                queryset = queryset.filter(type=type_filter)
            if start_date:
                queryset = queryset.filter(sent_at__gte=start_date)
            if end_date:
                queryset = queryset.filter(sent_at__lte=end_date)
            if tenant_id:
                queryset = queryset.filter(recipients__contains=[{"id": tenant_id}])

            # Serialize data
            serializer = CommunicationHistorySerializer(queryset, many=True)

            return Response(
                {"success": True, "data": serializer.data}, status=status.HTTP_200_OK
            )

        except Exception as e:
            return Response(
                {"success": False, "message": str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )


class CreateStaffAccountView(APIView):
    permission_classes = [IsAuthenticated]
    authentication_classes = [JWTAuthentication]

    def post(self, request):
        # Check if user has permission to create staff accounts
        user_profile = request.user.profile
        if user_profile.user_type not in [UserType.ADMIN, UserType.MANAGER]:
            return Response(
                {"error": "You don't have permission to create staff accounts"},
                status=status.HTTP_403_FORBIDDEN,
            )

        serializer = StaffAccountSerializer(
            data=request.data, context={"request": request}
        )
        if serializer.is_valid():
            try:
                # Generate password and create account
                password = serializer.generate_password()
                username, password = serializer.create_user_account(
                    serializer.validated_data, password
                )

                # Send credentials via email
                serializer.send_credentials_email(
                    serializer.validated_data, username, password
                )

                return Response(
                    {
                        "message": "Staff account created successfully",
                        "username": username,
                    },
                    status=status.HTTP_201_CREATED,
                )

            except Exception as e:
                return Response(
                    {"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class StaffAccountView(APIView):
    permission_classes = [IsAuthenticated]
    authentication_classes = [JWTAuthentication]

    def get_queryset(self):
        user_profile = self.request.user.profile

        # Admins can see all staff
        if user_profile.user_type == UserType.ADMIN:
            return Profile.objects.filter(
                user_type__in=[UserType.MANAGER, UserType.CLERK]
            )

        # Managers can only see clerks
        elif user_profile.user_type == UserType.MANAGER:
            return Profile.objects.filter(user_type=UserType.CLERK)

        return Profile.objects.none()

    def get(self, request, staff_id=None):
        if request.user.profile.user_type not in [UserType.ADMIN, UserType.MANAGER]:
            return Response(
                {"error": "You don't have permission to view staff accounts"},
                status=status.HTTP_403_FORBIDDEN,
            )

        if staff_id:
            staff = get_object_or_404(self.get_queryset(), id=staff_id)
            serializer = StaffProfileSerializer(staff)
            return Response(serializer.data)
        else:
            queryset = self.get_queryset()

            # Apply search filters if provided
            search = request.query_params.get("search", "")
            if search:
                queryset = queryset.filter(
                    Q(user__first_name__icontains=search)
                    | Q(user__last_name__icontains=search)
                    | Q(user__email__icontains=search)
                    | Q(phone_number__icontains=search)
                )

            # Apply user type filter if provided
            user_type = request.query_params.get("user_type", "")
            if user_type in [UserType.MANAGER, UserType.CLERK]:
                queryset = queryset.filter(user_type=user_type)

            # Group staff by property
            staff_by_property = {}
            for staff in queryset:
                serialized_staff = StaffProfileSerializer(staff).data
                for property_info in serialized_staff["property_info"]:
                    property_id = property_info["id"]
                    if property_id not in staff_by_property:
                        staff_by_property[property_id] = {
                            "property_info": property_info,
                            "staff": [],
                        }
                    staff_by_property[property_id]["staff"].append(serialized_staff)

            return Response(list(staff_by_property.values()))

    def put(self, request, staff_id):
        if request.user.profile.user_type not in [UserType.ADMIN, UserType.MANAGER]:
            return Response(
                {"error": "You don't have permission to update staff accounts"},
                status=status.HTTP_403_FORBIDDEN,
            )

        staff = get_object_or_404(self.get_queryset(), id=staff_id)

        # Prevent managers from updating managers
        if (
            request.user.profile.user_type == UserType.MANAGER
            and staff.user_type == UserType.MANAGER
        ):
            return Response(
                {"error": "Managers cannot update other managers' accounts"},
                status=status.HTTP_403_FORBIDDEN,
            )

        serializer = StaffProfileSerializer(staff, data=request.data, partial=True)
        if serializer.is_valid():
            # Update User model fields
            user_data = serializer.validated_data.pop("user", {})
            for attr, value in user_data.items():
                setattr(staff.user, attr, value)
            staff.user.save()

            # Update Profile model fields
            serializer.save()

            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, staff_id):
        if request.user.profile.user_type != UserType.ADMIN:
            return Response(
                {"error": "Only administrators can delete staff accounts"},
                status=status.HTTP_403_FORBIDDEN,
            )

        staff = get_object_or_404(self.get_queryset(), id=staff_id)

        # Delete the user (this will cascade delete the profile)
        staff.user.delete()

        return Response(status=status.HTTP_204_NO_CONTENT)


class DynamicSubscriptionQuoteView(APIView):
    def post(self, request, *args, **kwargs):
        try:
            # Inputs
            number_of_units = int(request.data.get("number_of_units", 0))
            average_rent = float(request.data.get("average_rent", 0))

            if number_of_units <= 0 or average_rent <= 0:
                return Response(
                    {
                        "error": "Number of units and average rent must be greater than zero."
                    },
                    status=status.HTTP_400_BAD_REQUEST,
                )

            # Calculate Total Revenue
            total_revenue = number_of_units * average_rent

            # Dynamic Percentage Logic (example)
            if total_revenue > 5_000_000:
                percentage_rate = 0.001  # 0.10% for revenue > 5M
            elif total_revenue > 1_000_000:
                percentage_rate = 0.0015  # 0.15% for revenue > 1M
            else:
                percentage_rate = 0.002  # 0.20% for lower revenue

            # Subscription Fee Calculation
            subscription_fee = total_revenue * percentage_rate

            # Response Data
            data = {
                "Total Revenue": f"{total_revenue:,.2f} KES",
                "Subscription Fee": f"{subscription_fee:,.2f} KES",
                "Percentage Rate Used": f"{percentage_rate * 100:.2f}%",
            }
            return Response(data, status=status.HTTP_200_OK)

        except ValueError:
            return Response(
                {
                    "error": "Invalid input. Please provide valid numbers for units and rent."
                },
                status=status.HTTP_400_BAD_REQUEST,
            )


@api_view(["POST"])
@permission_classes([IsAuthenticated])
@authentication_classes([JWTAuthentication])
def record_rent_payment(request):
    """
    Record a rent payment and update the rent period status
    """
    # Check if user has permission
    if not (request.user.profile.user_type in [UserType.ADMIN, UserType.MANAGER]):
        return Response(
            {"error": "You don't have permission to record payments"},
            status=status.HTTP_403_FORBIDDEN,
        )

    serializer = RentPaymentSerializer(data=request.data)

    if serializer.is_valid():
        try:
            with transaction.atomic():
                # Create the payment record
                payment = serializer.save()
                lease = payment.lease

                # Get or create rent period for the payment date
                period_start = payment.payment_date.replace(
                    day=1
                )  # First day of the month
                if lease.payment_period == PaymentPeriod.MONTHLY:
                    period_end = (period_start + timezone.timedelta(days=32)).replace(
                        day=1
                    ) - timezone.timedelta(days=1)
                elif lease.payment_period == PaymentPeriod.BIMONTHLY:
                    period_end = (period_start + timezone.timedelta(days=62)).replace(
                        day=1
                    ) - timezone.timedelta(days=1)
                elif lease.payment_period == PaymentPeriod.HALF_YEARLY:
                    period_end = (period_start + timezone.timedelta(days=182)).replace(
                        day=1
                    ) - timezone.timedelta(days=1)
                else:  # YEARLY
                    period_end = (period_start + timezone.timedelta(days=365)).replace(
                        day=1
                    ) - timezone.timedelta(days=1)

                rent_period, created = RentPeriodStatus.objects.get_or_create(
                    lease=lease,
                    period_start_date=period_start,
                    period_end_date=period_end,
                    defaults={"amount_due": lease.monthly_rent},
                )

                # Update the amount paid
                rent_period.amount_paid += payment.amount
                rent_period.update_payment_status()

                return Response(
                    {
                        "message": "Payment recorded successfully",
                        "payment_id": payment.id,
                        "period_status": "Paid"
                        if rent_period.is_paid
                        else "Partially Paid",
                        "remaining_balance": max(
                            Decimal("0"),
                            rent_period.amount_due - rent_period.amount_paid,
                        ),
                    },
                    status=status.HTTP_201_CREATED,
                )

        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class ReportFilter(filters.FilterSet):
    start_date = filters.DateFilter(field_name="created_at", lookup_expr="gte")
    end_date = filters.DateFilter(field_name="created_at", lookup_expr="lte")
    property = filters.UUIDFilter(field_name="property__id")
    status = filters.CharFilter(field_name="status")


class ReportsViewSet(viewsets.ViewSet):
    permission_classes = [IsAuthenticated]
    filter_class = ReportFilter

    @action(detail=False, methods=["get"])
    def lease_report(self, request):
        queryset = Lease.objects.all()

        # Apply filters
        property_id = request.query_params.get("property")
        start_date = request.query_params.get("start_date")
        end_date = request.query_params.get("end_date")
        status = request.query_params.get("status")

        if property_id:
            queryset = queryset.filter(unit__property_id=property_id)
        if start_date:
            queryset = queryset.filter(start_date__gte=start_date)
        if end_date:
            queryset = queryset.filter(end_date__lte=end_date)
        if status:
            queryset = queryset.filter(status=status)

        serializer = ReportLeaseSerializer(queryset, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=["get"])
    def payment_report(self, request):
        queryset = RentPayment.objects.all()

        # Apply filters
        property_id = request.query_params.get("property")
        start_date = request.query_params.get("start_date")
        end_date = request.query_params.get("end_date")

        if property_id:
            queryset = queryset.filter(lease__unit__property_id=property_id)
        if start_date:
            queryset = queryset.filter(payment_date__gte=start_date)
        if end_date:
            queryset = queryset.filter(payment_date__lte=end_date)

        serializer = ReportPaymentSerializer(queryset, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=["get"])
    def maintenance_report(self, request):
        queryset = MaintenanceRequest.objects.all()

        # Apply filters
        property_id = request.query_params.get("property")
        start_date = request.query_params.get("start_date")
        end_date = request.query_params.get("end_date")
        status = request.query_params.get("status")
        priority = request.query_params.get("priority")

        if property_id:
            queryset = queryset.filter(property_id=property_id)
        if start_date:
            queryset = queryset.filter(requested_date__gte=start_date)
        if end_date:
            queryset = queryset.filter(requested_date__lte=end_date)
        if status:
            queryset = queryset.filter(status=status)
        if priority:
            queryset = queryset.filter(priority=priority)

        serializer = ReportMaintenanceSerializer(queryset, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=["get"])
    def dashboard_summary(self, request):
        property_id = request.query_params.get("property")

        # Base querysets with property filter if provided
        property_filter = {"property_id": property_id} if property_id else {}
        lease_filter = {"unit__property_id": property_id} if property_id else {}

        # Get current date
        today = timezone.now().date()

        # Calculate various metrics
        total_units = Unit.objects.filter(**property_filter).count()
        occupied_units = Unit.objects.filter(
            is_occupied=True, **property_filter
        ).count()
        vacant_units = total_units - occupied_units

        active_leases = Lease.objects.filter(status="ACTIVE", **lease_filter).count()

        maintenance_pending = MaintenanceRequest.objects.filter(
            status="PENDING", **property_filter
        ).count()

        # Calculate total revenue for current month
        current_month_revenue = (
            RentPayment.objects.filter(
                payment_date__year=today.year,
                payment_date__month=today.month,
                lease__unit__property_id=property_id if property_id else None,
            ).aggregate(total=Sum("amount"))["total"]
            or 0
        )

        return Response(
            {
                "total_units": total_units,
                "occupied_units": occupied_units,
                "vacant_units": vacant_units,
                "occupancy_rate": (occupied_units / total_units * 100)
                if total_units > 0
                else 0,
                "active_leases": active_leases,
                "maintenance_pending": maintenance_pending,
                "current_month_revenue": current_month_revenue,
            }
        )
