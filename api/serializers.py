from rest_framework import serializers
from django.contrib.auth.models import User
from django.db import transaction
from django.core.exceptions import ValidationError
from .models import (
    Profile,
    UserType,
    IdentificationType,
    Property,
    PaymentPeriod,
    RentPayment,
    Unit,
    UnitType,
    Tenant,
    TenantStatus,
    Lease,
    LeaseStatus,
    MaintenanceRequest,
    MaintenancePriority,
    CommunicationHistory,
    MaintenanceStatus,
)
from decimal import Decimal
from django.utils import timezone
from datetime import timedelta
import string
import random
from django.contrib.auth.password_validation import validate_password
from .utils.send_mail import EmailService


def create_occupied_unit(self, validated_data, tenant_id=None):
    """
    Create a unit and handle tenant and lease creation if the unit is occupied

    Args:
        validated_data (dict): Validated unit data
        tenant_id (UUID, optional): ID of the tenant to be assigned to the unit

    Returns:
        Unit: The created unit instance
    """
    # Check if the unit is marked as occupied
    is_occupied = validated_data.get("is_occupied", False)

    # If occupied, tenant_id is required
    if is_occupied and not tenant_id:
        raise ValidationError(
            {"tenant_id": "Tenant ID is required when creating an occupied unit"}
        )

    # Use a transaction to ensure atomic creation
    with transaction.atomic():
        # Create the unit first
        unit = Unit.objects.create(**validated_data)

        # If the unit is occupied, create a lease
        if is_occupied:
            try:
                # Retrieve the tenant
                tenant = Tenant.objects.get(id=tenant_id)
                # Activate the tenant
                tenant.status = TenantStatus.ACTIVE
                tenant.save()

                # Create a lease for the unit
                lease = Lease.objects.create(
                    unit=unit,
                    tenant=tenant,
                    start_date=timezone.now().date(),
                    end_date=timezone.now().date()
                    + timezone.timedelta(days=365),  # Default 1-year lease
                    monthly_rent=unit.rent,
                    security_deposit=unit.rent
                    * 2,  # Example: security deposit is 2x monthly rent
                    status=LeaseStatus.ACTIVE,
                    payment_period=unit.payment_period,
                )

                # Mark the unit as occupied (redundant, but explicit)
                unit.is_occupied = True
                unit.save()

            except Tenant.DoesNotExist:
                # Rollback the unit creation if tenant not found
                unit.delete()
                raise ValidationError({"tenant_id": "Invalid tenant ID provided"})

        return unit


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
    username = serializers.CharField(source="user.username", required=False)
    email = serializers.CharField(source="user.email", required=False)

    class Meta:
        model = Profile
        fields = [
            "username",
            "email",
            "phone_number",
            "user_type",
            "identification_type",
            "identification_number",
            "can_manage_properties",
            "can_add_units",
            "can_edit_units",
            "can_delete_units",
            "can_view_financial_data",
        ]

    def update(self, instance, validated_data):
        # Get user data from validated_data
        user_data = validated_data.pop("user", {})

        # Update user fields if they exist in the request
        if user_data:
            user = instance.user
            # Update username if provided
            if "username" in user_data:
                # Check if username is already taken
                new_username = user_data["username"]
                if (
                    User.objects.exclude(pk=user.pk)
                    .filter(username=new_username)
                    .exists()
                ):
                    raise serializers.ValidationError(
                        {"username": "This username is already taken."}
                    )
                user.username = new_username

            # Update email if provided
            if "email" in user_data:
                user.email = user_data["email"]

            user.save()

        # Update profile fields
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        return instance


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
    Serializer for Unit model with comprehensive validation and additional details
    """

    custom_unit_type = serializers.CharField(
        required=False, allow_blank=True, allow_null=True
    )

    # New fields to include lease and payment details
    current_lease = serializers.SerializerMethodField()
    rent_payment_status = serializers.SerializerMethodField()
    tenant_id = serializers.UUIDField(write_only=True, required=False)

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
            "current_lease",  # New field
            "rent_payment_status",  # New field
            "tenant_id",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]

    def create(self, validated_data):
        tenant_id = validated_data.pop("tenant_id", None)
        return create_occupied_unit(self, validated_data, tenant_id)

    def get_current_lease(self, obj):
        """
        Get the current active lease for the unit
        """
        current_lease = Lease.objects.filter(
            unit=obj, status=LeaseStatus.ACTIVE
        ).first()

        if not current_lease:
            return None

        return {
            "id": str(current_lease.id),
            "tenant": {
                "id": str(current_lease.tenant.id),
                "name": f"{current_lease.tenant.first_name} {current_lease.tenant.last_name}",
                "email": current_lease.tenant.email,
                "phone_number": current_lease.tenant.phone_number,
            },
            "start_date": current_lease.start_date,
            "end_date": current_lease.end_date,
            "monthly_rent": current_lease.monthly_rent,
            "payment_period": current_lease.payment_period,
        }

    def get_rent_payment_status(self, obj):
        """
        Calculate rent payment status for the current lease
        """
        current_lease = Lease.objects.filter(
            unit=obj, status=LeaseStatus.ACTIVE
        ).first()

        if not current_lease:
            return None

        # Determine current payment period
        current_date = timezone.now().date()
        payment_period = current_lease.payment_period

        # Calculate rent amount based on payment period
        if payment_period == PaymentPeriod.MONTHLY:
            rent_amount = current_lease.monthly_rent
            period_start = current_date.replace(day=1)
            period_end = (period_start + timezone.timedelta(days=32)).replace(
                day=1
            ) - timezone.timedelta(days=1)
        elif payment_period == PaymentPeriod.BIMONTHLY:
            rent_amount = current_lease.monthly_rent * 2
            period_start = current_date.replace(day=1)
            period_end = (period_start + timezone.timedelta(days=62)).replace(
                day=1
            ) - timezone.timedelta(days=1)
        elif payment_period == PaymentPeriod.HALF_YEARLY:
            rent_amount = current_lease.monthly_rent * 6
            period_start = current_lease.start_date
            period_end = period_start + timezone.timedelta(days=180)
        elif payment_period == PaymentPeriod.YEARLY:
            rent_amount = current_lease.monthly_rent * 12
            period_start = current_lease.start_date
            period_end = period_start + timezone.timedelta(days=365)

        # Retrieve payments for the current period
        payments = RentPayment.objects.filter(
            lease=current_lease,
            payment_date__gte=period_start,
            payment_date__lte=period_end,
        )

        # Calculate total payments
        total_payments = sum(payment.amount for payment in payments)

        # Calculate remaining balance
        remaining_balance = rent_amount - total_payments

        return {
            "total_rent": float(rent_amount),
            "total_paid": float(total_payments),
            "remaining_balance": float(remaining_balance),
            "payment_status": (
                "PAID_IN_FULL"
                if remaining_balance <= 0
                else "PARTIALLY_PAID"
                if total_payments > 0
                else "NOT_PAID"
            ),
            "payment_period": payment_period,
            "period_start": period_start,
            "period_end": period_end,
        }

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
    property_id = serializers.UUIDField(write_only=True, required=False)
    unit_id = serializers.UUIDField(write_only=True, required=False)

    class Meta:
        model = Tenant
        fields = "__all__"
        read_only_fields = ["id", "created_at", "updated_at"]

    def validate(self, data):
        # Validate identification
        if data.get("identification_type") and not data.get("identification_number"):
            raise serializers.ValidationError(
                "Identification number is required when identification type is specified"
            )

        # Validate property and unit availability if property_id is provided
        property_id = data.get("property_id")
        if property_id:
            try:
                property_obj = Property.objects.get(id=property_id)

                # Check for available units
                available_units = Unit.objects.filter(
                    property=property_obj, is_occupied=False
                )

                if not available_units.exists():
                    raise serializers.ValidationError(
                        {"property_id": "No available units in this property"}
                    )

            except Property.DoesNotExist:
                raise serializers.ValidationError({"property_id": "Invalid property"})

        return data

    def generate_password(self):
        """Generate a secure random password"""
        chars = string.ascii_letters + string.digits + string.punctuation
        password = "".join(random.choice(chars) for _ in range(12))
        try:
            validate_password(password)
            return password
        except ValidationError:
            return self.generate_password()

    def create_user_account(self, tenant, password):
        """Create a user account for the tenant"""
        username = f"tenant_{tenant.id}"[:30]  # Ensure username length limit
        user = User.objects.create_user(
            username=username,
            email=tenant.email,
            password=password,
            first_name=tenant.first_name,
            last_name=tenant.last_name,
        )
        # Create associated profile
        Profile.objects.create(
            user=user,
            phone_number=tenant.phone_number,
            user_type=UserType.TENANT,
            identification_type=tenant.identification_type,
            identification_number=tenant.identification_number,
        )
        return username, password

    def send_credentials_email(self, tenant, username, password):
        """Send login credentials to tenant"""
        context = {
            "tenant_name": f"{tenant.first_name} {tenant.last_name}",
            "username": username,
            "password": password,
            "login_url": "https://yourdomain.com/login",  # Replace with actual URL
        }

        email_service = EmailService()
        email_service.send_email(
            recipient_email=tenant.email,
            recipient_name=f"{tenant.first_name} {tenant.last_name}",
            subject="Welcome to Our Portal - Your Login Credentials",
            template_name="emails/tenant_credentials.html",
            context=context,
        )

    def create(self, validated_data):
        property_id = validated_data.pop("property_id", None)
        tenant = Tenant.objects.create(**validated_data)

        # Create user account and send credentials if email is provided
        if tenant.email:
            password = self.generate_password()
            username, _ = self.create_user_account(tenant, password)
            self.send_credentials_email(tenant, username, password)

        # Handle lease creation if property_id provided
        if property_id:
            property_obj = Property.objects.get(id=property_id)
            unoccupied_unit = Unit.objects.filter(
                property=property_obj, is_occupied=False
            ).first()
            Lease.objects.create(
                tenant=tenant,
                unit=unoccupied_unit,
                start_date=timezone.now().date(),
                end_date=timezone.now().date() + timedelta(days=365),
                monthly_rent=unoccupied_unit.rent,
                security_deposit=0,
                status=LeaseStatus.PENDING,
            )
            unoccupied_unit.is_occupied = True
            unoccupied_unit.save()

        return tenant

    def update(self, instance, validated_data):
        property_id = validated_data.pop("property_id", None)

        # Update tenant fields
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        # Handle lease creation if property_id provided
        if property_id:
            # Check if tenant already has an active lease
            if instance.leases.filter(status=LeaseStatus.ACTIVE).exists():
                raise serializers.ValidationError(
                    {"property_id": "Tenant already has an active lease"}
                )

            property_obj = Property.objects.get(id=property_id)
            unoccupied_unit = Unit.objects.filter(
                property=property_obj, is_occupied=False
            ).first()

            Lease.objects.create(
                tenant=instance,
                unit=unoccupied_unit,
                start_date=timezone.now().date(),
                end_date=timezone.now().date() + timedelta(days=365),
                monthly_rent=unoccupied_unit.rent,
                security_deposit=0,
                status=LeaseStatus.PENDING,
            )

            unoccupied_unit.is_occupied = True
            unoccupied_unit.save()

        return instance


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
    Includes additional validation and automatic rent calculation
    """

    class Meta:
        model = Lease
        fields = "__all__"
        read_only_fields = [
            "id",
            "created_at",
            "updated_at",
            "previous_lease",
            "monthly_rent",
            "security_deposit",
        ]

    def validate(self, data):
        """
        Validate lease creation/update
        """
        # Ensure unit is provided
        unit = data.get("unit")
        if not unit:
            raise serializers.ValidationError("Unit is required")

        # Ensure unit is not already leased
        active_leases = Lease.objects.filter(unit=unit, status=LeaseStatus.ACTIVE)
        # Exclude current lease if it's an update
        if self.instance:
            active_leases = active_leases.exclude(pk=self.instance.pk)
        if active_leases.exists():
            raise serializers.ValidationError("This unit already has an active lease.")

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
        Custom create method to:
        1. Set monthly rent from unit's rent
        2. Set security deposit (e.g., as 1.5x monthly rent)
        3. Update unit occupancy
        """
        # Get the unit and its rent
        unit = validated_data.get("unit")

        # Set monthly rent directly from the unit
        validated_data["monthly_rent"] = unit.rent

        # Set security deposit (e.g., 1.5 times monthly rent)
        # You can adjust this multiplier as needed
        validated_data["security_deposit"] = unit.rent * Decimal("1.5")

        # Create lease
        lease = super().create(validated_data)

        # Update unit occupancy
        unit.is_occupied = True
        unit.save()

        return lease

    def update(self, instance, validated_data):
        """
        Custom update method similar to create
        """
        # Get the unit and its rent
        unit = validated_data.get("unit", instance.unit)

        # Update monthly rent from unit's rent
        validated_data["monthly_rent"] = unit.rent

        # Update security deposit
        validated_data["security_deposit"] = unit.rent * Decimal("1.5")

        # Update lease
        lease = super().update(instance, validated_data)

        # Update unit occupancy if needed
        if unit != instance.unit:
            # Update previous unit's occupancy
            instance.unit.is_occupied = False
            instance.unit.save()

            # Update new unit's occupancy
            unit.is_occupied = True
            unit.save()

        return lease


class LeaseTransferSerializer(serializers.Serializer):
    """
    Simplified serializer for transferring a lease to a new tenant while maintaining history
    """

    tenant = serializers.UUIDField(required=True)
    notes = serializers.CharField(required=False, allow_blank=True, allow_null=True)

    def validate_tenant(self, value):
        """
        Validate the tenant UUID and check if tenant exists
        """
        try:
            tenant = Tenant.objects.get(id=value)
            current_lease = self.context.get("current_lease")

            # Add debug logging
            print(
                f"Validating tenant: {tenant.id}, Current lease tenant: {current_lease.tenant.id}"
            )

            if tenant.id == current_lease.tenant.id:
                raise serializers.ValidationError(
                    "New tenant must be different from current tenant"
                )
            active_leases = Lease.objects.filter(
                tenant=tenant, status=LeaseStatus.ACTIVE
            ).exists()
            if active_leases:
                raise serializers.ValidationError(
                    "This tenant already has an active lease"
                )
            return tenant  # Returning Tenant instance
        except Tenant.DoesNotExist:
            raise serializers.ValidationError("Invalid tenant ID - tenant not found")

    def create(self, validated_data):
        """
        Create a new lease for the transferred unit while maintaining the same terms
        """
        current_lease = self.context.get("current_lease")

        new_lease = Lease.objects.create(
            tenant=validated_data["tenant"],  # Now this is already the Tenant instance
            unit=current_lease.unit,
            start_date=timezone.now().date(),
            end_date=current_lease.end_date,
            monthly_rent=current_lease.monthly_rent,
            security_deposit=current_lease.security_deposit,
            payment_period=current_lease.payment_period,
            status=LeaseStatus.ACTIVE,
            previous_lease=current_lease,
            notes=validated_data.get("notes", ""),
        )
        return new_lease


class MaintenanceRequestSerializer(serializers.ModelSerializer):
    class Meta:
        model = MaintenanceRequest
        fields = "__all__"
        read_only_fields = (
            "property",
            "tenant",
            "unit",
            "approved_rejected_by",
            "approved_rejected_date",
            "completed_date",
            "status",
            "repair_cost",
            "created_at",
            "updated_at",
        )

    def validate(self, data):
        if self.instance and self.instance.status == MaintenanceStatus.COMPLETED:
            raise serializers.ValidationError(
                "Cannot modify a completed maintenance request"
            )
        return data


class MaintenanceRequestCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = MaintenanceRequest
        fields = ["title", "description", "priority"]


class MaintenanceRequestCompleteSerializer(serializers.Serializer):
    repair_cost = serializers.DecimalField(max_digits=10, decimal_places=2)


class ChangePasswordSerializer(serializers.Serializer):
    old_password = serializers.CharField(required=True)
    new_password = serializers.CharField(required=True)

    def validate_new_password(self, value):
        """
        Validate the new password using Django's password validators
        """
        try:
            validate_password(value, self.context["user"])
        except ValidationError as e:
            raise serializers.ValidationError(list(e.messages))
        return value


class CommunicationHistorySerializer(serializers.ModelSerializer):
    sent_by = serializers.SerializerMethodField()

    class Meta:
        model = CommunicationHistory
        fields = "__all__"

    def get_sent_by(self, obj):
        if obj.sent_by:
            return {
                "id": obj.sent_by.id,
                "name": f"{obj.sent_by.user.first_name} {obj.sent_by.user.last_name}",
                "email": obj.sent_by.user.email,
            }
        return None


class StaffAccountSerializer(serializers.Serializer):
    first_name = serializers.CharField(max_length=100)
    last_name = serializers.CharField(max_length=100)
    email = serializers.EmailField()
    phone_number = serializers.CharField(max_length=20)
    user_type = serializers.ChoiceField(choices=["MANAGER", "CLERK"])
    identification_type = serializers.ChoiceField(choices=IdentificationType.choices)
    identification_number = serializers.CharField(max_length=50)
    property_id = serializers.UUIDField(required=True)  # New field

    def validate_property_id(self, value):
        try:
            property_obj = Property.objects.get(id=value)
            # Ensure the requesting user has access to this property
            request = self.context.get("request")
            user_profile = request.user.profile

            if user_profile.user_type == UserType.MANAGER:
                if not Property.objects.filter(id=value, manager=user_profile).exists():
                    raise serializers.ValidationError(
                        "You don't have permission to assign staff to this property"
                    )
            return value
        except Property.DoesNotExist:
            raise serializers.ValidationError("Invalid property ID")

    def validate_user_type(self, value):
        # Check if user has permission to create this user type
        request = self.context.get("request")
        user_profile = request.user.profile

        if user_profile.user_type == UserType.MANAGER and value == UserType.MANAGER:
            raise serializers.ValidationError("Managers cannot create other managers")

        return value

    def validate_email(self, value):
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError("This email is already registered")
        return value

    def generate_password(self):
        chars = string.ascii_letters + string.digits + string.punctuation
        password = "".join(random.choice(chars) for _ in range(12))
        try:
            validate_password(password)
            return password
        except ValidationError:
            return self.generate_password()

    def create_user_account(self, validated_data, password):
        property_id = validated_data.pop("property_id")
        username = f"{validated_data['user_type'].lower()}_{validated_data['email'].split('@')[0]}"[
            :30
        ]

        user = User.objects.create_user(
            username=username,
            email=validated_data["email"],
            password=password,
            first_name=validated_data["first_name"],
            last_name=validated_data["last_name"],
        )

        profile = Profile.objects.create(
            user=user,
            phone_number=validated_data["phone_number"],
            user_type=validated_data["user_type"],
            identification_type=validated_data["identification_type"],
            identification_number=validated_data["identification_number"],
        )

        # Associate with property
        property_obj = Property.objects.get(id=property_id)
        if validated_data["user_type"] == UserType.MANAGER:
            property_obj.manager = profile
            property_obj.save()

        return username, password

    def send_credentials_email(self, validated_data, username, password):
        context = {
            "name": f"{validated_data['first_name']} {validated_data['last_name']}",
            "username": username,
            "password": password,
            "login_url": "https://yourdomain.com/login",  # Replace with actual URL
            "user_type": validated_data["user_type"].capitalize(),
        }

        email_service = EmailService()
        email_service.send_email(
            recipient_email=validated_data["email"],
            recipient_name=f"{validated_data['first_name']} {validated_data['last_name']}",
            subject=f"Welcome to Our Portal - Your {validated_data['user_type'].capitalize()} Account Credentials",
            template_name="emails/staff_credentials.html",
            context=context,
        )


class StaffProfileSerializer(serializers.ModelSerializer):
    email = serializers.EmailField(source="user.email")
    first_name = serializers.CharField(source="user.first_name")
    last_name = serializers.CharField(source="user.last_name")
    property_info = serializers.SerializerMethodField()

    class Meta:
        model = Profile
        fields = [
            "id",
            "first_name",
            "last_name",
            "email",
            "phone_number",
            "user_type",
            "identification_type",
            "identification_number",
            "can_manage_properties",
            "can_add_units",
            "can_edit_units",
            "can_delete_units",
            "can_view_financial_data",
            "property_info",
        ]
        read_only_fields = ["id", "property_info"]

    def get_property_info(self, obj):
        if obj.user_type == UserType.MANAGER:
            properties = Property.objects.filter(manager=obj)
        else:
            # For clerks, find properties where their manager is assigned
            manager_properties = Property.objects.filter(
                manager__user_type=UserType.MANAGER
            )
            properties = (
                manager_properties.filter(manager=obj.manager) if obj.manager else []
            )

        return [
            {
                "id": str(prop.id),
                "name": prop.name,
                "address": f"{prop.address_line1}, {prop.city}",
            }
            for prop in properties
        ]


class RentPaymentSerializer(serializers.ModelSerializer):
    class Meta:
        model = RentPayment
        fields = ["id", "lease", "amount", "payment_date", "payment_method", "notes"]
        read_only_fields = ["id"]

    def validate(self, data):
        # Ensure the lease is active
        if data["lease"].status != LeaseStatus.ACTIVE:
            raise serializers.ValidationError(
                "Cannot record payment for inactive lease"
            )
        return data


class ReportLeaseSerializer(serializers.ModelSerializer):
    property_name = serializers.CharField(source="unit.property.name")
    unit_number = serializers.CharField(source="unit.unit_number")
    tenant_name = serializers.CharField(source="tenant.first_name")
    tenant_phone = serializers.CharField(source="tenant.phone_number")

    class Meta:
        model = Lease
        fields = [
            "id",
            "property_name",
            "unit_number",
            "tenant_name",
            "tenant_phone",
            "start_date",
            "end_date",
            "monthly_rent",
            "status",
            "payment_period",
        ]


class ReportPaymentSerializer(serializers.ModelSerializer):
    property_name = serializers.CharField(source="lease.unit.property.name")
    unit_number = serializers.CharField(source="lease.unit.unit_number")
    tenant_name = serializers.CharField(source="lease.tenant.first_name")

    class Meta:
        model = RentPayment
        fields = [
            "id",
            "property_name",
            "unit_number",
            "tenant_name",
            "amount",
            "payment_date",
            "payment_method",
        ]


class ReportMaintenanceSerializer(serializers.ModelSerializer):
    property_name = serializers.CharField(source="property.name")
    unit_number = serializers.CharField(source="unit.unit_number")
    tenant_name = serializers.CharField(source="tenant.first_name")

    class Meta:
        model = MaintenanceRequest
        fields = [
            "id",
            "property_name",
            "unit_number",
            "tenant_name",
            "title",
            "priority",
            "status",
            "requested_date",
            "completed_date",
            "repair_cost",
        ]
