import uuid
from urllib.parse import urlencode
import base64
import json
import string
import random
from django.contrib.auth.models import User
from django.db import models
from django.core.exceptions import ValidationError
from django.utils.translation import gettext_lazy as _
from .utils.send_mail import EmailService
from .utils.create_lease_document import LeaseDocumentGenerator
from django.core.files.storage import default_storage
from django.utils import timezone
from datetime import timedelta


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
    # Password reset fields
    reset_otp = models.CharField(max_length=6, blank=True, null=True)
    reset_otp_expiry = models.DateTimeField(blank=True, null=True)

    # Permission fields
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

    def generate_otp(self):
        """Generate a 6-digit OTP and set expiry to 15 minutes from now"""
        import random

        self.reset_otp = "".join(random.choices("0123456789", k=6))
        self.reset_otp_expiry = timezone.now() + timezone.timedelta(minutes=15)
        self.save()
        return self.reset_otp

    def clear_otp(self):
        """Clear OTP after verification"""
        self.reset_otp = None
        self.reset_otp_expiry = None
        self.save()

    def is_otp_valid(self, otp):
        """Check if the provided OTP is valid and not expired"""
        if not self.reset_otp or not self.reset_otp_expiry:
            return False

        if self.reset_otp != otp:
            return False

        if timezone.now() > self.reset_otp_expiry:
            # OTP expired, clear it
            self.clear_otp()
            return False

        return True


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
    logo = models.ImageField(
        upload_to="property_logos/",
        null=True,
        blank=True,
        help_text="Upload a logo image for this property",
    )

    # Location details
    address_line1 = models.CharField(max_length=255)
    code = models.CharField(
        max_length=10,
        unique=True,
        null=True,
        help_text="Unique code for M-Pesa integration",
    )
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

    def delete(self, *args, **kwargs):
        """
        Override delete method to remove logo file when property is deleted
        """
        # Delete the logo file if it exists
        if self.logo:
            default_storage.delete(self.logo.path)
        super().delete(*args, **kwargs)


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

    water_units_used = models.DecimalField(
        max_digits=8,
        decimal_places=2,
        default=2.00,
        help_text="Water units consumed this month (defaults to 2 units)",
    )
    water_price_per_unit = models.DecimalField(
        max_digits=8, decimal_places=2, default=0.00, help_text="Price per water unit"
    )
    water_bill_last_updated = models.DateField(
        null=True, blank=True, help_text="Date when water bill was last updated"
    )

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

    def get_current_water_bill(self):
        """Calculate current water bill amount"""
        from decimal import Decimal

        water_units = Decimal(str(self.water_units_used))
        price_per_unit = Decimal(str(self.water_price_per_unit))
        return water_units * price_per_unit

    def reset_water_units_if_needed(self):
        """Reset water units to default if not updated this month"""
        from django.utils import timezone

        today = timezone.now().date()
        current_month_start = today.replace(day=1)

        # If water bill hasn't been updated this month, reset to default
        if (
            not self.water_bill_last_updated
            or self.water_bill_last_updated < current_month_start
        ):
            from decimal import Decimal

            self.water_units_used = Decimal("2.00")
            return True
        return False


