# urls.py

from django.urls import path, include

from .views import velora_status, register_user, HoldingViewSet

# JWT authentication views
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)

# DRF router automatically creates CRUD URLs.
from rest_framework.routers import DefaultRouter


# Create a router for our API endpoints.
router = DefaultRouter()

# Register the HoldingViewSet.
router.register("holdings", HoldingViewSet, basename="holding")


urlpatterns = [

    # Check whether the Velora backend is running.
    path("status/", velora_status),

    # Register a new user.
    path("register/", register_user),

    # Login.
    path("login/", TokenObtainPairView.as_view()),

    # Refresh JWT access token.
    path("token/refresh/", TokenRefreshView.as_view()),

    # Holding CRUD endpoints.
    path("", include(router.urls)),
]