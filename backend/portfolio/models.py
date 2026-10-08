# models.py

from django.conf import settings
from django.db import models


class Holding(models.Model):
    """
    Stores a stock/asset owned by a Velora user.
    """

    # Connect each holding to the user who owns it.
    #
    # If the user is deleted, their holdings are also deleted.
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="holdings",
    )

    # Stock ticker symbol.
    # Example: RELIANCE, TCS, INFY
    ticker = models.CharField(max_length=20)

    # Number of shares owned.
    #
    # DecimalField is used instead of FloatField because
    # financial quantities should avoid floating-point errors.
    quantity = models.DecimalField(
        max_digits=20,
        decimal_places=6,
    )

    # Average purchase price per share.
    average_price = models.DecimalField(
        max_digits=20,
        decimal_places=2,
    )

    # Automatically stores when the holding was created.
    created_at = models.DateTimeField(auto_now_add=True)

    # Automatically updates whenever the holding is modified.
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        """
        Controls how a holding appears in Django admin.
        """

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

    ticker = models.CharField(
        max_length=20
    )

    target_price = models.DecimalField(
        max_digits=20,
        decimal_places=2,
    )

    condition = models.CharField(
        max_length=10,
        choices=CONDITION_CHOICES,
    )

    triggered = models.BooleanField(
        default=False
    )

    created_at = models.DateTimeField(
        auto_now_add=True
    )

    triggered_at = models.DateTimeField(
        null=True,
        blank=True
    )

    def __str__(self):
        return (
            f"{self.ticker} "
            f"{self.condition} "
            f"{self.target_price}"
        )