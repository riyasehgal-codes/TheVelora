import { useEffect, useState } from "react";

import Navbar from "../components/Navbar";
import NewsCard from "../components/NewsCard";

import { getStockNews } from "../api/client";
import api from "../api/client";


function News() {

  const [holdings, setHoldings] = useState([]);

  const [selectedTicker, setSelectedTicker] =
    useState("");

  const [news, setNews] = useState([]);

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");


  // -----------------------------------------
  // Get user's portfolio holdings
  // -----------------------------------------

  useEffect(() => {

    const fetchHoldings = async () => {

      try {

        const response =
          await api.get("/holdings/");

        setHoldings(response.data);

        if (response.data.length > 0) {

          setSelectedTicker(
            response.data[0].ticker
          );

        }

      } catch (error) {

        console.error(
          "Failed to load holdings:",
          error
        );

        setError(
          "Unable to load your portfolio."
        );

      }

    };

    fetchHoldings();

  }, []);


  // -----------------------------------------
  // Get news when selected stock changes
  // -----------------------------------------

  useEffect(() => {

    if (!selectedTicker) {
      return;
    }

    const fetchNews = async () => {

      try {

        setLoading(true);
        setError("");

        const data =
          await getStockNews(
            selectedTicker
          );

        setNews(data.news || []);

      } catch (error) {

        console.error(
          "Failed to load news:",
          error
        );

        setError(
          "Unable to load news."
        );

        setNews([]);

      } finally {

        setLoading(false);

      }

    };

    fetchNews();

  }, [selectedTicker]);


  return (

    <div className="min-h-screen bg-[#020617] text-white">

      {/* ================================= */}
      {/* NAVBAR */}
      {/* ================================= */}

      <Navbar />


      {/* ================================= */}
      {/* PAGE HEADER */}
      {/* ================================= */}

      <div className="border-b border-slate-800">

        <div className="mx-auto max-w-7xl px-8 py-7">

          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-blue-400">
            MARKET INTELLIGENCE
          </p>

          <div className="flex items-center justify-between gap-6">

            <div>

              <h1 className="text-3xl font-semibold">
                Financial News
              </h1>

              <p className="mt-2 text-sm text-slate-400">
                Stay updated on the companies in your portfolio.
              </p>

            </div>


            {/* Stock selector */}

            {holdings.length > 0 && (

              <select
                value={selectedTicker}
                onChange={(event) =>
                  setSelectedTicker(
                    event.target.value
                  )
                }
                className="rounded-lg border border-slate-700 bg-slate-900 px-4 py-2.5 text-sm text-white outline-none focus:border-blue-500"
              >

                {holdings.map((holding) => (

                  <option
                    key={holding.id}
                    value={holding.ticker}
                  >
                    {holding.ticker}
                  </option>

                ))}

              </select>

            )}

          </div>

        </div>

      </div>


      {/* ================================= */}
      {/* NEWS */}
      {/* ================================= */}

      <main className="mx-auto max-w-7xl px-8 py-8">

        {loading && (

          <div className="py-20 text-center">

            <p className="text-sm text-slate-400">
              Loading financial news...
            </p>

          </div>

        )}


        {error && !loading && (

          <div className="rounded-xl border border-red-900/50 bg-red-950/20 p-5">

            <p className="text-sm text-red-400">
              {error}
            </p>

          </div>

        )}


        {!loading &&
          !error &&
          news.length === 0 && (

            <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-12 text-center">

              <p className="text-sm text-slate-400">
                No recent news found for{" "}
                {selectedTicker}.
              </p>

            </div>

          )}


        {!loading &&
          !error &&
          news.length > 0 && (

            <>

              <div className="mb-5 flex items-center justify-between">

                <div>

                  <h2 className="text-lg font-semibold">
                    Latest News
                  </h2>

                  <p className="mt-1 text-xs text-slate-500">
                    Recent stories related to{" "}
                    {selectedTicker}
                  </p>

                </div>

                <span className="text-xs text-slate-500">
                  {news.length} articles
                </span>

              </div>


              <div className="grid gap-4 md:grid-cols-2">

                {news.map((article, index) => (

                  <NewsCard
                    key={`${article.title}-${index}`}
                    article={article}
                  />

                ))}

              </div>

            </>

          )}

      </main>

    </div>

  );
}


export default News;