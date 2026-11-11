
import { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import {
  getAlerts,
  createAlert,
  deleteAlert,
} from "../api/client";
import api from "../api/client";

function Alerts() {
  const [holdings, setHoldings] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [selectedTicker, setSelectedTicker] = useState("");
  const [condition, setCondition] = useState("above");
  const [targetPrice, setTargetPrice] = useState("");
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [checking, setChecking] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError("");

        const holdingsResponse = await api.get("/holdings/");
        const userHoldings = holdingsResponse.data;
        setHoldings(userHoldings);

        if (userHoldings.length > 0) {
          setSelectedTicker(userHoldings[0].ticker);
        }

        const alertsResponse = await getAlerts();
        setAlerts(alertsResponse);
      } catch (err) {
        console.error("Error loading alerts:", err);
        setError("Unable to load your alerts. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const handleCreateAlert = async (event) => {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (!selectedTicker) {
      setError("Please select a stock.");
      return;
    }

    if (!targetPrice || Number(targetPrice) <= 0) {
      setError("Please enter a valid target price.");
      return;
    }

    try {
      setCreating(true);

      const newAlert = await createAlert({
        ticker: selectedTicker,
        target_price: targetPrice,
        condition,
      });

      setAlerts((previous) => [newAlert, ...previous]);
      setTargetPrice("");
      setSuccess(`Alert created successfully for ${selectedTicker}.`);
    } catch (err) {
      console.error("Error creating alert:", err);
      setError(
        err.response?.data?.detail ||
        "Unable to create the alert. Please try again."
      );
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteAlert = async (alertId) => {
    setError("");
    setSuccess("");

    try {
      setDeletingId(alertId);
      await deleteAlert(alertId);

      setAlerts((previous) =>
        previous.filter((alert) => alert.id !== alertId)
      );

      setSuccess("Alert deleted successfully.");
    } catch (err) {
      console.error("Error deleting alert:", err);
      setError("Unable to delete the alert. Please try again.");
    } finally {
      setDeletingId(null);
    }
  };

  const handleCheckAlerts = async () => {
    setError("");
    setSuccess("");

    try {
      setChecking(true);

      await api.post("/alerts/check/");

      const updatedAlerts = await getAlerts();
      setAlerts(updatedAlerts);

      setSuccess("Your alerts have been checked successfully.");
    } catch (err) {
      console.error("Error checking alerts:", err);
      setError("Unable to check alerts right now. Please try again.");
    } finally {
      setChecking(false);
    }
  };

  const formatPrice = (price) => {
    return Number(price).toLocaleString("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 2,
    });
  };

  const activeCount = alerts.filter((alert) => !alert.triggered).length;
  const triggeredCount = alerts.filter((alert) => alert.triggered).length;

  if (loading) {
    return (
      <div className="min-h-screen bg-[#020510] text-white">
        <Navbar />
        <main className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="flex min-h-[40vh] flex-col items-center justify-center gap-4">
            <div className="h-9 w-9 animate-spin rounded-full border-2 border-blue-500/20 border-t-blue-500" />
            <p className="text-sm text-slate-400">Loading your alerts...</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#020510] text-white">
      <Navbar />

      <main className="mx-auto w-full max-w-6xl px-4 py-7 sm:px-6 sm:py-10 lg:px-8 lg:py-12">

        {/* HEADER */}
        <section className="mb-7 sm:mb-10">
          <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.22em] text-blue-400 sm:text-xs">
            Price Monitoring
          </p>

          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl lg:text-4xl">
                Price Alerts
              </h1>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">
                Stay informed when your stocks reach important price levels.
                Create alerts and monitor their status from one place.
              </p>
            </div>

            <div className="flex items-center gap-2 self-start rounded-full border border-emerald-500/20 bg-emerald-500/5 px-3 py-2 sm:self-auto">
              <span className="h-2 w-2 rounded-full bg-emerald-400" />
              <span className="text-xs font-medium text-emerald-400">
                Alert system
              </span>
            </div>
          </div>
        </section>

        {/* SUMMARY */}
        <section className="mb-7 grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4">
          <div className="rounded-xl border border-slate-800 bg-[#070f1e] p-4 sm:p-5">
            <p className="text-xs text-slate-400">Total alerts</p>
            <p className="mt-2 text-2xl font-semibold tabular-nums text-white">
              {alerts.length}
            </p>
          </div>

          <div className="rounded-xl border border-blue-500/15 bg-[#070f1e] p-4 sm:p-5">
            <p className="text-xs text-slate-400">Active alerts</p>
            <p className="mt-2 text-2xl font-semibold tabular-nums text-blue-400">
              {activeCount}
            </p>
          </div>

          <div className="rounded-xl border border-emerald-500/15 bg-[#070f1e] p-4 sm:p-5">
            <p className="text-xs text-slate-400">Triggered alerts</p>
            <p className="mt-2 text-2xl font-semibold tabular-nums text-emerald-400">
              {triggeredCount}
            </p>
          </div>
        </section>

        {/* CREATE ALERT */}
        <section className="rounded-2xl border border-slate-800 bg-[#070f1e] p-4 shadow-lg shadow-black/10 sm:p-6 lg:p-7">
          <div className="mb-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-blue-500/20 bg-blue-500/10 text-blue-400">
                <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5">
                  <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                </svg>
              </div>

              <div>
                <h2 className="text-base font-semibold text-white sm:text-lg">
                  Create a price alert
                </h2>
                <p className="mt-0.5 text-xs text-slate-500">
                  Set the price condition you want Velora to monitor.
                </p>
              </div>
            </div>
          </div>

          <form onSubmit={handleCreateAlert}>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 lg:gap-5">

              <div>
                <label className="mb-2 block text-xs font-medium text-slate-400">
                  Stock
                </label>
                <select
                  value={selectedTicker}
                  onChange={(event) => setSelectedTicker(event.target.value)}
                  className="min-h-12 w-full rounded-xl border border-slate-700/80 bg-[#030817] px-4 py-3 text-sm text-white outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10"
                >
                  {holdings.length === 0 ? (
                    <option value="">No holdings available</option>
                  ) : (
                    holdings.map((holding) => (
                      <option key={holding.id} value={holding.ticker}>
                        {holding.ticker}
                      </option>
                    ))
                  )}
                </select>
              </div>

              <div>
                <label className="mb-2 block text-xs font-medium text-slate-400">
                  Condition
                </label>
                <select
                  value={condition}
                  onChange={(event) => setCondition(event.target.value)}
                  className="min-h-12 w-full rounded-xl border border-slate-700/80 bg-[#030817] px-4 py-3 text-sm text-white outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10"
                >
                  <option value="above">Price goes above</option>
                  <option value="below">Price goes below</option>
                </select>
              </div>

              <div>
                <label className="mb-2 block text-xs font-medium text-slate-400">
                  Target price (INR)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={targetPrice}
                  onChange={(event) => setTargetPrice(event.target.value)}
                  placeholder="e.g. 2500.00"
                  className="min-h-12 w-full rounded-xl border border-slate-700/80 bg-[#030817] px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={creating || holdings.length === 0}
              className="mt-5 flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-950/30 transition hover:from-blue-500 hover:to-indigo-500 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto sm:min-w-48"
            >
              {creating ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  Creating alert...
                </>
              ) : (
                "Create alert"
              )}
            </button>

            {holdings.length === 0 && (
              <p className="mt-3 text-xs text-amber-400">
                Add a stock to your portfolio before creating an alert.
              </p>
            )}
          </form>
        </section>

        {/* FEEDBACK */}
        {(error || success) && (
          <div
            role="status"
            className={`mt-4 rounded-xl border px-4 py-3 text-sm ${
              error
                ? "border-red-500/20 bg-red-500/5 text-red-400"
                : "border-emerald-500/20 bg-emerald-500/5 text-emerald-400"
            }`}
          >
            {error || success}
          </div>
        )}

        {/* HOW IT WORKS */}
        <section className="mt-6 rounded-2xl border border-slate-800/80 bg-[#070f1e]/70 p-4 sm:p-6">
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500 sm:text-xs">
            How it works
          </p>

          <div className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-3 sm:gap-6">
            {[
              {
                number: "01",
                title: "Set a price",
                description: "Choose a stock and the price level you want Velora to watch.",
              },
              {
                number: "02",
                title: "Check the market",
                description: "Velora checks the latest available market price against your condition.",
              },
              {
                number: "03",
                title: "View triggered alerts",
                description: "When your condition is reached, the triggered alert appears on your dashboard.",
              },
            ].map((step) => (
              <div key={step.number} className="flex gap-3 sm:block">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-blue-500/20 bg-blue-500/10 text-xs font-semibold text-blue-400 sm:mb-3">
                  {step.number}
                </div>
                <div>
                  <h3 className="text-sm font-medium text-slate-200">
                    {step.title}
                  </h3>
                  <p className="mt-1 text-xs leading-5 text-slate-500">
                    {step.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* CREATED ALERTS */}
        <section className="mt-9 sm:mt-11">
          <div className="mb-5 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
            <div>
              <h2 className="text-lg font-semibold text-white">
                Your alerts
              </h2>
              <p className="mt-1 text-xs text-slate-500">
                Manage and monitor your created price alerts.
              </p>
            </div>

            <button
              type="button"
              onClick={handleCheckAlerts}
              disabled={checking || alerts.length === 0}
              className="flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-blue-500/30 bg-blue-500/10 px-4 py-2.5 text-xs font-medium text-blue-300 transition hover:border-blue-400/50 hover:bg-blue-500/20 disabled:cursor-not-allowed disabled:opacity-40 sm:w-auto"
            >
              {checking ? (
                <>
                  <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-blue-300/30 border-t-blue-300" />
                  Checking...
                </>
              ) : (
                <>
                  <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4">
                    <path d="M20 11a8 8 0 0 0-14.8-4L4 9m0 0V5m0 4h4m-4 4a8 8 0 0 0 14.8 4L20 15m0 0v4m0-4h-4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  Check alerts now
                </>
              )}
            </button>
          </div>

          {alerts.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-800 bg-[#070f1e]/50 px-5 py-12 text-center sm:py-16">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl border border-slate-700 bg-slate-900 text-slate-400">
                <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6">
                  <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9ZM10 21h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>

              <h3 className="mt-4 text-sm font-medium text-slate-300">
                No alerts created yet
              </h3>
              <p className="mt-2 text-xs text-slate-500">
                Create your first price alert to start monitoring your stocks.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3">
              {alerts.map((alert) => (
                <article
                  key={alert.id}
                  className="flex flex-col gap-4 rounded-2xl border border-slate-800 bg-[#070f1e] p-4 transition hover:border-slate-700 sm:flex-row sm:items-center sm:justify-between sm:p-5"
                >
                  <div className="flex min-w-0 items-start gap-3 sm:items-center sm:gap-4">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-blue-500/20 bg-blue-500/10 text-xs font-bold text-blue-400">
                      {alert.ticker}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-sm font-semibold text-white">
                          {alert.ticker}
                        </h3>

                        <span
                          className={`rounded-full px-2.5 py-1 text-[10px] font-medium ${
                            alert.triggered
                              ? "border border-emerald-500/20 bg-emerald-500/10 text-emerald-400"
                              : "border border-blue-500/20 bg-blue-500/10 text-blue-400"
                          }`}
                        >
                          {alert.triggered ? "Triggered" : "Active"}
                        </span>
                      </div>

                      <p className="mt-1.5 text-xs text-slate-400">
                        {alert.condition === "above"
                          ? "Price goes above"
                          : "Price goes below"}
                        <span className="ml-1 font-medium text-slate-200">
                          {formatPrice(alert.target_price)}
                        </span>
                      </p>

                      {alert.triggered && alert.triggered_at && (
                        <p className="mt-1.5 text-[11px] text-emerald-500/80">
                          Triggered {new Date(alert.triggered_at).toLocaleString("en-IN")}
                        </p>
                      )}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleDeleteAlert(alert.id)}
                    disabled={deletingId === alert.id}
                    className="flex min-h-10 w-full items-center justify-center gap-2 rounded-xl border border-slate-700/80 px-4 py-2 text-xs font-medium text-slate-400 transition hover:border-red-500/30 hover:bg-red-500/5 hover:text-red-400 disabled:opacity-50 sm:w-auto"
                  >
                    {deletingId === alert.id ? (
                      "Deleting..."
                    ) : (
                      <>
                        <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4">
                          <path d="M4 7h16M10 11v6m4-6v6M5 7l1 14h12l1-14M9 7V4h6v3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        Delete alert
                      </>
                    )}
                  </button>
                </article>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

export default Alerts;
