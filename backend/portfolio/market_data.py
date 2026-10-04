# market_data.py

import yfinance as yf


def get_exchange_rate(from_currency, to_currency="INR"):
    """
    Get the latest exchange rate between two currencies.

    Example:
        USD -> INR

    Returns:
        Exchange rate as a float
        None if the rate cannot be fetched.
    """

    from_currency = from_currency.upper()
    to_currency = to_currency.upper()

    # If both currencies are the same,
    # no conversion is needed.
    if from_currency == to_currency:
        return 1.0

    # Yahoo Finance currency pair format.
    currency_pair = (
        f"{from_currency}{to_currency}=X"
    )

    try:

        # Create Yahoo Finance ticker.
        currency = yf.Ticker(
            currency_pair
        )

        # Get recent market data.
        data = currency.history(
            period="5d"
        )

        # If Yahoo returned no data,
        # the exchange rate could not be found.
        if data.empty:
            return None

        # Get the latest closing rate.
        latest_rate = data["Close"].dropna().iloc[-1]

        return float(latest_rate)

    except Exception as error:

        print(
            "Exchange rate error:",
            error
        )

        return None


def get_stock_price(ticker):
    """
    Fetch the latest available market price
    and currency for a stock.

    Indian stocks:
        TCS -> TCS.NS -> INR

    US stocks:
        AAPL -> AAPL -> USD
    """

    ticker = ticker.upper().strip()

    # ==========================================
    # TRY NSE
    # ==========================================

    if "." not in ticker:

        nse_ticker = f"{ticker}.NS"

        stock = yf.Ticker(
            nse_ticker
        )

        try:

            data = stock.history(
                period="1d"
            )

        except Exception:

            data = None

        if (
            data is not None
            and not data.empty
        ):

            latest_price = (
                data["Close"].iloc[-1]
            )

            return {
                "ticker": ticker,
                "price": float(
                    latest_price
                ),
                "currency": "INR",
            }

    # ==========================================
    # TRY ORIGINAL TICKER
    # ==========================================

    stock = yf.Ticker(ticker)

    try:

        data = stock.history(
            period="1d"
        )

    except Exception:

        data = None

    if (
        data is None
        or data.empty
    ):

        return None

    latest_price = (
        data["Close"].iloc[-1]
    )

    return {
        "ticker": ticker,
        "price": float(
            latest_price
        ),
        "currency": "USD",
    }
    
def get_historical_prices(ticker, period="1mo"):
    """
    Get historical closing prices for a stock.

    Example periods:
        1mo
        3mo
        6mo
        1y

    Returns:
        A list containing date and closing price.
    """

    ticker = ticker.upper().strip()

    # Try NSE first for Indian stocks.
    if "." not in ticker:

        nse_ticker = f"{ticker}.NS"

        stock = yf.Ticker(
            nse_ticker
        )

        try:

            data = stock.history(
                period=period
            )

        except Exception:

            data = None

        if (
            data is not None
            and not data.empty
        ):

            return [
                {
                    "date": index.strftime(
                        "%Y-%m-%d"
                    ),
                    "price": float(
                        row["Close"]
                    ),
                }
                for index, row
                in data.iterrows()
            ]


    # If NSE didn't work,
    # try the original ticker.
    stock = yf.Ticker(ticker)

    try:

        data = stock.history(
            period=period
        )

    except Exception:

        data = None

    if (
        data is None
        or data.empty
    ):

        return []

    return [
        {
            "date": index.strftime(
                "%Y-%m-%d"
            ),
            "price": float(
                row["Close"]
            ),
        }
        for index, row
        in data.iterrows()
    ]