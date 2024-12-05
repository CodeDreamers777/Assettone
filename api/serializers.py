from rest_framework import serializers
from django.contrib.auth.models import User
from .models import (
    Profile,
    UserType,
    IdentificationType,
    Property,
    Unit,
    UnitType,
    Tenant,
    TenantStatus,
    Lease,
)


class UserRegistrationSerializer(serializers.ModelSerializer):
    password = serializers.CharField(
        write_only=True, required=True, style={"input_type": "password"}
    )
    phone_number = serializers.CharField(required=False, allow_null=True)
    identification_type = serializers.CharField(required=False, allow_null=True)
    identification_number = serializers.CharField(required=False, allow_null=True)

    class Meta:
        model = User
        fields = [
            "username",
            "email",
            "password",
            "first_name",
            "last_name",
            "phone_number",
            "identification_type",
            "identification_number",
        ]

    def validate(self, data):
        if User.objects.filter(email=data["email"]).exists():
            raise serializers.ValidationError({"email": "This email is already in use"})
        if User.objects.filter(username=data["username"]).exists():
            raise serializers.ValidationError(
                {"username": "This username is already taken"}
            )
        if bool(data.get("identification_type")) != bool(
            data.get("identification_number")
        ):
            raise serializers.ValidationError(
                "Both identification type and identification number must be provided together"
            )
        return data

    def create(self, validated_data):
        password = validated_data.pop("password")
        phone_number = validated_data.pop("phone_number", None)
        user_type = validated_data.pop("user_type", UserType.ADMIN)
        identification_type = validated_data.pop("identification_type", None)
        identification_number = validated_data.pop("identification_number", None)

        user = User.objects.create_user(
            username=validated_data["username"],
            email=validated_data["email"],
            password=password,
            first_name=validated_data.get("first_name", ""),
            last_name=validated_data.get("last_name", ""),
        )
        Profile.objects.create(
            user=user,
            phone_number=phone_number,
            user_type=user_type,
            identification_type=identification_type,
            identification_number=identification_number,
        )
        return user


class UserProfileUpdateSerializer(serializers.ModelSerializer):
    """
    Serializer for updating user profile
    Allows updating of specific fields with validation
    """

    class Meta:
        model = Profile
        fields = ["phone_number", "identification_type", "identification_number"]

    def validate_identification_type(self, value):
        """
        Validate identification type
        """
        if value and value not in dict(IdentificationType.choices):
            raise serializers.ValidationError("Invalid identification type")
        return value

    def validate(self, data):
        """
        Custom validation to ensure identification number
        is provided when identification type is specified
        """
        identification_type = data.get("identification_type") or (
            self.instance.identification_type if self.instance else None
        )
        identification_number = data.get("identification_number") or (
            self.instance.identification_number if self.instance else None
        )

        # If identification type is provided, identification number is required
        if identification_type and not identification_number:
            raise serializers.ValidationError(
                {
                    "identification_number": "Identification number is required when identification type is specified"
                }
            )

        # Check for unique identification number
        if identification_number:
            existing_profiles = Profile.objects.filter(
                identification_number=identification_number
            ).exclude(pk=self.instance.pk if self.instance else None)

            if existing_profiles.exists():
                raise serializers.ValidationError(
                    {
                        "identification_number": "This identification number is already in use"
                    }
                )

        return data


class PropertySerializer(serializers.ModelSerializer):
    """
    Serializer for Property model with comprehensive validation
    """

    total_units = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = Property
        fields = [
            "id",
            "name",
            "address_line1",
            "address_line2",
            "city",
            "state",
            "postal_code",
            "country",
            "owner",
            "manager",
            "total_units",
            "description",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "created_at",
            "updated_at",
            "owner",
            "manager",
            "total_units",
        ]

    def get_total_units(self, obj):
        """
        Calculate the total number of units associated with the property
        """
        return obj.units.count() if obj.id else 0

    def validate_postal_code(self, value):
        """
        Validate postal code is not empty
        """
        if not value:
            raise serializers.ValidationError("Postal code is required")
        return value

    def create(self, validated_data):
        """
        Custom create method to set default values
        """
        # Remove total_units from validated_data if present
        validated_data.pop("total_units", None)

        # Owner is set from the request user
        request = self.context.get("request")
        if request and request.user.is_authenticated:
            validated_data["owner"] = request.user.profile

        # Manager remains null initially
        validated_data["manager"] = None

        return super().create(validated_data)

    def update(self, instance, validated_data):
        """
        Custom update method to remove total_units from validated data
        """
        # Remove total_units from validated_data if present
        validated_data.pop("total_units", None)

        return super().update(instance, validated_data)


class UnitSerializer(serializers.ModelSerializer):
    """
    Serializer for Unit model with comprehensive validation
    """

    custom_unit_type = serializers.CharField(
        required=False, allow_blank=True, allow_null=True
    )

    class Meta:
        model = Unit
        fields = [
            "id",
            "unit_number",
            "property",
            "unit_type",
            "custom_unit_type",
            "rent",
            "payment_period",
            "floor",
            "square_footage",
            "is_occupied",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]

    def validate(self, data):
        """
        Additional validation for unit data
        """
        # Validate custom unit type
        unit_type = data.get("unit_type", UnitType.STUDIO)
        custom_unit_type = data.get("custom_unit_type")

        if unit_type == UnitType.CUSTOM and not custom_unit_type:
            raise serializers.ValidationError(
                {
                    "custom_unit_type": "Custom unit type name is required when unit type is CUSTOM"
                }
            )

        # Validate rent and payment period
        rent = data.get("rent")
        if rent is not None and rent <= 0:
            raise serializers.ValidationError(
                {"rent": "Rent must be a positive number"}
            )

        return data

    def validate_unit_number(self, value):
        """
        Validate unit number is unique within the property
        """
        property_id = self.context.get("property_id")
        if property_id:
            # Check for existing units with same unit number in the property
            existing_units = Unit.objects.filter(
                property_id=property_id, unit_number=value
            )

            # If this is an update, exclude the current instance
            instance = self.instance
            if instance:
                existing_units = existing_units.exclude(pk=instance.pk)

            if existing_units.exists():
                raise serializers.ValidationError(
                    "Unit number must be unique within the property"
                )
        return value


