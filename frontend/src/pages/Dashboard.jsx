import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

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
  getForecast,
  getStockNews,
} from "../api/client";

const CHART_COLORS = [
  "#3b82f6",
  "#06b6d4",
  "#10b981",
  "#f59e0b",
  "#ec4899",
  "#8b5cf6",
  "#f97316",
];

const cardClass =
  "rounded-2xl border border-slate-800/90 bg-[#08152d] shadow-[0_12px_35px_rgba(0,0,0,0.18)]";
const mutedText = "text-sm text-slate-400";

function Dashboard() {
  const navigate = useNavigate();

  const [holdings, setHoldings] = useState([]);
  const [marketPrices, setMarketPrices] = useState({});
  const [marketCurrencies, setMarketCurrencies] = useState({});
  const [exchangeRate, setExchangeRate] = useState(1);
  const [historicalData, setHistoricalData] = useState([]);
  const [selectedPeriod, setSelectedPeriod] = useState("1mo");

  const [loading, setLoading] = useState(true);
  const [chartLoading, setChartLoading] = useState(false);

  const [alerts, setAlerts] = useState([]);
  const [alertsLoading, setAlertsLoading] = useState(true);
  const [checkingAlerts, setCheckingAlerts] = useState(false);
  const [alertMessage, setAlertMessage] = useState("");
  const [alertError, setAlertError] = useState("");

  const [news, setNews] = useState([]);
  const [newsLoading, setNewsLoading] = useState(false);
  const [forecast, setForecast] = useState(null);
  const [forecastLoading, setForecastLoading] = useState(false);

  useEffect(() => {
    const fetchHoldings = async () => {
      try {
        const response = await api.get("/holdings/");
        setHoldings(Array.isArray(response.data) ? response.data : []);
      } catch (error) {
        console.error("Error fetching holdings:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchHoldings();
  }, []);

  const fetchAlerts = async () => {
    try {
      const response = await api.get("/alerts/");
      setAlerts(Array.isArray(response.data) ? response.data : []);
      setAlertError("");
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

  const handleCheckAlerts = async () => {
    setCheckingAlerts(true);
    setAlertMessage("");
    setAlertError("");

    try {
      const result = await api.post("/alerts/check/");
      const response = await api.get("/alerts/");
      setAlerts(Array.isArray(response.data) ? response.data : []);

      const checked = result.data.checked ?? 0;
      const triggered = result.data.triggered ?? 0;
      const failed = result.data.failed ?? 0;

      setAlertMessage(
        `Checked ${checked} alert(s). ${triggered} newly triggered.` +
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

  useEffect(() => {
    const fetchMarketData = async () => {
      if (holdings.length === 0) {
        setMarketPrices({});
        setMarketCurrencies({});
        return;
      }

      const prices = {};
      const currencies = {};

      await Promise.all(
        holdings.map(async (holding) => {
          try {
            const data = await getMarketPrice(holding.ticker);
            if (data) {
              prices[holding.ticker] = Number(data.price);
              currencies[holding.ticker] = data.currency;
            }
          } catch (error) {
            console.error(`Error fetching ${holding.ticker}:`, error);
          }
        })
      );

      setMarketPrices(prices);
      setMarketCurrencies(currencies);
    };

    fetchMarketData();
  }, [holdings]);

  useEffect(() => {
    const fetchRate = async () => {
      try {
        const data = await getExchangeRate("USD", "INR");
        if (data?.rate) setExchangeRate(Number(data.rate));
      } catch (error) {
        console.error("Exchange rate error:", error);
      }
    };

    fetchRate();
  }, []);

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

        await Promise.all(
          holdings.map(async (holding) => {
            try {
              const response = await getHistoricalPrices(
                holding.ticker,
                selectedPeriod
              );
              historicalPrices[holding.ticker] = response.data || [];
            } catch (error) {
              console.error(
                `Historical data error for ${holding.ticker}:`,
                error
              );
              historicalPrices[holding.ticker] = [];
            }
          })
        );

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

            const priceData = stockData.find((item) => item.date === date);
            if (!priceData) return;

            let value =
              Number(priceData.price) * Number(holding.quantity);

            if (marketCurrencies[holding.ticker] === "USD") {
              value *= exchangeRate;
            }

            totalValue += value;
          });

          return { date, value: Number(totalValue.toFixed(2)) };
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
  }, [holdings, selectedPeriod, marketCurrencies, exchangeRate]);

  const firstTicker = holdings[0]?.ticker;

  useEffect(() => {
    if (!firstTicker) {
      setNews([]);
      setForecast(null);
      return;
    }

    let cancelled = false;

    const loadNews = async () => {
      setNewsLoading(true);
      try {
        const response = await getStockNews(firstTicker);
        const data = response?.data ?? response;
        const items = Array.isArray(data)
          ? data
          : data?.news ?? data?.articles ?? data?.results ?? [];
        if (!cancelled) setNews(items.slice(0, 4));
      } catch (error) {
        console.error("Dashboard news preview error:", error);
        if (!cancelled) setNews([]);
      } finally {
        if (!cancelled) setNewsLoading(false);
      }
    };

    const loadForecast = async () => {
      setForecastLoading(true);
      try {
        const response = await getForecast(firstTicker);
        const data = response?.data ?? response;
        if (!cancelled) setForecast(data);
      } catch (error) {
        console.error("Dashboard forecast preview error:", error);
        if (!cancelled) setForecast(null);
      } finally {
        if (!cancelled) setForecastLoading(false);
      }
    };

    loadNews();
    loadForecast();

    return () => {
      cancelled = true;
    };
  }, [firstTicker]);

  let totalInvested = 0;
  let totalCurrentValue = 0;

  holdings.forEach((holding) => {
    const quantity = Number(holding.quantity);
    const averagePrice = Number(holding.average_price);
    const currentPrice = Number(marketPrices[holding.ticker] || 0);
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
    totalInvested > 0 ? (totalProfitLoss / totalInvested) * 100 : 0;

  const allocationData = holdings
    .map((holding) => {
      const quantity = Number(holding.quantity);
      const currentPrice = Number(marketPrices[holding.ticker] || 0);
      const currency = marketCurrencies[holding.ticker];

      let value = quantity * currentPrice;
      if (currency === "USD") value *= exchangeRate;

      return { ticker: holding.ticker, value };
    })
    .filter((item) => item.value > 0);

  const allocationTotal = allocationData.reduce(
    (total, item) => total + item.value,
    0
  );

  const finalAllocationData = allocationData.map((item) => ({
    ...item,
    percentage:
      allocationTotal > 0 ? (item.value / allocationTotal) * 100 : 0,
  }));

  const holdingPerformance = holdings
    .map((holding) => {
      const quantity = Number(holding.quantity || 0);
      const averagePrice = Number(holding.average_price || 0);
      const currentPrice = Number(marketPrices[holding.ticker] || 0);
      const currency = marketCurrencies[holding.ticker];
      const conversionRate = currency === "USD" ? exchangeRate : 1;
      const invested = quantity * averagePrice * conversionRate;
      const currentValue = quantity * currentPrice * conversionRate;
      const profitLoss = currentValue - invested;
      const returnPercentage = invested > 0 ? (profitLoss / invested) * 100 : 0;

      return {
        ticker: holding.ticker,
        invested,
        currentValue,
        profitLoss,
        returnPercentage,
        hasPrice: currentPrice > 0,
      };
    })
    .sort((a, b) => Math.abs(b.returnPercentage) - Math.abs(a.returnPercentage));

  const concentrationIndex = finalAllocationData.reduce((total, item) => {
    const weight = item.percentage / 100;
    return total + weight * weight;
  }, 0);

  const diversificationScore =
    finalAllocationData.length > 1
      ? Math.round((1 - concentrationIndex) * 100)
      : 0;

  let riskLevel = "High";
  if (diversificationScore >= 70) riskLevel = "Low";
  else if (diversificationScore >= 40) riskLevel = "Moderate";

  const largestHolding =
    finalAllocationData.length > 0
      ? finalAllocationData.reduce((largest, item) =>
          item.percentage > largest.percentage ? item : largest
        )
      : null;

  const triggeredAlerts = alerts.filter((alert) => alert.triggered);
  const activeAlerts = alerts.filter((alert) => !alert.triggered);

  const sortedHoldings = useMemo(
    () =>
      [...holdings].sort((a, b) => {
        const aValue =
          Number(marketPrices[a.ticker] || 0) * Number(a.quantity);
        const bValue =
          Number(marketPrices[b.ticker] || 0) * Number(b.quantity);
        return bValue - aValue;
      }),
    [holdings, marketPrices]
  );

  const formatCurrency = (value) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 2,
    }).format(Number(value || 0));

  const formatCompactCurrency = (value) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      notation: "compact",
      maximumFractionDigits: 1,
    }).format(Number(value || 0));

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

  const getNewsTitle = (item) =>
    item.title || item.headline || item.content || "Market news update";

  const getNewsSource = (item) =>
    item.publisher || item.source || item.provider || "Market news";

  const getNewsUrl = (item) =>
    item.link || item.url || item.article_url || "";

  const forecastTrend =
    forecast?.trend ||
    forecast?.direction ||
    forecast?.prediction?.trend ||
    "Not available";

  const forecastChange =
    forecast?.expected_change_pct ??
    forecast?.expected_change ??
    forecast?.change_percentage ??
    forecast?.percentage_change;

  const forecastCurrentPrice =
    forecast?.current_price ??
    forecast?.currentPrice ??
    forecast?.current ??
    marketPrices[firstTicker] ??
    0;

  const forecastRows =
    forecast?.predictions ||
    forecast?.forecast ||
    forecast?.forecast_data ||
    forecast?.data ||
    [];

  const forecastPoints = Array.isArray(forecastRows)
    ? forecastRows
        .map((item, index) => ({
          day: item.date || item.day || `Day ${index + 1}`,
          price: Number(
            item.predicted_price ?? item.price ?? item.value ?? item.prediction
          ),
        }))
        .filter((item) => Number.isFinite(item.price))
    : [];

  const quickLinks = [
    {
      title: "Manage portfolio",
      description: "Add, edit and review your holdings.",
      action: "Open Portfolio",
      path: "/portfolio",
      symbol: "↗",
    },
    {
      title: "Stock forecasts",
      description: "Explore your seven-day price forecasts.",
      action: "View Forecasts",
      path: "/forecast",
      symbol: "⌁",
    },
    {
      title: "Market news",
      description: "Read the latest updates for your stocks.",
      action: "Explore News",
      path: "/news",
      symbol: "▤",
    },
    {
      title: "Price alerts",
      description: "Create and manage your price notifications.",
      action: "Manage Alerts",
      path: "/alerts",
      symbol: "◉",
    },
    {
      title: "Velora AI",
      description: "Ask general questions and have a conversation.",
      action: "Ask Velora AI",
      path: "/ai-chat",
      symbol: "✳",
    },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-[#050d1d] text-white">
        <Navbar />
        <main className="mx-auto max-w-[1440px] px-5 py-12 sm:px-8">
          <div className="animate-pulse space-y-5">
            <div className="h-8 w-64 rounded bg-slate-800" />
            <div className="h-28 rounded-2xl bg-slate-900" />
            <div className="grid gap-4 md:grid-cols-3">
              {[1, 2, 3].map((item) => (
                <div key={item} className="h-28 rounded-2xl bg-slate-900" />
              ))}
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050d1d] text-slate-100">
      <Navbar />

      <main className="mx-auto max-w-[1440px] space-y-6 px-4 py-7 sm:px-6 lg:px-8 lg:py-9">
        <section className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-blue-400">
              Portfolio overview
            </p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Your financial snapshot
            </h1>
            <p className="mt-2 text-sm text-slate-400">
              Your investments, performance and market insights in one place.
            </p>
          </div>
          <button
            onClick={() => navigate("/portfolio")}
            className="w-fit rounded-xl border border-blue-500/40 bg-blue-500/10 px-4 py-2.5 text-sm font-semibold text-blue-300 transition hover:bg-blue-500/20"
          >
            View portfolio <span aria-hidden="true">↗</span>
          </button>
        </section>

        <section className={`${cardClass} overflow-hidden p-5 sm:p-6`}>
          <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-400">
                Live snapshot
              </p>
              <h2 className="mt-1 text-lg font-semibold text-white">
                Portfolio at a glance
              </h2>
              <p className={mutedText}>
                Based on your saved holdings and the latest available prices.
              </p>
            </div>
            <span className="w-fit rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-xs text-emerald-300">
              {holdings.length} {holdings.length === 1 ? "holding" : "holdings"}
            </span>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {[
              {
                label: "Total invested",
                value: formatCurrency(totalInvested),
                note: "Your purchase value",
                icon: "◈",
              },
              {
                label: "Current value",
                value: formatCurrency(totalCurrentValue),
                note: "Latest available market value",
                icon: "↗",
              },
              {
                label: "Total profit / loss",
                value: formatCurrency(totalProfitLoss),
                note: `${totalReturn >= 0 ? "+" : ""}${totalReturn.toFixed(2)}% overall`,
                icon: "⌁",
                positive: totalProfitLoss >= 0,
              },
              {
                label: "Diversification",
                value: `${diversificationScore}/100`,
                note: `${riskLevel} concentration risk`,
                icon: "◉",
              },
            ].map((metric) => (
              <div
                key={metric.label}
                className="rounded-xl border border-slate-800 bg-[#0b1b36] p-4"
              >
                <div className="flex items-center justify-between">
                  <p className="text-sm text-slate-400">{metric.label}</p>
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/10 text-lg text-blue-300">
                    {metric.icon}
                  </span>
                </div>
                <p
                  className={`mt-3 break-words text-xl font-bold tracking-tight sm:text-2xl ${
                    metric.positive === undefined
                      ? "text-white"
                      : metric.positive
                      ? "text-emerald-400"
                      : "text-rose-400"
                  }`}
                >
                  {metric.value}
                </p>
                <p className="mt-1 text-xs text-slate-500">{metric.note}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="grid gap-5 xl:grid-cols-12">
          <div className={`${cardClass} p-5 sm:p-6 xl:col-span-7`}>
            <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
              <div>
                <h2 className="text-lg font-semibold text-white">
                  Portfolio performance
                </h2>
                <p className={mutedText}>Portfolio value over time</p>
              </div>
              <div className="flex gap-1 rounded-xl bg-[#050d1d] p-1">
                {periods.map((period) => (
                  <button
                    key={period.value}
                    type="button"
                    onClick={() => setSelectedPeriod(period.value)}
                    className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                      selectedPeriod === period.value
                        ? "bg-blue-600 text-white"
                        : "text-slate-400 hover:bg-slate-800 hover:text-white"
                    }`}
                  >
                    {period.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-5 h-64 sm:h-72">
              {chartLoading ? (
                <div className="flex h-full items-center justify-center text-sm text-slate-500">
                  Loading performance data...
                </div>
              ) : historicalData.length === 0 ? (
                <div className="h-full overflow-y-auto pr-1">
                  <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="text-sm font-semibold text-white">
                        Holdings performance
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        Returns calculated from your average purchase price
                      </p>
                    </div>
                    <span className="rounded-full bg-blue-500/10 px-3 py-1 text-xs text-blue-300">
                      Live snapshot
                    </span>
                  </div>

                  {holdingPerformance.length === 0 ? (
                    <div className="flex h-[calc(100%-4rem)] min-h-36 flex-col items-center justify-center rounded-xl border border-dashed border-slate-700 bg-[#0b1b36]/60 px-4 text-center">
                      <span className="text-3xl text-slate-600">◈</span>
                      <p className="mt-2 text-sm font-medium text-slate-300">
                        Your performance overview will appear here
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        Add holdings to see stock-wise returns.
                      </p>
                      <button
                        onClick={() => navigate("/portfolio")}
                        className="mt-3 rounded-lg bg-blue-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-blue-500"
                      >
                        Add holdings
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {holdingPerformance.slice(0, 5).map((item, index) => {
                        const positive = item.profitLoss >= 0;
                        const barWidth = Math.max(
                          4,
                          Math.min(100, Math.abs(item.returnPercentage))
                        );

                        return (
                          <div
                            key={item.ticker}
                            className="rounded-xl border border-slate-800 bg-[#0b1b36] px-3 py-3"
                          >
                            <div className="flex items-center justify-between gap-3">
                              <div className="flex min-w-0 items-center gap-3">
                                <span
                                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-xs font-bold text-white"
                                  style={{
                                    backgroundColor:
                                      CHART_COLORS[index % CHART_COLORS.length],
                                  }}
                                >
                                  {item.ticker?.slice(0, 2)}
                                </span>
                                <div className="min-w-0">
                                  <p className="text-sm font-semibold text-white">
                                    {item.ticker}
                                  </p>
                                  <p className="text-xs text-slate-500">
                                    Current value {formatCurrency(item.currentValue)}
                                  </p>
                                </div>
                              </div>
                              <div className="shrink-0 text-right">
                                {item.hasPrice ? (
                                  <>
                                    <p
                                      className={`text-sm font-semibold ${
                                        positive ? "text-emerald-400" : "text-rose-400"
                                      }`}
                                    >
                                      {positive ? "+" : "−"}
                                      {formatCurrency(Math.abs(item.profitLoss))}
                                    </p>
                                    <p
                                      className={`mt-0.5 text-xs ${
                                        positive ? "text-emerald-400" : "text-rose-400"
                                      }`}
                                    >
                                      {positive ? "+" : ""}
                                      {item.returnPercentage.toFixed(2)}%
                                    </p>
                                  </>
                                ) : (
                                  <p className="text-xs text-slate-500">
                                    Price unavailable
                                  </p>
                                )}
                              </div>
                            </div>
                            <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-800">
                              <div
                                className={`h-full rounded-full ${
                                  positive ? "bg-emerald-400" : "bg-rose-400"
                                }`}
                                style={{ width: `${item.hasPrice ? barWidth : 0}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={historicalData}
                    margin={{ top: 10, right: 10, left: -15, bottom: 0 }}
                  >
                    <CartesianGrid
                      stroke="#1e293b"
                      strokeDasharray="4 4"
                      vertical={false}
                    />
                    <XAxis
                      dataKey="date"
                      tickFormatter={formatChartDate}
                      tick={{ fill: "#64748b", fontSize: 11 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      tickFormatter={formatCompactCurrency}
                      tick={{ fill: "#64748b", fontSize: 11 }}
                      axisLine={false}
                      tickLine={false}
                      width={65}
                    />
                    <Tooltip
                      contentStyle={{
                        background: "#0b1b36",
                        border: "1px solid #26364f",
                        borderRadius: "12px",
                        color: "#fff",
                      }}
                      formatter={(value) => [formatCurrency(value), "Value"]}
                      labelFormatter={formatChartDate}
                    />
                    <Line
                      type="monotone"
                      dataKey="value"
                      stroke="#3b82f6"
                      strokeWidth={2.5}
                      dot={false}
                      activeDot={{ r: 5, fill: "#60a5fa" }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          <div className={`${cardClass} p-5 sm:p-6 xl:col-span-5`}>
            <div>
              <h2 className="text-lg font-semibold text-white">
                Portfolio allocation
              </h2>
              <p className={mutedText}>How your current value is distributed</p>
            </div>

            {finalAllocationData.length === 0 ? (
              <div className="flex h-64 items-center justify-center text-sm text-slate-500">
                No allocation data available.
              </div>
            ) : (
              <div className="mt-3 grid items-center gap-3 sm:grid-cols-2">
                <div className="h-60 min-w-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={finalAllocationData}
                        dataKey="value"
                        nameKey="ticker"
                        cx="50%"
                        cy="50%"
                        innerRadius={58}
                        outerRadius={88}
                        paddingAngle={3}
                        stroke="none"
                      >
                        {finalAllocationData.map((entry, index) => (
                          <Cell
                            key={`allocation-${entry.ticker}`}
                            fill={CHART_COLORS[index % CHART_COLORS.length]}
                          />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          background: "#0b1b36",
                          border: "1px solid #26364f",
                          borderRadius: "12px",
                          color: "#fff",
                        }}
                        formatter={(value, name) => [
                          formatCurrency(value),
                          name,
                        ]}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                <div className="space-y-3">
                  {finalAllocationData.slice(0, 6).map((item, index) => (
                    <div
                      key={item.ticker}
                      className="flex items-center justify-between gap-2"
                    >
                      <div className="flex min-w-0 items-center gap-2">
                        <span
                          className="h-2.5 w-2.5 shrink-0 rounded-full"
                          style={{
                            backgroundColor:
                              CHART_COLORS[index % CHART_COLORS.length],
                          }}
                        />
                        <span className="truncate text-sm text-slate-300">
                          {item.ticker}
                        </span>
                      </div>
                      <span className="text-sm font-semibold text-white">
                        {item.percentage.toFixed(1)}%
                      </span>
                    </div>
                  ))}
                  {finalAllocationData.length > 6 && (
                    <p className="text-xs text-slate-500">
                      +{finalAllocationData.length - 6} more holdings
                    </p>
                  )}
                </div>
              </div>
            )}

            <button
              onClick={() => navigate("/portfolio")}
              className="mt-2 text-sm font-semibold text-blue-400 hover:text-blue-300"
            >
              View full portfolio <span aria-hidden="true">→</span>
            </button>
          </div>
        </section>

        <section className="grid gap-5 lg:grid-cols-12">
          <div className={`${cardClass} p-5 sm:p-6 lg:col-span-7`}>
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-white">Top holdings</h2>
                <p className={mutedText}>Your largest positions by current value</p>
              </div>
              <button
                onClick={() => navigate("/portfolio")}
                className="shrink-0 text-sm font-semibold text-blue-400 hover:text-blue-300"
              >
                View all →
              </button>
            </div>

            {sortedHoldings.length === 0 ? (
              <div className="mt-5 rounded-xl border border-dashed border-slate-700 p-6 text-center">
                <p className="text-sm text-slate-400">
                  You haven't added any holdings yet.
                </p>
                <button
                  onClick={() => navigate("/portfolio")}
                  className="mt-3 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-500"
                >
                  Add your first holding
                </button>
              </div>
            ) : (
              <div className="mt-4 overflow-x-auto">
                <table className="w-full min-w-[520px] text-left text-sm">
                  <thead className="border-b border-slate-800 text-xs uppercase tracking-wide text-slate-500">
                    <tr>
                      <th className="px-3 py-3 font-medium">Ticker</th>
                      <th className="px-3 py-3 font-medium">Quantity</th>
                      <th className="px-3 py-3 font-medium">Current price</th>
                      <th className="px-3 py-3 text-right font-medium">Value</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedHoldings.slice(0, 5).map((holding, index) => {
                      const price = Number(marketPrices[holding.ticker] || 0);
                      let value = price * Number(holding.quantity);
                      if (marketCurrencies[holding.ticker] === "USD") {
                        value *= exchangeRate;
                      }

                      return (
                        <tr
                          key={holding.id}
                          className="border-b border-slate-800/70 last:border-0"
                        >
                          <td className="px-3 py-3">
                            <div className="flex items-center gap-2">
                              <span
                                className="flex h-8 w-8 items-center justify-center rounded-lg text-xs font-bold text-white"
                                style={{
                                  backgroundColor:
                                    CHART_COLORS[index % CHART_COLORS.length],
                                }}
                              >
                                {holding.ticker?.slice(0, 2)}
                              </span>
                              <span className="font-semibold text-white">
                                {holding.ticker}
                              </span>
                            </div>
                          </td>
                          <td className="px-3 py-3 text-slate-400">
                            {holding.quantity}
                          </td>
                          <td className="px-3 py-3 text-slate-300">
                            {price ? formatCurrency(price) : "Unavailable"}
                          </td>
                          <td className="px-3 py-3 text-right font-semibold text-white">
                            {formatCurrency(value)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className={`${cardClass} p-5 sm:p-6 lg:col-span-5`}>
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-white">
                  Risk & diversification
                </h2>
                <p className={mutedText}>A concentration-based overview</p>
              </div>
              <span
                className={`rounded-full px-3 py-1 text-xs font-semibold ${
                  riskLevel === "Low"
                    ? "bg-emerald-500/10 text-emerald-300"
                    : riskLevel === "Moderate"
                    ? "bg-amber-500/10 text-amber-300"
                    : "bg-rose-500/10 text-rose-300"
                }`}
              >
                {riskLevel} risk
              </span>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-3">
              <div className="rounded-xl bg-[#0b1b36] p-4">
                <p className="text-xs text-slate-500">Diversification score</p>
                <p className="mt-2 text-3xl font-bold text-white">
                  {diversificationScore}
                  <span className="text-base text-slate-500">/100</span>
                </p>
              </div>
              <div className="rounded-xl bg-[#0b1b36] p-4">
                <p className="text-xs text-slate-500">Largest holding</p>
                <p className="mt-2 truncate text-2xl font-bold text-white">
                  {largestHolding?.ticker || "—"}
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  {largestHolding
                    ? `${largestHolding.percentage.toFixed(1)}% of portfolio`
                    : "No data available"}
                </p>
              </div>
            </div>

            {largestHolding && (
              <p className="mt-4 rounded-xl border border-blue-500/20 bg-blue-500/5 p-4 text-sm leading-6 text-slate-300">
                <span className="font-semibold text-blue-300">
                  Velora insight:
                </span>{" "}
                {largestHolding.ticker} represents{" "}
                {largestHolding.percentage.toFixed(1)}% of your portfolio.
                {largestHolding.percentage >= 50
                  ? " A large portion of your portfolio is concentrated in one holding."
                  : " Your portfolio value is spread across multiple holdings."}
              </p>
            )}
          </div>
        </section>

        <section className="grid gap-5 lg:grid-cols-12">
          <div className={`${cardClass} p-5 sm:p-6 lg:col-span-7`}>
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-400">
                  Market updates
                </p>
                <h2 className="mt-1 text-lg font-semibold text-white">
                  Recent news
                </h2>
                <p className={mutedText}>
                  {firstTicker
                    ? `News preview for ${firstTicker}`
                    : "Add a holding to see related news"}
                </p>
              </div>
              <button
                onClick={() => navigate("/news")}
                className="shrink-0 text-sm font-semibold text-blue-400 hover:text-blue-300"
              >
                View all →
              </button>
            </div>

            <div className="mt-4 divide-y divide-slate-800">
              {newsLoading ? (
                <p className="py-5 text-sm text-slate-500">Loading news...</p>
              ) : news.length === 0 ? (
                <p className="py-5 text-sm text-slate-500">
                  No recent news is available right now.
                </p>
              ) : (
                news.slice(0, 4).map((item, index) => {
                  const url = getNewsUrl(item);
                  return (
                    <div
                      key={item.uuid || item.id || `${getNewsTitle(item)}-${index}`}
                      className="flex items-start gap-3 py-4 first:pt-1 last:pb-1"
                    >
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-800 text-sm text-blue-300">
                        N
                      </span>
                      <div className="min-w-0 flex-1">
                        {url ? (
                          <a
                            href={url}
                            target="_blank"
                            rel="noreferrer"
                            className="line-clamp-2 text-sm font-medium leading-5 text-slate-200 hover:text-blue-300"
                          >
                            {getNewsTitle(item)}
                          </a>
                        ) : (
                          <p className="line-clamp-2 text-sm font-medium leading-5 text-slate-200">
                            {getNewsTitle(item)}
                          </p>
                        )}
                        <p className="mt-1 text-xs text-slate-500">
                          {getNewsSource(item)}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <div className={`${cardClass} p-5 sm:p-6 lg:col-span-5`}>
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-400">
                  Price monitoring
                </p>
                <h2 className="mt-1 text-lg font-semibold text-white">
                  Stock alerts
                </h2>
                <p className={mutedText}>Your alert activity at a glance</p>
              </div>
              <button
                onClick={() => navigate("/alerts")}
                className="shrink-0 text-sm font-semibold text-blue-400 hover:text-blue-300"
              >
                Manage →
              </button>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3">
              <div className="rounded-xl bg-[#0b1b36] p-4">
                <p className="text-xs text-slate-500">Active alerts</p>
                <p className="mt-1 text-2xl font-bold text-white">
                  {alertsLoading ? "—" : activeAlerts.length}
                </p>
              </div>
              <div className="rounded-xl bg-[#0b1b36] p-4">
                <p className="text-xs text-slate-500">Triggered alerts</p>
                <p className="mt-1 text-2xl font-bold text-emerald-400">
                  {alertsLoading ? "—" : triggeredAlerts.length}
                </p>
              </div>
            </div>

            <div className="mt-4 space-y-2">
              {alertsLoading ? (
                <p className="text-sm text-slate-500">Loading alerts...</p>
              ) : triggeredAlerts.length === 0 ? (
                <p className="rounded-xl bg-[#0b1b36] p-4 text-sm text-slate-400">
                  No triggered alerts yet. Check your active alerts for updates.
                </p>
              ) : (
                triggeredAlerts.slice(0, 3).map((alert) => (
                  <div
                    key={alert.id}
                    className="flex items-center justify-between gap-3 rounded-xl bg-[#0b1b36] p-3"
                  >
                    <div>
                      <p className="text-sm font-semibold text-white">
                        {alert.ticker}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        Went {alert.condition} {formatCurrency(alert.target_price)}
                      </p>
                    </div>
                    <span className="rounded-full bg-emerald-500/10 px-2.5 py-1 text-xs text-emerald-300">
                      Triggered
                    </span>
                  </div>
                ))
              )}
            </div>

            <button
              onClick={handleCheckAlerts}
              disabled={checkingAlerts}
              className="mt-4 w-full rounded-xl border border-blue-500/30 bg-blue-500/10 px-4 py-2.5 text-sm font-semibold text-blue-300 transition hover:bg-blue-500/20 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {checkingAlerts ? "Checking alerts..." : "Check alerts now"}
            </button>

            {alertMessage && (
              <p role="status" className="mt-3 text-xs text-emerald-300">
                {alertMessage}
              </p>
            )}
            {alertError && (
              <p role="alert" className="mt-3 text-xs text-rose-300">
                {alertError}
              </p>
            )}
          </div>
        </section>

        <section className={`${cardClass} overflow-hidden p-5 sm:p-6`}>
          <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-400">
                Forecast preview
              </p>
              <h2 className="mt-1 text-lg font-semibold text-white">
                Seven-day stock forecast
              </h2>
              <p className={mutedText}>
                {firstTicker
                  ? `A quick look at the forecast for ${firstTicker}`
                  : "Add a holding to view a stock forecast"}
              </p>
            </div>
            <button
              onClick={() => navigate("/forecast")}
              className="w-fit rounded-xl border border-blue-500/30 bg-blue-500/10 px-4 py-2 text-sm font-semibold text-blue-300 hover:bg-blue-500/20"
            >
              Explore forecasts →
            </button>
          </div>

          {forecastLoading ? (
            <p className="mt-5 text-sm text-slate-500">
              Loading forecast preview...
            </p>
          ) : !forecast ? (
            <p className="mt-5 rounded-xl bg-[#0b1b36] p-4 text-sm text-slate-400">
              Forecast preview is unavailable right now. You can still open the
              Forecast page to select a stock.
            </p>
          ) : (
            <div className="mt-5 grid gap-4 md:grid-cols-3">
              <div className="rounded-xl bg-[#0b1b36] p-4">
                <p className="text-xs text-slate-500">Selected stock</p>
                <p className="mt-2 text-2xl font-bold text-white">
                  {firstTicker}
                </p>
              </div>
              <div className="rounded-xl bg-[#0b1b36] p-4">
                <p className="text-xs text-slate-500">Current price</p>
                <p className="mt-2 text-2xl font-bold text-white">
                  {formatCurrency(forecastCurrentPrice)}
                </p>
              </div>
              <div className="rounded-xl bg-[#0b1b36] p-4">
                <p className="text-xs text-slate-500">Forecast trend</p>
                <p className="mt-2 text-2xl font-bold capitalize text-blue-300">
                  {String(forecastTrend)}
                </p>
                {forecastChange !== undefined && (
                  <p className="mt-1 text-xs text-slate-400">
                    Expected change: {Number(forecastChange).toFixed(2)}%
                  </p>
                )}
              </div>
              {forecastPoints.length > 0 && (
                <div className="h-44 md:col-span-3">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={forecastPoints}>
                      <CartesianGrid
                        stroke="#1e293b"
                        strokeDasharray="4 4"
                        vertical={false}
                      />
                      <XAxis
                        dataKey="day"
                        tick={{ fill: "#64748b", fontSize: 10 }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <YAxis
                        domain={["auto", "auto"]}
                        tick={{ fill: "#64748b", fontSize: 10 }}
                        axisLine={false}
                        tickLine={false}
                        width={55}
                      />
                      <Tooltip
                        contentStyle={{
                          background: "#0b1b36",
                          border: "1px solid #26364f",
                          borderRadius: "12px",
                          color: "#fff",
                        }}
                      />
                      <Line
                        type="monotone"
                        dataKey="price"
                        stroke="#22d3ee"
                        strokeWidth={2}
                        dot={false}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          )}
          <p className="mt-4 text-xs text-slate-600">
            Forecasts are estimates based on historical data and are not
            guaranteed predictions or financial advice.
          </p>
        </section>

        <section>
          <div className="mb-4">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-400">
              Explore Velora
            </p>
            <h2 className="mt-1 text-xl font-semibold text-white">
              Everything you need, in one place
            </h2>
            <p className={mutedText}>
              Jump directly to any part of your investment workspace.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
            {quickLinks.map((link) => (
              <button
                key={link.path}
                onClick={() => navigate(link.path)}
                className="group rounded-2xl border border-slate-800 bg-[#08152d] p-5 text-left transition hover:-translate-y-1 hover:border-blue-500/50 hover:bg-[#0b1b36]"
              >
                <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-blue-500/20 bg-blue-500/10 text-xl text-blue-300">
                  {link.symbol}
                </span>
                <h3 className="mt-4 font-semibold text-white">{link.title}</h3>
                <p className="mt-2 min-h-10 text-sm leading-5 text-slate-400">
                  {link.description}
                </p>
                <p className="mt-4 text-sm font-semibold text-blue-400 group-hover:text-blue-300">
                  {link.action} <span aria-hidden="true">→</span>
                </p>
              </button>
            ))}
          </div>
        </section>

        <footer className="flex flex-col justify-between gap-2 border-t border-slate-800 py-5 text-xs text-slate-600 sm:flex-row">
          <span>Velora · Portfolio overview</span>
          <span>USD → INR: ₹{exchangeRate.toFixed(2)}</span>
        </footer>
      </main>
    </div>
  );
}

export default Dashboard;
