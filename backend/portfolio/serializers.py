
from django.contrib.auth.models import User
from rest_framework import serializers
from rest_framework.exceptions import APIException

from .models import (
    Holding,
    Alert,
    ChatConversation,
    ChatMessage,
)

from .market_data import (
    validate_ticker,
    InvalidTickerError,
    MarketDataUnavailableError,
)


class MarketDataUnavailableAPIException(APIException):
    status_code = 503
    default_detail = (
        "The market data service is temporarily unavailable. "
        "Please try again."
    )
    default_code = "market_data_unavailable"


class RegisterSerializer(serializers.ModelSerializer):

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

    def validate_ticker(self, value):
        ticker = value.strip().upper()

        try:
            validate_ticker(ticker)

        except InvalidTickerError as error:
            raise serializers.ValidationError(str(error))

        except MarketDataUnavailableError as error:
            raise MarketDataUnavailableAPIException(str(error))

        return ticker


class AlertSerializer(serializers.ModelSerializer):

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
