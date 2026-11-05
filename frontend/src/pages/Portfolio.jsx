import { useCallback, useEffect, useMemo, useState } from "react";
import Navbar from "../components/Navbar";
import api, { getMarketPrice, getExchangeRate } from "../api/client";

const COLORS = [
  "#3b82f6",
  "#06b6d4",
  "#a855f7",
  "#ec4899",
  "#f59e0b",
  "#10b981",
  "#8b5cf6",
  "#f97316",
];

const COMPANY_NAMES = {
  AAPL: "Apple Inc.",
  MSFT: "Microsoft",
  GOOGL: "Alphabet",
  GOOG: "Alphabet",
  AMZN: "Amazon",
  TSLA: "Tesla",
  NVDA: "NVIDIA",
  META: "Meta Platforms",
  NFLX: "Netflix",
  TCS: "Tata Consultancy Services",
  RELIANCE: "Reliance Industries",
  INFY: "Infosys",
  WIPRO: "Wipro",
  HDFCBANK: "HDFC Bank",
  ICICIBANK: "ICICI Bank",
  SBIN: "State Bank of India",
  ITC: "ITC Limited",
  LT: "Larsen & Toubro",
};

const getCleanTicker = (ticker = "") =>
  ticker.replace(/\.(NS|BO)$/i, "").toUpperCase();

const getCompanyName = (ticker) => {
  const clean = getCleanTicker(ticker);
  return COMPANY_NAMES[clean] || clean;
};

const formatMoney = (value, currency = "INR") =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(Number(value) || 0);

const formatNumber = (value) =>
  new Intl.NumberFormat("en-IN", {
    maximumFractionDigits: 2,
  }).format(Number(value) || 0);

const getErrorMessage = (err, fallback) => {
  const data = err?.response?.data;

  if (typeof data === "string") return data;
  if (data?.ticker) {
    return Array.isArray(data.ticker)
      ? data.ticker[0]
      : data.ticker;
  }
  if (data?.detail) return data.detail;
  if (data?.error) return data.error;

  return fallback;
};

