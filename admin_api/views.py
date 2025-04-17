# admin_api/views.py

from django.contrib.auth import authenticate
from django.contrib.auth.models import User
from django.utils import timezone
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
from rest_framework import status, viewsets, generics, filters
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework_simplejwt.tokens import RefreshToken
from django_filters.rest_framework import DjangoFilterBackend
from api.models import Profile, UserType, Property, Unit
from .serializers import (
    UserSerializer,
    ProfileSerializer,
    LandlordCreateSerializer,
    LandlordUpdateSerializer,
    PropertySerializer,
    PropertyCreateSerializer,
    PropertyUpdateSerializer,
)


@method_decorator(csrf_exempt, name="dispatch")
class AdminLoginAPIView(APIView):
    """
    API endpoint for admin login
    """

    def post(self, request):
        username = request.data.get("username")
        password = request.data.get("password")

        if not username or not password:
            return Response(
                {"error": "Please provide both username and password"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        user = authenticate(username=username, password=password)

        if user is None:
            return Response(
                {"error": "Invalid credentials"}, status=status.HTTP_401_UNAUTHORIZED
            )

        if not user.is_superuser:
            return Response(
                {"error": "Access denied. Admin privileges required."},
                status=status.HTTP_403_FORBIDDEN,
            )

        # Generate JWT tokens
        refresh = RefreshToken.for_user(user)

        # Update last session timestamp if user has a profile
        try:
            profile = user.profile
            profile.last_session = timezone.now()
            profile.save()
        except Profile.DoesNotExist:
            pass

        return Response(
            {
                "refresh": str(refresh),
                "access": str(refresh.access_token),
                "user": UserSerializer(user).data,
            }
        )


class AdminDashboardAPIView(APIView):
    """
    API endpoint for admin dashboard summary data
    """

    permission_classes = [IsAuthenticated, IsAdminUser]
    authentication_classes = [JWTAuthentication]

    def get(self, request):
        landlord_count = Profile.objects.filter(user_type=UserType.ADMIN).count()
        active_landlords = Profile.objects.filter(
            user_type=UserType.ADMIN, user__is_active=True
        ).count()
        inactive_landlords = landlord_count - active_landlords
        property_count = Property.objects.count()

        # Get recently active landlords
        recent_activity = Profile.objects.filter(
            user_type=UserType.ADMIN, last_session__isnull=False
        ).order_by("-last_session")[:5]

        return Response(
            {
                "landlord_count": landlord_count,
                "active_landlords": active_landlords,
                "inactive_landlords": inactive_landlords,
                "property_count": property_count,
                "recent_activity": ProfileSerializer(recent_activity, many=True).data,
            }
        )


class LandlordListAPIView(generics.ListAPIView):
    """
    API endpoint to list all landlords/property owners
    """

    serializer_class = ProfileSerializer
    permission_classes = [IsAuthenticated, IsAdminUser]
    authentication_classes = [JWTAuthentication]

    filter_backends = [
        DjangoFilterBackend,
        filters.SearchFilter,
        filters.OrderingFilter,
    ]
    filterset_fields = ["user__is_active"]
    search_fields = [
        "user__username",
        "user__email",
        "user__first_name",
        "user__last_name",
        "phone_number",
    ]
    ordering_fields = ["user__date_joined", "last_session", "user__username"]
    ordering = ["-user__date_joined"]

    def get_queryset(self):
        return Profile.objects.filter(user_type=UserType.ADMIN).select_related("user")


class LandlordDetailAPIView(generics.RetrieveAPIView):
    """
    API endpoint to get details of a specific landlord/property owner
    """

    serializer_class = ProfileSerializer
    permission_classes = [IsAuthenticated, IsAdminUser]
    authentication_classes = [JWTAuthentication]

    lookup_field = "id"

    def get_queryset(self):
        return Profile.objects.filter(user_type=UserType.ADMIN).select_related("user")


class LandlordCreateAPIView(generics.CreateAPIView):
    """
    API endpoint to create a new landlord/property owner
    """

    serializer_class = LandlordCreateSerializer
    permission_classes = [IsAuthenticated, IsAdminUser]
    authentication_classes = [JWTAuthentication]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        profile = serializer.save()

        return Response(
            {
                "status": "success",
                "message": "Landlord account created successfully",
                "data": ProfileSerializer(profile).data,
            },
            status=status.HTTP_201_CREATED,
        )


class LandlordUpdateAPIView(generics.UpdateAPIView):
    """
    API endpoint to update a landlord/property owner
    """

    serializer_class = LandlordUpdateSerializer
    permission_classes = [IsAuthenticated, IsAdminUser]
    authentication_classes = [JWTAuthentication]

    lookup_field = "id"

    def get_queryset(self):
        return Profile.objects.filter(user_type=UserType.ADMIN).select_related("user")

    def get_serializer_context(self):
        context = super().get_serializer_context()
        profile = self.get_object()
        context["user"] = profile.user
        return context

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop("partial", False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)

        return Response(
            {
                "status": "success",
                "message": "Landlord account updated successfully",
                "data": ProfileSerializer(instance).data,
            }
        )


class ActivateDeactivateLandlordAPIView(APIView):
    """
    API endpoint to activate or deactivate a landlord account
    """

    permission_classes = [IsAuthenticated, IsAdminUser]
    authentication_classes = [JWTAuthentication]

    def post(self, request, pk):
        try:
            profile = Profile.objects.get(id=pk, user_type=UserType.ADMIN)
            user = profile.user

            # Toggle is_active status
            user.is_active = not user.is_active
            user.save()

            status_text = "activated" if user.is_active else "deactivated"

            return Response(
                {
                    "status": "success",
                    "message": f"Landlord account {status_text} successfully",
                    "is_active": user.is_active,
                }
            )

        except Profile.DoesNotExist:
            return Response(
                {"status": "error", "message": "Landlord not found"},
                status=status.HTTP_404_NOT_FOUND,
            )


class PropertyListAPIView(generics.ListAPIView):
    """
    API endpoint to list all properties
    """

    serializer_class = PropertySerializer
    permission_classes = [IsAuthenticated, IsAdminUser]
    authentication_classes = [JWTAuthentication]

    filter_backends = [
        DjangoFilterBackend,
        filters.SearchFilter,
        filters.OrderingFilter,
    ]
    filterset_fields = ["city", "state", "country", "owner__id"]
    search_fields = ["name", "address_line1", "city", "state", "postal_code"]
    ordering_fields = ["name", "created_at", "city"]
    ordering = ["-created_at"]

    def get_queryset(self):
        # Annotate with unit count
        return Property.objects.annotate(total_units=Count("units")).select_related(
            "owner__user", "manager__user"
        )


class PropertyDetailAPIView(generics.RetrieveAPIView):
    """
    API endpoint to get details of a specific property
    """

    serializer_class = PropertySerializer
    permission_classes = [IsAuthenticated, IsAdminUser]
    authentication_classes = [JWTAuthentication]

    lookup_field = "id"

    def get_queryset(self):
        return Property.objects.annotate(total_units=Count("units")).select_related(
            "owner__user", "manager__user"
        )


class PropertyCreateAPIView(generics.CreateAPIView):
    """
    API endpoint to create a new property
    """

    serializer_class = PropertyCreateSerializer
    permission_classes = [IsAuthenticated, IsAdminUser]
    authentication_classes = [JWTAuthentication]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        property_instance = serializer.save()

        return Response(
            {
                "status": "success",
                "message": "Property created successfully",
                "data": PropertySerializer(property_instance).data,
            },
            status=status.HTTP_201_CREATED,
        )


class PropertyUpdateAPIView(generics.UpdateAPIView):
    """
    API endpoint to update a property
    """

    serializer_class = PropertyUpdateSerializer
    permission_classes = [IsAuthenticated, IsAdminUser]
    authentication_classes = [JWTAuthentication]

    lookup_field = "id"

    def get_queryset(self):
        return Property.objects.all()

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop("partial", False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)

        # Refresh instance to get updated data
        instance = self.get_object()

        return Response(
            {
                "status": "success",
                "message": "Property updated successfully",
                "data": PropertySerializer(instance).data,
            }
        )


class PropertyDeleteAPIView(generics.DestroyAPIView):
    """
    API endpoint to delete a property
    """

    permission_classes = [IsAuthenticated, IsAdminUser]
    authentication_classes = [JWTAuthentication]

    lookup_field = "id"

    def get_queryset(self):
        return Property.objects.all()

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        property_name = instance.name
        self.perform_destroy(instance)

        return Response(
            {
                "status": "success",
                "message": f'Property "{property_name}" deleted successfully',
            },
            status=status.HTTP_200_OK,
        )


class PropertyStatisticsAPIView(APIView):
    """
    API endpoint to get statistics about a specific property
    """

    permission_classes = [IsAuthenticated, IsAdminUser]
    authentication_classes = [JWTAuthentication]

    def get(self, request, pk):
        try:
            property = Property.objects.get(id=pk)

            # Get units statistics
            total_units = Unit.objects.filter(property=property).count()
            occupied_units = Unit.objects.filter(
                property=property, is_occupied=True
            ).count()
            vacant_units = total_units - occupied_units
            occupancy_rate = (
                (occupied_units / total_units * 100) if total_units > 0 else 0
            )

            # Get units by type
            unit_types = (
                Unit.objects.filter(property=property)
                .values("unit_type")
                .annotate(count=Count("unit_type"))
            )

            return Response(
                {
                    "property_id": str(property.id),
                    "property_name": property.name,
                    "total_units": total_units,
                    "occupied_units": occupied_units,
                    "vacant_units": vacant_units,
                    "occupancy_rate": round(occupancy_rate, 2),
                    "unit_types": unit_types,
                }
            )

        except Property.DoesNotExist:
            return Response(
                {"status": "error", "message": "Property not found"},
                status=status.HTTP_404_NOT_FOUND,
            )
