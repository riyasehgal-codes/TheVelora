# views.py

from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status, viewsets
from rest_framework.permissions import IsAuthenticated

from .serializers import RegisterSerializer, HoldingSerializer
from .models import Holding


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


@api_view(["POST"])
def register_user(request):
    """
    Creates a new Velora user account.
    """

    serializer = RegisterSerializer(data=request.data)

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


class HoldingViewSet(viewsets.ModelViewSet):
    """
    Provides CRUD operations for portfolio holdings.
    """

    # Only logged-in users can access this API.
    permission_classes = [IsAuthenticated]

    # Convert Holding objects to/from JSON.
    serializer_class = HoldingSerializer

    def get_queryset(self):
        """
        Return ONLY the holdings belonging to
        the currently logged-in user.
        """

        return Holding.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        """
        Automatically attach the new holding
        to the currently logged-in user.
        """

        serializer.save(user=self.request.user)