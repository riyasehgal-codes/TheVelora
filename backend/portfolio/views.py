
from django.utils import timezone

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
from .alerts import check_alert
from .news import get_stock_news


class RegisterView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = RegisterSerializer(data=request.data)

        if serializer.is_valid():
            serializer.save()
            return Response(
                {"message": "User registered successfully."},
                status=status.HTTP_201_CREATED,
            )

        return Response(
            serializer.errors,
            status=status.HTTP_400_BAD_REQUEST,
        )


class HoldingViewSet(viewsets.ModelViewSet):
    serializer_class = HoldingSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Holding.objects.filter(
            user=self.request.user
        ).order_by("-created_at")

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class AlertViewSet(viewsets.ModelViewSet):
    serializer_class = AlertSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Alert.objects.filter(
            user=self.request.user
        ).order_by("-created_at")

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


@api_view(["GET"])
@permission_classes([AllowAny])
def stock_status(request):
    return Response({"status": "Velora API is running"})


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def market_price(request, ticker):
    try:
        return Response(get_stock_price(ticker))
    except Exception as error:
        return Response(
            {"error": str(error)},
            status=status.HTTP_400_BAD_REQUEST,
        )


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def exchange_rate(request, from_currency, to_currency):
    try:
        return Response(
            get_exchange_rate(from_currency, to_currency)
        )
    except Exception as error:
        return Response(
            {"error": str(error)},
            status=status.HTTP_400_BAD_REQUEST,
        )


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def historical_prices(request, ticker):
    period = request.query_params.get("period", "1mo")

    try:
        return Response(
            get_historical_prices(ticker, period)
        )
    except Exception as error:
        return Response(
            {"error": str(error)},
            status=status.HTTP_400_BAD_REQUEST,
        )


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def forecast_stock(request, ticker):
    try:
        return Response(get_forecast(ticker))
    except Exception as error:
        return Response(
            {"error": str(error)},
            status=status.HTTP_400_BAD_REQUEST,
        )


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def stock_news(request, ticker):
    try:
        news = get_stock_news(ticker)
        return Response({
            "ticker": ticker.upper(),
            "count": len(news),
            "news": news,
        })
    except Exception as error:
        return Response(
            {"error": str(error)},
            status=status.HTTP_400_BAD_REQUEST,
        )


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def check_alerts(request):
    """
    Check only the logged-in user's active alerts.
    """

    active_alerts = list(
        Alert.objects.filter(
            user=request.user,
            triggered=False,
        ).order_by("created_at")
    )

    triggered_alerts = []
    failures = []

    for alert in active_alerts:
        try:
            was_triggered = check_alert(alert)

            if was_triggered:
                triggered_alerts.append({
                    "id": alert.id,
                    "ticker": alert.ticker,
                    "target_price": str(alert.target_price),
                    "condition": alert.condition,
                    "triggered": True,
                    "triggered_at": (
                        alert.triggered_at.isoformat()
                        if alert.triggered_at
                        else timezone.now().isoformat()
                    ),
                })

        except Exception as error:
            failures.append({
                "id": alert.id,
                "ticker": alert.ticker,
                "error": str(error),
            })

    return Response({
        "checked": len(active_alerts),
        "triggered": len(triggered_alerts),
        "alerts": triggered_alerts,
        "failed": len(failures),
        "failures": failures,
    })
