# views.py

# DRF decorator that allows us to create a simple API endpoint.
from rest_framework.decorators import api_view

# Response converts our Python data into a JSON response.
from rest_framework.response import Response


@api_view(["GET"])
def velora_status(request):
    """
    Simple API endpoint used to check whether
    the Velora backend is working.
    """

    return Response({
        "status": "success",
        "message": "Velora backend is running!",
        "app": "Velora",
    })