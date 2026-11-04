from django.contrib.auth.models import User
from rest_framework import serializers

from .models import (
    Holding,
    Alert,
    ChatConversation,
    ChatMessage,
)


class RegisterSerializer(serializers.ModelSerializer):
    """
    Converts registration data from React into a Django User.
    """

    password = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ["username", "email", "password"]

    def create(self, validated_data):
        return User.objects.create_user(
            username=validated_data["username"],
            email=validated_data["email"],
            password=validated_data["password"],
        )


class HoldingSerializer(serializers.ModelSerializer):
    """
    Converts Holding model data into JSON.
    """

    class Meta:
        model = Holding
        fields = [
            "id",
            "ticker",
            "quantity",
            "average_price",
            "created_at",
            "updated_at",
        ]

        read_only_fields = [
            "id",
            "created_at",
            "updated_at",
        ]


class AlertSerializer(serializers.ModelSerializer):
    """
    Converts Alert model data into JSON.
    """

    class Meta:
        model = Alert
        fields = [
            "id",
            "ticker",
            "target_price",
            "condition",
            "triggered",
            "created_at",
            "triggered_at",
        ]

        read_only_fields = [
            "id",
            "triggered",
            "created_at",
            "triggered_at",
        ]


class ChatConversationSerializer(serializers.ModelSerializer):
    """
    Serializes conversation information.
    """

    class Meta:
        model = ChatConversation
        fields = [
            "id",
            "title",
            "created_at",
            "updated_at",
        ]

        read_only_fields = [
            "id",
            "created_at",
            "updated_at",
        ]


class ChatMessageSerializer(serializers.ModelSerializer):
    """
    Serializes individual chat messages.
    """

    class Meta:
        model = ChatMessage
        fields = [
            "id",
            "role",
            "content",
            "created_at",
        ]

        read_only_fields = [
            "id",
            "role",
            "created_at",
        ]