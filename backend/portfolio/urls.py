
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)

from .views import (
    RegisterView,
    HoldingViewSet,
    AlertViewSet,
    stock_status,
    market_price,
    exchange_rate,
    historical_prices,
    forecast_stock,
    stock_news,
    check_alerts,
)


router = DefaultRouter()
router.register(r"holdings", HoldingViewSet, basename="holding")
router.register(r"alerts", AlertViewSet, basename="alert")


urlpatterns = [
    path("register/", RegisterView.as_view(), name="register"),
    path("login/", TokenObtainPairView.as_view(), name="login"),
    path(
        "token/refresh/",
        TokenRefreshView.as_view(),
        name="token_refresh",
    ),

    # IMPORTANT: Place this before the router.
    path("alerts/check/", check_alerts, name="check_alerts"),

    path("", include(router.urls)),

    path("status/", stock_status, name="status"),
    path(
        "market-price/<str:ticker>/",
        market_price,
        name="market_price",
    ),
    path(
        "exchange-rate/<str:from_currency>/<str:to_currency>/",
        exchange_rate,
        name="exchange_rate",
    ),
    path(
        "historical-prices/<str:ticker>/",
        historical_prices,
        name="historical_prices",
    ),
    path("forecast/<str:ticker>/", forecast_stock, name="forecast"),
    path("news/<str:ticker>/", stock_news, name="stock_news"),
]
