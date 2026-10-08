import { useEffect, useState } from "react";

import Navbar from "../components/Navbar";

import {
  getAlerts,
  createAlert,
  deleteAlert,
} from "../api/client";

import api from "../api/client";


function Alerts() {

  // ============================================================
  // STATE
  // ============================================================

  const [holdings, setHoldings] = useState([]);

  const [alerts, setAlerts] = useState([]);

  const [selectedTicker, setSelectedTicker] =
    useState("");

  const [condition, setCondition] =
    useState("above");

  const [targetPrice, setTargetPrice] =
    useState("");

  const [loading, setLoading] =
    useState(true);

  const [creating, setCreating] =
    useState(false);

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");


  // ============================================================
  // LOAD HOLDINGS + ALERTS
  // ============================================================

  useEffect(() => {

    const loadData = async () => {

      try {

        setLoading(true);

        setError("");

        // Get user's holdings
        const holdingsResponse =
          await api.get(
            "/holdings/"
          );

        const userHoldings =
          holdingsResponse.data;

        setHoldings(
          userHoldings
        );


        // Automatically select first stock
        if (
          userHoldings.length > 0
        ) {

          setSelectedTicker(
            userHoldings[0].ticker
          );

        }


        // Get user's alerts
        const alertsResponse =
          await getAlerts();

        setAlerts(
          alertsResponse
        );

      } catch (err) {

        console.error(
          "Error loading alerts:",
          err
        );

        setError(
          "Unable to load your alerts."
        );

      } finally {

        setLoading(false);

      }

    };


    loadData();

  }, []);


  // ============================================================
  // CREATE ALERT
  // ============================================================

  const handleCreateAlert = async (
    event
  ) => {

    event.preventDefault();

    setError("");

    setSuccess("");


    // Basic validation
    if (!selectedTicker) {

      setError(
        "Please select a stock."
      );

      return;

    }


    if (!targetPrice) {

      setError(
        "Please enter a target price."
      );

      return;

    }


    if (
      Number(targetPrice) <= 0
    ) {

      setError(
        "Target price must be greater than zero."
      );

      return;

    }


    try {

      setCreating(true);


      const newAlert =
        await createAlert({

          ticker:
            selectedTicker,

          target_price:
            targetPrice,

          condition:
            condition,

        });


      // Add newly-created alert
      // to the beginning of the list

      setAlerts(
        (previousAlerts) => [
          newAlert,
          ...previousAlerts,
        ]
      );


      // Clear target price

      setTargetPrice("");


      setSuccess(
        "Alert created successfully."
      );


    } catch (err) {

      console.error(
        "Error creating alert:",
        err
      );

      setError(
        "Unable to create the alert."
      );

    } finally {

      setCreating(false);

    }

  };


  // ============================================================
  // DELETE ALERT
  // ============================================================

  const handleDeleteAlert = async (
    alertId
  ) => {

    try {

      await deleteAlert(
        alertId
      );


      setAlerts(
        (previousAlerts) =>
          previousAlerts.filter(
            (alert) =>
              alert.id !== alertId
          )
      );


    } catch (err) {

      console.error(
        "Error deleting alert:",
        err
      );

      setError(
        "Unable to delete the alert."
      );

    }

  };


  // ============================================================
  // FORMAT PRICE
  // ============================================================

  const formatPrice = (
    price
  ) => {

    return Number(
      price
    ).toLocaleString(
      "en-IN",
      {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 2,
      }
    );

  };


  // ============================================================
  // LOADING STATE
  // ============================================================

  if (loading) {

    return (

      <div className="min-h-screen bg-[#020617] text-white">

        <Navbar />

        <main className="mx-auto max-w-6xl px-8 py-12">

          <p className="text-sm text-slate-400">
            Loading alerts...
          </p>

        </main>

      </div>

    );

  }


  // ============================================================
  // PAGE
  // ============================================================

  return (

    <div className="min-h-screen bg-[#020617] text-white">

      <Navbar />


      <main className="mx-auto max-w-6xl px-8 py-10">


        {/* ================================================== */}
        {/* HEADER */}
        {/* ================================================== */}

        <div className="mb-8">

          <p className="mb-2 text-xs font-medium uppercase tracking-[0.2em] text-blue-400">
            PRICE MONITORING
          </p>

          <h1 className="text-3xl font-semibold tracking-tight">
            Alerts
          </h1>

          <p className="mt-2 max-w-2xl text-sm text-slate-400">
            Set price alerts for stocks in your portfolio
            and monitor important price levels.
          </p>

        </div>


        {/* ================================================== */}
        {/* CREATE ALERT */}
        {/* ================================================== */}

        <section className="mb-8 rounded-xl border border-slate-800 bg-slate-900/50 p-6">

          <div className="mb-5">

            <h2 className="text-base font-semibold text-white">
              Create Price Alert
            </h2>

            <p className="mt-1 text-xs text-slate-500">
              You'll be able to monitor this price level
              from your Velora alerts.
            </p>

          </div>


          <form
            onSubmit={handleCreateAlert}
            className="grid gap-4 md:grid-cols-4"
          >


            {/* STOCK */}

            <div>

              <label className="mb-2 block text-xs font-medium text-slate-400">
                Stock
              </label>

              <select
                value={selectedTicker}
                onChange={(event) =>
                  setSelectedTicker(
                    event.target.value
                  )
                }
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-white outline-none transition focus:border-blue-500"
              >

                {holdings.length === 0 ? (

                  <option value="">
                    No holdings available
                  </option>

                ) : (

                  holdings.map(
                    (holding) => (

                      <option
                        key={holding.id}
                        value={holding.ticker}
                      >
                        {holding.ticker}
                      </option>

                    )
                  )

                )}

              </select>

            </div>


            {/* CONDITION */}

            <div>

              <label className="mb-2 block text-xs font-medium text-slate-400">
                Condition
              </label>

              <select
                value={condition}
                onChange={(event) =>
                  setCondition(
                    event.target.value
                  )
                }
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-white outline-none transition focus:border-blue-500"
              >

                <option value="above">
                  Price goes above
                </option>

                <option value="below">
                  Price goes below
                </option>

              </select>

            </div>


            {/* TARGET PRICE */}

            <div>

              <label className="mb-2 block text-xs font-medium text-slate-400">
                Target Price
              </label>

              <input
                type="number"
                step="0.01"
                min="0"
                value={targetPrice}
                onChange={(event) =>
                  setTargetPrice(
                    event.target.value
                  )
                }
                placeholder="Enter price"
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-white placeholder:text-slate-600 outline-none transition focus:border-blue-500"
              />

            </div>


            {/* CREATE BUTTON */}

            <div className="flex items-end">

              <button
                type="submit"
                disabled={
                  creating ||
                  holdings.length === 0
                }
                className="w-full rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
              >

                {creating
                  ? "Creating..."
                  : "Create Alert"}

              </button>

            </div>

          </form>


          {/* ERROR */}

          {error && (

            <div className="mt-4 rounded-lg border border-red-900/50 bg-red-950/20 px-4 py-3 text-sm text-red-400">
              {error}
            </div>

          )}


          {/* SUCCESS */}

          {success && (

            <div className="mt-4 rounded-lg border border-emerald-900/50 bg-emerald-950/20 px-4 py-3 text-sm text-emerald-400">
              {success}
            </div>

          )}

        </section>


        {/* ================================================== */}
        {/* ALERT LIST */}
        {/* ================================================== */}

        <section>

          <div className="mb-4 flex items-center justify-between">

            <div>

              <h2 className="text-base font-semibold text-white">
                Your Alerts
              </h2>

              <p className="mt-1 text-xs text-slate-500">
                {alerts.length} alert
                {alerts.length !== 1
                  ? "s"
                  : ""}
              </p>

            </div>

          </div>


          {alerts.length === 0 ? (

            <div className="rounded-xl border border-dashed border-slate-800 bg-slate-900/30 px-6 py-12 text-center">

              <div className="mb-3 text-2xl text-slate-600">
                ◇
              </div>

              <h3 className="text-sm font-medium text-slate-300">
                No alerts yet
              </h3>

              <p className="mt-1 text-xs text-slate-500">
                Create your first price alert above.
              </p>

            </div>

          ) : (

            <div className="space-y-3">

              {alerts.map(
                (alert) => (

                  <div
                    key={alert.id}
                    className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-900/50 px-5 py-4 transition hover:border-slate-700"
                  >


                    {/* ALERT INFO */}

                    <div className="flex items-center gap-4">

                      <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-blue-500/20 bg-blue-500/10 text-xs font-semibold text-blue-400">
                        {alert.ticker}
                      </div>


                      <div>

                        <div className="flex items-center gap-2">

                          <span className="text-sm font-medium text-white">
                            {alert.ticker}
                          </span>

                          <span
                            className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
                              alert.triggered
                                ? "bg-emerald-500/10 text-emerald-400"
                                : "bg-blue-500/10 text-blue-400"
                            }`}
                          >
                            {alert.triggered
                              ? "Triggered"
                              : "Active"}
                          </span>

                        </div>


                        <p className="mt-1 text-xs text-slate-500">

                          {alert.condition ===
                          "above"
                            ? "Price goes above"
                            : "Price goes below"}

                          {" "}

                          <span className="text-slate-300">
                            {formatPrice(
                              alert.target_price
                            )}
                          </span>

                        </p>

                      </div>

                    </div>


                    {/* DELETE */}

                    <button
                      onClick={() =>
                        handleDeleteAlert(
                          alert.id
                        )
                      }
                      className="rounded-lg border border-slate-800 px-3 py-2 text-xs text-slate-500 transition hover:border-red-900/50 hover:bg-red-950/20 hover:text-red-400"
                    >
                      Delete
                    </button>

                  </div>

                )
              )}

            </div>

          )}

        </section>

      </main>

    </div>

  );

}


export default Alerts;