from django.conf import settings
from django.db import models


class Holding(models.Model):
    """
    Stores a stock/asset owned by a Velora user.
    """

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="holdings",
    )

    ticker = models.CharField(max_length=20)

    quantity = models.DecimalField(
        max_digits=20,
        decimal_places=6,
    )

    average_price = models.DecimalField(
        max_digits=20,
        decimal_places=2,
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.ticker} - {self.quantity} shares"


class Alert(models.Model):
    """
    Stores a price alert created by a Velora user.
    """

    CONDITION_CHOICES = [
        ("above", "Price goes above"),
        ("below", "Price goes below"),
    ]

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="alerts",
    )

    ticker = models.CharField(max_length=20)

    target_price = models.DecimalField(
        max_digits=20,
        decimal_places=2,
    )

    condition = models.CharField(
        max_length=10,
        choices=CONDITION_CHOICES,
    )

    triggered = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    triggered_at = models.DateTimeField(
        null=True,
        blank=True,
    )

    def __str__(self):
        return (
            f"{self.ticker} "
            f"{self.condition} "
            f"{self.target_price}"
        )


class ChatConversation(models.Model):
    """
    Stores a conversation created by a Velora user.
    """

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="chat_conversations",
    )

    title = models.CharField(
        max_length=100,
        default="New conversation",
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-updated_at"]

    def __str__(self):
        return f"{self.title} - {self.user}"


class ChatMessage(models.Model):
    """
    Stores individual messages inside a conversation.
    """

    ROLE_CHOICES = [
        ("user", "User"),
        ("assistant", "Velora AI"),
    ]

    conversation = models.ForeignKey(
        ChatConversation,
        on_delete=models.CASCADE,
        related_name="messages",
    )

    role = models.CharField(
        max_length=10,
        choices=ROLE_CHOICES,
    )

    content = models.TextField()

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["created_at", "id"]

    def __str__(self):
        return f"{self.role}: {self.content[:40]}"