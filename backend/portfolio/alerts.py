
import logging

import yfinance as yf

from django.utils import timezone

from .models import Alert


logger = logging.getLogger(__name__)


# ============================================================
# TICKER NORMALIZATION
# ============================================================

def normalize_ticker(ticker):
    """
    Converts common Indian stock tickers into Yahoo Finance
    NSE tickers.

    Examples:
        TCS -> TCS.NS
        AAPL -> AAPL
        TCS.NS -> TCS.NS
    """

    ticker = ticker.upper().strip()

    # Preserve tickers that already specify an exchange.
    if "." in ticker:
        return ticker

    indian_stocks = [
        "TCS",
        "RELIANCE",
        "INFY",
        "HDFCBANK",
        "ICICIBANK",
        "SBIN",
        "ITC",
        "HINDUNILVR",
        "WIPRO",
        "BHARTIARTL",
        "KOTAKBANK",
        "LT",
        "AXISBANK",
        "MARUTI",
        "SUNPHARMA",
        "TATAMOTORS",
        "TATASTEEL",
        "ADANIENT",
        "ADANIPORTS",
    ]

    if ticker in indian_stocks:
        return f"{ticker}.NS"

    return ticker


# ============================================================
# GET LATEST AVAILABLE PRICE
# ============================================================

def get_current_price(ticker):
    """
    Attempts to obtain a recent price from Yahoo Finance.

    First tries intraday data. If that is unavailable,
    falls back to recent daily closing prices.

    Note:
    Outside market hours, the returned price may be the
    latest available close rather than a live price.
    """

    yahoo_ticker = normalize_ticker(ticker)
    stock = yf.Ticker(yahoo_ticker)

    # First attempt: recent intraday prices.
    try:
        history = stock.history(
            period="1d",
            interval="1m",
        )

        if not history.empty:
            prices = history["Close"].dropna()

            if not prices.empty:
                return float(prices.iloc[-1])

    except Exception as error:
        logger.warning(
            "Intraday price lookup failed for %s: %s",
            yahoo_ticker,
            error,
        )

    # Fallback: most recent available daily close.
    try:
        history = stock.history(
            period="5d",
            interval="1d",
        )

        if not history.empty:
            prices = history["Close"].dropna()

            if not prices.empty:
                return float(prices.iloc[-1])

    except Exception as error:
        logger.warning(
            "Daily price lookup failed for %s: %s",
            yahoo_ticker,
            error,
        )

    raise ValueError(
        f"Unable to retrieve a recent price for {ticker}. "
        "Yahoo Finance returned no usable price data."
    )


# ============================================================
# CHECK ONE ALERT
# ============================================================

def check_alert(alert):
    """
    Checks one alert.

    Returns True if this check triggers the alert;
    otherwise returns False.
    """

    if alert.triggered:
        return False

    current_price = get_current_price(alert.ticker)
    target_price = float(alert.target_price)

    if (
        alert.condition == "above"
        and current_price >= target_price
    ):
        triggered = True

    elif (
        alert.condition == "below"
        and current_price <= target_price
    ):
        triggered = True

    else:
        triggered = False

    if triggered:
        alert.triggered = True
        alert.triggered_at = timezone.now()

        alert.save(
            update_fields=[
                "triggered",
                "triggered_at",
            ]
        )

        logger.info(
            "Alert %s triggered: %s at price %s",
            alert.id,
            alert.ticker,
            current_price,
        )

    return triggered


# ============================================================
# CHECK ALL ACTIVE ALERTS
# ============================================================

def check_all_alerts():
    """
    Checks every active alert.

    A failure for one alert does not prevent other alerts
    from being checked.

    Returns a list of alerts triggered during this check.
    """

    active_alerts = Alert.objects.filter(
        triggered=False
    ).order_by("created_at")

    triggered_alerts = []

    for alert in active_alerts:
        try:
            if check_alert(alert):
                triggered_alerts.append(alert)

        except Exception:
            logger.exception(
                "Failed to check alert ID %s for ticker %s",
                alert.id,
                alert.ticker,
            )

    return triggered_alerts


