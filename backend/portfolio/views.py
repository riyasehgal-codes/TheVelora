from rest_framework import status, viewsets
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Holding, Alert

from .serializers import (
    RegisterSerializer,
    HoldingSerializer,
    AlertSerializer,
)

from .market_data import (
    get_stock_price,
    get_exchange_rate,
    get_historical_prices,
)

from .forecast import get_forecast

from .news import get_stock_news


# ============================================================
# USER REGISTRATION
# ============================================================

class RegisterView(APIView):
    """
    Handles new user registration.
    """

    permission_classes = [AllowAny]

    def post(self, request):

        serializer = RegisterSerializer(
            data=request.data
        )

        if serializer.is_valid():

            serializer.save()

            return Response(
                {
                    "message": "User registered successfully."
                },
                status=status.HTTP_201_CREATED,
            )

        return Response(
            serializer.errors,
            status=status.HTTP_400_BAD_REQUEST,
        )


# ============================================================
# HOLDINGS
# ============================================================

class HoldingViewSet(viewsets.ModelViewSet):
    """
    Handles CRUD operations for portfolio holdings.

    Each user can only see and modify their own holdings.
    """

    serializer_class = HoldingSerializer

    permission_classes = [
        IsAuthenticated
    ]

    def get_queryset(self):

        return Holding.objects.filter(
            user=self.request.user
        ).order_by("-created_at")

    def perform_create(self, serializer):

        serializer.save(
            user=self.request.user
        )


# ============================================================
# ALERTS
# ============================================================

class AlertViewSet(viewsets.ModelViewSet):
    """
    Handles CRUD operations for stock price alerts.

    Each user can only see and modify their own alerts.
    """

    serializer_class = AlertSerializer

    permission_classes = [
        IsAuthenticated
    ]

    def get_queryset(self):

        return Alert.objects.filter(
            user=self.request.user
        ).order_by("-created_at")

    def perform_create(self, serializer):

        serializer.save(
            user=self.request.user
        )


# ============================================================
# BASIC API STATUS
# ============================================================

@api_view(["GET"])
@permission_classes([AllowAny])
def stock_status(request):

    return Response(
        {
            "status": "Velora API is running"
        }
    )


# ============================================================
# LIVE MARKET PRICE
# ============================================================

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def market_price(request, ticker):

    try:

        data = get_stock_price(
            ticker
        )

        return Response(data)

    except Exception as error:

        return Response(
            {
                "error": str(error)
            },
            status=status.HTTP_400_BAD_REQUEST,
        )


# ============================================================
# EXCHANGE RATE
# ============================================================

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def exchange_rate(
    request,
    from_currency,
    to_currency
):

    try:

        data = get_exchange_rate(
            from_currency,
            to_currency
        )

        return Response(data)

    except Exception as error:

        return Response(
            {
                "error": str(error)
            },
            status=status.HTTP_400_BAD_REQUEST,
        )


# ============================================================
# HISTORICAL PRICES
# ============================================================

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def historical_prices(
    request,
    ticker
):

    period = request.query_params.get(
        "period",
        "1mo"
    )

    try:

        data = get_historical_prices(
            ticker,
            period
        )

        return Response(data)

    except Exception as error:

        return Response(
            {
                "error": str(error)
            },
            status=status.HTTP_400_BAD_REQUEST,
        )


# ============================================================
# STOCK FORECAST
# ============================================================

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def forecast_stock(
    request,
    ticker
):

    try:

        data = get_forecast(
            ticker
        )

        return Response(data)

    except Exception as error:

        return Response(
            {
                "error": str(error)
            },
            status=status.HTTP_400_BAD_REQUEST,
        )


# ============================================================
# STOCK NEWS
# ============================================================

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def stock_news(
    request,
    ticker
):

    try:

        news = get_stock_news(
            ticker
        )

        return Response(
            {
                "ticker": ticker.upper(),
                "count": len(news),
                "news": news,
            }
        )

    except Exception as error:

        return Response(
            {
                "error": str(error)
            },
            status=status.HTTP_400_BAD_REQUEST,
        )