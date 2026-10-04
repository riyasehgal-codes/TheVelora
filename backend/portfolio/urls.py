# urls.py

from django.urls import path, include

from .views import (
    velora_status,
    register_user,
    market_price,
    exchange_rate,
    historical_prices,
    HoldingViewSet,
)

from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)

from rest_framework.routers import DefaultRouter


# ==========================================
# HOLDINGS ROUTER
# ==========================================

router = DefaultRouter()

router.register(
    "holdings",
    HoldingViewSet,
    basename="holding",
)


# ==========================================
# URL PATTERNS
# ==========================================

urlpatterns = [

    path(
        "status/",
        velora_status
    ),

    path(
        "register/",
        register_user
    ),

    path(
        "login/",
        TokenObtainPairView.as_view()
    ),

    path(
        "token/refresh/",
        TokenRefreshView.as_view()
    ),

    path(
        "market-price/<str:ticker>/",
        market_price
    ),

    path(
        "exchange-rate/<str:from_currency>/<str:to_currency>/",
        exchange_rate
    ),
    
    path(
        "historical-prices/<str:ticker>/",
        historical_prices
    ),

    path(
        "",
        include(router.urls)
    ),
    
]