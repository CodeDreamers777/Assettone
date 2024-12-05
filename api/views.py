from rest_framework import status, viewsets
from django.db import transaction
from django.utils import timezone
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from django.contrib.auth import authenticate
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework.permissions import IsAuthenticated
from .models import Profile, Property, Unit, UserType, Tenant, Lease, LeaseStatus
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
)
from rest_framework.decorators import action
from .utils.decorator import jwt_required
from django.utils.decorators import method_decorator


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
        Handle user login
        """
        username = request.data.get("username")
        password = request.data.get("password")

        if not username or not password:
            return Response(
                {
                    "success": False,
                    "message": "Both username and password are required",
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Authenticate user
        user = authenticate(username=username, password=password)

        if user:
            # Generate tokens
            refresh = RefreshToken.for_user(user)

            return Response(
                {
                    "success": True,
                    "message": "Login successful",
                    "user_id": str(user.id),
                    "username": user.username,
                    "tokens": {
                        "refresh": str(refresh),
                        "access": str(refresh.access_token),
                    },
                },
                status=status.HTTP_200_OK,
            )

        return Response(
            {"success": False, "message": "Invalid credentials"},
            status=status.HTTP_401_UNAUTHORIZED,
        )


class UserProfileView(APIView):
    permission_classes = [IsAuthenticated]
    authentication_classes = [JWTAuthentication]

    def get(self, request):
        """
        Get current user's profile
        """
        try:
            # Fetch the profile associated with the authenticated user
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
        Update user profile
        Allows updating of specific fields
        """
        try:
            # Fetch the profile associated with the authenticated user
            profile = Profile.objects.get(user=request.user)

            # Use a serializer to validate and update the profile
            serializer = UserProfileUpdateSerializer(
                profile, data=request.data, partial=True
            )

            if serializer.is_valid():
                # Save the updated profile
                serializer.save()

                return Response(
                    {
                        "success": True,
                        "message": "Profile updated successfully",
                        "updated_fields": list(request.data.keys()),
                    },
                    status=status.HTTP_200_OK,
                )

            # If serializer validation fails
            return Response(
                {"success": False, "message": serializer.errors},
                status=status.HTTP_400_BAD_REQUEST,
            )

        except Profile.DoesNotExist:
            return Response(
                {"success": False, "message": "Profile not found"},
                status=status.HTTP_404_NOT_FOUND,
            )


class PropertyViewSet(viewsets.ModelViewSet):
    """
    Viewset for Property model with comprehensive CRUD operations
    """

    queryset = Property.objects.all()
    permission_classes = [IsAuthenticated]
    authentication_classes = [JWTAuthentication]

    def get_queryset(self):
        """
        Custom queryset method to return properties based on user role
        """
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
        """
        Return different serializers based on the action
        """
        if self.action == "retrieve":
            return PropertyDetailSerializer
        return PropertySerializer

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
        Ensures the user has permission to modify this lease
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

        # Update lease status and unit occupancy
        lease.status = LeaseStatus.TERMINATED
        lease.end_date = timezone.now().date()
        lease.save()

        # Mark the unit as unoccupied
        unit = lease.unit
        unit.is_occupied = False
        unit.save()

        return Response({"status": "Lease terminated", "lease_id": lease.id})

    @action(detail=True, methods=["POST"])
    def transfer_lease(self, request, pk=None):
        """
        Transfer a lease to a new tenant
        Requires new tenant information and optional additional details
        Ensures the user has permission to modify this lease
        """
        current_lease = self.get_object()

        # Verify user has permission to modify this lease
        user_profile = Profile.objects.get(user=request.user)

        # Check if the user owns or manages the property of this lease
        if user_profile.user_type in [UserType.ADMIN, UserType.MANAGER]:
            # Validate ownership/management based on user type
            if user_profile.user_type == UserType.ADMIN:
                if current_lease.unit.property.owner != user_profile:
                    return Response(
                        {"error": "You do not have permission to transfer this lease"},
                        status=status.HTTP_403_FORBIDDEN,
                    )
            else:
                if current_lease.unit.property.manager != user_profile:
                    return Response(
                        {"error": "You do not have permission to transfer this lease"},
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

        # Use transfer serializer to validate and process transfer
        serializer = LeaseTransferSerializer(
            data=request.data, context={"current_lease": current_lease}
        )

        if serializer.is_valid():
            # Create a new lease, marking the current one as transferred
            current_lease.status = LeaseStatus.TERMINATED
            current_lease.end_date = timezone.now().date()
            current_lease.save()

            # Create new lease with reference to previous lease
            new_lease = serializer.save(
                previous_lease=current_lease, unit=current_lease.unit
            )

            return Response(
                {"status": "Lease transferred", "new_lease_id": new_lease.id},
                status=status.HTTP_201_CREATED,
            )

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
