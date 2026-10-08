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


        // Select first stock automatically

        if (
          userHoldings.length > 0
        ) {

          setSelectedTicker(
            userHoldings[0].ticker
          );

        }


        // Get all created alerts

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


    // Validate stock

    if (!selectedTicker) {

      setError(
        "Please select a stock."
      );

      return;

    }


    // Validate price

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


      // Add the new alert
      // to the top of the list

      setAlerts(
        (previousAlerts) => [
          newAlert,
          ...previousAlerts,
        ]
      );


      // Clear price input

      setTargetPrice("");


      setSuccess(
        `Alert created for ${selectedTicker}.`
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

      setError("");

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


      setSuccess(
        "Alert deleted successfully."
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
  // LOADING
  // ============================================================

  if (loading) {

    return (

      <div className="min-h-screen bg-[#020617] text-white">

        <Navbar />

        <main className="mx-auto max-w-5xl px-8 py-12">

          <p className="text-sm text-slate-400">
            Loading...
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


      <main className="mx-auto max-w-5xl px-8 py-12">


        {/* ================================================== */}
        {/* HEADER */}
        {/* ================================================== */}

        <div className="mb-10">

          <p className="mb-2 text-xs font-medium uppercase tracking-[0.2em] text-blue-400">
            PRICE MONITORING
          </p>

          <h1 className="text-3xl font-semibold tracking-tight">
            Create an Alert
          </h1>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">
            Tell Velora when a stock reaches an important
            price level. Triggered alerts will appear on
            your Home dashboard.
          </p>

        </div>


        {/* ================================================== */}
        {/* CREATE ALERT */}
        {/* ================================================== */}

        <section className="rounded-xl border border-slate-800 bg-slate-900/50 p-7">

          <div className="mb-7">

            <h2 className="text-base font-semibold text-white">
              Price Alert
            </h2>

            <p className="mt-1 text-xs text-slate-500">
              Choose a stock and the price condition you want
              Velora to monitor.
            </p>

          </div>


          <form
            onSubmit={handleCreateAlert}
            className="grid gap-5 md:grid-cols-3"
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
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-3 text-sm text-white outline-none transition focus:border-blue-500"
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
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-3 text-sm text-white outline-none transition focus:border-blue-500"
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
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-3 text-sm text-white placeholder:text-slate-600 outline-none transition focus:border-blue-500"
              />

            </div>


            {/* CREATE BUTTON */}

            <div className="md:col-span-3">

              <button
                type="submit"
                disabled={
                  creating ||
                  holdings.length === 0
                }
                className="w-full rounded-lg bg-blue-600 px-4 py-3 text-sm font-medium text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
              >

                {creating
                  ? "Creating Alert..."
                  : "Create Alert"}

              </button>

            </div>

          </form>


          {/* ERROR */}

          {error && (

            <div className="mt-5 rounded-lg border border-red-900/50 bg-red-950/20 px-4 py-3 text-sm text-red-400">
              {error}
            </div>

          )}


          {/* SUCCESS */}

          {success && (

            <div className="mt-5 rounded-lg border border-emerald-900/50 bg-emerald-950/20 px-4 py-3 text-sm text-emerald-400">
              {success}
            </div>

          )}

        </section>


        {/* ================================================== */}
        {/* HOW IT WORKS */}
        {/* ================================================== */}

        <section className="mt-6 rounded-xl border border-slate-800/70 bg-slate-900/20 px-6 py-5">

          <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
            How alerts work
          </p>


          <div className="mt-4 grid gap-5 md:grid-cols-3">

            <div>

              <p className="text-sm font-medium text-slate-300">
                01. Set a price
              </p>

              <p className="mt-1 text-xs leading-5 text-slate-500">
                Choose the stock and price level you want
                Velora to watch.
              </p>

            </div>


            <div>

              <p className="text-sm font-medium text-slate-300">
                02. Velora monitors it
              </p>

              <p className="mt-1 text-xs leading-5 text-slate-500">
                Velora checks the market price against your
                selected condition.
              </p>

            </div>


            <div>

              <p className="text-sm font-medium text-slate-300">
                03. See it on Home
              </p>

              <p className="mt-1 text-xs leading-5 text-slate-500">
                When the condition is reached, the triggered
                alert appears on your dashboard.
              </p>

            </div>

          </div>

        </section>


        {/* ================================================== */}
        {/* CREATED ALERTS */}
        {/* ================================================== */}

        <section className="mt-10">

          <div className="mb-4">

            <h2 className="text-base font-semibold text-white">
              Your Created Alerts
            </h2>

            <p className="mt-1 text-xs text-slate-500">
              {alerts.length} alert
              {alerts.length !== 1
                ? "s"
                : ""}{" "}
              created
            </p>

          </div>


          {alerts.length === 0 ? (

            <div className="rounded-xl border border-dashed border-slate-800 bg-slate-900/20 px-6 py-10 text-center">

              <p className="text-sm text-slate-400">
                You haven't created any alerts yet.
              </p>

            </div>

          ) : (

            <div className="space-y-3">

              {alerts.map(
                (alert) => (

                  <div
                    key={alert.id}
                    className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-900/40 px-5 py-4 transition hover:border-slate-700"
                  >

                    {/* LEFT */}

                    <div className="flex items-center gap-4">

                      {/* TICKER */}

                      <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-blue-500/20 bg-blue-500/10 text-xs font-semibold text-blue-400">
                        {alert.ticker}
                      </div>


                      {/* DETAILS */}

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


                        {/* TRIGGERED TIME */}

                        {alert.triggered &&
                          alert.triggered_at && (

                            <p className="mt-1 text-[11px] text-emerald-500">

                              Triggered{" "}

                              {new Date(
                                alert.triggered_at
                              ).toLocaleString(
                                "en-IN"
                              )}

                            </p>

                          )}

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