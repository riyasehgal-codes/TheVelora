# serializers.py
from .models import Holding
from django.contrib.auth.models import User
from rest_framework import serializers


class RegisterSerializer(serializers.ModelSerializer):
    """
    Converts registration data from React into a Django User.
    """

    # Password should be write-only.
    # This means we can receive it, but never return it in an API response.
    password = serializers.CharField(write_only=True)

    class Meta:
        model = User

        # These are the fields React will send during registration.
        fields = ["username", "email", "password"]

    def create(self, validated_data):
        """
        Creates a new user using Django's built-in User model.
        """

        # create_user() automatically handles password hashing.
        user = User.objects.create_user(
            username=validated_data["username"],
            email=validated_data["email"],
            password=validated_data["password"],
        )

        return user
    
class HoldingSerializer(serializers.ModelSerializer):
    """
    Converts Holding model data into JSON
    and validates data coming from React.
    """

    class Meta:
        model = Holding

        # These are the fields React can work with.
        fields = [
            "id",
            "ticker",
            "quantity",
            "average_price",
            "created_at",
            "updated_at",
        ]

        # These fields are created automatically by Django.
        read_only_fields = [
            "id",
            "created_at",
            "updated_at",
        ]