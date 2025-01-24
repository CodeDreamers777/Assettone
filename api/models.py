import uuid
from django.contrib.auth.models import User
from django.db import models
from django.core.exceptions import ValidationError
from django.utils.translation import gettext_lazy as _


class UserType(models.TextChoices):
    ADMIN = "ADMIN", "Property Owner"
    MANAGER = "MANAGER", "Property Manager"
    CLERK = "CLERK", "Clerk"
    TENANT = "TENANT", "Tenant"  # Added tenant type


class IdentificationType(models.TextChoices):
    NATIONAL_ID = "id", "National ID"
    PASSPORT = "passport", "Passport"
    WORK_PERMIT = "workPermit", "Work Permit"
    MILITARY_ID = "militaryId", "Military ID"
    DRIVERS_LICENSE = "driversLicense", "Driver's License"


class Profile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="profile")
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    phone_number = models.CharField(max_length=15, blank=True, null=True)
    last_session = models.DateTimeField(null=True, blank=True)
    user_type = models.CharField(
        max_length=10, choices=UserType.choices, default=UserType.CLERK
    )
    identification_type = models.CharField(
        max_length=20, choices=IdentificationType.choices, blank=True, null=True
    )
    identification_number = models.CharField(
        max_length=50, blank=True, null=True, unique=True
    )
    can_manage_properties = models.BooleanField(default=False)
    can_add_units = models.BooleanField(default=False)
    can_edit_units = models.BooleanField(default=False)
    can_delete_units = models.BooleanField(default=False)
    can_view_financial_data = models.BooleanField(default=False)

    def clean(self):
        if self.identification_type and not self.identification_number:
            raise ValidationError(
                "Identification number is required when identification type is specified"
            )
        if self.identification_number:
            existing_profiles = Profile.objects.filter(
                identification_number=self.identification_number
            ).exclude(pk=self.pk)
            if existing_profiles.exists():
                raise ValidationError("This identification number is already in use")


class UnitType(models.TextChoices):
    """
    Predefined unit types with option for custom type
    """

    STUDIO = "STUDIO", _("Studio Apartments")
    ONE_BEDROOM = "ONE_BEDROOM", _("One-Bedroom Apartments")
    TWO_BEDROOM = "TWO_BEDROOM", _("Two-Bedroom Apartments")
    THREE_BEDROOM = "THREE_BEDROOM", _("Three-Bedroom Apartments")
    PENTHOUSE = "PENTHOUSE", _("Penthouses")
    BEDSITTER = "BEDSITTER", _("Bedsitters")
    DUPLEX = "DUPLEX", _("Duplex Apartments")
    MAISONETTE = "MAISONETTE", _("Maisonettes")
    CUSTOM = "CUSTOM", _("Custom")


class PaymentPeriod(models.TextChoices):
    """
    Payment period options for rent
    """

    MONTHLY = "MONTHLY", _("Monthly")
    BIMONTHLY = "BIMONTHLY", _("Bi-Monthly")
    HALF_YEARLY = "HALF_YEARLY", _("Half Yearly")
    YEARLY = "YEARLY", _("Yearly")


class Property(models.Model):
    """
    Property model representing rental properties
    """

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=200)

    # Location details
    address_line1 = models.CharField(max_length=255)
    address_line2 = models.CharField(max_length=255, blank=True, null=True)
    city = models.CharField(max_length=100)
    state = models.CharField(max_length=100)
    postal_code = models.CharField(max_length=20)
    country = models.CharField(max_length=100)

    # Property ownership
    owner = models.ForeignKey(
        Profile,
        on_delete=models.CASCADE,
        related_name="owned_properties",
        limit_choices_to={"user_type": UserType.ADMIN},
    )

    # Optional manager assignment
    manager = models.ForeignKey(
        Profile,
        on_delete=models.SET_NULL,
        related_name="managed_properties",
        limit_choices_to={"user_type": UserType.MANAGER},
        blank=True,
        null=True,
    )

    # Additional property details
    total_units = models.PositiveIntegerField(default=0)
    description = models.TextField(blank=True, null=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.name} - {self.city}, {self.state}"

    def clean(self):
        """
        Validate property details
        """
        # Ensure postal code is not empty
        if not self.postal_code:
            raise ValidationError("Postal code is required")