class WaterBillUpdate(models.Model):
    """Track monthly water bill updates for units"""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    unit = models.ForeignKey(
        Unit, on_delete=models.CASCADE, related_name="water_updates"
    )

    # Water consumption details
    units_used = models.DecimalField(
        max_digits=8, decimal_places=2, help_text="Water units consumed"
    )
    price_per_unit = models.DecimalField(
        max_digits=8, decimal_places=2, help_text="Price per water unit"
    )
    total_amount = models.DecimalField(
        max_digits=10, decimal_places=2, help_text="Total water bill amount"
    )

    # Period details
    billing_month = models.DateField(help_text="Month for this water bill")

    # Metadata
    updated_by = models.ForeignKey(
        Profile, on_delete=models.SET_NULL, null=True, related_name="water_bill_updates"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ("unit", "billing_month")

    def save(self, *args, **kwargs):
        """Override save to update unit's current water bill"""
        from decimal import Decimal

        units = Decimal(str(self.units_used))
        price = Decimal(str(self.price_per_unit))
        self.total_amount = units * price

        # Update the unit's current water bill
        self.unit.water_units_used = self.units_used
        self.unit.water_price_per_unit = self.price_per_unit
        self.unit.water_bill_last_updated = self.billing_month
        self.unit.save()

        super().save(*args, **kwargs)

    def __str__(self):
        return f"Water Bill - {self.unit} - {self.billing_month.strftime('%B %Y')}"


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
    property = models.ForeignKey(
        Property,
        on_delete=models.SET_NULL,
        null=True,
        related_name="tenants",
        help_text="Property association for tenants without units",
    )

    # Personal Information
    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100)
    email = models.EmailField(unique=True, blank=True, null=True)
    phone_number = models.CharField(max_length=100)

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

    # Account number for payments
    account_number = models.CharField(max_length=50, blank=True, null=True)

    # Additional Lease Details
    lease_document = models.FileField(
        upload_to="lease_documents/", blank=True, null=True
    )
    notes = models.TextField(blank=True, null=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    # E-signing fields
    is_signed = models.BooleanField(default=False)
    signing_token = models.UUIDField(unique=True, null=True, blank=True)
    signed_at = models.DateTimeField(null=True, blank=True)
    signature_document = models.FileField(
        upload_to="signed_lease_documents/", blank=True, null=True
    )

    def generate_account_number(self):
        """Generate the account number for payments"""
        if not self.unit or not self.unit.property:
            return None

        # Always use the first three letters of property name in uppercase
        property_prefix = self.unit.property.name[:3].upper()

        # Generate account number using property prefix and unit number
        return f"{property_prefix}-{self.unit.unit_number}"

    def get_payment_account_number(self):
        """Get the account number, generating it if not already set"""
        if not self.account_number:
            self.account_number = self.generate_account_number()
            # Save only if the model instance already exists in the database
            if self.pk:
                self.save(update_fields=["account_number"])
        return self.account_number

    def send_lease_signing_email(self):
        """
        Send lease signing email with encoded lease details in URL
        """
        print("---was called to send email----")
        # Ensure account number is generated before sending email
        if not self.account_number:
            self.account_number = self.generate_account_number()
            # Save only if it has a primary key (i.e., already saved to the database)
            if self.pk:
                self.save(update_fields=["account_number"])

        # Compile lease details using only existing fields
        lease_data = {
            "lease_id": str(self.id),
            "signing_token": str(self.signing_token),
            "account_number": self.account_number,  # Include account number in email data
            "tenant": {
                "first_name": self.tenant.first_name,
                "last_name": self.tenant.last_name,
                "email": self.tenant.email,
                "phone_number": self.tenant.phone_number,
            },
            "unit": {
                "unit_number": self.unit.unit_number,
                "unit_type": self.unit.unit_type,
                "floor": self.unit.floor,
                "square_footage": str(self.unit.square_footage)
                if self.unit.square_footage
                else None,
            },
            "property": {
                "name": self.unit.property.name,
                "address_line1": self.unit.property.address_line1,
                "address_line2": self.unit.property.address_line2,
                "city": self.unit.property.city,
                "state": self.unit.property.state,
                "postal_code": self.unit.property.postal_code,
            },
            "lease_terms": {
                "start_date": self.start_date.isoformat(),
                "end_date": self.end_date.isoformat(),
                "monthly_rent": str(self.monthly_rent),
                "security_deposit": str(self.security_deposit),
                "payment_period": self.payment_period,
            },
        }

        # Encode lease data
        encoded_data = base64.urlsafe_b64encode(
            json.dumps(lease_data).encode()
        ).decode()

        # Generate signing URL with encoded data
        signing_url = f"https://assettone-rental-management.vercel.app/lease-signing?data={encoded_data}"

        # Prepare email context
        context = {
            "tenant_name": f"{self.tenant.first_name} {self.tenant.last_name}",
            "lease_url": signing_url,
            "property_name": self.unit.property.name,
            "unit_number": self.unit.unit_number,
        }
        print(context)

        # Send email
        email_service = EmailService()
        email_service.send_email(
            recipient_email=self.tenant.email,
            recipient_name=f"{self.tenant.first_name} {self.tenant.last_name}",
            subject=f"Lease Agreement for {self.unit.property.name} - Unit {self.unit.unit_number}",
            template_name="emails/lease_signing.html",
            context=context,
        )

    def create_initial_rent_period(self):
        """Creates the initial rent period for a new lease"""
        from django.utils import timezone
        from datetime import datetime
        from dateutil.relativedelta import relativedelta

        today = timezone.now().date()

        # Determine period start date - use first day of current month
        # or lease start date if it's in the current month
        current_month_start = today.replace(day=1)

        if self.start_date.month == today.month and self.start_date.year == today.year:
            start_date = self.start_date
        else:
            start_date = current_month_start

        # Calculate base rent amount and end date based on payment period
        if self.payment_period == PaymentPeriod.MONTHLY:
            next_month = start_date.replace(day=28) + relativedelta(days=4)
            end_date = next_month.replace(day=1) - relativedelta(days=1)
            base_rent_amount = self.monthly_rent
        elif self.payment_period == PaymentPeriod.BIMONTHLY:
            end_date = start_date + relativedelta(months=2) - relativedelta(days=1)
            base_rent_amount = self.monthly_rent * 2
        elif self.payment_period == PaymentPeriod.HALF_YEARLY:
            end_date = start_date + relativedelta(months=6) - relativedelta(days=1)
            base_rent_amount = self.monthly_rent * 6
        elif self.payment_period == PaymentPeriod.YEARLY:
            end_date = start_date + relativedelta(years=1) - relativedelta(days=1)
            base_rent_amount = self.monthly_rent * 12
        else:
            # Default to monthly
            next_month = start_date.replace(day=28) + relativedelta(days=4)
            end_date = next_month.replace(day=1) - relativedelta(days=1)
            base_rent_amount = self.monthly_rent

        # Get water bill information
        unit_reset_needed = self.unit.reset_water_units_if_needed()
        if unit_reset_needed:
            self.unit.save()

        water_bill_amount = self.unit.get_current_water_bill()
        water_units_used = self.unit.water_units_used

        # Calculate total amount due (rent + water bill)
        total_amount_due = base_rent_amount + water_bill_amount

        # Check if a rent period already exists for this lease and date range
        from .models import RentPeriodStatus

        existing_period = RentPeriodStatus.objects.filter(
            lease=self, period_start_date__lte=start_date, period_end_date__gte=end_date
        ).first()

        if not existing_period:
            RentPeriodStatus.objects.create(
                lease=self,
                period_start_date=start_date,
                period_end_date=end_date,
                amount_due=total_amount_due,  # This now includes water bill
                amount_paid=0,
                is_paid=False,
                water_bill_amount=water_bill_amount,
                water_units_used=water_units_used,
            )

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
        """Override save to handle tenant and unit status updates and account number generation"""
        is_new = not self.pk  # Check if this is a new instance

        # Generate account number if not already set
        if not self.account_number:
            self.account_number = self.generate_account_number()

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
    WHATSAPP = "WHATSAPP", "WhatsApp"


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


class PaymentMethod(models.TextChoices):
    CASH = "CASH", _("Cash")
    BANK_TRANSFER = "BANK_TRANSFER", _("Bank Transfer")
    CREDIT_CARD = "CREDIT_CARD", _("Credit Card")
    MOBILE_MONEY = "MOBILE_MONEY", _("Mobile Money")
    CHECK = "CHECK", _("Check")
    OTHER = "OTHER", _("Other")


class RentPeriodStatus(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    lease = models.ForeignKey(
        Lease, on_delete=models.CASCADE, related_name="rent_periods"
    )
    period_start_date = models.DateField()
    period_end_date = models.DateField()
    amount_due = models.DecimalField(max_digits=10, decimal_places=2)
    amount_paid = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    is_paid = models.BooleanField(default=False)
    # Water bill for this period
    water_bill_amount = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=0.00,
        help_text="Water bill amount for this rental period",
    )
    water_units_used = models.DecimalField(
        max_digits=8,
        decimal_places=2,
        default=2.00,
        help_text="Water units used during this period",
    )

    class Meta:
        unique_together = ("lease", "period_start_date", "period_end_date")

    def __str__(self):
        return f"{self.lease} - {self.period_start_date} to {self.period_end_date}"

    def get_total_amount_due(self):
        """Get total amount due including rent and water bill"""
        from decimal import Decimal

        rent_amount = Decimal(str(self.amount_due))
        water_amount = Decimal(str(self.water_bill_amount))
        return rent_amount + water_amount

    def update_payment_status(self):
        """Update payment status based on total amount due (rent + water bill)"""
        from decimal import Decimal

        # Get total amount due including water bill
        total_due = self.get_total_amount_due()
        amount_paid = Decimal(str(self.amount_paid))

        self.is_paid = amount_paid >= total_due
        self.save()


class ExpenseCategory(models.TextChoices):
    """
    Predefined expense categories common in property management
    """

    MAINTENANCE = "MAINTENANCE", _("Maintenance")
    REPAIRS = "REPAIRS", _("Repairs")
    UTILITIES = "UTILITIES", _("Utilities")
    TAXES = "TAXES", _("Property Taxes")
    INSURANCE = "INSURANCE", _("Insurance")
    CLEANING = "CLEANING", _("Cleaning")
    LANDSCAPING = "LANDSCAPING", _("Landscaping")
    MANAGEMENT = "MANAGEMENT", _("Management Fees")
    LEGAL = "LEGAL", _("Legal Fees")
    ADVERTISING = "ADVERTISING", _("Advertising")
    SUPPLIES = "SUPPLIES", _("Supplies")
    RENOVATION = "RENOVATION", _("Renovation")
    MORTGAGE = "MORTGAGE", _("Mortgage")
    OTHER = "OTHER", _("Other")


class Expense(models.Model):
    """
    Model for tracking property-related expenses
    """

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    # Core expense details
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True, null=True)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    expense_date = models.DateField()
    category = models.CharField(
        max_length=20, choices=ExpenseCategory.choices, default=ExpenseCategory.OTHER
    )

    # Custom category name for OTHER
    custom_category = models.CharField(
        max_length=100, blank=True, null=True, help_text="Required if category is OTHER"
    )

    # Related entities - property is required, unit and tenant are optional
    property = models.ForeignKey(
        "Property", on_delete=models.CASCADE, related_name="expenses"
    )
    unit = models.ForeignKey(
        "Unit",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="expenses",
    )
    tenant = models.ForeignKey(
        "Tenant",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="expenses",
    )

    # Payment details
    payment_method = models.CharField(
        max_length=20, choices=PaymentMethod.choices, default=PaymentMethod.CASH
    )

    # Vendor information
    vendor_name = models.CharField(max_length=200, blank=True, null=True)
    vendor_contact = models.CharField(max_length=100, blank=True, null=True)

    # Receipt/invoice tracking
    receipt_number = models.CharField(max_length=100, blank=True, null=True)
    receipt_file = models.FileField(
        upload_to="expense_receipts/",
        blank=True,
        null=True,
        help_text="Upload receipt or invoice",
    )

    # Tax deductible flag for financial reporting
    is_tax_deductible = models.BooleanField(default=True)

    # Metadata
    created_by = models.ForeignKey(
        "Profile", on_delete=models.SET_NULL, null=True, related_name="created_expenses"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.title} - {self.property.name} (${self.amount})"

    def clean(self):
        """
        Validate expense details
        """
        from django.core.exceptions import ValidationError

        # Validate custom category
        if self.category == ExpenseCategory.OTHER and not self.custom_category:
            raise ValidationError(
                "Custom category name is required when category is OTHER"
            )

        # Ensure unit belongs to property if specified
        if self.unit and self.unit.property != self.property:
            raise ValidationError("Unit must belong to the specified property")

        # Ensure tenant has a lease in the property if specified
        if self.tenant:
            has_lease = self.tenant.leases.filter(
                unit__property=self.property, status="ACTIVE"
            ).exists()

            if not has_lease:
                raise ValidationError(
                    "Tenant must have an active lease in the specified property"
                )


