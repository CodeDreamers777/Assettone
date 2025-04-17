# admin_api/serializers.py

from django.contrib.auth.models import User
from rest_framework import serializers
from api.models import Profile, UserType, Property


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = [
            "id",
            "username",
            "email",
            "first_name",
            "last_name",
            "is_active",
            "date_joined",
            "last_login",
        ]
        read_only_fields = ["date_joined", "last_login"]


class ProfileSerializer(serializers.ModelSerializer):
    user = UserSerializer()
    properties_count = serializers.SerializerMethodField()

    class Meta:
        model = Profile
        fields = [
            "id",
            "user",
            "phone_number",
            "last_session",
            "user_type",
            "identification_type",
            "identification_number",
            "properties_count",
        ]

    def get_properties_count(self, obj):
        if obj.user_type == UserType.ADMIN:
            return Property.objects.filter(owner=obj).count()
        return 0


class LandlordCreateSerializer(serializers.Serializer):
    username = serializers.CharField(max_length=150)
    email = serializers.EmailField()
    first_name = serializers.CharField(max_length=150)
    last_name = serializers.CharField(max_length=150)
    password = serializers.CharField(write_only=True, style={"input_type": "password"})
    phone_number = serializers.CharField(
        max_length=15, required=False, allow_blank=True
    )
    identification_type = serializers.ChoiceField(
        choices=Profile.identification_type.field.choices,
        required=False,
        allow_blank=True,
    )
    identification_number = serializers.CharField(
        max_length=50, required=False, allow_blank=True
    )

    def validate_username(self, value):
        if User.objects.filter(username=value).exists():
            raise serializers.ValidationError("Username already exists")
        return value

    def validate_email(self, value):
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError("Email already exists")
        return value

    def create(self, validated_data):
        user = User.objects.create_user(
            username=validated_data["username"],
            email=validated_data["email"],
            first_name=validated_data["first_name"],
            last_name=validated_data["last_name"],
            password=validated_data["password"],
        )

        profile = Profile.objects.create(
            user=user,
            phone_number=validated_data.get("phone_number", ""),
            user_type=UserType.ADMIN,
            identification_type=validated_data.get("identification_type", None),
            identification_number=validated_data.get("identification_number", None),
            can_manage_properties=True,
            can_add_units=True,
            can_edit_units=True,
            can_view_financial_data=True,
        )

        return profile


class LandlordUpdateSerializer(serializers.Serializer):
    first_name = serializers.CharField(max_length=150, required=False)
    last_name = serializers.CharField(max_length=150, required=False)
    email = serializers.EmailField(required=False)
    phone_number = serializers.CharField(
        max_length=15, required=False, allow_blank=True
    )
    identification_type = serializers.ChoiceField(
        choices=Profile.identification_type.field.choices,
        required=False,
        allow_blank=True,
    )
    identification_number = serializers.CharField(
        max_length=50, required=False, allow_blank=True
    )
    is_active = serializers.BooleanField(required=False)

    def validate_email(self, value):
        user = self.context["user"]
        if User.objects.exclude(pk=user.pk).filter(email=value).exists():
            raise serializers.ValidationError("Email already exists")
        return value

    def update(self, instance, validated_data):
        user = instance.user

        # Update User model fields
        if "first_name" in validated_data:
            user.first_name = validated_data["first_name"]
        if "last_name" in validated_data:
            user.last_name = validated_data["last_name"]
        if "email" in validated_data:
            user.email = validated_data["email"]
        if "is_active" in validated_data:
            user.is_active = validated_data["is_active"]

        user.save()

        # Update Profile model fields
        if "phone_number" in validated_data:
            instance.phone_number = validated_data["phone_number"]
        if "identification_type" in validated_data:
            instance.identification_type = validated_data["identification_type"]
        if "identification_number" in validated_data:
            instance.identification_number = validated_data["identification_number"]

        instance.save()
        return instance


class PropertySerializer(serializers.ModelSerializer):
    owner_name = serializers.SerializerMethodField()
    manager_name = serializers.SerializerMethodField()
    city = serializers.CharField(required=True)
    total_units = serializers.IntegerField(read_only=True)  # Will be calculated

    class Meta:
        model = Property
        fields = [
            "id",
            "name",
            "logo",
            "address_line1",
            "address_line2",
            "city",
            "state",
            "postal_code",
            "country",
            "owner",
            "owner_name",
            "manager",
            "manager_name",
            "total_units",
            "description",
            "created_at",
            "updated_at",
        ]

    def get_owner_name(self, obj):
        if obj.owner and obj.owner.user:
            return f"{obj.owner.user.first_name} {obj.owner.user.last_name}"
        return None

    def get_manager_name(self, obj):
        if obj.manager and obj.manager.user:
            return f"{obj.manager.user.first_name} {obj.manager.user.last_name}"
        return None


class PropertyCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Property
        fields = [
            "name",
            "logo",
            "address_line1",
            "address_line2",
            "city",
            "state",
            "postal_code",
            "country",
            "owner",
            "manager",
            "description",
        ]

    def validate_owner(self, value):
        if value.user_type != UserType.ADMIN:
            raise serializers.ValidationError("Owner must be a property owner (ADMIN)")
        return value

    def validate_manager(self, value):
        if value and value.user_type != UserType.MANAGER:
            raise serializers.ValidationError("Manager must have MANAGER user type")
        return value


class PropertyUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Property
        fields = [
            "name",
            "logo",
            "address_line1",
            "address_line2",
            "city",
            "state",
            "postal_code",
            "country",
            "manager",
            "description",
        ]

    def validate_manager(self, value):
        if value and value.user_type != UserType.MANAGER:
            raise serializers.ValidationError("Manager must have MANAGER user type")
        return value