class Unit(models.Model):
    """
    Unit model representing individual rental units within a property
    """

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    # Unique identifier for the unit within its property
    unit_number = models.CharField(max_length=50)

    # Relationship to Property
    property = models.ForeignKey(
        Property, on_delete=models.CASCADE, related_name="units"
    )

    # Unit type with custom option
    unit_type = models.CharField(
        max_length=50, choices=UnitType.choices, default=UnitType.STUDIO
    )

    # Custom unit type for CUSTOM option
    custom_unit_type = models.CharField(
        max_length=100,
        blank=True,
        null=True,
        help_text="Required if unit type is CUSTOM",
    )

    # Rent details
    rent = models.DecimalField(
        max_digits=10, decimal_places=2, help_text="Required monthly rent amount"
    )
    payment_period = models.CharField(
        max_length=20,
        choices=PaymentPeriod.choices,
        default=PaymentPeriod.MONTHLY,
        help_text="Rent payment period",
    )

    # Additional unit details
    floor = models.CharField(max_length=20, blank=True, null=True)
    square_footage = models.DecimalField(
        max_digits=10, decimal_places=2, blank=True, null=True
    )

    # Occupancy status
    is_occupied = models.BooleanField(default=False)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ("property", "unit_number")

    def __str__(self):
        return f"Unit {self.unit_number} - {self.property.name}"

    def clean(self):
        """
        Validate unit details
        """
        # Ensure unit number is unique within the property
        existing_units = Unit.objects.filter(
            property=self.property, unit_number=self.unit_number
        )

        # Exclude the current instance if this is an update
        if self.pk:
            existing_units = existing_units.exclude(pk=self.pk)

        if existing_units.exists():
            raise ValidationError("Unit number must be unique within the property")

        # Validate custom unit type
        if self.unit_type == UnitType.CUSTOM and not self.custom_unit_type:
            raise ValidationError(
                "Custom unit type name is required when unit type is CUSTOM"
            )


class TenantStatus(models.TextChoices):
    """
    Status choices for tenants
    """

    ACTIVE = "ACTIVE", _("Active")
    INACTIVE = "INACTIVE", _("Inactive")
    EVICTED = "EVICTED", _("Evicted")


class Tenant(models.Model):
    """
    Tenant model representing individuals renting a unit
    """

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    # Personal Information
    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100)
    email = models.EmailField(unique=True, blank=True, null=True)
    phone_number = models.CharField(max_length=20)

    # Identification
    identification_type = models.CharField(
        max_length=20, choices=IdentificationType.choices, blank=True, null=True
    )
    identification_number = models.CharField(
        max_length=50, blank=True, null=True, unique=True
    )

    # Employment and Income Details (Optional)
    occupation = models.CharField(max_length=100, blank=True, null=True)
    monthly_income = models.DecimalField(
        max_digits=10, decimal_places=2, blank=True, null=True
    )

    # Tenant Status
    status = models.CharField(
        max_length=20, choices=TenantStatus.choices, default=TenantStatus.INACTIVE
    )

    # Emergency Contact
    emergency_contact_name = models.CharField(max_length=100, blank=True, null=True)
    emergency_contact_phone = models.CharField(max_length=20, blank=True, null=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.first_name} {self.last_name}"

    def clean(self):
        """
        Validate tenant details
        """
        # Validate identification
        if self.identification_type and not self.identification_number:
            raise ValidationError(
                "Identification number is required when identification type is specified"
            )

        # Ensure unique identification number
        if self.identification_number:
            existing_tenants = Tenant.objects.filter(
                identification_number=self.identification_number
            ).exclude(pk=self.pk)
            if existing_tenants.exists():
                raise ValidationError("This identification number is already in use")