function Portfolio() {
  const [holdings, setHoldings] = useState([]);
  const [marketPrices, setMarketPrices] = useState({});
  const [marketCurrencies, setMarketCurrencies] = useState({});
  const [exchangeRate, setExchangeRate] = useState(1);

  const [loading, setLoading] = useState(true);
  const [marketLoading, setMarketLoading] = useState(false);
  const [adding, setAdding] = useState(false);
  const [savingId, setSavingId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("ticker");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [formData, setFormData] = useState({
    ticker: "",
    quantity: "",
    average_price: "",
  });

  const [editingId, setEditingId] = useState(null);
  const [editData, setEditData] = useState({
    ticker: "",
    quantity: "",
    average_price: "",
  });

  const fetchHoldings = useCallback(async (showLoader = false) => {
    if (showLoader) setLoading(true);

    try {
      const response = await api.get("/holdings/");
      setHoldings(response.data);
      setError("");
    } catch (err) {
      console.error("Error fetching holdings:", err);
      setError("Unable to load your holdings. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHoldings(true);
  }, [fetchHoldings]);

  useEffect(() => {
    let cancelled = false;

    const fetchMarketData = async () => {
      if (holdings.length === 0) {
        setMarketPrices({});
        setMarketCurrencies({});
        setMarketLoading(false);
        return;
      }

      setMarketLoading(true);

      const results = await Promise.all(
        holdings.map(async (holding) => {
          try {
            const data = await getMarketPrice(holding.ticker);

            return {
              ticker: holding.ticker,
              price: Number(data?.price) || 0,
              currency: data?.currency || null,
            };
          } catch (err) {
            console.error(
              `Market price error for ${holding.ticker}:`,
              err
            );

            return {
              ticker: holding.ticker,
              price: 0,
              currency: null,
            };
          }
        })
      );

      if (cancelled) return;

      const prices = {};
      const currencies = {};

      results.forEach((item) => {
        prices[item.ticker] = item.price;

        if (item.currency) {
          currencies[item.ticker] = item.currency;
        }
      });

      setMarketPrices(prices);
      setMarketCurrencies(currencies);
      setMarketLoading(false);
    };

    fetchMarketData();

    return () => {
      cancelled = true;
    };
  }, [holdings]);

  useEffect(() => {
    let cancelled = false;

    const fetchRate = async () => {
      try {
        const data = await getExchangeRate("USD", "INR");

        if (!cancelled && data?.rate) {
          setExchangeRate(Number(data.rate));
        }
      } catch (err) {
        console.error("Exchange rate error:", err);
      }
    };

    fetchRate();

    return () => {
      cancelled = true;
    };
  }, []);

  const getHoldingCurrency = (holding) => {
    return (
      marketCurrencies[holding.ticker] ||
      (/\.(NS|BO)$/i.test(holding.ticker) ? "INR" : "USD")
    );
  };

  const getHoldingValue = (holding) => {
    const quantity = Number(holding.quantity) || 0;
    const price = Number(marketPrices[holding.ticker]) || 0;

    let value = quantity * price;

    if (getHoldingCurrency(holding) === "USD") {
      value *= exchangeRate;
    }

    return value;
  };

  const getInvestedValue = (holding) => {
    const quantity = Number(holding.quantity) || 0;
    const price = Number(holding.average_price) || 0;

    let value = quantity * price;

    if (getHoldingCurrency(holding) === "USD") {
      value *= exchangeRate;
    }

    return value;
  };

  const totalValue = holdings.reduce(
    (total, holding) => total + getHoldingValue(holding),
    0
  );

  const totalInvested = holdings.reduce(
    (total, holding) => total + getInvestedValue(holding),
    0
  );

  const totalProfit = totalValue - totalInvested;

  const totalReturn =
    totalInvested > 0
      ? (totalProfit / totalInvested) * 100
      : 0;

  const allocationData = useMemo(() => {
    return holdings
      .map((holding) => ({
        ticker: holding.ticker,
        value: getHoldingValue(holding),
      }))
      .sort((a, b) => b.value - a.value)
      .map((item) => ({
        ...item,
        percentage:
          totalValue > 0
            ? (item.value / totalValue) * 100
            : 0,
      }));
  }, [holdings, marketPrices, marketCurrencies, exchangeRate, totalValue]);

  const largestHolding = allocationData[0] || null;

  const concentration = allocationData.reduce(
    (total, item) => total + Math.pow(item.percentage / 100, 2),
    0
  );

  const diversificationScore =
    allocationData.length > 1
      ? Math.round((1 - concentration) * 100)
      : 0;

  const riskLabel =
    holdings.length === 0
      ? "No data"
      : diversificationScore >= 70
      ? "Well spread"
      : diversificationScore >= 40
      ? "Moderate"
      : "Concentrated";

  const riskColor =
    diversificationScore >= 70
      ? "text-emerald-400 bg-emerald-500/10"
      : diversificationScore >= 40
      ? "text-amber-400 bg-amber-500/10"
      : "text-rose-400 bg-rose-500/10";

  const displayedHoldings = useMemo(() => {
    let result = [...holdings];

    if (search.trim()) {
      const query = search.trim().toLowerCase();

      result = result.filter((holding) => {
        return (
          holding.ticker.toLowerCase().includes(query) ||
          getCompanyName(holding.ticker).toLowerCase().includes(query)
        );
      });
    }

    result.sort((a, b) => {
      if (sortBy === "ticker") {
        return a.ticker.localeCompare(b.ticker);
      }

      if (sortBy === "value") {
        return getHoldingValue(b) - getHoldingValue(a);
      }

      if (sortBy === "profit") {
        const profitA =
          getHoldingValue(a) - getInvestedValue(a);
        const profitB =
          getHoldingValue(b) - getInvestedValue(b);

        return profitB - profitA;
      }

      return 0;
    });

    return result;
  }, [
    holdings,
    search,
    sortBy,
    marketPrices,
    marketCurrencies,
    exchangeRate,
  ]);

  const allocationGradient = useMemo(() => {
    if (!allocationData.length || totalValue <= 0) {
      return "conic-gradient(#1e293b 0% 100%)";
    }

    let current = 0;

    const segments = allocationData.map((item, index) => {
      const start = current;
      current += item.percentage;

      return `${COLORS[index % COLORS.length]} ${start}% ${current}%`;
    });

    return `conic-gradient(${segments.join(", ")})`;
  }, [allocationData, totalValue]);

  const handleAddHolding = async (event) => {
    event.preventDefault();
    setError("");
    setSuccess("");

    setAdding(true);

    try {
      await api.post("/holdings/", {
        ticker: formData.ticker.trim().toUpperCase(),
        quantity: formData.quantity,
        average_price: formData.average_price,
      });

      setFormData({
        ticker: "",
        quantity: "",
        average_price: "",
      });

      setSuccess("Stock added to your portfolio.");
      await fetchHoldings();
    } catch (err) {
      console.error("Add holding error:", err);
      setError(
        getErrorMessage(err, "Unable to add this stock.")
      );
    } finally {
      setAdding(false);
    }
  };

  const handleDelete = async (id) => {
    const confirmed = window.confirm(
      "Are you sure you want to remove this holding?"
    );

    if (!confirmed) return;

    setError("");
    setSuccess("");
    setDeletingId(id);

    try {
      await api.delete(`/holdings/${id}/`);

      setHoldings((previous) =>
        previous.filter((holding) => holding.id !== id)
      );

      setSuccess("Holding removed successfully.");
    } catch (err) {
      console.error("Delete error:", err);
      setError(
        getErrorMessage(err, "Unable to delete this holding.")
      );
    } finally {
      setDeletingId(null);
    }
  };

  const startEditing = (holding) => {
    setEditingId(holding.id);

    setEditData({
      ticker: holding.ticker,
      quantity: holding.quantity,
      average_price: holding.average_price,
    });

    setError("");
    setSuccess("");
  };

  const handleEdit = async (id) => {
    setError("");
    setSuccess("");
    setSavingId(id);

    try {
      await api.patch(`/holdings/${id}/`, {
        ticker: editData.ticker.trim().toUpperCase(),
        quantity: editData.quantity,
        average_price: editData.average_price,
      });

      setEditingId(null);
      setSuccess("Holding updated successfully.");
      await fetchHoldings();
    } catch (err) {
      console.error("Edit error:", err);
      setError(
        getErrorMessage(err, "Unable to update this holding.")
      );
    } finally {
      setSavingId(null);
    }
  };

  const refreshPortfolio = async () => {
    await fetchHoldings();
  };

  const getStockIcon = (ticker) => {
    const clean = getCleanTicker(ticker);

    const icons = {
      AAPL: "A",
      MSFT: "M",
      GOOGL: "G",
      GOOG: "G",
      AMZN: "a",
      TSLA: "T",
      NVDA: "N",
      META: "M",
      TCS: "T",
      RELIANCE: "R",
      INFY: "I",
    };

    return icons[clean] || clean.charAt(0);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#050816] text-white">
        <Navbar />

        <div className="flex min-h-[70vh] flex-col items-center justify-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-blue-500/20 border-t-blue-400" />
          <p className="text-sm text-slate-400">
            Loading your portfolio...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#050816] text-white">
      <div className="pointer-events-none fixed -right-40 -top-40 h-125 w-125 rounded-full bg-blue-600/10 blur-[120px]" />
      <div className="pointer-events-none fixed -bottom-40 -left-40 h-100 w-100 rounded-full bg-purple-600/10 blur-[120px]" />

      <Navbar />

      <main className="relative mx-auto max-w-375 px-4 py-8 sm:px-6 lg:px-8">
        {/* PAGE HEADER */}
        <div className="mb-7 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <div className="mb-3 h-0.75 w-10 rounded-full bg-linear-to-r from-blue-500 to-purple-500" />

            <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.3em] text-blue-400">
              Your investments
            </p>

            <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
              Your Portfolio
              <span className="text-blue-400">.</span>
            </h1>

            <p className="mt-2 text-sm text-slate-400">
              Track your holdings, monitor performance and understand your allocation.
            </p>
          </div>

          <button
            onClick={refreshPortfolio}
            className="flex w-fit items-center gap-2 rounded-lg border border-slate-700/70 bg-slate-900/60 px-4 py-2.5 text-xs font-medium text-slate-300 transition hover:border-blue-500/50 hover:text-white"
          >
            <svg
              className="h-4 w-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
            >
              <path d="M20 7v5h-5" />
              <path d="M4 17v-5h5" />
              <path d="M5.6 9a7 7 0 0111.8-2L20 12" />
              <path d="M18.4 15a7 7 0 01-11.8 2L4 12" />
            </svg>
            Refresh portfolio
          </button>
        </div>

        {/* ALERTS */}
        {error && (
          <div className="mb-4 flex items-start justify-between gap-3 rounded-xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-300">
            <span>{error}</span>
            <button
              onClick={() => setError("")}
              className="text-rose-300/70 hover:text-white"
            >
              ×
            </button>
          </div>
        )}

        {success && (
          <div className="mb-4 flex items-start justify-between gap-3 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">
            <span>{success}</span>
            <button
              onClick={() => setSuccess("")}
              className="text-emerald-300/70 hover:text-white"
            >
              ×
            </button>
          </div>
        )}

        {/* PORTFOLIO SUMMARY */}
        <section className="mb-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-2xl border border-blue-500/20 bg-linear-to-br from-blue-500/10 to-[#080f25] p-5">
            <div className="flex items-center justify-between">
              <p className="text-xs text-slate-400">Portfolio value</p>
              <span className="rounded-lg bg-blue-500/10 p-2 text-blue-400">
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <path d="M3 3v18h18" />
                  <path d="M7 14l4-4 3 3 6-7" />
                </svg>
              </span>
            </div>
            <p className="mt-4 text-2xl font-semibold tracking-tight">
              {formatMoney(totalValue)}
            </p>
            <p className="mt-2 text-[11px] text-slate-500">
              Current market value
            </p>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-[#0a1022]/80 p-5">
            <div className="flex items-center justify-between">
              <p className="text-xs text-slate-400">Total invested</p>
              <span className="rounded-lg bg-purple-500/10 p-2 text-purple-400">
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <rect x="3" y="5" width="18" height="14" rx="2" />
                  <path d="M3 10h18" />
                </svg>
              </span>
            </div>
            <p className="mt-4 text-2xl font-semibold tracking-tight">
              {formatMoney(totalInvested)}
            </p>
            <p className="mt-2 text-[11px] text-slate-500">
              Your total purchase value
            </p>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-[#0a1022]/80 p-5">
            <div className="flex items-center justify-between">
              <p className="text-xs text-slate-400">Total profit / loss</p>
              <span className={`rounded-lg p-2 ${totalProfit >= 0 ? "bg-emerald-500/10 text-emerald-400" : "bg-rose-500/10 text-rose-400"}`}>
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <path d="M3 17l6-6 4 4 8-9" />
                  <path d="M15 6h6v6" />
                </svg>
              </span>
            </div>
            <p className={`mt-4 text-2xl font-semibold tracking-tight ${totalProfit >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
              {totalProfit >= 0 ? "+" : ""}
              {formatMoney(totalProfit)}
            </p>
            <p className="mt-2 text-[11px] text-slate-500">
              Overall unrealized P/L
            </p>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-[#0a1022]/80 p-5">
            <div className="flex items-center justify-between">
              <p className="text-xs text-slate-400">Total return</p>
              <span className={`rounded-lg p-2 ${totalReturn >= 0 ? "bg-emerald-500/10 text-emerald-400" : "bg-rose-500/10 text-rose-400"}`}>
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <path d="M12 3v18" />
                  <path d="M17 8l-5-5-5 5" />
                </svg>
              </span>
            </div>
            <p className={`mt-4 text-2xl font-semibold tracking-tight ${totalReturn >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
              {totalReturn >= 0 ? "+" : ""}
              {totalReturn.toFixed(2)}%
            </p>
            <p className="mt-2 text-[11px] text-slate-500">
              Return on invested amount
            </p>
          </div>
        </section>

        {/* ADD STOCK */}
        <section className="mb-6 overflow-hidden rounded-2xl border border-blue-500/20 bg-[#0a1022]/90">
          <div className="flex items-center gap-3 border-b border-slate-800/80 px-5 py-4">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-linear-to-br from-blue-500 to-purple-600 text-xl font-light shadow-lg shadow-blue-500/10">
              +
            </div>

            <div>
              <h2 className="text-sm font-semibold">Add a holding</h2>
              <p className="mt-0.5 text-[11px] text-slate-500">
                Add a stock to start tracking its performance.
              </p>
            </div>
          </div>

          <form
            onSubmit={handleAddHolding}
            className="grid gap-4 p-5 sm:grid-cols-2 xl:grid-cols-[1.2fr_1fr_1fr_auto]"
          >
            <div>
              <label className="mb-2 block text-[11px] font-medium text-slate-400">
                Stock ticker
              </label>
              <input
                type="text"
                placeholder="e.g. AAPL or TCS.NS"
                value={formData.ticker}
                onChange={(e) =>
                  setFormData({ ...formData, ticker: e.target.value })
                }
                required
                className="h-11 w-full rounded-xl border border-slate-700/80 bg-[#050a19] px-4 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10"
              />
            </div>

            <div>
              <label className="mb-2 block text-[11px] font-medium text-slate-400">
                Quantity
              </label>
              <input
                type="number"
                min="0.000001"
                step="any"
                placeholder="e.g. 10"
                value={formData.quantity}
                onChange={(e) =>
                  setFormData({ ...formData, quantity: e.target.value })
                }
                required
                className="h-11 w-full rounded-xl border border-slate-700/80 bg-[#050a19] px-4 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10"
              />
            </div>

            <div>
              <label className="mb-2 block text-[11px] font-medium text-slate-400">
                Average buy price
              </label>
              <input
                type="number"
                min="0.000001"
                step="any"
                placeholder="e.g. 150.00"
                value={formData.average_price}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    average_price: e.target.value,
                  })
                }
                required
                className="h-11 w-full rounded-xl border border-slate-700/80 bg-[#050a19] px-4 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10"
              />
            </div>

            <div className="flex items-end">
              <button
                type="submit"
                disabled={adding}
                className="h-11 w-full rounded-xl bg-linear-to-r from-blue-500 to-violet-600 px-7 text-sm font-semibold text-white shadow-lg shadow-blue-500/10 transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60 xl:min-w-37.5"
              >
                {adding ? "Adding..." : "Add stock"}
              </button>
            </div>
          </form>
        </section>

        {/* MAIN CONTENT */}
        <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1.8fr)_minmax(300px,0.8fr)]">
          {/* HOLDINGS TABLE */}
          <section className="min-w-0 overflow-hidden rounded-2xl border border-slate-800 bg-[#0a1022]/80">
            <div className="flex flex-col gap-4 border-b border-slate-800 px-5 py-5 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-semibold">Your holdings</h2>
                  <span className="rounded-full border border-slate-700 bg-slate-800/70 px-2 py-0.5 text-[10px] text-slate-400">
                    {holdings.length}
                  </span>
                </div>
                <p className="mt-1 text-xs text-slate-500">
                  {marketLoading ? "Updating market prices..." : "Your stocks and their current performance"}
                </p>
              </div>

              <div className="flex flex-col gap-2 sm:flex-row">
                <div className="flex h-10 items-center gap-2 rounded-xl border border-slate-700/80 bg-[#050a19] px-3">
                  <svg className="h-4 w-4 shrink-0 text-slate-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="11" cy="11" r="7" />
                    <path d="m20 20-4-4" />
                  </svg>
                  <input
                    type="text"
                    placeholder="Search holdings..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full bg-transparent text-xs text-white outline-none placeholder:text-slate-600 sm:w-36"
                  />
                </div>

                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="h-10 rounded-xl border border-slate-700/80 bg-[#050a19] px-3 text-xs text-slate-300 outline-none focus:border-blue-500"
                >
                  <option value="ticker">Sort by ticker</option>
                  <option value="value">Sort by value</option>
                  <option value="profit">Sort by profit</option>
                </select>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-212.5 text-left">
                <thead>
                  <tr className="border-b border-slate-800/80 bg-slate-950/30 text-[10px] uppercase tracking-wider text-slate-500">
                    <th className="px-5 py-4 font-medium">Stock</th>
                    <th className="px-3 py-4 font-medium">Quantity</th>
                    <th className="px-3 py-4 font-medium">Buy price</th>
                    <th className="px-3 py-4 font-medium">Market price</th>
                    <th className="px-3 py-4 font-medium">Current value</th>
                    <th className="px-3 py-4 font-medium">Profit / Loss</th>
                    <th className="px-4 py-4 text-right font-medium">Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {displayedHoldings.map((holding) => {
                    const currentPrice =
                      Number(marketPrices[holding.ticker]) || 0;

                    const currency = getHoldingCurrency(holding);
                    const value = getHoldingValue(holding);
                    const invested = getInvestedValue(holding);
                    const profit = value - invested;

                    const profitPercentage =
                      invested > 0 ? (profit / invested) * 100 : 0;

                    const isEditing = editingId === holding.id;

                    return (
                      <tr
                        key={holding.id}
                        className="border-b border-slate-800/60 transition hover:bg-blue-500/[0.035]"
                      >
                        <td className="px-5 py-4">
                          {isEditing ? (
                            <input
                              value={editData.ticker}
                              onChange={(e) =>
                                setEditData({
                                  ...editData,
                                  ticker: e.target.value,
                                })
                              }
                              className="w-28 rounded-lg border border-blue-500 bg-[#050a19] px-2 py-2 text-xs text-white outline-none"
                            />
                          ) : (
                            <div className="flex items-center gap-3">
                              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-linear-to-br from-blue-500/25 to-violet-500/20 text-sm font-bold text-blue-300 ring-1 ring-blue-400/20">
                                {getStockIcon(holding.ticker)}
                              </div>
                              <div className="min-w-0">
                                <p className="text-xs font-semibold text-white">
                                  {holding.ticker}
                                </p>
                                <p className="mt-1 max-w-37.5 truncate text-[10px] text-slate-500">
                                  {getCompanyName(holding.ticker)}
                                </p>
                              </div>
                            </div>
                          )}
                        </td>

                        <td className="px-3 py-4">
                          {isEditing ? (
                            <input
                              type="number"
                              min="0.000001"
                              step="any"
                              value={editData.quantity}
                              onChange={(e) =>
                                setEditData({
                                  ...editData,
                                  quantity: e.target.value,
                                })
                              }
                              className="w-20 rounded-lg border border-blue-500 bg-[#050a19] px-2 py-2 text-xs text-white outline-none"
                            />
                          ) : (
                            <span className="text-xs text-slate-300">
                              {formatNumber(holding.quantity)}
                            </span>
                          )}
                        </td>

                        <td className="px-3 py-4">
                          {isEditing ? (
                            <input
                              type="number"
                              min="0.000001"
                              step="any"
                              value={editData.average_price}
                              onChange={(e) =>
                                setEditData({
                                  ...editData,
                                  average_price: e.target.value,
                                })
                              }
                              className="w-24 rounded-lg border border-blue-500 bg-[#050a19] px-2 py-2 text-xs text-white outline-none"
                            />
                          ) : (
                            <span className="text-xs text-slate-400">
                              {formatMoney(holding.average_price, currency)}
                            </span>
                          )}
                        </td>

                        <td className="px-3 py-4">
                          <span className="text-xs text-slate-300">
                            {currentPrice > 0
                              ? formatMoney(currentPrice, currency)
                              : "Unavailable"}
                          </span>
                        </td>

                        <td className="px-3 py-4">
                          <span className="text-xs font-semibold text-white">
                            {formatMoney(value)}
                          </span>
                        </td>

                        <td className="px-3 py-4">
                          <div className={profit >= 0 ? "text-emerald-400" : "text-rose-400"}>
                            <p className="text-xs font-semibold">
                              {profit >= 0 ? "+" : ""}
                              {formatMoney(profit)}
                            </p>
                            <p className="mt-1 text-[10px] opacity-80">
                              {profitPercentage >= 0 ? "+" : ""}
                              {profitPercentage.toFixed(2)}%
                            </p>
                          </div>
                        </td>

                        <td className="px-4 py-4">
                          <div className="flex justify-end gap-2">
                            {isEditing ? (
                              <>
                                <button
                                  onClick={() => handleEdit(holding.id)}
                                  disabled={savingId === holding.id}
                                  className="rounded-lg bg-emerald-500/10 px-3 py-2 text-[10px] font-medium text-emerald-400 transition hover:bg-emerald-500/20 disabled:opacity-50"
                                >
                                  {savingId === holding.id ? "Saving..." : "Save"}
                                </button>

                                <button
                                  onClick={() => setEditingId(null)}
                                  className="rounded-lg bg-slate-800 px-3 py-2 text-[10px] text-slate-300 transition hover:bg-slate-700"
                                >
                                  Cancel
                                </button>
                              </>
                            ) : (
                              <>
                                <button
                                  onClick={() => startEditing(holding)}
                                  title="Edit holding"
                                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-700 text-slate-400 transition hover:border-blue-500/60 hover:text-blue-400"
                                >
                                  <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                                    <path d="M12 20h9" />
                                    <path d="M16.5 3.5a2.1 2.1 0 013 3L8 18l-4 1 1-4z" />
                                  </svg>
                                </button>

                                <button
                                  onClick={() => handleDelete(holding.id)}
                                  disabled={deletingId === holding.id}
                                  title="Delete holding"
                                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-700 text-slate-400 transition hover:border-rose-500/60 hover:text-rose-400 disabled:opacity-50"
                                >
                                  {deletingId === holding.id ? (
                                    <span className="text-xs">...</span>
                                  ) : (
                                    <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                                      <path d="M3 6h18" />
                                      <path d="M8 6V4h8v2" />
                                      <path d="M19 6l-1 15H6L5 6" />
                                    </svg>
                                  )}
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}

                  {displayedHoldings.length === 0 && (
                    <tr>
                      <td colSpan="7" className="px-6 py-16 text-center">
                        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-800/70 text-slate-400">
                          <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
                            <circle cx="11" cy="11" r="7" />
                            <path d="m20 20-4-4" />
                          </svg>
                        </div>

                        <p className="text-sm font-medium text-slate-300">
                          {search ? "No matching holdings" : "Your portfolio is empty"}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          {search
                            ? "Try another ticker or company name."
                            : "Add your first stock above to get started."}
                        </p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="flex flex-col justify-between gap-2 border-t border-slate-800 px-5 py-3 text-[10px] text-slate-500 sm:flex-row">
              <span>
                Showing {displayedHoldings.length} of {holdings.length} holdings
              </span>
              <span>
                {marketLoading ? "Refreshing market data..." : "Market data may be delayed"}
              </span>
            </div>
          </section>

          {/* SIDEBAR */}
          <aside className="space-y-5">
            {/* DIVERSIFICATION */}
            <section className="rounded-2xl border border-slate-800 bg-[#0a1022]/80 p-5">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-500/10 text-blue-400">
                    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                      <path d="M12 3l8 4v5c0 5-3.5 8-8 9-4.5-1-8-4-8-9V7z" />
                      <path d="M9 12l2 2 4-4" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold">Diversification</h3>
                    <p className="mt-0.5 text-[10px] text-slate-500">
                      Portfolio concentration
                    </p>
                  </div>
                </div>

                <span className={`rounded-full px-2.5 py-1 text-[9px] font-semibold ${riskColor}`}>
                  {riskLabel}
                </span>
              </div>

              <div className="mt-6 flex items-center gap-5">
                <div
                  className="relative flex h-24 w-24 shrink-0 items-center justify-center rounded-full"
                  style={{
                    background: `conic-gradient(#3b82f6 ${diversificationScore * 3.6}deg, #1e293b 0deg)`,
                  }}
                >
                  <div className="flex h-19 w-19 flex-col items-center justify-center rounded-full bg-[#0a1022]">
                    <span className="text-xl font-semibold">
                      {diversificationScore}
                    </span>
                    <span className="text-[9px] text-slate-500">out of 100</span>
                  </div>
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] text-slate-500">
                      Largest holding
                    </span>
                    <span className="text-xs font-medium text-white">
                      {largestHolding
                        ? `${largestHolding.percentage.toFixed(1)}%`
                        : "—"}
                    </span>
                  </div>

                  <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-800">
                    <div
                      className="h-full rounded-full bg-linear-to-r from-blue-500 to-violet-500"
                      style={{
                        width: `${largestHolding?.percentage || 0}%`,
                      }}
                    />
                  </div>

                  <p className="mt-3 text-[10px] leading-relaxed text-slate-500">
                    {holdings.length === 0
                      ? "Add stocks to see how your investments are distributed."
                      : holdings.length === 1
                      ? "Your portfolio currently depends on one holding."
                      : "A more balanced allocation can reduce dependence on a single holding."}
                  </p>
                </div>
              </div>

              <p className="mt-4 border-t border-slate-800 pt-3 text-[9px] leading-relaxed text-slate-600">
                This is a simple concentration-based diversification indicator, not a prediction of investment risk.
              </p>
            </section>

            {/* ALLOCATION */}
            <section className="rounded-2xl border border-slate-800 bg-[#0a1022]/80 p-5">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold">Portfolio allocation</h3>
                  <p className="mt-1 text-[10px] text-slate-500">
                    Distribution by current value
                  </p>
                </div>
                <span className="rounded-lg bg-purple-500/10 p-2 text-purple-400">
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <path d="M12 3a9 9 0 109 9h-9z" />
                    <path d="M12 3v9h9" />
                  </svg>
                </span>
              </div>

              <div className="mt-6 flex flex-col items-center gap-6 sm:flex-row xl:flex-col 2xl:flex-row">
                <div
                  className="relative flex h-36 w-36 shrink-0 items-center justify-center rounded-full"
                  style={{ background: allocationGradient }}
                >
                  <div className="flex h-25 w-25 flex-col items-center justify-center rounded-full bg-[#0a1022]">
                    <span className="text-center text-sm font-semibold">
                      {formatMoney(totalValue)}
                    </span>
                    <span className="mt-1 text-[9px] text-slate-500">
                      Total value
                    </span>
                  </div>
                </div>

                <div className="w-full min-w-0 flex-1 space-y-3">
                  {allocationData.slice(0, 5).map((item, index) => (
                    <div
                      key={item.ticker}
                      className="flex items-center justify-between gap-3"
                    >
                      <div className="flex min-w-0 items-center gap-2">
                        <span
                          className="h-2.5 w-2.5 shrink-0 rounded-full"
                          style={{
                            backgroundColor: COLORS[index % COLORS.length],
                          }}
                        />
                        <span className="truncate text-[11px] text-slate-400">
                          {item.ticker}
                        </span>
                      </div>

                      <span className="shrink-0 text-[11px] font-medium text-slate-200">
                        {item.percentage.toFixed(1)}%
                      </span>
                    </div>
                  ))}

                  {allocationData.length > 5 && (
                    <p className="pt-1 text-[10px] text-slate-500">
                      + {allocationData.length - 5} more holdings
                    </p>
                  )}

                  {allocationData.length === 0 && (
                    <p className="text-center text-xs text-slate-500">
                      No allocation data yet.
                    </p>
                  )}
                </div>
              </div>
            </section>

            {/* QUICK STATS */}
            <section className="rounded-2xl border border-slate-800 bg-[#0a1022]/80 p-5">
              <div className="mb-5 flex items-center justify-between">
                <h3 className="text-sm font-semibold">Portfolio details</h3>
                <span className="text-[10px] text-slate-500">
                  Overview
                </span>
              </div>

              <div className="grid grid-cols-2 gap-x-4 gap-y-5">
                <div>
                  <p className="text-[10px] text-slate-500">Total holdings</p>
                  <p className="mt-1.5 text-lg font-semibold">
                    {holdings.length}
                  </p>
                </div>

                <div>
                  <p className="text-[10px] text-slate-500">Top holding</p>
                  <p className="mt-1.5 truncate text-sm font-semibold">
                    {largestHolding?.ticker || "—"}
                  </p>
                </div>

                <div>
                  <p className="text-[10px] text-slate-500">Total invested</p>
                  <p className="mt-1.5 text-sm font-semibold">
                    {formatMoney(totalInvested)}
                  </p>
                </div>

                <div>
                  <p className="text-[10px] text-slate-500">Current value</p>
                  <p className="mt-1.5 text-sm font-semibold">
                    {formatMoney(totalValue)}
                  </p>
                </div>
              </div>

              <div className="mt-5 border-t border-slate-800 pt-4">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-[10px] text-slate-500">
                    Overall return
                  </span>
                  <span className={`text-sm font-semibold ${totalReturn >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                    {totalReturn >= 0 ? "+" : ""}
                    {totalReturn.toFixed(2)}%
                  </span>
                </div>
              </div>
            </section>

            {/* EXCHANGE RATE */}
            <div className="flex items-center justify-between rounded-xl border border-slate-800/70 bg-slate-900/40 px-4 py-3">
              <span className="text-[10px] text-slate-500">
                Currency conversion
              </span>
              <span className="text-[10px] font-medium text-slate-300">
                1 USD = ₹{exchangeRate.toFixed(2)}
              </span>
            </div>
          </aside>
        </div>

        <p className="mt-8 text-center text-[10px] text-slate-600">
          Portfolio values are estimates based on available market data and exchange rates.
        </p>
      </main>
    </div>
  );
}

export default Portfolio;