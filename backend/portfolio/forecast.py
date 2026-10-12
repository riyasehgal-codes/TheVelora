
import logging

import pandas as pd
import yfinance as yf
from statsmodels.tsa.arima.model import ARIMA

from .market_data import normalize_ticker


logger = logging.getLogger(__name__)


def get_forecast(ticker):
    """
    Generate a seven-day stock-price forecast using ARIMA(5, 1, 0).

    Uses approximately six months of historical market data.
    Returns forecast prices, confidence intervals, expected
    percentage change, trend, and model information.
    """
    original_ticker = ticker.upper().strip()

    if not original_ticker:
        raise ValueError("Stock ticker cannot be empty.")

    yahoo_ticker = normalize_ticker(original_ticker)

    # Retrieve historical data for the normalized ticker.
    try:
        history = yf.Ticker(yahoo_ticker).history(
            period="6mo",
            auto_adjust=True,
        )
    except Exception as error:
        logger.exception(
            "Forecast data lookup failed for %s",
            yahoo_ticker,
        )
        raise ValueError(
            f"Unable to retrieve market data for {original_ticker}. "
            "Please try again later."
        ) from error

    # Fall back to the original ticker if normalization changed it.
    if (
        (history is None or history.empty)
        and yahoo_ticker != original_ticker
    ):
        try:
            history = yf.Ticker(original_ticker).history(
                period="6mo",
                auto_adjust=True,
            )
            yahoo_ticker = original_ticker
        except Exception as error:
            logger.exception(
                "Forecast fallback failed for %s",
                original_ticker,
            )
            raise ValueError(
                f"Unable to retrieve market data for {original_ticker}."
            ) from error

    if history is None or history.empty:
        raise ValueError(
            f"No historical market data was found for "
            f"{original_ticker}. Check the ticker symbol."
        )

    if "Close" not in history.columns:
        raise ValueError(
            f"Closing prices are unavailable for {original_ticker}."
        )

    prices = pd.to_numeric(
        history["Close"], errors="coerce"
    ).dropna()

    # ARIMA needs sufficient usable historical observations.
    if len(prices) < 30:
        raise ValueError(
            f"Not enough historical data for {original_ticker}. "
            "At least 30 usable price observations are required."
        )

    current_price = float(prices.iloc[-1])

    if current_price <= 0:
        raise ValueError(
            f"The latest price for {original_ticker} is invalid."
        )

    # Use a regular business-day index to avoid warnings caused
    # by Yahoo Finance's irregular trading-date index.
    prices.index = pd.to_datetime(prices.index).tz_localize(None)
    prices = prices[~prices.index.duplicated(keep="last")].sort_index()

    regular_index = pd.bdate_range(
        start=prices.index[0],
        end=prices.index[-1],
    )

    prices = prices.reindex(regular_index).ffill().dropna()

    if len(prices) < 30:
        raise ValueError(
            f"Not enough usable historical data for {original_ticker}."
        )

    # Fit the ARIMA model.
    try:
        model = ARIMA(
            prices,
            order=(5, 1, 0),
        )
        fitted_model = model.fit()

        forecast_result = fitted_model.get_forecast(steps=7)
        forecast_values = forecast_result.predicted_mean
        confidence_intervals = forecast_result.conf_int(alpha=0.05)

    except Exception as error:
        logger.exception(
            "ARIMA forecast failed for %s",
            original_ticker,
        )
        raise ValueError(
            f"The forecasting model could not generate a prediction "
            f"for {original_ticker}. Please try again."
        ) from error

    # Generate the next seven business-day forecast entries.
    forecast_dates = pd.bdate_range(
        start=prices.index[-1] + pd.offsets.BDay(1),
        periods=7,
    )

    forecast_data = []

    for index, forecast_date in enumerate(forecast_dates):
        predicted_price = float(forecast_values.iloc[index])
        lower_bound = float(confidence_intervals.iloc[index, 0])
        upper_bound = float(confidence_intervals.iloc[index, 1])

        forecast_data.append({
            "date": forecast_date.strftime("%Y-%m-%d"),
            "predicted_price": round(predicted_price, 2),
            "lower_bound": round(lower_bound, 2),
            "upper_bound": round(upper_bound, 2),
        })

    final_prediction = float(forecast_values.iloc[-1])

    expected_change = (
        (final_prediction - current_price) / current_price
    ) * 100

    if expected_change > 1:
        trend = "Upward"
    elif expected_change < -1:
        trend = "Downward"
    else:
        trend = "Stable"

    return {
        "ticker": original_ticker,
        "yahoo_ticker": yahoo_ticker,
        "current_price": round(current_price, 2),
        "expected_change": round(expected_change, 2),
        "trend": trend,
        "confidence_level": "95%",
        "forecast": forecast_data,
        "model": {
            "name": "ARIMA",
            "order": "(5, 1, 0)",
            "historical_period": "6 months",
            "forecast_period": "7 trading days",
        },
    }