class LeaseStatus(models.TextChoices):
    """
    Status choices for leases
    """

    ACTIVE = "ACTIVE", _("Active")
    INACTIVE = "INACTIVE", _("INACTIVE")
    EXPIRED = "EXPIRED", _("Expired")
    TERMINATED = "TERMINATED", _("Terminated")
    PENDING = "PENDING", _("Pending")


class Lease(models.Model):
    """
    Lease model representing a tenant's rental agreement for a specific unit
    """

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    # Relationship to Unit and Tenant
    unit = models.ForeignKey(Unit, on_delete=models.CASCADE, related_name="leases")
    tenant = models.ForeignKey(Tenant, on_delete=models.CASCADE, related_name="leases")

    # Lease Terms
    start_date = models.DateField()
    end_date = models.DateField()

    # Rent Details
    monthly_rent = models.DecimalField(max_digits=10, decimal_places=2)
    security_deposit = models.DecimalField(max_digits=10, decimal_places=2)
    # Add payment period to lease
    payment_period = models.CharField(
        max_length=20,
        choices=PaymentPeriod.choices,
        default=PaymentPeriod.MONTHLY,
        help_text="Rent payment period for this lease",
    )

    # Lease Status
    status = models.CharField(
        max_length=20, choices=LeaseStatus.choices, default=LeaseStatus.ACTIVE
    )

    # Previous Lease (for lease transfers)
    previous_lease = models.ForeignKey(
        "self",
        on_delete=models.SET_NULL,
        blank=True,
        null=True,
        related_name="next_lease",
    )

    # Additional Lease Details
    lease_document = models.FileField(
        upload_to="lease_documents/", blank=True, null=True
    )
    notes = models.TextField(blank=True, null=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Lease for {self.tenant} - {self.unit}"

    def clean(self):
        """
        Validate lease details
        """
        # Ensure only one active lease per unit
        if self.status == LeaseStatus.ACTIVE:
            active_leases = Lease.objects.filter(
                unit=self.unit, status=LeaseStatus.ACTIVE
            ).exclude(pk=self.pk)

            if active_leases.exists():
                raise ValidationError(
                    "This unit already has an active lease. "
                    "Please terminate the existing lease first."
                )

        # Validate date range
        if self.start_date and self.end_date:
            if self.start_date >= self.end_date:
                raise ValidationError("End date must be after start date")

    def save(self, *args, **kwargs):
        """Override save to handle tenant and unit status updates"""
        is_new = not self.pk  # Check if this is a new instance
        if not is_new:
            try:
                old_instance = Lease.objects.get(pk=self.pk)
                old_status = old_instance.status
            except Lease.DoesNotExist:
                old_status = None
        else:
            old_status = None

        # Run clean() manually for new instances
        if is_new:
            self.clean()

        # Save the lease
        super().save(*args, **kwargs)

        # Handle status changes
        if is_new or self.status != old_status:
            self._update_related_statuses()

    def _update_related_statuses(self):
        """Update tenant and unit status based on lease status"""
        if self.status == LeaseStatus.ACTIVE:
            # When lease becomes active
            self.unit.is_occupied = True
            self.unit.save()
            self.tenant.status = TenantStatus.ACTIVE
            self.tenant.save()
        elif self.status in [
            LeaseStatus.TERMINATED,
            LeaseStatus.EXPIRED,
            LeaseStatus.INACTIVE,
        ]:
            # When lease is terminated/expired/inactive
            self.unit.is_occupied = False
            self.unit.save()

            # Only update tenant status if they don't have other active leases
            active_leases = Lease.objects.filter(
                tenant=self.tenant, status=LeaseStatus.ACTIVE
            ).exclude(pk=self.pk)

            if not active_leases.exists():
                self.tenant.status = TenantStatus.INACTIVE
                self.tenant.save()


class RentPayment(models.Model):
    """
    Model to track rent payments for a lease
    """

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    lease = models.ForeignKey(Lease, on_delete=models.CASCADE, related_name="payments")
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    payment_date = models.DateField()
    payment_method = models.CharField(max_length=50, blank=True, null=True)
    notes = models.TextField(blank=True, null=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Payment of {self.amount} for lease {self.lease}"


class MaintenanceStatus(models.TextChoices):
    PENDING = "PENDING", _("Pending")
    APPROVED = "APPROVED", _("Approved")
    REJECTED = "REJECTED", _("Rejected")
    IN_PROGRESS = "IN_PROGRESS", _("In Progress")
    COMPLETED = "COMPLETED", _("Completed")


class MaintenancePriority(models.TextChoices):
    LOW = "LOW", _("Low")
    MEDIUM = "MEDIUM", _("Medium")
    HIGH = "HIGH", _("High")
    EMERGENCY = "EMERGENCY", _("Emergency")


class MaintenanceRequest(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    # Relations
    unit = models.ForeignKey(
        "Unit", on_delete=models.CASCADE, related_name="maintenance_requests"
    )
    tenant = models.ForeignKey(
        "Tenant", on_delete=models.CASCADE, related_name="maintenance_requests"
    )
    property = models.ForeignKey(
        "Property", on_delete=models.CASCADE, related_name="maintenance_requests"
    )

    # Request details
    title = models.CharField(max_length=200)
    description = models.TextField()
    priority = models.CharField(
        max_length=20,
        choices=MaintenancePriority.choices,
        default=MaintenancePriority.MEDIUM,
    )

    # Status and dates
    status = models.CharField(
        max_length=20,
        choices=MaintenanceStatus.choices,
        default=MaintenanceStatus.PENDING,
    )
    requested_date = models.DateTimeField(auto_now_add=True)
    approved_rejected_date = models.DateTimeField(null=True, blank=True)
    completed_date = models.DateTimeField(null=True, blank=True)

    # Authorization
    approved_rejected_by = models.ForeignKey(
        "Profile",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="handled_maintenance_requests",
    )

    # Cost - only added upon completion
    repair_cost = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        null=True,
        blank=True,
        help_text="Cost of repair (filled upon completion)",
    )

    notes = models.TextField(null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def clean(self):
        if self.status in [MaintenanceStatus.APPROVED, MaintenanceStatus.REJECTED]:
            if not self.approved_rejected_by:
                raise ValidationError(
                    "Approver/Rejector must be specified when changing status"
                )

        if (
            self.status == MaintenanceStatus.COMPLETED
            and not self.approved_rejected_date
        ):
            raise ValidationError(
                "Maintenance request must be approved before marking as completed"
            )

    def __str__(self):
        return f"{self.title} - {self.unit} ({self.status})"


class CommunicationType(models.TextChoices):
    EMAIL = "EMAIL", "Email"
    SMS = "SMS", "SMS"
    NOTIFICATION = "NOTIFICATION", "In-App Notification"


class CommunicationHistory(models.Model):
    """
    Model to store all communications with tenants
    """

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    type = models.CharField(
        max_length=20,
        choices=CommunicationType.choices,
        default=CommunicationType.EMAIL,
    )
    subject = models.CharField(max_length=255)
    message = models.TextField()
    sent_by = models.ForeignKey(
        "Profile",
        on_delete=models.SET_NULL,
        null=True,
        related_name="sent_communications",
    )
    sent_at = models.DateTimeField(auto_now_add=True)

    # Store as JSON to handle multiple recipients
    recipients = models.JSONField(
        help_text="List of recipient details including ID, name, and email"
    )

    status = models.CharField(
        max_length=20,
        choices=[
            ("SUCCESS", "Success"),
            ("FAILED", "Failed"),
            ("PARTIAL", "Partial Success"),
        ],
        default="SUCCESS",
    )
    error_message = models.TextField(null=True, blank=True)

    def __str__(self):
        return f"{self.type} - {self.subject} ({self.sent_at})"
