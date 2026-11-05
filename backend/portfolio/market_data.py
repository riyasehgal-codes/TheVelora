
import logging
import re

import pandas as pd
import yfinance as yf


logger = logging.getLogger(__name__)


INDIAN_STOCKS = {
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
}


class InvalidTickerError(Exception):
    """Raised when a stock ticker does not exist."""


class MarketDataUnavailableError(Exception):
    """Raised when the market data provider cannot be reached."""


def normalize_ticker(ticker):
    ticker = ticker.upper().strip()

    if not ticker:
        raise ValueError("Stock ticker cannot be empty.")

    if not re.fullmatch(r"[A-Z0-9.^=_-]{1,30}", ticker):
        raise ValueError("Please enter a valid stock ticker format.")

    if "." in ticker:
        return ticker

    if ticker in INDIAN_STOCKS:
        return f"{ticker}.NS"

    return ticker


def _get_ticker_candidates(ticker):
    original = ticker.upper().strip()
    normalized = normalize_ticker(original)

    candidates = [normalized]

    if normalized != original:
        candidates.append(original)

    return list(dict.fromkeys(candidates))


def validate_ticker(ticker):
    """
    Verify that a ticker has usable historical market data.

    Invalid symbols raise InvalidTickerError.
    Provider/network failures raise MarketDataUnavailableError.
    """

    candidates = _get_ticker_candidates(ticker)
    provider_errors = []

    for yahoo_ticker in candidates:
        try:
            data = yf.Ticker(yahoo_ticker).history(
                period="1mo",
                auto_adjust=True,
                raise_errors=True,
            )

            if data is not None and not data.empty:
                if "Close" in data.columns:
                    prices = pd.to_numeric(
                        data["Close"],
                        errors="coerce",
                    ).dropna()

                    if not prices.empty:
                        return yahoo_ticker

        except Exception as error:
            error_message = str(error).lower()

            invalid_messages = [
                "possibly delisted",
                "no timezone found",
                "quote not found",
                "symbol may be delisted",
                "no price data found",
            ]

            if any(
                message in error_message
                for message in invalid_messages
            ):
                continue

            logger.warning(
                "Ticker validation failed for %s: %s",
                yahoo_ticker,
                error,
            )

            provider_errors.append(error)

    if provider_errors:
        raise MarketDataUnavailableError(
            "We could not verify this stock right now because "
            "the market data service is unavailable. Please try again."
        )

    raise InvalidTickerError(
        f"'{ticker.upper().strip()}' is not a valid stock ticker. "
        "Please check the symbol and try again."
    )


def get_exchange_rate(from_currency, to_currency="INR"):
    from_currency = from_currency.upper().strip()
    to_currency = to_currency.upper().strip()

    if from_currency == to_currency:
        return 1.0

    currency_pair = f"{from_currency}{to_currency}=X"

    try:
        data = yf.Ticker(currency_pair).history(period="5d")

        if data.empty or "Close" not in data.columns:
            return None

        prices = pd.to_numeric(
            data["Close"],
            errors="coerce",
        ).dropna()

        if prices.empty:
            return None

        return float(prices.iloc[-1])

    except Exception:
        logger.exception(
            "Exchange rate lookup failed for %s",
            currency_pair,
        )
        return None


def _get_history(yahoo_ticker, period="1mo"):
    try:
        data = yf.Ticker(yahoo_ticker).history(
            period=period,
            auto_adjust=True,
        )

        if data.empty or "Close" not in data.columns:
            return None

        data = data.copy()

        data["Close"] = pd.to_numeric(
            data["Close"],
            errors="coerce",
        )

        data = data.dropna(subset=["Close"])

        return data if not data.empty else None

    except Exception:
        logger.exception(
            "Market data lookup failed for %s",
            yahoo_ticker,
        )
        return None


def get_stock_price(ticker):
    candidates = _get_ticker_candidates(ticker)

    for yahoo_ticker in candidates:
        data = _get_history(yahoo_ticker, period="5d")

        if data is None:
            continue

        currency = (
            "INR"
            if yahoo_ticker.endswith((".NS", ".BO"))
            else "USD"
        )

        return {
            "ticker": ticker.upper().strip(),
            "yahoo_ticker": yahoo_ticker,
            "price": float(data["Close"].iloc[-1]),
            "currency": currency,
        }

    raise ValueError(
        f"No recent market price was found for "
        f"{ticker.upper().strip()}. "
        "Check the ticker symbol and try again."
    )


def get_historical_prices(ticker, period="1mo"):
    allowed_periods = {"1mo", "3mo", "6mo", "1y"}

    if period not in allowed_periods:
        raise ValueError(
            f"Unsupported period '{period}'. "
            f"Choose one of: {', '.join(sorted(allowed_periods))}."
        )

    for yahoo_ticker in _get_ticker_candidates(ticker):
        data = _get_history(yahoo_ticker, period=period)

        if data is None:
            continue

        return [
            {
                "date": index.strftime("%Y-%m-%d"),
                "price": round(float(row["Close"]), 4),
            }
            for index, row in data.iterrows()
        ]

    raise ValueError(
        f"No historical market data was found for "
        f"{ticker.upper().strip()}."
    )