class PropertyDetailSerializer(PropertySerializer):
    """
    Detailed Property Serializer that includes related units
    """

    units = UnitSerializer(many=True, read_only=True)
    total_units = serializers.SerializerMethodField()

    class Meta(PropertySerializer.Meta):
        fields = PropertySerializer.Meta.fields + ["units"]

    def get_total_units(self, obj):
        """
        Get the total number of units for the property
        """
        return obj.units.count()


class TenantSerializer(serializers.ModelSerializer):
    """
    Serializer for Tenant model
    Includes all fields with validation
    """

    class Meta:
        model = Tenant
        fields = "__all__"
        read_only_fields = ["id", "created_at", "updated_at"]

    def validate(self, data):
        """
        Additional validation for tenant creation/update
        """
        # Validate identification
        if data.get("identification_type") and not data.get("identification_number"):
            raise serializers.ValidationError(
                "Identification number is required when identification type is specified"
            )

        return data


class LeaseSerializer(serializers.ModelSerializer):
    """
    Serializer for retrieving Lease details
    Includes related tenant and unit information
    """

    tenant_name = serializers.SerializerMethodField()
    unit_details = serializers.SerializerMethodField()
    previous_lease_id = serializers.UUIDField(
        source="previous_lease.id", read_only=True, required=False, allow_null=True
    )

    class Meta:
        model = Lease
        fields = "__all__"
        read_only_fields = ["id", "created_at", "updated_at"]

    def get_tenant_name(self, obj):
        """
        Get full name of the tenant
        """
        return f"{obj.tenant.first_name} {obj.tenant.last_name}"

    def get_unit_details(self, obj):
        """
        Get basic unit details
        """
        return {
            "id": str(obj.unit.id),
            "unit_number": obj.unit.unit_number,
            "property_name": obj.unit.property.name,
        }


class LeaseCreateSerializer(serializers.ModelSerializer):
    """
    Serializer for creating or updating a Lease
    Includes additional validation
    """

    class Meta:
        model = Lease
        fields = "__all__"
        read_only_fields = ["id", "created_at", "updated_at", "previous_lease"]

    def validate(self, data):
        """
        Validate lease creation/update
        """
        # Ensure unit is not already leased
        unit = data.get("unit")
        if unit:
            active_leases = Lease.objects.filter(unit=unit, status=LeaseStatus.ACTIVE)

            # Exclude current lease if it's an update
            if self.instance:
                active_leases = active_leases.exclude(pk=self.instance.pk)

            if active_leases.exists():
                raise serializers.ValidationError(
                    "This unit already has an active lease."
                )

        # Validate date range
        start_date = data.get("start_date")
        end_date = data.get("end_date")
        if start_date and end_date:
            if start_date >= end_date:
                raise serializers.ValidationError(
                    "Lease end date must be after start date"
                )

        return data

    def create(self, validated_data):
        """
        Custom create method to update unit occupancy
        """
        # Create lease
        lease = super().create(validated_data)

        # Update unit occupancy
        unit = lease.unit
        unit.is_occupied = True
        unit.save()

        return lease


class LeaseTransferSerializer(serializers.Serializer):
    """
    Serializer for transferring a lease to a new tenant
    """

    tenant_id = serializers.PrimaryKeyRelatedField(
        queryset=Tenant.objects.filter(status=TenantStatus.ACTIVE), required=True
    )
    start_date = serializers.DateField(required=True)
    end_date = serializers.DateField(required=True)
    monthly_rent = serializers.DecimalField(
        max_digits=10, decimal_places=2, required=True
    )
    security_deposit = serializers.DecimalField(
        max_digits=10, decimal_places=2, required=True
    )
    notes = serializers.CharField(required=False, allow_null=True)

    def validate(self, data):
        """
        Validate lease transfer details
        """
        # Get current lease from context
        current_lease = self.context.get("current_lease")
        if not current_lease:
            raise serializers.ValidationError("No current lease found for transfer")

        # Validate start and end dates
        start_date = data.get("start_date")
        end_date = data.get("end_date")

        if start_date >= end_date:
            raise serializers.ValidationError("End date must be after start date")

        # Ensure start date is after current lease's end date
        if start_date <= current_lease.end_date:
            raise serializers.ValidationError(
                "New lease start date must be after current lease end date"
            )

        return data

    def create(self, validated_data):
        """
        Create a new lease for the transferred unit
        """
        # Remove unit from validated data as it will be set from context
        validated_data.pop("unit", None)

        # Get current lease's unit
        current_lease = self.context.get("current_lease")
        unit = current_lease.unit

        # Create new lease
        new_lease = Lease.objects.create(unit=unit, **validated_data)

        return new_lease
