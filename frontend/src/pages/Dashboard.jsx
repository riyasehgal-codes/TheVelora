import { useEffect, useState } from "react";

import {
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

import Navbar from "../components/Navbar";

import api, {
  getMarketPrice,
  getExchangeRate,
  getHistoricalPrices,
} from "../api/client";


function Dashboard() {

  // ==========================================
  // STATE
  // ==========================================

  const [holdings, setHoldings] = useState([]);

  const [marketPrices, setMarketPrices] =
    useState({});

  const [marketCurrencies, setMarketCurrencies] =
    useState({});

  const [exchangeRate, setExchangeRate] =
    useState(1);

  const [historicalData, setHistoricalData] =
    useState([]);

  const [selectedPeriod, setSelectedPeriod] =
    useState("1mo");

  const [loading, setLoading] =
    useState(true);

  const [chartLoading, setChartLoading] =
    useState(false);


  // ==========================================
  // FETCH HOLDINGS
  // ==========================================

  useEffect(() => {

    const fetchHoldings = async () => {

      try {

        const response =
          await api.get("/holdings/");

        setHoldings(response.data);

      } catch (error) {

        console.error(
          "Error fetching holdings:",
          error
        );

      } finally {

        setLoading(false);

      }

    };

    fetchHoldings();

  }, []);


  // ==========================================
  // FETCH CURRENT MARKET PRICES
  // ==========================================

  useEffect(() => {

    const fetchMarketData = async () => {

      if (holdings.length === 0) {
        return;
      }

      const prices = {};
      const currencies = {};

      for (const holding of holdings) {

        try {

          const data =
            await getMarketPrice(
              holding.ticker
            );

          if (data) {

            prices[holding.ticker] =
              data.price;

            currencies[holding.ticker] =
              data.currency;

          }

        } catch (error) {

          console.error(
            `Error fetching ${holding.ticker}:`,
            error
          );

        }

      }

      setMarketPrices(prices);
      setMarketCurrencies(currencies);

    };

    fetchMarketData();

  }, [holdings]);


  // ==========================================
  // FETCH USD → INR RATE
  // ==========================================

  useEffect(() => {

    const fetchExchangeRate = async () => {

      try {

        const data =
          await getExchangeRate(
            "USD",
            "INR"
          );

        if (data?.rate) {

          setExchangeRate(
            Number(data.rate)
          );

        }

      } catch (error) {

        console.error(
          "Exchange rate error:",
          error
        );

      }

    };

    fetchExchangeRate();

  }, []);


  // ==========================================
  // FETCH HISTORICAL DATA
  // ==========================================

  useEffect(() => {

    const fetchHistoricalData =
      async () => {

        if (holdings.length === 0) {
          return;
        }

        setChartLoading(true);

        try {

          const historicalPrices = {};


          // Fetch historical prices
          // for every holding.

          for (
            const holding of holdings
          ) {

            try {

              const response =
                await getHistoricalPrices(
                  holding.ticker,
                  selectedPeriod
                );

              historicalPrices[
                holding.ticker
              ] = response.data || [];

            } catch (error) {

              console.error(
                `Historical data error for ${holding.ticker}:`,
                error
              );

              historicalPrices[
                holding.ticker
              ] = [];

            }

          }


          // ========================================
          // COLLECT ALL AVAILABLE DATES
          // ========================================

          const allDates = new Set();

          Object.values(
            historicalPrices
          ).forEach((stockData) => {

            stockData.forEach((item) => {

              allDates.add(item.date);

            });

          });


          const sortedDates =
            Array.from(allDates).sort();


          // ========================================
          // CALCULATE PORTFOLIO VALUE
          // FOR EVERY DATE
          // ========================================

          const portfolioHistory =
            sortedDates.map((date) => {

              let totalValue = 0;


              holdings.forEach(
                (holding) => {

                  const stockData =
                    historicalPrices[
                      holding.ticker
                    ];

                  if (!stockData) {
                    return;
                  }


                  // Find this stock's
                  // price for this date.

                  const priceData =
                    stockData.find(
                      (item) =>
                        item.date === date
                    );


                  if (!priceData) {
                    return;
                  }


                  const quantity =
                    Number(
                      holding.quantity
                    );


                  let value =
                    priceData.price *
                    quantity;


                  // Convert USD holdings
                  // into INR.

                  const currency =
                    marketCurrencies[
                      holding.ticker
                    ];


                  if (
                    currency === "USD"
                  ) {

                    value =
                      value *
                      exchangeRate;

                  }


                  totalValue += value;

                }
              );


              return {

                date: date,

                value:
                  Number(
                    totalValue.toFixed(2)
                  ),

              };

            });


          setHistoricalData(
            portfolioHistory
          );

        } catch (error) {

          console.error(
            "Historical portfolio error:",
            error
          );

          setHistoricalData([]);

        } finally {

          setChartLoading(false);

        }

      };


    /*
     * Wait until we know the currencies
     * of the holdings before calculating
     * historical INR values.
     */

    if (
      holdings.length > 0 &&
      Object.keys(
        marketCurrencies
      ).length > 0
    ) {

      fetchHistoricalData();

    }

  }, [
    holdings,
    selectedPeriod,
    marketCurrencies,
    exchangeRate,
  ]);


  // ==========================================
  // CURRENT PORTFOLIO CALCULATIONS
  // ==========================================

  let totalInvested = 0;

  let totalCurrentValue = 0;


  holdings.forEach((holding) => {

    const quantity =
      Number(holding.quantity);

    const averagePrice =
      Number(
        holding.average_price
      );

    const currentPrice =
      Number(
        marketPrices[
          holding.ticker
        ] || 0
      );

    const currency =
      marketCurrencies[
        holding.ticker
      ];


    let invested =
      quantity * averagePrice;

    let currentValue =
      quantity * currentPrice;


    // Convert USD values to INR.

    if (currency === "USD") {

      invested =
        invested *
        exchangeRate;

      currentValue =
        currentValue *
        exchangeRate;

    }


    totalInvested += invested;

    totalCurrentValue +=
      currentValue;

  });


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
  // PORTFOLIO ALLOCATION
  // ==========================================

  const allocationData = holdings
    .map((holding) => {

      const quantity =
        Number(holding.quantity);

      const currentPrice =
        Number(
          marketPrices[
            holding.ticker
          ] || 0
        );

      const currency =
        marketCurrencies[
          holding.ticker
        ];


      let value =
        quantity * currentPrice;


      // Convert USD holdings to INR.

      if (currency === "USD") {

        value =
          value *
          exchangeRate;

      }


      return {

        ticker:
          holding.ticker,

        value:
          value,

      };

    })
    .filter(
      (item) =>
        item.value > 0
    );


  const allocationTotal =
    allocationData.reduce(
      (total, item) =>
        total + item.value,
      0
    );


  const finalAllocationData =
    allocationData.map(
      (item) => ({

        ...item,

        percentage:
          allocationTotal > 0
            ? (
                item.value /
                allocationTotal
              ) * 100
            : 0,

      })
    );
  
  // ==========================================
  // RISK & DIVERSIFICATION SCORE
  // ==========================================

  /*
  * We use portfolio concentration to
  * calculate a simple diversification score.
  *
  * HHI = Sum of squared portfolio weights.
  *
  * Example:
  *
  * 50% / 50%
  * HHI = 0.25 + 0.25 = 0.50
  *
  * 90% / 10%
  * HHI = 0.81 + 0.01 = 0.82
  *
  * Higher HHI = more concentrated.
  * Lower HHI = more diversified.
  */

  const concentrationIndex =
    finalAllocationData.reduce(
      (total, item) => {

        const weight =
          item.percentage / 100;

        return (
          total +
          weight * weight
        );

      },
      0
    );


  /*
  * Convert concentration into
  * an easy-to-understand score.
  *
  * 100 = highly diversified
  * 0   = highly concentrated
  */

  const diversificationScore =
    finalAllocationData.length > 1
      ? Math.round(
          (1 - concentrationIndex) * 100
        )
      : 0;


  /*
  * Determine a simple risk category.
  */

  let riskLevel = "High";

  if (diversificationScore >= 70) {

    riskLevel = "Low";

  } else if (
    diversificationScore >= 40
  ) {

    riskLevel = "Moderate";

  }


  /*
  * Find the largest holding.
  */

  const largestHolding =
    finalAllocationData.length > 0
      ? finalAllocationData.reduce(
          (largest, item) =>
            item.percentage >
            largest.percentage
              ? item
              : largest
        )
      : null;

  // ==========================================
  // FORMATTERS
  // ==========================================

  const formatCurrency = (value) => {

    return new Intl.NumberFormat(
      "en-IN",
      {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 2,
      }
    ).format(value);

  };


  const formatChartDate = (
    date
  ) => {

    const parsedDate =
      new Date(date);

    return parsedDate.toLocaleDateString(
      "en-IN",
      {
        day: "numeric",
        month: "short",
      }
    );

  };


  // ==========================================
  // PERIOD BUTTONS
  // ==========================================

  const periods = [

    {
      label: "1M",
      value: "1mo",
    },

    {
      label: "3M",
      value: "3mo",
    },

    {
      label: "6M",
      value: "6mo",
    },

    {
      label: "1Y",
      value: "1y",
    },

  ];


  // ==========================================
  // LOADING STATE
  // ==========================================

  if (loading) {

    return (

      <div>

        <Navbar />

        <main className="p-8">

          <p className="text-gray-500">
            Loading dashboard...
          </p>

        </main>

      </div>

    );

  }


  // ==========================================
  // DASHBOARD
  // ==========================================

  return (

    <div className="min-h-screen bg-gray-50">

      <Navbar />


      <main className="mx-auto max-w-7xl p-8">


        {/* ====================================
            PAGE HEADER
        ==================================== */}

        <div className="mb-8">

          <h2 className="text-3xl font-bold">
            Dashboard
          </h2>

          <p className="mt-1 text-gray-500">
            Track your portfolio performance
            and investments.
          </p>

        </div>


        {/* ====================================
            SUMMARY CARDS
        ==================================== */}

        <div className="grid gap-6 md:grid-cols-3">


          {/* Portfolio Value */}

          <div className="rounded-2xl bg-white p-6 shadow-sm">

            <p className="text-sm text-gray-500">
              Portfolio Value
            </p>

            <h3 className="mt-2 text-2xl font-bold">
              {formatCurrency(
                totalCurrentValue
              )}
            </h3>

          </div>


          {/* Total Invested */}

          <div className="rounded-2xl bg-white p-6 shadow-sm">

            <p className="text-sm text-gray-500">
              Total Invested
            </p>

            <h3 className="mt-2 text-2xl font-bold">
              {formatCurrency(
                totalInvested
              )}
            </h3>

          </div>


          {/* Total P/L */}

          <div className="rounded-2xl bg-white p-6 shadow-sm">

            <p className="text-sm text-gray-500">
              Total P/L
            </p>

            <h3
              className={`mt-2 text-2xl font-bold ${
                totalProfitLoss >= 0
                  ? "text-green-600"
                  : "text-red-600"
              }`}
            >

              {formatCurrency(
                totalProfitLoss
              )}

            </h3>

            <p
              className={`mt-1 text-sm ${
                totalReturn >= 0
                  ? "text-green-600"
                  : "text-red-600"
              }`}
            >

              {totalReturn >= 0
                ? "+"
                : ""}

              {totalReturn.toFixed(2)}%

            </p>

          </div>

        </div>


        {/* ====================================
            HISTORICAL PERFORMANCE
        ==================================== */}

        <div className="mt-8 rounded-2xl bg-white p-6 shadow-sm">


          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">


            <div>

              <h3 className="text-xl font-semibold">
                Portfolio Performance
              </h3>

              <p className="mt-1 text-sm text-gray-500">
                Portfolio value over time
              </p>

            </div>


            {/* Period Selector */}

            <div className="flex gap-2">

              {periods.map(
                (period) => (

                  <button
                    key={period.value}
                    onClick={() =>
                      setSelectedPeriod(
                        period.value
                      )
                    }
                    className={`rounded-lg px-4 py-2 text-sm font-medium ${
                      selectedPeriod ===
                      period.value
                        ? "bg-black text-white"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    }`}
                  >

                    {period.label}

                  </button>

                )
              )}

            </div>

          </div>


          {/* Chart */}

          <div className="mt-6 h-80">

            {chartLoading ? (

              <div className="flex h-full items-center justify-center">

                <p className="text-gray-500">
                  Loading performance data...
                </p>

              </div>

            ) : historicalData.length === 0 ? (

              <div className="flex h-full items-center justify-center">

                <p className="text-gray-500">
                  No historical data available.
                </p>

              </div>

            ) : (

              <ResponsiveContainer
                width="100%"
                height="100%"
              >

                <LineChart
                  data={
                    historicalData
                  }
                  margin={{
                    top: 10,
                    right: 20,
                    left: 10,
                    bottom: 10,
                  }}
                >

                  <CartesianGrid
                    strokeDasharray="3 3"
                  />

                  <XAxis
                    dataKey="date"
                    tickFormatter={
                      formatChartDate
                    }
                  />

                  <YAxis
                    tickFormatter={(
                      value
                    ) =>
                      `₹${(
                        value / 1000
                      ).toFixed(0)}k`
                    }
                  />

                  <Tooltip
                    formatter={(
                      value
                    ) =>
                      formatCurrency(
                        value
                      )
                    }
                    labelFormatter={(
                      label
                    ) =>
                      formatChartDate(
                        label
                      )
                    }
                  />

                  <Line
                    type="monotone"
                    dataKey="value"
                    stroke="currentColor"
                    strokeWidth={2}
                    dot={false}
                  />

                </LineChart>

              </ResponsiveContainer>

            )}

          </div>

        </div>


        {/* ====================================
            PORTFOLIO ALLOCATION
        ==================================== */}

        <div className="mt-8 rounded-2xl bg-white p-6 shadow-sm">


          <div>

            <h3 className="text-xl font-semibold">
              Portfolio Allocation
            </h3>

            <p className="mt-1 text-sm text-gray-500">
              How your portfolio is distributed
              across your holdings.
            </p>

          </div>


          <div className="mt-6 grid gap-8 md:grid-cols-2">


            {/* ==================================
                PIE CHART
            ================================== */}

            <div className="h-72">

              {finalAllocationData.length === 0 ? (

                <div className="flex h-full items-center justify-center">

                  <p className="text-gray-500">
                    No allocation data available.
                  </p>

                </div>

              ) : (

                <ResponsiveContainer
                  width="100%"
                  height="100%"
                >

                  <PieChart>

                    <Pie
                      data={
                        finalAllocationData
                      }
                      dataKey="value"
                      nameKey="ticker"
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      label={({
                        ticker,
                        percentage,
                      }) =>
                        `${ticker} ${percentage.toFixed(1)}%`
                      }
                    >

                      {finalAllocationData.map(
                        (entry, index) => (

                          <Cell
                            key={
                              `cell-${index}`
                            }
                          />

                        )
                      )}

                    </Pie>

                    <Tooltip
                      formatter={(
                        value,
                        name
                      ) => [

                        formatCurrency(
                          value
                        ),

                        name,

                      ]}
                    />

                  </PieChart>

                </ResponsiveContainer>

              )}

            </div>


            {/* ==================================
                ALLOCATION DETAILS
            ================================== */}

            <div className="flex flex-col justify-center gap-4">

              {finalAllocationData.map(
                (item) => (

                  <div
                    key={item.ticker}
                    className="flex items-center justify-between rounded-xl bg-gray-50 p-4"
                  >

                    <div>

                      <p className="font-semibold">
                        {item.ticker}
                      </p>

                      <p className="text-sm text-gray-500">
                        {formatCurrency(
                          item.value
                        )}
                      </p>

                    </div>


                    <p className="font-semibold">
                      {item.percentage.toFixed(1)}%
                    </p>

                  </div>

                )
              )}

            </div>

          </div>

        </div>

          {/* ====================================
            RISK & DIVERSIFICATION
              ==================================== */}

              <div className="mt-8 rounded-2xl bg-white p-6 shadow-sm">

                <div>

                  <h3 className="text-xl font-semibold">
                    Risk & Diversification
                  </h3>

                  <p className="mt-1 text-sm text-gray-500">
                    A simple concentration-based view
                    of your portfolio.
                  </p>

                </div>


                <div className="mt-6 grid gap-6 md:grid-cols-3">


                  {/* ==================================
                      DIVERSIFICATION SCORE
                  ================================== */}

                  <div className="rounded-xl bg-gray-50 p-5">

                    <p className="text-sm text-gray-500">
                      Diversification Score
                    </p>

                    <p className="mt-2 text-3xl font-bold">
                      {diversificationScore}
                      <span className="text-lg text-gray-400">
                        /100
                      </span>
                    </p>

                  </div>


                  {/* ==================================
                      RISK LEVEL
                  ================================== */}

                  <div className="rounded-xl bg-gray-50 p-5">

                    <p className="text-sm text-gray-500">
                      Portfolio Risk
                    </p>

                    <p
                      className={`mt-2 text-3xl font-bold ${
                        riskLevel === "Low"
                          ? "text-green-600"
                          : riskLevel === "Moderate"
                          ? "text-yellow-600"
                          : "text-red-600"
                      }`}
                    >
                      {riskLevel}
                    </p>

                  </div>


                  {/* ==================================
                      LARGEST HOLDING
                  ================================== */}

                  <div className="rounded-xl bg-gray-50 p-5">

                    <p className="text-sm text-gray-500">
                      Largest Holding
                    </p>

                    {largestHolding ? (

                      <>

                        <p className="mt-2 text-3xl font-bold">
                          {largestHolding.ticker}
                        </p>

                        <p className="mt-1 text-sm text-gray-500">
                          {largestHolding.percentage.toFixed(1)}%
                          of portfolio
                        </p>

                      </>

                    ) : (

                      <p className="mt-2 text-gray-400">
                        No data
                      </p>

                    )}

                  </div>

                </div>


                {/* ==================================
                    EXPLANATION
                ================================== */}

                {largestHolding && (

                  <div className="mt-6 rounded-xl border p-4">

                    <p className="text-sm text-gray-600">

                      <span className="font-semibold">
                        Velora insight:
                      </span>{" "}

                      {largestHolding.ticker} represents{" "}
                      {largestHolding.percentage.toFixed(1)}%
                      {" "}of your portfolio.

                      {largestHolding.percentage >= 50
                        ? " A large portion of the portfolio is concentrated in a single holding."
                        : " The portfolio is relatively distributed across multiple holdings."
                      }

                    </p>

                  </div>

                )}

              </div>

        {/* ====================================
            TOP HOLDINGS
        ==================================== */}

        <div className="mt-8 rounded-2xl bg-white p-6 shadow-sm">

          <h3 className="text-xl font-semibold">
            Top Holdings
          </h3>


          <div className="mt-4 space-y-3">

            {holdings.map(
              (holding) => {

                const currentPrice =
                  Number(
                    marketPrices[
                      holding.ticker
                    ] || 0
                  );

                const quantity =
                  Number(
                    holding.quantity
                  );

                const currency =
                  marketCurrencies[
                    holding.ticker
                  ];


                let value =
                  currentPrice *
                  quantity;


                if (
                  currency === "USD"
                ) {

                  value =
                    value *
                    exchangeRate;

                }


                return (

                  <div
                    key={holding.id}
                    className="flex items-center justify-between rounded-xl bg-gray-50 p-4"
                  >

                    <div>

                      <p className="font-semibold">
                        {holding.ticker}
                      </p>

                      <p className="text-sm text-gray-500">
                        {quantity} shares
                      </p>

                    </div>


                    <p className="font-semibold">
                      {formatCurrency(
                        value
                      )}
                    </p>

                  </div>

                );

              }
            )}

          </div>

        </div>


        {/* ====================================
            EXCHANGE RATE
        ==================================== */}

        <div className="mt-6 text-sm text-gray-500">

          USD → INR:
          {" "}
          ₹{exchangeRate.toFixed(2)}

        </div>

      </main>

    </div>

  );

}


export default Dashboard;