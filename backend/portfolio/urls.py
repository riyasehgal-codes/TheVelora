# urls.py

from django.urls import path

# Import our API view.
from .views import velora_status


urlpatterns = [
    # GET /api/status/
    path("status/", velora_status),
]