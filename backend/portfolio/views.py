# views.py

from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status, viewsets
from rest_framework.permissions import IsAuthenticated

from .serializers import RegisterSerializer, HoldingSerializer
from .models import Holding
from .market_data import (
    get_stock_price,
    get_exchange_rate,
    get_historical_prices,
)

# ==========================================
# VELORA STATUS
# ==========================================

@api_view(["GET"])
def velora_status(request):

    return Response({
        "status": "success",
        "message": "Velora backend is running!",
        "app": "Velora",
    })


# ==========================================
# USER REGISTRATION
# ==========================================

@api_view(["POST"])
def register_user(request):

    serializer = RegisterSerializer(
        data=request.data
    )


    if serializer.is_valid():

        user = serializer.save()

        return Response(
            {
                "message": "User registered successfully!",
                "username": user.username,
            },
            status=status.HTTP_201_CREATED,
        )


    return Response(
        serializer.errors,
        status=status.HTTP_400_BAD_REQUEST,
    )


# ==========================================
# MARKET PRICE
# ==========================================

@api_view(["GET"])
def market_price(request, ticker):
    """
    Return the latest market price
    and currency of a stock.
    """

    market_data = get_stock_price(ticker)


    if market_data is None:

        return Response(
            {
                "error": (
                    "Unable to find market data "
                    "for this ticker."
                )
            },
            status=status.HTTP_404_NOT_FOUND,
        )


    return Response(market_data)


# ==========================================
# CURRENCY EXCHANGE RATE
# ==========================================

@api_view(["GET"])
def exchange_rate(
    request,
    from_currency,
    to_currency="INR",
):
    """
    Return the current exchange rate.

    Example:

        USD -> INR

    Response:

        {
            "from_currency": "USD",
            "to_currency": "INR",
            "rate": 83.50
        }
    """

    rate = get_exchange_rate(
        from_currency.upper(),
        to_currency.upper(),
    )


    if rate is None:

        return Response(
            {
                "error": (
                    "Unable to fetch exchange rate."
                )
            },
            status=status.HTTP_404_NOT_FOUND,
        )


    return Response(
        {
            "from_currency":
                from_currency.upper(),

            "to_currency":
                to_currency.upper(),

            "rate": rate,
        }
    )
    
# ==========================================
# HISTORICAL MARKET DATA
# ==========================================

@api_view(["GET"])
def historical_prices(request, ticker):
    """
    Return historical closing prices
    for a stock.

    Example:
        /api/historical-prices/TCS/?period=1mo
    """

    # Get the requested period.
    # If the frontend doesn't provide one,
    # use 1 month.
    period = request.query_params.get(
        "period",
        "1mo"
    )

    # Only allow periods that we
    # currently support.
    allowed_periods = [
        "1mo",
        "3mo",
        "6mo",
        "1y",
    ]

    if period not in allowed_periods:

        return Response(
            {
                "error": (
                    "Invalid period. "
                    "Use 1mo, 3mo, "
                    "6mo, or 1y."
                )
            },
            status=status.HTTP_400_BAD_REQUEST,
        )

    data = get_historical_prices(
        ticker,
        period
    )

    if not data:

        return Response(
            {
                "error": (
                    "Unable to fetch "
                    "historical data."
                )
            },
            status=status.HTTP_404_NOT_FOUND,
        )

    return Response(
        {
            "ticker":
                ticker.upper(),

            "period":
                period,

            "data":
                data,
        }
    )


# ==========================================
# HOLDINGS
# ==========================================

class HoldingViewSet(viewsets.ModelViewSet):

    permission_classes = [
        IsAuthenticated
    ]

    serializer_class = HoldingSerializer


    def get_queryset(self):

        return Holding.objects.filter(
            user=self.request.user
        )


    def perform_create(self, serializer):

        serializer.save(
            user=self.request.user
        )