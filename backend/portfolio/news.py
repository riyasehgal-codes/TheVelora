import yfinance as yf


def get_stock_news(ticker, limit=10):
    """
    Get recent financial news related to a stock.
    """

    ticker = ticker.upper().strip()

    try:
        # Yahoo Finance Search API
        search = yf.Search(
            ticker,
            news_count=limit,
        )

        raw_news = search.news

        print(
            f"SEARCH NEWS FOR {ticker}:",
            raw_news
        )

    except Exception as error:

        print(
            f"News search error for {ticker}: {error}"
        )

        return []

    if not raw_news:
        return []

    articles = []

    for item in raw_news[:limit]:

        try:

            # Current yfinance news format
            content = item.get(
                "content",
                {}
            )

            title = content.get(
                "title",
                ""
            )

            provider = content.get(
                "provider",
                {}
            )

            publisher = provider.get(
                "displayName",
                "Unknown"
            )

            published_at = content.get(
                "pubDate",
                ""
            )

            canonical_url = content.get(
                "canonicalUrl",
                {}
            )

            url = canonical_url.get(
                "url",
                ""
            )

            thumbnail = content.get(
                "thumbnail",
                {}
            )

            resolutions = thumbnail.get(
                "resolutions",
                []
            )

            image = ""

            if resolutions:

                image = resolutions[0].get(
                    "url",
                    ""
                )

            # --------------------------------
            # Fallback for older format
            # --------------------------------

            if not title:

                title = item.get(
                    "title",
                    ""
                )

                publisher = item.get(
                    "publisher",
                    "Unknown"
                )

                url = item.get(
                    "link",
                    ""
                )

                published_at = item.get(
                    "providerPublishTime",
                    ""
                )

            if title:

                articles.append({

                    "title": title,

                    "publisher": publisher,

                    "published_at": published_at,

                    "url": url,

                    "image": image,

                })

        except Exception as error:

            print(
                f"Error processing article: {error}"
            )

            continue

    return articles