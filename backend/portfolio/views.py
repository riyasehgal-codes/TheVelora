
from django.utils import timezone

from rest_framework import status, viewsets
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import (
    Holding,
    Alert,
    ChatConversation,
    ChatMessage,
)

from .serializers import (
    RegisterSerializer,
    HoldingSerializer,
    AlertSerializer,
    ChatConversationSerializer,
    ChatMessageSerializer,
)

from .market_data import (
    get_stock_price,
    get_exchange_rate,
    get_historical_prices,
)

from .forecast import get_forecast
from .alerts import check_alert
from .news import get_stock_news

from .ai_service import (
    generate_chat_response,
    GroqRateLimitError,
)


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


# ============================================================
# AI-3: PERSISTENT CHAT HISTORY
# ============================================================


class ChatConversationListView(APIView):
    """
    Lists and creates conversations for the logged-in user.
    """

    permission_classes = [IsAuthenticated]

    def get(self, request):
        conversations = ChatConversation.objects.filter(
            user=request.user
        )

        serializer = ChatConversationSerializer(
            conversations,
            many=True,
        )

        return Response(serializer.data)

    def post(self, request):
        title = request.data.get(
            "title",
            "New conversation",
        )

        if not isinstance(title, str):
            return Response(
                {"error": "Conversation title must be text."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        conversation = ChatConversation.objects.create(
            user=request.user,
            title=title.strip()[:100] or "New conversation",
        )

        serializer = ChatConversationSerializer(conversation)

        return Response(
            serializer.data,
            status=status.HTTP_201_CREATED,
        )


class ChatConversationDetailView(APIView):
    """
    Retrieves or deletes one of the user's conversations.
    """

    permission_classes = [IsAuthenticated]

    def get_object(self, request, conversation_id):
        return ChatConversation.objects.filter(
            id=conversation_id,
            user=request.user,
        ).first()

    def get(self, request, conversation_id):
        conversation = self.get_object(
            request,
            conversation_id,
        )

        if not conversation:
            return Response(
                {"error": "Conversation not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        serializer = ChatConversationSerializer(conversation)

        return Response(serializer.data)

    def delete(self, request, conversation_id):
        conversation = self.get_object(
            request,
            conversation_id,
        )

        if not conversation:
            return Response(
                {"error": "Conversation not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        conversation.delete()

        return Response(status=status.HTTP_204_NO_CONTENT)


class ChatConversationMessagesView(APIView):
    """
    Retrieves messages and handles new messages in a conversation.
    """

    permission_classes = [IsAuthenticated]

    def get_conversation(self, request, conversation_id):
        return ChatConversation.objects.filter(
            id=conversation_id,
            user=request.user,
        ).first()

    def get(self, request, conversation_id):
        conversation = self.get_conversation(
            request,
            conversation_id,
        )

        if not conversation:
            return Response(
                {"error": "Conversation not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        messages = conversation.messages.all()

        serializer = ChatMessageSerializer(
            messages,
            many=True,
        )

        return Response(serializer.data)

    def post(self, request, conversation_id):
        conversation = self.get_conversation(
            request,
            conversation_id,
        )

        if not conversation:
            return Response(
                {"error": "Conversation not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        content = request.data.get("content")

        if not isinstance(content, str) or not content.strip():
            return Response(
                {"error": "Message content cannot be empty."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        content = content.strip()

        if len(content) > 4000:
            return Response(
                {"error": "Message must be under 4000 characters."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Save the user's message.
        user_message = ChatMessage.objects.create(
            conversation=conversation,
            role="user",
            content=content,
        )

        # Load the latest 8 messages for AI context.
        recent_messages = list(
            conversation.messages.order_by(
                "-created_at",
                "-id",
            )[:8]
        )

        recent_messages.reverse()

        history = [
            {
                "role": message.role,
                "content": message.content,
            }
            for message in recent_messages
        ]

        try:
            answer = generate_chat_response(history)

            assistant_message = ChatMessage.objects.create(
                conversation=conversation,
                role="assistant",
                content=answer,
            )

            # Give the conversation a title based on its first message.
            if conversation.title == "New conversation":
                conversation.title = content[:50]

            conversation.save(update_fields=[
                "title",
                "updated_at",
            ])

            return Response({
                "user_message": ChatMessageSerializer(
                    user_message
                ).data,
                "assistant_message": ChatMessageSerializer(
                    assistant_message
                ).data,
            })

        except GroqRateLimitError as error:
            return Response(
                {
                    "error": str(error),
                    "code": "AI_LIMIT_REACHED",
                    "retry_after": error.retry_after,
                    "reset_after": error.reset_after,
                },
                status=status.HTTP_429_TOO_MANY_REQUESTS,
            )

        except ConnectionError as error:
            return Response(
                {"error": str(error)},
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )

        except TimeoutError as error:
            return Response(
                {"error": str(error)},
                status=status.HTTP_504_GATEWAY_TIMEOUT,
            )

        except ValueError as error:
            return Response(
                {"error": str(error)},
                status=status.HTTP_502_BAD_GATEWAY,
            )

        except Exception:
            return Response(
                {
                    "error": (
                        "Something went wrong while generating "
                        "the AI response."
                    )
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )
