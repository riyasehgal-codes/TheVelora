
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
  "#5279df",
  "#648eea",
  "#829fe8",
  "#9a83df",
  "#4c9bbd",
  "#58a995",
  "#b18bd6",
];

const CARD =
  "rounded-2xl border border-[#142039] bg-[#050b18] shadow-[0_8px_24px_rgba(0,0,0,0.22)]";

const INNER_CARD =
  "rounded-xl border border-[#142039] bg-[#070f1e]";

const MUTED = "text-sm text-slate-500";

function SectionHeading({ eyebrow, title, description, action }) {
  return (
    <div className="flex min-w-0 flex-col justify-between gap-3 sm:flex-row sm:items-center">
      <div>
        {eyebrow && (
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-blue-400">
            {eyebrow}
          </p>
        )}
        <h2 className="mt-1 text-base font-semibold tracking-tight text-white sm:text-lg">
          {title}
        </h2>
        {description && (
          <p className="mt-1 max-w-2xl text-xs leading-5 text-slate-500 sm:text-sm">{description}</p>
        )}
      </div>
      {action}
    </div>
  );
}

function EmptyState({ title, description, action, onClick }) {
  return (
    <div className="flex min-h-48 flex-col items-center justify-center rounded-xl border border-dashed border-[#1b2b46] bg-[#070f1e] px-5 py-8 text-center">
      <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-blue-500/20 bg-blue-500/10 text-xl text-blue-300">
        ◈
      </div>
      <p className="mt-3 text-sm font-semibold text-white">{title}</p>
      <p className="mt-1 max-w-sm text-xs leading-5 text-slate-500">
        {description}
      </p>
      {action && (
        <button
          onClick={onClick}
          className="mt-4 rounded-lg bg-[#24458f] px-4 py-2 text-xs font-semibold text-white transition hover:bg-[#315fc4]"
        >
          {action}
        </button>
      )}
    </div>
  );
}

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
    let cancelled = false;

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

      if (!cancelled) {
        setMarketPrices(prices);
        setMarketCurrencies(currencies);
      }
    };

    fetchMarketData();

    return () => {
      cancelled = true;
    };
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
    let cancelled = false;

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

          return {
            date,
            value: Number(totalValue.toFixed(2)),
          };
        });

        if (!cancelled) setHistoricalData(portfolioHistory);
      } catch (error) {
        console.error("Historical portfolio error:", error);
        if (!cancelled) setHistoricalData([]);
      } finally {
        if (!cancelled) setChartLoading(false);
      }
    };

    fetchHistoricalData();

    return () => {
      cancelled = true;
    };
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
    totalInvested > 0
      ? (totalProfitLoss / totalInvested) * 100
      : 0;

  const allocationData = holdings
    .map((holding) => {
      const quantity = Number(holding.quantity);
      const currentPrice = Number(marketPrices[holding.ticker] || 0);
      const currency = marketCurrencies[holding.ticker];

      let value = quantity * currentPrice;
      if (currency === "USD") value *= exchangeRate;

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

      const returnPercentage =
        invested > 0 ? (profitLoss / invested) * 100 : 0;

      return {
        ticker: holding.ticker,
        invested,
        currentValue,
        profitLoss,
        returnPercentage,
        hasPrice: currentPrice > 0,
      };
    })
    .sort(
      (a, b) =>
        Math.abs(b.returnPercentage) - Math.abs(a.returnPercentage)
    );

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

  if (finalAllocationData.length === 0) {
    riskLevel = "Unavailable";
  } else if (finalAllocationData.length === 1) {
    riskLevel = "High";
  } else if (diversificationScore >= 70) {
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
            item.predicted_price ??
              item.price ??
              item.value ??
              item.prediction
          ),
        }))
        .filter((item) => Number.isFinite(item.price))
    : [];

  const quickLinks = [
    {
      title: "Manage portfolio",
      description: "Add, edit and review your holdings.",
      action: "Open portfolio",
      path: "/portfolio",
      symbol: "↗",
    },
    {
      title: "Stock forecasts",
      description: "Explore your seven-day price forecasts.",
      action: "View forecasts",
      path: "/forecast",
      symbol: "⌁",
    },
    {
      title: "Market news",
      description: "Read the latest updates for your stocks.",
      action: "Explore news",
      path: "/news",
      symbol: "▤",
    },
    {
      title: "Price alerts",
      description: "Create and manage your price notifications.",
      action: "Manage alerts",
      path: "/alerts",
      symbol: "◉",
    },
    {
      title: "Velora AI",
      description: "Ask questions and start a conversation.",
      action: "Ask Velora AI",
      path: "/ai-chat",
      symbol: "✳",
    },
  ];

  if (loading) {
    return (
      <div className="min-h-screen w-full overflow-x-clip bg-[#020510] text-white">
        <Navbar />
        <main className="mx-auto w-full max-w-[1440px] space-y-5 px-3 py-6 sm:space-y-6 sm:px-6 sm:py-8 lg:px-8 lg:py-10">
          <div className="animate-pulse space-y-5">
            <div className="h-4 w-36 rounded bg-[#142039]" />
            <div className="h-9 w-72 rounded-lg bg-[#142039]" />
            <div className="h-5 w-96 max-w-full rounded bg-[#0b1425]" />
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {[1, 2, 3, 4].map((item) => (
                <div
                  key={item}
                  className="h-36 rounded-2xl border border-[#142039] bg-[#050b18]"
                />
              ))}
            </div>
            <div className="grid gap-5 xl:grid-cols-2">
              <div className="h-80 rounded-2xl bg-[#050b18]" />
              <div className="h-80 rounded-2xl bg-[#050b18]" />
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full overflow-x-clip bg-[#020510] text-slate-100">
      <style>{`
        main [class*="bg-[#081832]"],
        main [class*="bg-[#07142b]"],
        main [class*="bg-[#091831]"] {
          background-color: #050b18 !important;
        }

        main [class*="bg-[#0a1a35]"],
        main [class*="bg-[#0b1c37]"],
        main [class*="bg-[#0b1d3a]"] {
          background-color: #070f1e !important;
        }

        main [class*="bg-[#10264b]"] {
          background-color: #0b1930 !important;
        }

        main [class*="bg-[#040d1d]"] {
          background-color: #030814 !important;
        }

        main [class*="bg-[#17366d]"] {
          background-color: #14264a !important;
        }

        main [class*="bg-[#20478c]"] {
          background-color: #1b315c !important;
        }

        main [class*="border-[#1b3155]"],
        main [class*="border-[#17294a]"],
        main [class*="border-[#203453]"],
        main [class*="border-[#1b2b46]"],
        main [class*="border-[#294574]"],
        main [class*="border-[#263957]"] {
          border-color: #142039 !important;
        }

        main [class*="hover:bg-[#0a1a35]"]:hover,
        main [class*="hover:bg-[#0b1c37]"]:hover {
          background-color: #0a1425 !important;
        }

        main [class*="shadow-"] {
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.22) !important;
        }
      `}</style>

      <Navbar />

      <main className="mx-auto w-full max-w-[1440px] space-y-5 px-3 py-5 sm:space-y-6 sm:px-6 sm:py-7 lg:px-8 lg:py-9">
        <section className="min-w-0 rounded-2xl border border-[#142039] bg-[#050b18] p-4 shadow-[0_8px_24px_rgba(0,0,0,0.22)] sm:p-6 lg:p-8">
          <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
            <div>
              <div className="mb-3 flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-blue-400" />
                <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-blue-300">
                  Your investment workspace
                </p>
              </div>

              <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl lg:text-4xl">
                Your financial snapshot
              </h1>

              <p className="mt-2 max-w-xl text-sm leading-6 text-slate-400">
                Track your investments, monitor performance and explore
                market insights — all from one place.
              </p>
            </div>

            <button
              onClick={() => navigate("/portfolio")}
              className="w-full rounded-xl border border-blue-500/30 bg-[#14264a] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#1b315c] sm:w-fit"
            >
              View portfolio <span className="ml-2">↗</span>
            </button>
          </div>

          <div className="mt-5 flex flex-wrap gap-2 border-t border-[#142039] pt-4 sm:mt-7 sm:gap-3 sm:pt-5">
            <div className="min-w-[calc(50%-0.25rem)] flex-1 rounded-lg border border-[#142039] bg-[#070f1e] px-3 py-2.5 sm:min-w-0 sm:px-4">
              <p className="text-[10px] uppercase tracking-wider text-slate-500">
                Your holdings
              </p>
              <p className="mt-1 text-sm font-semibold text-white">
                {holdings.length} {holdings.length === 1 ? "stock" : "stocks"}
              </p>
            </div>
            <div className="min-w-[calc(50%-0.25rem)] flex-1 rounded-lg border border-[#142039] bg-[#070f1e] px-3 py-2.5 sm:min-w-0 sm:px-4">
              <p className="text-[10px] uppercase tracking-wider text-slate-500">
                Active alerts
              </p>
              <p className="mt-1 text-sm font-semibold text-white">
                {alertsLoading ? "—" : activeAlerts.length}
              </p>
            </div>
            <div className="min-w-[calc(50%-0.25rem)] flex-1 rounded-lg border border-[#142039] bg-[#070f1e] px-3 py-2.5 sm:min-w-0 sm:px-4">
              <p className="text-[10px] uppercase tracking-wider text-slate-500">
                Portfolio currency
              </p>
              <p className="mt-1 text-sm font-semibold text-white">INR ₹</p>
            </div>
          </div>
        </section>

        <section className={`${CARD} min-w-0 p-4 sm:p-5 lg:p-6`}>
          <SectionHeading
            eyebrow="Portfolio overview"
            title="Portfolio at a glance"
            description="A quick overview of your investment performance."
            action={
              <span className="w-fit rounded-full border border-blue-500/20 bg-blue-500/10 px-3 py-1.5 text-xs font-medium text-blue-300">
                Live snapshot
              </span>
            }
          />

          <div className="mt-4 grid grid-cols-1 gap-3 min-[420px]:grid-cols-2 xl:mt-5 xl:grid-cols-4">
            {[
              {
                label: "Total invested",
                value: formatCurrency(totalInvested),
                note: "Your total purchase value",
                symbol: "◈",
              },
              {
                label: "Current value",
                value: formatCurrency(totalCurrentValue),
                note: "Latest available market value",
                symbol: "↗",
              },
              {
                label: "Total profit / loss",
                value: formatCurrency(totalProfitLoss),
                note: `${totalReturn >= 0 ? "+" : ""}${totalReturn.toFixed(2)}% overall return`,
                symbol: "⌁",
                positive: totalProfitLoss >= 0,
              },
              {
                label: "Diversification",
                value:
                  finalAllocationData.length > 0
                    ? `${diversificationScore}/100`
                    : "—",
                note:
                  riskLevel === "Unavailable"
                    ? "Add holdings to calculate"
                    : `${riskLevel} concentration risk`,
                symbol: "◉",
              },
            ].map((metric) => (
              <div
                key={metric.label}
                className="rounded-xl border border-[#142039] bg-[#070f1e] p-4 transition hover:border-[#24458f]"
              >
                <div className="flex items-center justify-between">
                  <p className="text-xs font-medium text-slate-400">
                    {metric.label}
                  </p>
                  <span className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#1b315c] bg-[#0b1930] text-lg text-blue-300">
                    {metric.symbol}
                  </span>
                </div>

                <p
                  className={`mt-4 break-words text-xl font-bold tracking-tight sm:text-2xl ${
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

        <section className="grid min-w-0 grid-cols-1 gap-4 lg:gap-5 xl:grid-cols-12">
          <div className={`${CARD} min-w-0 p-4 sm:p-5 lg:p-6 xl:col-span-7`}>
            <SectionHeading
              eyebrow="Performance"
              title="Portfolio performance"
              description="Track how your portfolio value changes over time."
              action={
                <div className="flex max-w-full flex-wrap gap-1 rounded-lg border border-[#142039] bg-[#030814] p-1">
                  {periods.map((period) => (
                    <button
                      key={period.value}
                      type="button"
                      onClick={() => setSelectedPeriod(period.value)}
                      className={`rounded-md px-3 py-1.5 text-xs font-semibold transition ${
                        selectedPeriod === period.value
                          ? "bg-[#24458f] text-white"
                          : "text-slate-400 hover:bg-[#142542] hover:text-white"
                      }`}
                    >
                      {period.label}
                    </button>
                  ))}
                </div>
              }
            />

            <div className="mt-4 h-56 min-w-0 sm:mt-5 sm:h-72">
              {chartLoading ? (
                <div className="flex h-full items-center justify-center text-sm text-slate-500">
                  Loading performance data...
                </div>
              ) : historicalData.length === 0 ? (
                <div className="h-full overflow-y-auto pr-1">
                  {holdingPerformance.length === 0 ? (
                    <EmptyState
                      title="Your performance overview will appear here"
                      description="Add your first holding to start tracking your portfolio performance."
                      action="Add holdings"
                      onClick={() => navigate("/portfolio")}
                    />
                  ) : (
                    <>
                      <div className="mb-4 flex items-center justify-between gap-2">
                        <div>
                          <p className="text-sm font-semibold text-white">
                            Holdings performance
                          </p>
                          <p className="mt-1 text-xs text-slate-500">
                            Returns based on your average purchase price
                          </p>
                        </div>
                        <span className="rounded-full border border-[#1b315c] bg-[#0b1930] px-3 py-1 text-xs text-blue-300">
                          Snapshot
                        </span>
                      </div>

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
                              className={`${INNER_CARD} px-3 py-3`}
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
                                      Current value{" "}
                                      {formatCurrency(item.currentValue)}
                                    </p>
                                  </div>
                                </div>

                                <div className="shrink-0 text-right">
                                  {item.hasPrice ? (
                                    <>
                                      <p
                                        className={`text-sm font-semibold ${
                                          positive
                                            ? "text-emerald-400"
                                            : "text-rose-400"
                                        }`}
                                      >
                                        {positive ? "+" : "−"}
                                        {formatCurrency(
                                          Math.abs(item.profitLoss)
                                        )}
                                      </p>
                                      <p
                                        className={`mt-0.5 text-xs ${
                                          positive
                                            ? "text-emerald-400"
                                            : "text-rose-400"
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

                              <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-[#142039]">
                                <div
                                  className={`h-full rounded-full ${
                                    positive
                                      ? "bg-emerald-400"
                                      : "bg-rose-400"
                                  }`}
                                  style={{
                                    width: `${
                                      item.hasPrice ? barWidth : 0
                                    }%`,
                                  }}
                                />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </>
                  )}
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={historicalData}
                    margin={{ top: 10, right: 10, left: -15, bottom: 0 }}
                  >
                    <CartesianGrid
                      stroke="#142039"
                      strokeDasharray="4 4"
                      vertical={false}
                    />
                    <XAxis
                      dataKey="date"
                      tickFormatter={formatChartDate}
                      tick={{ fill: "#71829e", fontSize: 11 }}
                      axisLine={false}
                      tickLine={false}
                      minTickGap={25}
                    />
                    <YAxis
                      tickFormatter={formatCompactCurrency}
                      tick={{ fill: "#71829e", fontSize: 11 }}
                      axisLine={false}
                      tickLine={false}
                      width={65}
                    />
                    <Tooltip
                      contentStyle={{
                        background: "#070f1e",
                        border: "1px solid #1b315c",
                        borderRadius: "10px",
                        color: "#fff",
                      }}
                      formatter={(value) => [
                        formatCurrency(value),
                        "Portfolio value",
                      ]}
                      labelFormatter={formatChartDate}
                    />
                    <Line
                      type="monotone"
                      dataKey="value"
                      stroke="#5279df"
                      strokeWidth={2.5}
                      dot={false}
                      activeDot={{
                        r: 5,
                        fill: "#82a4f4",
                        stroke: "#070f1e",
                        strokeWidth: 3,
                      }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          <div className={`${CARD} min-w-0 p-4 sm:p-5 lg:p-6 xl:col-span-5`}>
            <SectionHeading
              eyebrow="Asset distribution"
              title="Portfolio allocation"
              description="See how your current value is distributed."
            />

            {finalAllocationData.length === 0 ? (
              <div className="mt-4">
                <EmptyState
                  title="No allocation data yet"
                  description="Your stock allocation will appear here once market prices are available."
                />
              </div>
            ) : (
              <div className="mt-4 grid min-w-0 grid-cols-1 items-center gap-3 sm:grid-cols-2">
                <div className="h-52 min-w-0 sm:h-60">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={finalAllocationData}
                        dataKey="value"
                        nameKey="ticker"
                        cx="50%"
                        cy="50%"
                        innerRadius={62}
                        outerRadius={92}
                        paddingAngle={3}
                        stroke="none"
                      >
                        {finalAllocationData.map((entry, index) => (
                          <Cell
                            key={`allocation-${entry.ticker}`}
                            fill={
                              CHART_COLORS[index % CHART_COLORS.length]
                            }
                          />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          background: "#070f1e",
                          border: "1px solid #1b315c",
                          borderRadius: "10px",
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
              className="mt-3 text-sm font-semibold text-blue-400 transition hover:text-blue-300"
            >
              View full portfolio <span className="ml-1">→</span>
            </button>
          </div>
        </section>

        <section className="grid min-w-0 grid-cols-1 gap-4 lg:gap-5 lg:grid-cols-12">
          <div className={`${CARD} min-w-0 p-4 sm:p-5 lg:p-6 lg:col-span-7`}>
            <SectionHeading
              eyebrow="Your investments"
              title="Top holdings"
              description="Your largest positions by current market value."
              action={
                <button
                  onClick={() => navigate("/portfolio")}
                  className="text-sm font-semibold text-blue-400 transition hover:text-blue-300"
                >
                  View all →
                </button>
              }
            />

            {sortedHoldings.length === 0 ? (
              <div className="mt-5">
                <EmptyState
                  title="Your portfolio is waiting"
                  description="Add your first stock to start tracking its value and performance."
                  action="Add your first holding"
                  onClick={() => navigate("/portfolio")}
                />
              </div>
            ) : (
              <div className="mt-5 max-w-full overflow-x-auto overscroll-x-contain rounded-lg">
                <table className="w-full min-w-[500px] text-left text-xs sm:text-sm">
                  <thead className="border-b border-[#142039] text-[10px] uppercase tracking-[0.14em] text-slate-500">
                    <tr>
                      <th className="px-3 py-3 font-semibold">Ticker</th>
                      <th className="px-3 py-3 font-semibold">Quantity</th>
                      <th className="px-3 py-3 font-semibold">
                        Current price
                      </th>
                      <th className="px-3 py-3 text-right font-semibold">
                        Value
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {sortedHoldings.slice(0, 5).map((holding, index) => {
                      const price = Number(
                        marketPrices[holding.ticker] || 0
                      );

                      let value = price * Number(holding.quantity);

                      if (marketCurrencies[holding.ticker] === "USD") {
                        value *= exchangeRate;
                      }

                      return (
                        <tr
                          key={holding.id}
                          className="border-b border-[#142039] transition last:border-0 hover:bg-[#070f1e]"
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

          <div className={`${CARD} min-w-0 p-4 sm:p-5 lg:p-6 lg:col-span-5`}>
            <SectionHeading
              eyebrow="Portfolio health"
              title="Risk & diversification"
              description="A concentration-based overview of your holdings."
              action={
                <span
                  className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
                    riskLevel === "Low"
                      ? "bg-emerald-500/10 text-emerald-300"
                      : riskLevel === "Moderate"
                      ? "bg-amber-500/10 text-amber-300"
                      : riskLevel === "High"
                      ? "bg-rose-500/10 text-rose-300"
                      : "bg-slate-700/50 text-slate-400"
                  }`}
                >
                  {riskLevel === "Unavailable"
                    ? "No data"
                    : `${riskLevel} risk`}
                </span>
              }
            />

            <div className="mt-4 grid grid-cols-1 gap-3 min-[420px]:grid-cols-2 sm:mt-5">
              <div className={`${INNER_CARD} p-4`}>
                <p className="text-xs text-slate-500">
                  Diversification score
                </p>
                <p className="mt-2 text-3xl font-bold text-white">
                  {finalAllocationData.length > 0
                    ? diversificationScore
                    : "—"}
                  {finalAllocationData.length > 0 && (
                    <span className="text-base text-slate-500">/100</span>
                  )}
                </p>
              </div>

              <div className={`${INNER_CARD} p-4`}>
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

            {largestHolding ? (
              <div className="mt-4 rounded-xl border border-[#142039] bg-[#070f1e] p-4">
                <p className="text-xs font-bold uppercase tracking-wider text-blue-300">
                  Velora insight
                </p>
                <p className="mt-2 text-sm leading-6 text-slate-300">
                  <span className="font-semibold text-white">
                    {largestHolding.ticker}
                  </span>{" "}
                  represents{" "}
                  <span className="font-semibold text-blue-300">
                    {largestHolding.percentage.toFixed(1)}%
                  </span>{" "}
                  of your portfolio.
                  {largestHolding.percentage >= 50
                    ? " A large portion of your portfolio is concentrated in one holding."
                    : " Your portfolio value is spread across multiple holdings."}
                </p>
              </div>
            ) : (
              <p className="mt-4 rounded-xl border border-[#142039] bg-[#070f1e] p-4 text-sm leading-6 text-slate-400">
                Add holdings with available market prices to see your
                diversification insights.
              </p>
            )}

            <p className="mt-3 text-[11px] leading-5 text-slate-600">
              This score measures portfolio concentration only. It is not a
              complete assessment of investment risk.
            </p>
          </div>
        </section>

        <section className="grid min-w-0 grid-cols-1 gap-4 lg:gap-5 lg:grid-cols-12">
          <div className={`${CARD} min-w-0 p-4 sm:p-5 lg:p-6 lg:col-span-7`}>
            <SectionHeading
              eyebrow="Market updates"
              title="Recent news"
              description={
                firstTicker
                  ? `Latest news preview for ${firstTicker}.`
                  : "Add a holding to see related market news."
              }
              action={
                <button
                  onClick={() => navigate("/news")}
                  className="text-sm font-semibold text-blue-400 transition hover:text-blue-300"
                >
                  View all →
                </button>
              }
            />

            <div className="mt-4 divide-y divide-[#142039]">
              {newsLoading ? (
                <p className="py-5 text-sm text-slate-500">
                  Loading market news...
                </p>
              ) : news.length === 0 ? (
                <p className="py-5 text-sm text-slate-500">
                  No recent news is available right now.
                </p>
              ) : (
                news.slice(0, 4).map((item, index) => {
                  const url = getNewsUrl(item);

                  return (
                    <div
                      key={
                        item.uuid ||
                        item.id ||
                        `${getNewsTitle(item)}-${index}`
                      }
                      className="flex items-start gap-3 py-4 first:pt-1 last:pb-1"
                    >
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-[#1b315c] bg-[#0b1930] text-sm font-bold text-blue-300">
                        N
                      </span>

                      <div className="min-w-0 flex-1">
                        {url ? (
                          <a
                            href={url}
                            target="_blank"
                            rel="noreferrer"
                            className="line-clamp-2 text-sm font-medium leading-5 text-slate-200 transition hover:text-blue-300"
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

                      {url && (
                        <span className="shrink-0 text-slate-600">↗</span>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <div className={`${CARD} min-w-0 p-4 sm:p-5 lg:p-6 lg:col-span-5`}>
            <SectionHeading
              eyebrow="Price monitoring"
              title="Stock alerts"
              description="Keep track of your alert activity."
              action={
                <button
                  onClick={() => navigate("/alerts")}
                  className="text-sm font-semibold text-blue-400 transition hover:text-blue-300"
                >
                  Manage →
                </button>
              }
            />

            <div className="mt-4 grid grid-cols-1 gap-3 min-[420px]:grid-cols-2 sm:mt-5">
              <div className={`${INNER_CARD} p-4`}>
                <p className="text-xs text-slate-500">Active alerts</p>
                <p className="mt-2 text-2xl font-bold text-white">
                  {alertsLoading ? "—" : activeAlerts.length}
                </p>
              </div>

              <div className={`${INNER_CARD} p-4`}>
                <p className="text-xs text-slate-500">Triggered alerts</p>
                <p className="mt-2 text-2xl font-bold text-emerald-400">
                  {alertsLoading ? "—" : triggeredAlerts.length}
                </p>
              </div>
            </div>

            <div className="mt-4 space-y-2">
              {alertsLoading ? (
                <p className="text-sm text-slate-500">Loading alerts...</p>
              ) : triggeredAlerts.length === 0 ? (
                <p className="rounded-xl border border-[#142039] bg-[#070f1e] p-4 text-sm text-slate-400">
                  No triggered alerts yet. Check your active alerts for
                  updates.
                </p>
              ) : (
                triggeredAlerts.slice(0, 3).map((alert) => (
                  <div
                    key={alert.id}
                    className="flex items-center justify-between gap-3 rounded-xl border border-[#142039] bg-[#070f1e] p-3"
                  >
                    <div>
                      <p className="text-sm font-semibold text-white">
                        {alert.ticker}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        Went {alert.condition}{" "}
                        {formatCurrency(alert.target_price)}
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
              className="mt-4 w-full rounded-xl border border-[#24458f] bg-[#14264a] px-4 py-2.5 text-sm font-semibold text-blue-100 transition hover:bg-[#1b315c] disabled:cursor-not-allowed disabled:opacity-50"
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

        <section className={`${CARD} min-w-0 overflow-hidden p-4 sm:p-5 lg:p-6`}>
          <div className="flex min-w-0 flex-col justify-between gap-3 sm:flex-row sm:items-center">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-blue-400">
                Predictive insights
              </p>
              <h2 className="mt-1 text-lg font-semibold text-white">
                Seven-day stock forecast
              </h2>
              <p className={MUTED}>
                {firstTicker
                  ? `A quick look at the forecast for ${firstTicker}.`
                  : "Add a holding to view a stock forecast."}
              </p>
            </div>

            <button
              onClick={() => navigate("/forecast")}
              className="w-fit rounded-xl border border-[#24458f] bg-[#14264a] px-4 py-2.5 text-sm font-semibold text-blue-100 transition hover:bg-[#1b315c]"
            >
              Explore forecasts →
            </button>
          </div>

          {forecastLoading ? (
            <p className="mt-5 text-sm text-slate-500">
              Loading forecast preview...
            </p>
          ) : !forecast ? (
            <div className="mt-5">
              <EmptyState
                title="Forecast preview unavailable"
                description="You can still open the Forecast page and select a stock to explore its forecast."
                action="Open forecasts"
                onClick={() => navigate("/forecast")}
              />
            </div>
          ) : (
            <div className="mt-4 grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-2 lg:mt-5 lg:grid-cols-3">
              <div className={`${INNER_CARD} p-4`}>
                <p className="text-xs text-slate-500">Selected stock</p>
                <p className="mt-2 text-2xl font-bold text-white">
                  {firstTicker}
                </p>
              </div>

              <div className={`${INNER_CARD} p-4`}>
                <p className="text-xs text-slate-500">Current price</p>
                <p className="mt-2 text-2xl font-bold text-white">
                  {formatCurrency(forecastCurrentPrice)}
                </p>
              </div>

              <div className={`${INNER_CARD} p-4`}>
                <p className="text-xs text-slate-500">Forecast trend</p>
                <p className="mt-2 text-2xl font-bold capitalize text-blue-300">
                  {String(forecastTrend)}
                </p>

                {forecastChange !== undefined && (
                  <p className="mt-1 text-xs text-slate-400">
                    Expected change:{" "}
                    {Number(forecastChange).toFixed(2)}%
                  </p>
                )}
              </div>

              {forecastPoints.length > 0 && (
                <div className="h-48 min-w-0 rounded-xl border border-[#142039] bg-[#070f1e] p-2 sm:h-52 sm:p-3 sm:col-span-2 lg:col-span-3">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={forecastPoints}>
                      <CartesianGrid
                        stroke="#142039"
                        strokeDasharray="4 4"
                        vertical={false}
                      />
                      <XAxis
                        dataKey="day"
                        tick={{ fill: "#71829e", fontSize: 10 }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <YAxis
                        domain={["auto", "auto"]}
                        tick={{ fill: "#71829e", fontSize: 10 }}
                        axisLine={false}
                        tickLine={false}
                        width={55}
                      />
                      <Tooltip
                        contentStyle={{
                          background: "#070f1e",
                          border: "1px solid #1b315c",
                          borderRadius: "10px",
                          color: "#fff",
                        }}
                      />
                      <Line
                        type="monotone"
                        dataKey="price"
                        stroke="#648eea"
                        strokeWidth={2.5}
                        dot={false}
                        activeDot={{ r: 5 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          )}

          <p className="mt-4 text-[11px] leading-5 text-slate-600">
            Forecasts are estimates based on historical data. They are not
            guaranteed predictions or financial advice.
          </p>
        </section>

        <section>
          <div className="mb-4">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-blue-400">
              Explore Velora
            </p>
            <h2 className="mt-1 text-xl font-semibold text-white">
              Your workspace, connected
            </h2>
            <p className={MUTED}>
              Jump directly to the tools and features you need.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-3 min-[480px]:grid-cols-2 xl:grid-cols-5 sm:gap-4">
            {quickLinks.map((link) => (
              <button
                key={link.path}
                onClick={() => navigate(link.path)}
                className="group min-w-0 rounded-2xl border border-[#142039] bg-[#050b18] p-4 text-left transition duration-200 hover:-translate-y-1 hover:border-[#24458f] hover:bg-[#070f1e] sm:p-5"
              >
                <span className="flex h-11 w-11 items-center justify-center rounded-xl border border-[#1b315c] bg-[#0b1930] text-xl text-blue-300 transition group-hover:bg-[#14264a]">
                  {link.symbol}
                </span>

                <h3 className="mt-4 font-semibold text-white">
                  {link.title}
                </h3>

                <p className="mt-2 min-h-10 text-sm leading-5 text-slate-400">
                  {link.description}
                </p>

                <p className="mt-4 text-sm font-semibold text-blue-400 transition group-hover:text-blue-300">
                  {link.action} <span className="ml-1">→</span>
                </p>
              </button>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}

export default Dashboard;
  