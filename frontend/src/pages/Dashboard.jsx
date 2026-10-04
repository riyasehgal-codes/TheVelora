// Dashboard.jsx

import { useEffect, useState } from "react";

import api, {
  getMarketPrice,
  getExchangeRate,
} from "../api/client";

import Navbar from "../components/Navbar";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";


function Dashboard() {

  // ==========================================
  // STATE
  // ==========================================

  const [holdings, setHoldings] =
    useState([]);

  const [marketPrices, setMarketPrices] =
    useState({});

  const [marketCurrencies, setMarketCurrencies] =
    useState({});

  const [exchangeRate, setExchangeRate] =
    useState(1);

  const [loading, setLoading] =
    useState(true);


  // ==========================================
  // FETCH PORTFOLIO DATA
  // ==========================================

  const fetchDashboardData = async () => {

    try {

      // Get the user's holdings
      const holdingsResponse =
        await api.get(
          "/holdings/"
        );

      const holdingsData =
        holdingsResponse.data;

      setHoldings(
        holdingsData
      );


      // Objects to store prices
      // and currencies for each ticker
      const prices = {};
      const currencies = {};


      // Fetch current market price
      // for every holding
      for (
        const holding of holdingsData
      ) {

        try {

          const marketData =
            await getMarketPrice(
              holding.ticker
            );

          prices[
            holding.ticker
          ] = marketData.price;

          currencies[
            holding.ticker
          ] = marketData.currency;

        } catch (error) {

          console.error(
            `Unable to fetch ${holding.ticker}`,
            error
          );

        }

      }


      setMarketPrices(
        prices
      );

      setMarketCurrencies(
        currencies
      );


      // Get current USD -> INR rate
      const exchangeData =
        await getExchangeRate(
          "USD",
          "INR"
        );

      setExchangeRate(
        Number(
          exchangeData.rate
        )
      );

    } catch (error) {

      console.error(
        "Unable to load dashboard:",
        error
      );

    } finally {

      setLoading(false);

    }

  };


  // ==========================================
  // LOAD DATA WHEN PAGE OPENS
  // ==========================================

  useEffect(() => {

    fetchDashboardData();

  }, []);


  // ==========================================
  // CALCULATE INVESTED VALUE
  // ==========================================

  const calculateInvestedValue = (
    holding
  ) => {

    return (
      Number(
        holding.quantity
      ) *
      Number(
        holding.average_price
      )
    );

  };


  // ==========================================
  // CALCULATE CURRENT VALUE
  // ==========================================

  const calculateCurrentValue = (
    holding
  ) => {

    const price =
      marketPrices[
        holding.ticker
      ];

    if (
      price === undefined
    ) {

      return null;

    }

    return (
      Number(
        holding.quantity
      ) *
      Number(price)
    );

  };


  // ==========================================
  // CONVERT VALUE TO INR
  // ==========================================

  const convertToINR = (
    value,
    currency
  ) => {

    if (value === null) {
      return null;
    }

    if (
      currency === "USD"
    ) {

      return (
        value *
        exchangeRate
      );

    }

    return value;

  };


  // ==========================================
  // CALCULATE TOTALS
  // ==========================================

  const totalInvested =
    holdings.reduce(
      (
        total,
        holding
      ) => {

        const invested =
          calculateInvestedValue(
            holding
          );

        const currency =
          marketCurrencies[
            holding.ticker
          ];

        const investedINR =
          convertToINR(
            invested,
            currency
          );

        return (
          total +
          (investedINR || 0)
        );

      },
      0
    );


  const totalCurrentValue =
    holdings.reduce(
      (
        total,
        holding
      ) => {

        const current =
          calculateCurrentValue(
            holding
          );

        const currency =
          marketCurrencies[
            holding.ticker
          ];

        const currentINR =
          convertToINR(
            current,
            currency
          );

        return (
          total +
          (currentINR || 0)
        );

      },
      0
    );


  const totalProfitLoss =
    totalCurrentValue -
    totalInvested;


  const totalReturn =
    totalInvested > 0
      ? (
          totalProfitLoss /
          totalInvested
        ) * 100
      : 0;


  // ==========================================
  // CREATE CHART DATA
  // ==========================================

  /*
    For now, we are creating a simple
    portfolio distribution chart.

    Later, when we build historical
    market data, this will become a
    real portfolio performance chart.
  */

  const chartData =
    holdings.map(
      (holding) => {

        const currentValue =
          calculateCurrentValue(
            holding
          );

        const currency =
          marketCurrencies[
            holding.ticker
          ];

        const currentValueINR =
          convertToINR(
            currentValue,
            currency
          );

        return {
          ticker:
            holding.ticker,

          value:
            currentValueINR || 0,
        };

      }
    );


  // ==========================================
  // TOP HOLDINGS
  // ==========================================

  const topHoldings =
    [...holdings]
      .sort(
        (a, b) => {

          const valueA =
            convertToINR(
              calculateCurrentValue(a),
              marketCurrencies[
                a.ticker
              ]
            ) || 0;

          const valueB =
            convertToINR(
              calculateCurrentValue(b),
              marketCurrencies[
                b.ticker
              ]
            ) || 0;

          return valueB - valueA;

        }
      )
      .slice(0, 5);


  // ==========================================
  // LOADING SCREEN
  // ==========================================

  if (loading) {

    return (

      <div className="min-h-screen bg-gray-100">

        <Navbar />

        <main className="mx-auto max-w-6xl p-8">

          <p className="text-gray-500">
            Loading dashboard...
          </p>

        </main>

      </div>

    );

  }


  // ==========================================
  // DASHBOARD UI
  // ==========================================

  return (

    <div className="min-h-screen bg-gray-100">

      <Navbar />


      <main className="mx-auto max-w-6xl p-8">


        {/* =====================================
            HEADER
        ====================================== */}

        <div>

          <h1 className="text-3xl font-bold">
            Dashboard
          </h1>

          <p className="mt-2 text-gray-600">
            Here's an overview of your
            investment portfolio.
          </p>

        </div>


        {/* =====================================
            SUMMARY CARDS
        ====================================== */}

        <div className="mt-8 grid gap-4 md:grid-cols-3">


          {/* Portfolio Value */}

          <div className="rounded-2xl bg-white p-6 shadow">

            <p className="text-sm text-gray-500">
              Portfolio Value
            </p>

            <p className="mt-2 text-3xl font-bold">
              ₹
              {totalCurrentValue.toFixed(
                2
              )}
            </p>

          </div>


          {/* Invested */}

          <div className="rounded-2xl bg-white p-6 shadow">

            <p className="text-sm text-gray-500">
              Total Invested
            </p>

            <p className="mt-2 text-3xl font-bold">
              ₹
              {totalInvested.toFixed(
                2
              )}
            </p>

          </div>


          {/* Profit / Loss */}

          <div className="rounded-2xl bg-white p-6 shadow">

            <p className="text-sm text-gray-500">
              Total Profit / Loss
            </p>

            <p
              className={`mt-2 text-3xl font-bold ${
                totalProfitLoss >= 0
                  ? "text-green-600"
                  : "text-red-600"
              }`}
            >

              {totalProfitLoss >= 0
                ? "+"
                : "-"}

              ₹
              {Math.abs(
                totalProfitLoss
              ).toFixed(2)}

            </p>

            <p
              className={`mt-1 text-sm ${
                totalProfitLoss >= 0
                  ? "text-green-600"
                  : "text-red-600"
              }`}
            >

              {totalReturn >= 0
                ? "+"
                : ""}

              {totalReturn.toFixed(
                2
              )}

              %

            </p>

          </div>

        </div>


        {/* =====================================
            CHART + TOP HOLDINGS
        ====================================== */}

        <div className="mt-8 grid gap-6 lg:grid-cols-3">


          {/* =================================
              PORTFOLIO CHART
          ================================== */}

          <div className="rounded-2xl bg-white p-6 shadow lg:col-span-2">

            <div className="flex items-center justify-between">

              <div>

                <h2 className="text-xl font-semibold">
                  Portfolio Distribution
                </h2>

                <p className="mt-1 text-sm text-gray-500">
                  Current value of each holding
                  in INR.
                </p>

              </div>

            </div>


            <div className="mt-6 h-80">

              {chartData.length > 0 ? (

                <ResponsiveContainer
                  width="100%"
                  height="100%"
                >

                  <LineChart
                    data={chartData}
                  >

                    <CartesianGrid
                      strokeDasharray="3 3"
                    />

                    <XAxis
                      dataKey="ticker"
                    />

                    <YAxis />

                    <Tooltip
                      formatter={(
                        value
                      ) =>
                        `₹${Number(
                          value
                        ).toFixed(2)}`
                      }
                    />

                    <Line
                      type="monotone"
                      dataKey="value"
                      stroke="#000000"
                      strokeWidth={3}
                    />

                  </LineChart>

                </ResponsiveContainer>

              ) : (

                <div className="flex h-full items-center justify-center">

                  <p className="text-gray-500">
                    Add holdings to see
                    your portfolio chart.
                  </p>

                </div>

              )}

            </div>

          </div>


          {/* =================================
              TOP HOLDINGS
          ================================== */}

          <div className="rounded-2xl bg-white p-6 shadow">

            <h2 className="text-xl font-semibold">
              Top Holdings
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Your largest investments.
            </p>


            <div className="mt-6 space-y-4">

              {topHoldings.length === 0 ? (

                <p className="text-gray-500">
                  No holdings yet.
                </p>

              ) : (

                topHoldings.map(
                  (holding) => {

                    const currentValue =
                      calculateCurrentValue(
                        holding
                      );

                    const currency =
                      marketCurrencies[
                        holding.ticker
                      ];

                    const currentValueINR =
                      convertToINR(
                        currentValue,
                        currency
                      ) || 0;

                    const percentage =
                      totalCurrentValue > 0
                        ? (
                            currentValueINR /
                            totalCurrentValue
                          ) * 100
                        : 0;


                    return (

                      <div
                        key={
                          holding.id
                        }
                        className="border-b pb-4 last:border-b-0"
                      >

                        <div className="flex items-center justify-between">

                          <div>

                            <p className="font-semibold">
                              {holding.ticker}
                            </p>

                            <p className="text-sm text-gray-500">
                              {percentage.toFixed(
                                1
                              )}
                              % of portfolio
                            </p>

                          </div>


                          <p className="font-semibold">
                            ₹
                            {currentValueINR.toFixed(
                              2
                            )}
                          </p>

                        </div>

                      </div>

                    );

                  }
                )

              )}

            </div>

          </div>

        </div>


        {/* =====================================
            QUICK INFO
        ====================================== */}

        <div className="mt-8 rounded-2xl bg-white p-6 shadow">

          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">

            <div>

              <h2 className="text-xl font-semibold">
                Market Conversion
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                USD holdings are converted to
                INR using the latest exchange
                rate.
              </p>

            </div>


            <div className="rounded-xl bg-gray-50 px-5 py-3">

              <p className="text-sm text-gray-500">
                USD → INR
              </p>

              <p className="text-lg font-semibold">
                ₹
                {exchangeRate.toFixed(
                  2
                )}
              </p>

            </div>

          </div>

        </div>

      </main>

    </div>

  );

}


export default Dashboard;