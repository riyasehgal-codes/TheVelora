import { useEffect, useState } from "react";

import {
  AreaChart,
  Area,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

import Navbar from "../components/Navbar";

import api, {
  getForecast,
} from "../api/client";


function Forecast() {

  // ==========================================
  // STATE
  // ==========================================

  const [holdings, setHoldings] = useState([]);

  const [selectedTicker, setSelectedTicker] =
    useState("");

  const [forecastData, setForecastData] =
    useState(null);

  const [loading, setLoading] =
    useState(true);

  const [forecastLoading, setForecastLoading] =
    useState(false);

  const [error, setError] =
    useState("");


  // ==========================================
  // FETCH USER HOLDINGS
  // ==========================================

  useEffect(() => {

    const fetchHoldings = async () => {

      try {

        const response =
          await api.get("/holdings/");

        const userHoldings =
          response.data || [];

        setHoldings(userHoldings);

        if (userHoldings.length > 0) {

          setSelectedTicker(
            userHoldings[0].ticker
          );

        }

      } catch (err) {

        console.error(
          "Error fetching holdings:",
          err
        );

        setError(
          "Unable to load your portfolio holdings."
        );

      } finally {

        setLoading(false);

      }

    };

    fetchHoldings();

  }, []);


  // ==========================================
  // FETCH FORECAST
  // ==========================================

  useEffect(() => {

    const loadForecast = async () => {

      if (!selectedTicker) {
        return;
      }

      setForecastLoading(true);
      setError("");

      try {

        const data =
          await getForecast(
            selectedTicker
          );

        setForecastData(data);

      } catch (err) {

        console.error(
          "Forecast error:",
          err
        );

        setForecastData(null);

        setError(
          "Unable to generate the forecast for this stock."
        );

      } finally {

        setForecastLoading(false);

      }

    };

    loadForecast();

  }, [selectedTicker]);


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
    ).format(Number(value) || 0);

  };


  const formatDate = (date) => {

    if (!date) {
      return "";
    }

    const parsedDate =
      new Date(date);

    if (
      Number.isNaN(
        parsedDate.getTime()
      )
    ) {
      return date;
    }

    return parsedDate.toLocaleDateString(
      "en-IN",
      {
        day: "numeric",
        month: "short",
      }
    );

  };


  // ==========================================
  // FORECAST VALUES
  // ==========================================

  const currentPrice =
    Number(
      forecastData?.current_price ??
      forecastData?.currentPrice ??
      0
    );


  const trend =
    forecastData?.trend ??
    "Stable";


  const expectedChange =
    Number(
      forecastData?.expected_change ??
      forecastData?.expectedChange ??
      0
    );


  const confidence =
    forecastData?.confidence ??
    "95%";


  const predictions =
    forecastData?.forecast ??
    forecastData?.predictions ??
    forecastData?.data ??
    [];


  // ==========================================
  // CHART DATA
  // ==========================================

  const chartData = predictions.map(
    (item) => ({

      date:
        item.date ??
        item.ds ??
        item.forecast_date,

      predicted:
        Number(
          item.predicted_price ??
          item.predicted ??
          item.price ??
          0
        ),

      lower:
        Number(
          item.lower_bound ??
          item.lower ??
          item.confidence_lower ??
          0
        ),

      upper:
        Number(
          item.upper_bound ??
          item.upper ??
          item.confidence_upper ??
          0
        ),

    })
  );


  /*
   * Add the current market price as the
   * starting point of the forecast chart.
   *
   * This makes the chart easier to understand:
   *
   * Current Price → Forecast → Forecast Range
   */

  const chartWithCurrentPrice = [

    {
      date: "Today",
      predicted: currentPrice,
      lower: currentPrice,
      upper: currentPrice,
      isCurrent: true,
    },

    ...chartData.map(
      (item) => ({

        ...item,

        isCurrent: false,

      })
    ),

  ];


  const finalPrediction =
    chartData.length > 0
      ? chartData[
          chartData.length - 1
        ].predicted
      : 0;


  // ==========================================
  // TREND STYLING
  // ==========================================

  const normalizedTrend =
    String(trend).toLowerCase();


  const isUpward =
    normalizedTrend.includes("up");


  const isDownward =
    normalizedTrend.includes("down");


  const trendColor =
    isUpward
      ? "text-emerald-400"
      : isDownward
      ? "text-red-400"
      : "text-yellow-400";


  const trendBg =
    isUpward
      ? "bg-emerald-400/10 border-emerald-400/20"
      : isDownward
      ? "bg-red-400/10 border-red-400/20"
      : "bg-yellow-400/10 border-yellow-400/20";


  // ==========================================
  // CUSTOM TOOLTIP
  // ==========================================

  const CustomTooltip = ({
    active,
    payload,
    label,
  }) => {

    if (
      !active ||
      !payload ||
      payload.length === 0
    ) {
      return null;
    }


    const predicted =
      payload.find(
        (item) =>
          item.dataKey ===
          "predicted"
      );


    const lower =
      payload.find(
        (item) =>
          item.dataKey ===
          "lower"
      );


    const upper =
      payload.find(
        (item) =>
          item.dataKey ===
          "upper"
      );


    return (

      <div className="min-w-[180px] rounded-xl border border-blue-500/20 bg-[#050b22]/95 p-4 shadow-2xl backdrop-blur-xl">

        <p className="text-[10px] uppercase tracking-wider text-slate-500">
          {label === "Today"
            ? "Current"
            : formatDate(label)}
        </p>


        {predicted && (

          <div className="mt-3 flex items-center justify-between gap-6">

            <span className="text-xs text-slate-400">
              Predicted
            </span>

            <span className="text-sm font-semibold text-blue-400">
              {formatCurrency(
                predicted.value
              )}
            </span>

          </div>

        )}


        {lower && (

          <div className="mt-2 flex items-center justify-between gap-6">

            <span className="text-xs text-slate-500">
              Lower
            </span>

            <span className="text-xs text-slate-400">
              {formatCurrency(
                lower.value
              )}
            </span>

          </div>

        )}


        {upper && (

          <div className="mt-1 flex items-center justify-between gap-6">

            <span className="text-xs text-slate-500">
              Upper
            </span>

            <span className="text-xs text-slate-400">
              {formatCurrency(
                upper.value
              )}
            </span>

          </div>

        )}

      </div>

    );

  };


  // ==========================================
  // LOADING
  // ==========================================

  if (loading) {

    return (

      <div className="min-h-screen bg-[#020617] text-white">

        <Navbar />

        <main className="mx-auto max-w-[1400px] px-8 py-8">

          <p className="text-sm text-slate-500">
            Loading forecast...
          </p>

        </main>

      </div>

    );

  }


  // ==========================================
  // NO HOLDINGS
  // ==========================================

  if (holdings.length === 0) {

    return (

      <div className="min-h-screen bg-[#020617] text-white">

        <Navbar />

        <main className="mx-auto max-w-[1400px] px-8 py-10">

          <p className="text-xs uppercase tracking-[0.25em] text-blue-400">
            FORECAST
          </p>

          <h1 className="mt-2 text-3xl font-semibold">
            Market outlook
          </h1>

          <div className="mt-8 rounded-xl border border-white/10 bg-white/[0.025] p-6">

            <p className="text-sm text-slate-300">
              No holdings found.
            </p>

            <p className="mt-2 text-xs text-slate-500">
              Add a stock to your portfolio to
              generate a forecast.
            </p>

          </div>

        </main>

      </div>

    );

  }


  // ==========================================
  // MAIN PAGE
  // ==========================================

  return (

    <div className="min-h-screen bg-[#020617] text-white">

      <Navbar />


      {/* BACKGROUND GLOW */}

      <div className="pointer-events-none fixed inset-0 overflow-hidden">

        <div className="absolute right-[-180px] top-[-220px] h-[450px] w-[450px] rounded-full bg-blue-700/10 blur-3xl" />

        <div className="absolute bottom-[-250px] left-[-200px] h-[450px] w-[450px] rounded-full bg-indigo-700/8 blur-3xl" />

      </div>


      <main className="relative mx-auto max-w-[1400px] px-8 py-8">


        {/* ======================================
            HEADER
        ====================================== */}

        <div className="flex items-end justify-between">

          <div>

            <p className="text-[10px] font-medium uppercase tracking-[0.3em] text-blue-400">
              FORECAST
            </p>

            <h1 className="mt-2 text-3xl font-semibold tracking-tight">
              Market outlook
            </h1>

            <p className="mt-1 text-xs text-slate-500">
              7-day statistical forecast based on
              historical market data.
            </p>

          </div>


          {/* STOCK SELECTOR */}

          <div className="w-52">

            <label className="mb-1.5 block text-[10px] uppercase tracking-wider text-slate-500">
              Holding
            </label>

            <select
              value={selectedTicker}
              onChange={(event) =>
                setSelectedTicker(
                  event.target.value
                )
              }
              className="w-full rounded-lg border border-blue-500/25 bg-[#07102d] px-3 py-2.5 text-sm text-white outline-none transition focus:border-blue-500"
            >

              {holdings.map(
                (holding) => (

                  <option
                    key={holding.id}
                    value={holding.ticker}
                    className="bg-[#07102d]"
                  >
                    {holding.ticker}
                  </option>

                )
              )}

            </select>

          </div>

        </div>


        {/* ERROR */}

        {error && (

          <div className="mt-5 rounded-lg border border-red-500/20 bg-red-500/5 px-4 py-3 text-xs text-red-300">

            {error}

          </div>

        )}


        {/* ======================================
            FORECAST CONTENT
        ====================================== */}

        {forecastLoading ? (

          <div className="mt-7 grid grid-cols-4 gap-4">

            {[1, 2, 3, 4].map(
              (item) => (

                <div
                  key={item}
                  className="h-28 animate-pulse rounded-xl border border-white/10 bg-white/[0.025]"
                />

              )
            )}

          </div>

        ) : forecastData ? (

          <>


            {/* ==================================
                SUMMARY CARDS
            ================================== */}

            <div className="mt-7 grid grid-cols-4 gap-4">


              <div className="rounded-xl border border-white/10 bg-white/[0.025] px-5 py-4">

                <p className="text-[10px] uppercase tracking-wider text-slate-500">
                  Current price
                </p>

                <p className="mt-2 text-xl font-semibold">
                  {formatCurrency(
                    currentPrice
                  )}
                </p>

                <p className="mt-1 text-[11px] text-slate-600">
                  {selectedTicker}
                </p>

              </div>


              <div className="rounded-xl border border-white/10 bg-white/[0.025] px-5 py-4">

                <p className="text-[10px] uppercase tracking-wider text-slate-500">
                  7-day estimate
                </p>

                <p className="mt-2 text-xl font-semibold">
                  {formatCurrency(
                    finalPrediction
                  )}
                </p>

                <p className="mt-1 text-[11px] text-slate-600">
                  Final predicted price
                </p>

              </div>


              <div className="rounded-xl border border-white/10 bg-white/[0.025] px-5 py-4">

                <p className="text-[10px] uppercase tracking-wider text-slate-500">
                  Expected change
                </p>

                <p
                  className={`mt-2 text-xl font-semibold ${
                    expectedChange >= 0
                      ? "text-emerald-400"
                      : "text-red-400"
                  }`}
                >
                  {expectedChange >= 0
                    ? "+"
                    : ""}
                  {expectedChange.toFixed(2)}
                  %
                </p>

                <p className="mt-1 text-[11px] text-slate-600">
                  Model projection
                </p>

              </div>


              <div className="rounded-xl border border-white/10 bg-white/[0.025] px-5 py-4">

                <p className="text-[10px] uppercase tracking-wider text-slate-500">
                  Short-term trend
                </p>

                <div
                  className={`mt-2 inline-flex rounded-md border px-2.5 py-1 text-xs font-medium ${trendBg} ${trendColor}`}
                >
                  {trend}
                </div>

                <p className="mt-1 text-[11px] text-slate-600">
                  Statistical outlook
                </p>

              </div>

            </div>


            {/* ==================================
                BEAUTIFUL FORECAST GRAPH
            ================================== */}

            <div className="mt-5 rounded-xl border border-white/10 bg-white/[0.025] px-6 py-5">

              <div className="flex items-center justify-between">

                <div>

                  <h2 className="text-sm font-semibold">
                    Price forecast
                  </h2>

                  <p className="mt-1 text-[11px] text-slate-500">
                    Expected movement over the next
                    seven days
                  </p>

                </div>


                {/* LEGEND */}

                <div className="flex items-center gap-5">

                  <div className="flex items-center gap-2">

                    <span className="h-2.5 w-2.5 rounded-full bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.8)]" />

                    <span className="text-[10px] text-slate-400">
                      Predicted
                    </span>

                  </div>


                  <div className="flex items-center gap-2">

                    <span className="h-2.5 w-2.5 rounded-full bg-purple-500/60" />

                    <span className="text-[10px] text-slate-400">
                      {confidence} range
                    </span>

                  </div>

                </div>

              </div>


              {/* GRAPH */}

              <div className="mt-5 h-[330px]">

                {chartData.length === 0 ? (

                  <div className="flex h-full items-center justify-center text-xs text-slate-500">
                    No forecast data available.
                  </div>

                ) : (

                  <ResponsiveContainer
                    width="100%"
                    height="100%"
                  >

                    <AreaChart
                      data={
                        chartWithCurrentPrice
                      }
                      margin={{
                        top: 15,
                        right: 20,
                        left: 5,
                        bottom: 5,
                      }}
                    >

                      <defs>

                        {/* Confidence gradient */}

                        <linearGradient
                          id="confidenceGradient"
                          x1="0"
                          y1="0"
                          x2="0"
                          y2="1"
                        >

                          <stop
                            offset="0%"
                            stopColor="#8b5cf6"
                            stopOpacity={0.18}
                          />

                          <stop
                            offset="100%"
                            stopColor="#8b5cf6"
                            stopOpacity={0.02}
                          />

                        </linearGradient>


                        {/* Forecast line glow */}

                        <filter
                          id="lineGlow"
                          x="-50%"
                          y="-50%"
                          width="200%"
                          height="200%"
                        >

                          <feGaussianBlur
                            stdDeviation="3"
                            result="blur"
                          />

                          <feMerge>

                            <feMergeNode
                              in="blur"
                            />

                            <feMergeNode
                              in="SourceGraphic"
                            />

                          </feMerge>

                        </filter>

                      </defs>


                      <CartesianGrid
                        stroke="#ffffff"
                        strokeOpacity={0.045}
                        vertical={false}
                      />


                      <XAxis
                        dataKey="date"
                        tickFormatter={(
                          value
                        ) =>
                          value === "Today"
                            ? "Today"
                            : formatDate(
                                value
                              )
                        }
                        tick={{
                          fill: "#64748b",
                          fontSize: 10,
                        }}
                        axisLine={false}
                        tickLine={false}
                        dy={8}
                      />


                      <YAxis
                        tick={{
                          fill: "#64748b",
                          fontSize: 10,
                        }}
                        axisLine={false}
                        tickLine={false}
                        width={55}
                        tickFormatter={(value) =>
                          `₹${Number(
                            value
                          ).toLocaleString(
                            "en-IN",
                            {
                              maximumFractionDigits: 0,
                            }
                          )}`
                        }
                        domain={["auto", "auto"]}
                      />


                      <Tooltip
                        content={
                          <CustomTooltip />
                        }
                        cursor={{
                          stroke:
                            "#4f7cff",
                          strokeOpacity:
                            0.2,
                        }}
                      />


                      {/* CONFIDENCE AREA */}

                      <Area
                        type="monotone"
                        dataKey="upper"
                        stroke="none"
                        fill="url(#confidenceGradient)"
                        connectNulls
                        isAnimationActive
                      />


                      <Area
                        type="monotone"
                        dataKey="lower"
                        stroke="none"
                        fill="#020617"
                        fillOpacity={0.95}
                        connectNulls
                      />


                      {/* UPPER BOUND */}

                      <Line
                        type="monotone"
                        dataKey="upper"
                        stroke="#8b5cf6"
                        strokeWidth={1}
                        strokeOpacity={0.35}
                        strokeDasharray="3 5"
                        dot={false}
                        connectNulls
                      />


                      {/* LOWER BOUND */}

                      <Line
                        type="monotone"
                        dataKey="lower"
                        stroke="#8b5cf6"
                        strokeWidth={1}
                        strokeOpacity={0.35}
                        strokeDasharray="3 5"
                        dot={false}
                        connectNulls
                      />


                      {/* MAIN FORECAST LINE */}

                      <Line
                        type="monotone"
                        dataKey="predicted"
                        stroke="#4f7cff"
                        strokeWidth={3}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        dot={false}
                        activeDot={{
                          r: 5,
                          fill: "#4f7cff",
                          stroke:
                            "#ffffff",
                          strokeWidth: 2,
                        }}
                        connectNulls
                        filter="url(#lineGlow)"
                      />


                      {/* CURRENT PRICE DOT */}

                      <Line
                        type="monotone"
                        dataKey="predicted"
                        stroke="transparent"
                        strokeWidth={0}
                        dot={(props) => {

                          const {
                            cx,
                            cy,
                            index,
                          } = props;

                          if (index !== 0) {
                            return null;
                          }

                          return (

                            <circle
                              cx={cx}
                              cy={cy}
                              r={5}
                              fill="#ffffff"
                              stroke="#4f7cff"
                              strokeWidth={3}
                            />

                          );

                        }}
                        activeDot={false}
                      />

                    </AreaChart>

                  </ResponsiveContainer>

                )}

              </div>


              {/* CHART FOOTER */}

              <div className="mt-2 flex items-center justify-between border-t border-white/5 pt-3">

                <p className="text-[10px] text-slate-600">
                  Current price:{" "}
                  <span className="text-slate-400">
                    {formatCurrency(
                      currentPrice
                    )}
                  </span>
                </p>

                <p className="text-[10px] text-slate-600">
                  Final estimate:{" "}
                  <span className="text-blue-400">
                    {formatCurrency(
                      finalPrediction
                    )}
                  </span>
                </p>

              </div>

            </div>


            {/* ==================================
                BOTTOM SECTION
            ================================== */}

            <div className="mt-5 grid grid-cols-3 gap-5">


              {/* DAILY FORECAST */}

              <div className="col-span-2 rounded-xl border border-white/10 bg-white/[0.025] px-5 py-5">

                <div>

                  <h2 className="text-sm font-semibold">
                    Daily forecast
                  </h2>

                  <p className="mt-1 text-[11px] text-slate-500">
                    Expected price range for the
                    next seven days.
                  </p>

                </div>


                <div className="mt-4 overflow-hidden">

                  <table className="w-full">

                    <thead>

                      <tr className="border-b border-white/10">

                        <th className="pb-3 text-left text-[9px] font-medium uppercase tracking-wider text-slate-600">
                          Date
                        </th>

                        <th className="pb-3 text-right text-[9px] font-medium uppercase tracking-wider text-slate-600">
                          Predicted
                        </th>

                        <th className="pb-3 text-right text-[9px] font-medium uppercase tracking-wider text-slate-600">
                          Lower
                        </th>

                        <th className="pb-3 text-right text-[9px] font-medium uppercase tracking-wider text-slate-600">
                          Upper
                        </th>

                      </tr>

                    </thead>


                    <tbody>

                      {chartData.map(
                        (item, index) => (

                          <tr
                            key={
                              `${item.date}-${index}`
                            }
                            className="border-b border-white/5 last:border-0"
                          >

                            <td className="py-3 text-xs text-slate-400">
                              {formatDate(
                                item.date
                              )}
                            </td>

                            <td className="py-3 text-right text-xs font-medium text-blue-400">
                              {formatCurrency(
                                item.predicted
                              )}
                            </td>

                            <td className="py-3 text-right text-xs text-slate-500">
                              {formatCurrency(
                                item.lower
                              )}
                            </td>

                            <td className="py-3 text-right text-xs text-slate-500">
                              {formatCurrency(
                                item.upper
                              )}
                            </td>

                          </tr>

                        )
                      )}

                    </tbody>

                  </table>

                </div>

              </div>


              {/* MODEL INFO */}

              <div className="space-y-5">

                <div className="rounded-xl border border-white/10 bg-white/[0.025] p-5">

                  <p className="text-[9px] font-medium uppercase tracking-[0.25em] text-blue-400">
                    MODEL
                  </p>

                  <h3 className="mt-2 text-lg font-semibold">
                    ARIMA
                  </h3>

                  <p className="mt-2 text-[11px] leading-5 text-slate-500">
                    A time-series model trained
                    using historical market prices
                    to estimate short-term movement.
                  </p>

                  <div className="mt-4 flex flex-wrap gap-2">

                    <span className="rounded-md border border-white/10 bg-white/[0.025] px-2 py-1 text-[9px] text-slate-500">
                      6 months data
                    </span>

                    <span className="rounded-md border border-white/10 bg-white/[0.025] px-2 py-1 text-[9px] text-slate-500">
                      7 day forecast
                    </span>

                  </div>

                </div>


                <div className="rounded-xl border border-amber-400/10 bg-amber-400/[0.025] p-5">

                  <p className="text-[9px] font-medium uppercase tracking-[0.25em] text-amber-400">
                    NOTE
                  </p>

                  <h3 className="mt-2 text-sm font-semibold">
                    Forecasts are estimates
                  </h3>

                  <p className="mt-2 text-[11px] leading-5 text-slate-500">
                    Predictions are based on
                    historical data and statistical
                    modeling. They do not guarantee
                    future market performance.
                  </p>

                </div>

              </div>

            </div>

          </>

        ) : null}

      </main>

    </div>

  );

}


export default Forecast;