class MpesaTransaction(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    transaction_id = models.CharField(max_length=30, unique=True)
    phone_number = models.CharField(max_length=100)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    account_number = models.CharField(max_length=50)
    transaction_date = models.DateTimeField()
    processed = models.BooleanField(default=False)

    # Will be populated after processing
    property = models.ForeignKey(
        "Property", on_delete=models.SET_NULL, null=True, blank=True
    )
    unit = models.ForeignKey("Unit", on_delete=models.SET_NULL, null=True, blank=True)
    tenant = models.ForeignKey(
        "Tenant", on_delete=models.SET_NULL, null=True, blank=True
    )
    rent_period = models.ForeignKey(
        "RentPeriodStatus", on_delete=models.SET_NULL, null=True, blank=True
    )

    # Additional fields for error handling
    processing_error = models.TextField(null=True, blank=True)
    processing_attempts = models.IntegerField(default=0)
    last_attempt = models.DateTimeField(null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.transaction_id} - {self.amount} - {self.account_number}"


class PaymentReceipt(models.Model):
    code = models.CharField(max_length=8, unique=True, db_index=True)

    # Store all payment data as JSON for simplicity
    payment_data = models.JSONField()

    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()
    accessed_count = models.IntegerField(default=0)

    class Meta:
        db_table = "payment_receipts"

    @classmethod
    def generate_code(cls):
        """Generate unique 6-character code"""
        chars = string.ascii_uppercase + string.digits
        while True:
            code = "".join(random.choice(chars) for _ in range(6))
            if not cls.objects.filter(code=code).exists():
                return code

    def save(self, *args, **kwargs):
        if not self.code:
            self.code = self.generate_code()
        if not self.expires_at:
            self.expires_at = timezone.now() + timedelta(days=30)
        super().save(*args, **kwargs)
