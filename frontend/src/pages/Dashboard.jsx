
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

const CHART_COLORS = [
  "#6366f1",
  "#06b6d4",
  "#10b981",
  "#f59e0b",
  "#ec4899",
  "#8b5cf6",
  "#f97316",
];

function Dashboard() {
  // ==========================================
  // STATE
  // ==========================================

  const [holdings, setHoldings] = useState([]);
  const [marketPrices, setMarketPrices] = useState({});
  const [marketCurrencies, setMarketCurrencies] = useState({});
  const [exchangeRate, setExchangeRate] = useState(1);
  const [historicalData, setHistoricalData] = useState([]);
  const [selectedPeriod, setSelectedPeriod] = useState("1mo");

  const [loading, setLoading] = useState(true);
  const [chartLoading, setChartLoading] = useState(false);

  // Phase 5: alert state
  const [alerts, setAlerts] = useState([]);
  const [alertsLoading, setAlertsLoading] = useState(true);
  const [checkingAlerts, setCheckingAlerts] = useState(false);
  const [alertMessage, setAlertMessage] = useState("");
  const [alertError, setAlertError] = useState("");

  // ==========================================
  // FETCH HOLDINGS
  // ==========================================

  useEffect(() => {
    const fetchHoldings = async () => {
      try {
        const response = await api.get("/holdings/");
        setHoldings(
          Array.isArray(response.data) ? response.data : []
        );
      } catch (error) {
        console.error("Error fetching holdings:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchHoldings();
  }, []);

  // ==========================================
  // PHASE 5: FETCH ALERTS
  // ==========================================

  const fetchAlerts = async () => {
    try {
      const response = await api.get("/alerts/");
      setAlerts(
        Array.isArray(response.data) ? response.data : []
      );
    } catch (error) {
      console.error("Error fetching alerts:", error);
      setAlertError("Unable to load your alerts.");
    } finally {
      setAlertsLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
  }, []);

  // ==========================================
  // PHASE 5: CHECK ALERTS
  // ==========================================

  const handleCheckAlerts = async () => {
    setCheckingAlerts(true);
    setAlertMessage("");
    setAlertError("");

    try {
      const result = await api.post("/alerts/check/");

      // Reload the alerts so their statuses are up to date.
      const response = await api.get("/alerts/");
      setAlerts(
        Array.isArray(response.data) ? response.data : []
      );

      const checked = result.data.checked ?? 0;
      const triggered = result.data.triggered ?? 0;
      const failed = result.data.failed ?? 0;

      setAlertMessage(
        `Checked ${checked} alert(s). ` +
        `${triggered} newly triggered.` +
        (failed > 0 ? ` ${failed} could not be checked.` : "")
      );
    } catch (error) {
      console.error("Error checking alerts:", error);

      setAlertError(
        error.response?.data?.detail ||
        error.response?.data?.error ||
        "Unable to check alerts. Please try again."
      );
    } finally {
      setCheckingAlerts(false);
    }
  };

  // ==========================================
  // FETCH CURRENT MARKET PRICES
  // ==========================================

  useEffect(() => {
    const fetchMarketData = async () => {
      if (holdings.length === 0) {
        setMarketPrices({});
        setMarketCurrencies({});
        return;
      }

      const prices = {};
      const currencies = {};

      for (const holding of holdings) {
        try {
          const data = await getMarketPrice(holding.ticker);

          if (data) {
            prices[holding.ticker] = Number(data.price);
            currencies[holding.ticker] = data.currency;
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
  // FETCH USD TO INR EXCHANGE RATE
  // ==========================================

  useEffect(() => {
    const fetchRate = async () => {
      try {
        const data = await getExchangeRate("USD", "INR");

        if (data?.rate) {
          setExchangeRate(Number(data.rate));
        }
      } catch (error) {
        console.error("Exchange rate error:", error);
      }
    };

    fetchRate();
  }, []);

  // ==========================================
  // FETCH HISTORICAL PORTFOLIO DATA
  // ==========================================

  useEffect(() => {
    const fetchHistoricalData = async () => {
      if (
        holdings.length === 0 ||
        Object.keys(marketCurrencies).length === 0
      ) {
        setHistoricalData([]);
        return;
      }

      setChartLoading(true);

      try {
        const historicalPrices = {};

        for (const holding of holdings) {
          try {
            const response = await getHistoricalPrices(
              holding.ticker,
              selectedPeriod
            );

            historicalPrices[holding.ticker] =
              response.data || [];
          } catch (error) {
            console.error(
              `Historical data error for ${holding.ticker}:`,
              error
            );

            historicalPrices[holding.ticker] = [];
          }
        }

        const allDates = new Set();

        Object.values(historicalPrices).forEach((stockData) => {
          stockData.forEach((item) => {
            if (item.date) allDates.add(item.date);
          });
        });

        const sortedDates = Array.from(allDates).sort();

        const portfolioHistory = sortedDates.map((date) => {
          let totalValue = 0;

          holdings.forEach((holding) => {
            const stockData = historicalPrices[holding.ticker];

            if (!stockData) return;

            const priceData = stockData.find(
              (item) => item.date === date
            );

            if (!priceData) return;

            let value =
              Number(priceData.price) *
              Number(holding.quantity);

            if (marketCurrencies[holding.ticker] === "USD") {
              value *= exchangeRate;
            }

            totalValue += value;
          });

          return {
            date,
            value: Number(totalValue.toFixed(2)),
          };
        });

        setHistoricalData(portfolioHistory);
      } catch (error) {
        console.error("Historical portfolio error:", error);
        setHistoricalData([]);
      } finally {
        setChartLoading(false);
      }
    };

    fetchHistoricalData();
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
    const quantity = Number(holding.quantity);
    const averagePrice = Number(holding.average_price);
    const currentPrice = Number(
      marketPrices[holding.ticker] || 0
    );
    const currency = marketCurrencies[holding.ticker];

    let invested = quantity * averagePrice;
    let currentValue = quantity * currentPrice;

    if (currency === "USD") {
      invested *= exchangeRate;
      currentValue *= exchangeRate;
    }

    totalInvested += invested;
    totalCurrentValue += currentValue;
  });

  const totalProfitLoss = totalCurrentValue - totalInvested;

  const totalReturn =
    totalInvested > 0
      ? (totalProfitLoss / totalInvested) * 100
      : 0;

  // ==========================================
  // PORTFOLIO ALLOCATION
  // ==========================================

  const allocationData = holdings
    .map((holding) => {
      const quantity = Number(holding.quantity);
      const currentPrice = Number(
        marketPrices[holding.ticker] || 0
      );
      const currency = marketCurrencies[holding.ticker];

      let value = quantity * currentPrice;

      if (currency === "USD") {
        value *= exchangeRate;
      }

      return {
        ticker: holding.ticker,
        value,
      };
    })
    .filter((item) => item.value > 0);

  const allocationTotal = allocationData.reduce(
    (total, item) => total + item.value,
    0
  );

  const finalAllocationData = allocationData.map((item) => ({
    ...item,
    percentage:
      allocationTotal > 0
        ? (item.value / allocationTotal) * 100
        : 0,
  }));

  // ==========================================
  // RISK AND DIVERSIFICATION
  // ==========================================

  const concentrationIndex = finalAllocationData.reduce(
    (total, item) => {
      const weight = item.percentage / 100;
      return total + weight * weight;
    },
    0
  );

  const diversificationScore =
    finalAllocationData.length > 1
      ? Math.round((1 - concentrationIndex) * 100)
      : 0;

  let riskLevel = "High";

  if (diversificationScore >= 70) {
    riskLevel = "Low";
  } else if (diversificationScore >= 40) {
    riskLevel = "Moderate";
  }

  const largestHolding =
    finalAllocationData.length > 0
      ? finalAllocationData.reduce((largest, item) =>
          item.percentage > largest.percentage ? item : largest
        )
      : null;

  // ==========================================
  // FORMATTERS
  // ==========================================

  const formatCurrency = (value) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 2,
    }).format(value);

  const formatChartDate = (date) =>
    new Date(date).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
    });

  const periods = [
    { label: "1M", value: "1mo" },
    { label: "3M", value: "3mo" },
    { label: "6M", value: "6mo" },
    { label: "1Y", value: "1y" },
  ];

  const triggeredAlerts = alerts.filter(
    (alert) => alert.triggered
  );

  // ==========================================
  // LOADING STATE
  // ==========================================

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <main className="p-8">
          <p className="text-gray-500">Loading dashboard...</p>
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
        {/* PAGE HEADER */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold">Dashboard</h2>
          <p className="mt-1 text-gray-500">
            Track your portfolio performance and investments.
          </p>
        </div>

        {/* PHASE 5: STOCK ALERTS */}
        <section className="mb-8 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <div>
              <h3 className="text-xl font-semibold">
                Stock Alerts
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                Check your price alerts and review triggered alerts.
              </p>
            </div>

            <button
              type="button"
              onClick={handleCheckAlerts}
              disabled={checkingAlerts}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {checkingAlerts ? "Checking..." : "Check Alerts Now"}
            </button>
          </div>

          {alertMessage && (
            <p
              className="mt-4 rounded-lg bg-green-50 p-3 text-sm text-green-700"
              role="status"
            >
              {alertMessage}
            </p>
          )}

          {alertError && (
            <p
              className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700"
              role="alert"
            >
              {alertError}
            </p>
          )}

          <div className="mt-5 space-y-3">
            {alertsLoading ? (
              <p className="text-sm text-gray-500">
                Loading alerts...
              </p>
            ) : triggeredAlerts.length === 0 ? (
              <div className="rounded-xl bg-gray-50 p-5 text-sm text-gray-500">
                No triggered alerts yet. Click "Check Alerts Now"
                to check your active alerts.
              </div>
            ) : (
              triggeredAlerts.slice(0, 5).map((alert) => (
                <div
                  key={alert.id}
                  className="flex flex-col justify-between gap-3 rounded-xl border border-gray-100 p-4 sm:flex-row sm:items-center"
                >
                  <div>
                    <p className="font-semibold text-gray-900">
                      {alert.ticker}
                    </p>

                    <p className="mt-1 text-sm text-gray-500">
                      Price went{" "}
                      {alert.condition === "above"
                        ? "above"
                        : "below"}{" "}
                      {formatCurrency(Number(alert.target_price))}
                    </p>

                    {alert.triggered_at && (
                      <p className="mt-1 text-xs text-gray-400">
                        Triggered:{" "}
                        {new Date(
                          alert.triggered_at
                        ).toLocaleString("en-IN")}
                      </p>
                    )}
                  </div>

                  <span className="w-fit rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">
                    Triggered
                  </span>
                </div>
              ))
            )}

            {!alertsLoading && triggeredAlerts.length > 5 && (
              <p className="text-sm text-gray-500">
                Showing 5 of {triggeredAlerts.length} triggered alerts.
                View the Alerts page for the complete list.
              </p>
            )}
          </div>
        </section>

        {/* SUMMARY CARDS */}
        <div className="grid gap-6 md:grid-cols-3">
          <div className="rounded-2xl bg-white p-6 shadow-sm">
            <p className="text-sm text-gray-500">Portfolio Value</p>
            <h3 className="mt-2 text-2xl font-bold">
              {formatCurrency(totalCurrentValue)}
            </h3>
          </div>

          <div className="rounded-2xl bg-white p-6 shadow-sm">
            <p className="text-sm text-gray-500">Total Invested</p>
            <h3 className="mt-2 text-2xl font-bold">
              {formatCurrency(totalInvested)}
            </h3>
          </div>

          <div className="rounded-2xl bg-white p-6 shadow-sm">
            <p className="text-sm text-gray-500">Total P/L</p>
            <h3
              className={`mt-2 text-2xl font-bold ${
                totalProfitLoss >= 0
                  ? "text-green-600"
                  : "text-red-600"
              }`}
            >
              {formatCurrency(totalProfitLoss)}
            </h3>
            <p
              className={`mt-1 text-sm ${
                totalReturn >= 0
                  ? "text-green-600"
                  : "text-red-600"
              }`}
            >
              {totalReturn >= 0 ? "+" : ""}
              {totalReturn.toFixed(2)}%
            </p>
          </div>
        </div>

        {/* HISTORICAL PERFORMANCE */}
        <section className="mt-8 rounded-2xl bg-white p-6 shadow-sm">
          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
            <div>
              <h3 className="text-xl font-semibold">
                Portfolio Performance
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                Portfolio value over time
              </p>
            </div>

            <div className="flex gap-2">
              {periods.map((period) => (
                <button
                  key={period.value}
                  type="button"
                  onClick={() => setSelectedPeriod(period.value)}
                  className={`rounded-lg px-4 py-2 text-sm font-medium ${
                    selectedPeriod === period.value
                      ? "bg-black text-white"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  {period.label}
                </button>
              ))}
            </div>
          </div>

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
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={historicalData}
                  margin={{
                    top: 10,
                    right: 20,
                    left: 10,
                    bottom: 10,
                  }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="date"
                    tickFormatter={formatChartDate}
                  />
                  <YAxis
                    tickFormatter={(value) =>
                      `₹${(value / 1000).toFixed(0)}k`
                    }
                  />
                  <Tooltip
                    formatter={(value) => formatCurrency(value)}
                    labelFormatter={formatChartDate}
                  />
                  <Line
                    type="monotone"
                    dataKey="value"
                    stroke="#6366f1"
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </section>

        {/* PORTFOLIO ALLOCATION */}
        <section className="mt-8 rounded-2xl bg-white p-6 shadow-sm">
          <div>
            <h3 className="text-xl font-semibold">
              Portfolio Allocation
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              How your portfolio is distributed across your holdings.
            </p>
          </div>

          <div className="mt-6 grid gap-8 md:grid-cols-2">
            <div className="h-72">
              {finalAllocationData.length === 0 ? (
                <div className="flex h-full items-center justify-center">
                  <p className="text-gray-500">
                    No allocation data available.
                  </p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={finalAllocationData}
                      dataKey="value"
                      nameKey="ticker"
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      label={({ ticker, percentage }) =>
                        `${ticker} ${percentage.toFixed(1)}%`
                      }
                    >
                      {finalAllocationData.map((entry, index) => (
                        <Cell
                          key={`cell-${entry.ticker}`}
                          fill={
                            CHART_COLORS[index % CHART_COLORS.length]
                          }
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value, name) => [
                        formatCurrency(value),
                        name,
                      ]}
                    />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>

            <div className="flex flex-col justify-center gap-4">
              {finalAllocationData.map((item, index) => (
                <div
                  key={item.ticker}
                  className="flex items-center justify-between rounded-xl bg-gray-50 p-4"
                >
                  <div className="flex items-center gap-3">
                    <span
                      className="h-3 w-3 rounded-full"
                      style={{
                        backgroundColor:
                          CHART_COLORS[index % CHART_COLORS.length],
                      }}
                    />
                    <div>
                      <p className="font-semibold">{item.ticker}</p>
                      <p className="text-sm text-gray-500">
                        {formatCurrency(item.value)}
                      </p>
                    </div>
                  </div>
                  <p className="font-semibold">
                    {item.percentage.toFixed(1)}%
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* RISK AND DIVERSIFICATION */}
        <section className="mt-8 rounded-2xl bg-white p-6 shadow-sm">
          <div>
            <h3 className="text-xl font-semibold">
              Risk &amp; Diversification
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              A simple concentration-based view of your portfolio.
            </p>
          </div>

          <div className="mt-6 grid gap-6 md:grid-cols-3">
            <div className="rounded-xl bg-gray-50 p-5">
              <p className="text-sm text-gray-500">
                Diversification Score
              </p>
              <p className="mt-2 text-3xl font-bold">
                {diversificationScore}
                <span className="text-lg text-gray-400">/100</span>
              </p>
            </div>

            <div className="rounded-xl bg-gray-50 p-5">
              <p className="text-sm text-gray-500">Portfolio Risk</p>
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

            <div className="rounded-xl bg-gray-50 p-5">
              <p className="text-sm text-gray-500">Largest Holding</p>
              {largestHolding ? (
                <>
                  <p className="mt-2 text-3xl font-bold">
                    {largestHolding.ticker}
                  </p>
                  <p className="mt-1 text-sm text-gray-500">
                    {largestHolding.percentage.toFixed(1)}% of portfolio
                  </p>
                </>
              ) : (
                <p className="mt-2 text-gray-400">No data</p>
              )}
            </div>
          </div>

          {largestHolding && (
            <div className="mt-6 rounded-xl border p-4">
              <p className="text-sm text-gray-600">
                <span className="font-semibold">Velora insight:</span>{" "}
                {largestHolding.ticker} represents{" "}
                {largestHolding.percentage.toFixed(1)}% of your portfolio.
                {largestHolding.percentage >= 50
                  ? " A large portion of the portfolio is concentrated in a single holding."
                  : " Your portfolio is relatively distributed across multiple holdings."}
              </p>
            </div>
          )}
        </section>

        {/* TOP HOLDINGS */}
        <section className="mt-8 rounded-2xl bg-white p-6 shadow-sm">
          <h3 className="text-xl font-semibold">Top Holdings</h3>

          <div className="mt-4 space-y-3">
            {holdings.length === 0 ? (
              <p className="rounded-xl bg-gray-50 p-4 text-sm text-gray-500">
                You haven't added any holdings yet.
              </p>
            ) : (
              holdings.map((holding) => {
                const currentPrice = Number(
                  marketPrices[holding.ticker] || 0
                );
                const quantity = Number(holding.quantity);
                const currency = marketCurrencies[holding.ticker];

                let value = currentPrice * quantity;

                if (currency === "USD") {
                  value *= exchangeRate;
                }

                return (
                  <div
                    key={holding.id}
                    className="flex items-center justify-between rounded-xl bg-gray-50 p-4"
                  >
                    <div>
                      <p className="font-semibold">{holding.ticker}</p>
                      <p className="text-sm text-gray-500">
                        {quantity} shares
                      </p>
                    </div>
                    <p className="font-semibold">
                      {formatCurrency(value)}
                    </p>
                  </div>
                );
              })
            )}
          </div>
        </section>

        {/* EXCHANGE RATE */}
        <div className="mt-6 text-sm text-gray-500">
          USD → INR: ₹{exchangeRate.toFixed(2)}
        </div>
      </main>
    </div>
  );
}

export default Dashboard;
