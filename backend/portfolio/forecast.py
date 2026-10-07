# forecast.py

import numpy as np
import pandas as pd

from statsmodels.tsa.arima.model import ARIMA

from .market_data import get_historical_prices


def forecast_stock_price(ticker, days=7):
    """
    Generate a short-term stock price forecast.

    Parameters:
        ticker: Stock ticker symbol
        days: Number of future days to forecast

    Returns:
        Dictionary containing:
        - current price
        - predicted prices
        - confidence ranges
        - trend
        - expected percentage change
    """

    # ==========================================
    # GET HISTORICAL DATA
    # ==========================================

    historical_data = get_historical_prices(
        ticker,
        period="6mo"
    )

    if not historical_data:

        return {
            "error": "Unable to fetch historical stock data."
        }


    # ==========================================
    # CONVERT TO DATAFRAME
    # ==========================================

    df = pd.DataFrame(
        historical_data
    )

    if df.empty or len(df) < 30:

        return {
            "error": (
                "Not enough historical data "
                "to generate a forecast."
            )
        }


    # ==========================================
    # CLEAN DATA
    # ==========================================

    df["date"] = pd.to_datetime(
        df["date"]
    )

    df["price"] = pd.to_numeric(
        df["price"],
        errors="coerce"
    )

    df = df.dropna(
        subset=["price"]
    )

    df = df.sort_values(
        "date"
    )

    df = df.reset_index(
        drop=True
    )


    # ==========================================
    # PREPARE PRICE SERIES
    # ==========================================

    prices = df["price"].astype(float)


    # ==========================================
    # CREATE ARIMA MODEL
    # ==========================================

    try:

        model = ARIMA(
            prices,
            order=(5, 1, 0)
        )

        model_fit = model.fit()


        # Generate forecast object.

        forecast_result = (
            model_fit.get_forecast(
                steps=days
            )
        )


        # Predicted prices.

        forecast_mean = (
            forecast_result.predicted_mean
        )


        # 95% confidence intervals.

        confidence_intervals = (
            forecast_result.conf_int(
                alpha=0.05
            )
        )


    except Exception as error:

        return {
            "error": (
                f"Forecasting failed: {str(error)}"
            )
        }


    # ==========================================
    # CREATE FUTURE DATES
    # ==========================================

    last_date = df["date"].iloc[-1]

    forecast_dates = pd.date_range(
        start=last_date + pd.Timedelta(days=1),
        periods=days,
        freq="D"
    )


    # ==========================================
    # FORMAT FORECAST DATA
    # ==========================================

    forecast_data = []


    for index, date in enumerate(
        forecast_dates
    ):

        predicted_price = float(
            forecast_mean.iloc[index]
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


        # Make sure prices don't
        # become negative.

        lower_bound = max(
            0,
            lower_bound
        )

        upper_bound = max(
            0,
            upper_bound
        )


        forecast_data.append({

            "date": date.strftime(
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

        })


    # ==========================================
    # CURRENT PRICE
    # ==========================================

    current_price = float(
        prices.iloc[-1]
    )


    # ==========================================
    # FINAL PREDICTED PRICE
    # ==========================================

    predicted_final_price = float(
        forecast_mean.iloc[-1]
    )


    # ==========================================
    # DETERMINE TREND
    # ==========================================

    if predicted_final_price > current_price:

        trend = "Upward"

    elif predicted_final_price < current_price:

        trend = "Downward"

    else:

        trend = "Stable"


    # ==========================================
    # EXPECTED PERCENTAGE CHANGE
    # ==========================================

    if current_price != 0:

        expected_change = (
            (
                predicted_final_price
                - current_price
            )
            / current_price
        ) * 100

    else:

        expected_change = 0


    # ==========================================
    # RETURN RESULT
    # ==========================================

    return {

        "ticker": ticker.upper(),

        "current_price": round(
            current_price,
            2
        ),

        "forecast_days": days,

        "trend": trend,

        "expected_change_percent": round(
            expected_change,
            2
        ),

        "confidence_level": "95%",

        "forecast": forecast_data,

    }