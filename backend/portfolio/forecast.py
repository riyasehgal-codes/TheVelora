import yfinance as yf
import pandas as pd

from statsmodels.tsa.arima.model import ARIMA


# ============================================================
# TICKER NORMALIZATION
# ============================================================

def normalize_ticker(ticker):
    """
    Converts common Indian stock symbols into Yahoo Finance
    NSE symbols.

    Example:
        TCS -> TCS.NS
        RELIANCE -> RELIANCE.NS
        AAPL -> AAPL
    """

    ticker = ticker.upper().strip()

    # Already has an exchange suffix
    if "." in ticker:
        return ticker

    # Common Indian stocks
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
# FORECAST
# ============================================================

def get_forecast(ticker):
    """
    Generates a 7-day stock price forecast using ARIMA.

    Model:
        ARIMA(5, 1, 0)

    Historical data:
        Approximately 6 months

    Returns:
        Current price
        7-day predictions
        Confidence intervals
        Expected trend
        Expected percentage change
    """

    original_ticker = ticker.upper().strip()

    yahoo_ticker = normalize_ticker(
        original_ticker
    )

    # --------------------------------------------------------
    # Get historical data
    # --------------------------------------------------------

    stock = yf.Ticker(
        yahoo_ticker
    )

    history = stock.history(
        period="6mo",
        auto_adjust=True
    )

    # --------------------------------------------------------
    # Fallback
    # --------------------------------------------------------

    if history.empty:

        # If NSE ticker failed, try the original ticker
        if yahoo_ticker != original_ticker:

            stock = yf.Ticker(
                original_ticker
            )

            history = stock.history(
                period="6mo",
                auto_adjust=True
            )

    if history.empty:

        raise ValueError(
            f"No historical market data found for {original_ticker}."
        )

    # --------------------------------------------------------
    # Extract closing prices
    # --------------------------------------------------------

    prices = history["Close"].dropna()

    if len(prices) < 30:

        raise ValueError(
            "Not enough historical data to generate a forecast."
        )

    # Make sure prices are numeric
    prices = pd.to_numeric(
        prices,
        errors="coerce"
    ).dropna()

    if prices.empty:

        raise ValueError(
            "Unable to process historical stock prices."
        )

    # --------------------------------------------------------
    # Current price
    # --------------------------------------------------------

    current_price = float(
        prices.iloc[-1]
    )

    # --------------------------------------------------------
    # ARIMA MODEL
    # --------------------------------------------------------

    model = ARIMA(
        prices,
        order=(5, 1, 0)
    )

    fitted_model = model.fit()

    # --------------------------------------------------------
    # Generate 7-day forecast
    # --------------------------------------------------------

    forecast_result = fitted_model.get_forecast(
        steps=7
    )

    forecast_values = forecast_result.predicted_mean

    confidence_intervals = (
        forecast_result.conf_int(
            alpha=0.05
        )
    )

    # --------------------------------------------------------
    # Build forecast response
    # --------------------------------------------------------

    forecast_data = []

    last_date = prices.index[-1]

    for index in range(7):

        predicted_price = float(
            forecast_values.iloc[index]
        )

        lower_bound = float(
            confidence_intervals.iloc[
                index,
                0
            ]
        )

        upper_bound = float(
            confidence_intervals.iloc[
                index,
                1
            ]
        )

        forecast_date = (
            last_date +
            pd.Timedelta(
                days=index + 1
            )
        )

        forecast_data.append(
            {
                "date": forecast_date.strftime(
                    "%Y-%m-%d"
                ),

                "predicted_price": round(
                    predicted_price,
                    2
                ),

                "lower_bound": round(
                    lower_bound,
                    2
                ),

                "upper_bound": round(
                    upper_bound,
                    2
                ),
            }
        )

    # --------------------------------------------------------
    # Expected change
    # --------------------------------------------------------

    final_prediction = float(
        forecast_values.iloc[-1]
    )

    expected_change = (
        (
            final_prediction -
            current_price
        )
        / current_price
    ) * 100

    # --------------------------------------------------------
    # Determine trend
    # --------------------------------------------------------

    if expected_change > 1:
        trend = "Upward"

    elif expected_change < -1:
        trend = "Downward"

    else:
        trend = "Stable"

    # --------------------------------------------------------
    # Final response
    # --------------------------------------------------------

    return {

        "ticker": original_ticker,

        "yahoo_ticker": yahoo_ticker,

        "current_price": round(
            current_price,
            2
        ),

        "expected_change": round(
            expected_change,
            2
        ),

        "trend": trend,

        "confidence_level": "95%",

        "forecast": forecast_data,

        "model": {
            "name": "ARIMA",
            "order": "(5, 1, 0)",
            "historical_period": "6 months",
            "forecast_period": "7 days",
        },
    }