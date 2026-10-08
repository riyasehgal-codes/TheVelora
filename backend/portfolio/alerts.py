import yfinance as yf

from django.utils import timezone

from .models import Alert


# ============================================================
# TICKER NORMALIZATION
# ============================================================

def normalize_ticker(ticker):
    """
    Converts common Indian stock tickers into Yahoo Finance
    NSE tickers.

    Example:
        TCS -> TCS.NS
        AAPL -> AAPL
    """

    ticker = ticker.upper().strip()

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
# GET CURRENT STOCK PRICE
# ============================================================

def get_current_price(ticker):
    """
    Gets the latest available market price from Yahoo Finance.
    """

    yahoo_ticker = normalize_ticker(ticker)

    stock = yf.Ticker(
        yahoo_ticker
    )

    history = stock.history(
        period="1d",
        interval="1m"
    )

    if history.empty:
        raise ValueError(
            f"Unable to get current price for {ticker}."
        )

    prices = history["Close"].dropna()

    if prices.empty:
        raise ValueError(
            f"No price data available for {ticker}."
        )

    return float(
        prices.iloc[-1]
    )


# ============================================================
# CHECK ONE ALERT
# ============================================================

def check_alert(alert):
    """
    Checks whether a single alert condition has been met.

    Returns:
        True  -> alert triggered
        False -> alert still active
    """

    if alert.triggered:
        return False

    current_price = get_current_price(
        alert.ticker
    )

    target_price = float(
        alert.target_price
    )

    triggered = False

    # --------------------------------------------------------
    # ABOVE
    # --------------------------------------------------------

    if (
        alert.condition == "above"
        and current_price >= target_price
    ):
        triggered = True

    # --------------------------------------------------------
    # BELOW
    # --------------------------------------------------------

    elif (
        alert.condition == "below"
        and current_price <= target_price
    ):
        triggered = True

    # --------------------------------------------------------
    # UPDATE ALERT
    # --------------------------------------------------------

    if triggered:

        alert.triggered = True

        alert.triggered_at = timezone.now()

        alert.save(
            update_fields=[
                "triggered",
                "triggered_at",
            ]
        )

    return triggered


# ============================================================
# CHECK ALL ACTIVE ALERTS
# ============================================================

def check_all_alerts():
    """
    Checks every active alert in the database.

    Returns a list containing the alerts that
    were triggered during this check.
    """

    active_alerts = Alert.objects.filter(
        triggered=False
    )

    triggered_alerts = []

    for alert in active_alerts:

        try:

            if check_alert(alert):

                triggered_alerts.append(
                    alert
                )

        except Exception as error:

            print(
                f"Error checking alert "
                f"{alert.id}: {error}"
            )

    return triggered_alerts