
import logging

import pandas as pd
import yfinance as yf


logger = logging.getLogger(__name__)


# Common Indian stocks listed on the NSE.
# These symbols are converted to Yahoo Finance's .NS format.
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


def normalize_ticker(ticker):
    """
    Convert known Indian stock symbols to Yahoo Finance symbols.

    Examples:
        TCS -> TCS.NS
        RELIANCE -> RELIANCE.NS
        AAPL -> AAPL
        AMZN -> AMZN
        AAPL.NS -> AAPL.NS
    """
    ticker = ticker.upper().strip()

    if not ticker:
        raise ValueError("Stock ticker cannot be empty.")

    # Keep explicitly supplied exchange suffixes unchanged.
    if "." in ticker:
        return ticker

    if ticker in INDIAN_STOCKS:
        return f"{ticker}.NS"

    # Unknown symbols are tried as supplied rather than
    # incorrectly assuming that they are Indian stocks.
    return ticker


def get_exchange_rate(from_currency, to_currency="INR"):
    """
    Fetch the latest available currency exchange rate.

    Returns a float, or None if the rate is unavailable.
    """
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
            data["Close"], errors="coerce"
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
    """Fetch market history and return None if unavailable."""
    try:
        data = yf.Ticker(yahoo_ticker).history(
            period=period,
            auto_adjust=True,
        )

        if data.empty or "Close" not in data.columns:
            return None

        data = data.copy()
        data["Close"] = pd.to_numeric(
            data["Close"], errors="coerce"
        )
        data = data.dropna(subset=["Close"])

        return data if not data.empty else None

    except Exception:
        logger.exception(
            "Market data lookup failed for %s",
            yahoo_ticker,
        )
        return None


def _get_ticker_candidates(ticker):
    """
    Return the appropriate Yahoo Finance symbol candidates.

    Known Indian stocks use NSE symbols. Other stocks are
    tried using the original symbol.
    """
    original = ticker.upper().strip()
    normalized = normalize_ticker(original)

    candidates = [normalized]

    # Allow fallback to the original symbol if an NSE lookup
    # fails for a known Indian stock.
    if normalized != original:
        candidates.append(original)

    return list(dict.fromkeys(candidates))


def get_stock_price(ticker):
    """
    Fetch the latest available stock price and currency.

    Examples:
        TCS -> TCS.NS, INR
        AAPL -> AAPL, USD
        AAPL.NS -> AAPL.NS, INR
    """
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
        f"No recent market price was found for {ticker.upper().strip()}. "
        "Check the ticker symbol and try again."
    )


def get_historical_prices(ticker, period="1mo"):
    """
    Return historical closing prices as a list of dictionaries.

    Supported periods include 1mo, 3mo, 6mo, and 1y.
    """
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
