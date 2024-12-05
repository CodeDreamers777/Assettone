from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.contrib.auth.models import User
from .models import Profile, Property, Unit, Tenant, Lease
from django.utils.translation import gettext_lazy as _


class ProfileInline(admin.StackedInline):
    """
    Inline admin configuration for Profile model
    Allows editing Profile details within the User admin page
    """

    model = Profile
    can_delete = False
    verbose_name_plural = "Profile"
    extra = 0

    # Limit fields shown in inline to keep the interface clean
    fields = (
        "phone_number",
        "user_type",
        "identification_type",
        "identification_number",
        ("can_manage_properties", "can_view_financial_data"),
        ("can_add_units", "can_edit_units", "can_delete_units"),
    )


class CustomUserAdmin(BaseUserAdmin):
    """
    Custom User admin that includes Profile information
    """

    inlines = (ProfileInline,)
    list_display = (
        "username",
        "email",
        "first_name",
        "last_name",
        "is_staff",
        "get_user_type",
    )
    list_filter = ("is_staff", "is_superuser", "profile__user_type")

    def get_user_type(self, obj):
        """
        Display user type in the admin list view
        """
        return obj.profile.user_type if hasattr(obj, "profile") else "N/A"

    get_user_type.short_description = "User Type"


class PropertyAdmin(admin.ModelAdmin):
    """
    Admin configuration for Property model
    """

    list_display = (
        "name",
        "city",
        "state",
        "country",
        "owner",
        "manager",
        "total_units",
    )
    list_filter = (
        "city",
        "state",
        "country",
        "owner__user__username",
        "manager__user__username",
    )
    search_fields = (
        "name",
        "address_line1",
        "address_line2",
        "city",
        "state",
        "postal_code",
    )
    readonly_fields = ("created_at", "updated_at")


class UnitAdmin(admin.ModelAdmin):
    """
    Admin configuration for Unit model
    """

    list_display = (
        "unit_number",
        "property",
        "unit_type",
        "rent",
        "payment_period",
        "is_occupied",
    )
    list_filter = ("unit_type", "payment_period", "is_occupied", "property__name")
    search_fields = ("unit_number", "property__name", "custom_unit_type")
    readonly_fields = ("created_at", "updated_at")

    # Custom display for units with custom type
    def get_unit_type_display(self, obj):
        """
        Display custom unit type if applicable
        """
        if obj.unit_type == "CUSTOM":
            return obj.custom_unit_type
        return obj.get_unit_type_display()


# Unregister the default User admin and register our custom one
admin.site.unregister(User)
admin.site.register(User, CustomUserAdmin)

# Register the Property and Unit models with their custom admin classes
admin.site.register(Property, PropertyAdmin)
admin.site.register(Unit, UnitAdmin)


@admin.register(Profile)
class ProfileAdmin(admin.ModelAdmin):
    """
    Admin configuration for Profile model
    """

    list_display = (
        "get_username",
        "user_type",
        "phone_number",
        "identification_type",
        "identification_number",
    )
    list_filter = (
        "user_type",
        "identification_type",
        "can_manage_properties",
        "can_view_financial_data",
    )
    search_fields = (
        "user__username",
        "user__first_name",
        "user__last_name",
        "user__email",
        "phone_number",
        "identification_number",
    )

    def get_username(self, obj):
        """
        Display full name or username in the admin list view
        """
        user = obj.user
        return f"{user.get_full_name()} ({user.username})"

    get_username.short_description = "User"

    # Customize the form to show detailed permissions
    fieldsets = (
        (
            "User Information",
            {
                "fields": (
                    "user",
                    "phone_number",
                    "identification_type",
                    "identification_number",
                )
            },
        ),
        ("User Type", {"fields": ("user_type",)}),
        (
            "Permissions",
            {
                "fields": (
                    "can_manage_properties",
                    "can_add_units",
                    "can_edit_units",
                    "can_delete_units",
                    "can_view_financial_data",
                )
            },
        ),
    )


@admin.register(Tenant)
class TenantAdmin(admin.ModelAdmin):
    """
    Admin configuration for Tenant model
    """

    list_display = (
        "first_name",
        "last_name",
        "email",
        "phone_number",
        "status",
        "created_at",
    )
    list_filter = ("status", "created_at")
    search_fields = (
        "first_name",
        "last_name",
        "email",
        "phone_number",
        "identification_number",
    )

    def get_readonly_fields(self, request, obj=None):
        """
        Make identification number read-only after creation
        """
        if obj:  # editing an existing object
            return self.readonly_fields + ("identification_number",)
        return self.readonly_fields


@admin.register(Lease)
class LeaseAdmin(admin.ModelAdmin):
    """
    Admin configuration for Lease model
    """

    list_display = (
        "get_tenant_name",
        "get_unit_details",
        "start_date",
        "end_date",
        "status",
        "monthly_rent",
    )
    list_filter = ("status", "start_date", "end_date")
    search_fields = (
        "tenant__first_name",
        "tenant__last_name",
        "unit__unit_number",
        "unit__property__name",
    )

    def get_tenant_name(self, obj):
        """
        Display tenant's full name in admin list
        """
        return f"{obj.tenant.first_name} {obj.tenant.last_name}"

    get_tenant_name.short_description = _("Tenant Name")

    def get_unit_details(self, obj):
        """
        Display unit and property details in admin list
        """
        return f"{obj.unit.unit_number} - {obj.unit.property.name}"

    get_unit_details.short_description = _("Unit Details")

    def get_readonly_fields(self, request, obj=None):
        """
        Make certain fields read-only after creation
        """
        if obj:  # editing an existing object
            return self.readonly_fields + ("unit", "tenant")
        return self.readonly_fields
