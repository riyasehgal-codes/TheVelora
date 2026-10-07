// Portfolio.jsx

import { useEffect, useMemo, useState } from "react";

import Navbar from "../components/Navbar";

import api, {
  getMarketPrice,
  getExchangeRate,
} from "../api/client";


function Portfolio() {

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

  const [loading, setLoading] =
    useState(true);

  const [search, setSearch] =
    useState("");

  const [sortBy, setSortBy] =
    useState("ticker");

  const [error, setError] =
    useState("");


  // ==========================================
  // ADD HOLDING FORM
  // ==========================================

  const [formData, setFormData] = useState({

    ticker: "",
    quantity: "",
    average_price: "",

  });


  // ==========================================
  // EDIT STATE
  // ==========================================

  const [editingId, setEditingId] =
    useState(null);

  const [editData, setEditData] = useState({

    ticker: "",
    quantity: "",
    average_price: "",

  });


  // ==========================================
  // FETCH HOLDINGS
  // ==========================================

  const fetchHoldings = async () => {

    try {

      const response =
        await api.get("/holdings/");

      setHoldings(response.data);

    } catch (err) {

      console.error(
        "Error fetching holdings:",
        err
      );

      setError(
        "Unable to load your holdings."
      );

    } finally {

      setLoading(false);

    }

  };


  useEffect(() => {

    fetchHoldings();

  }, []);


  // ==========================================
  // FETCH MARKET PRICES
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

            prices[
              holding.ticker
            ] = Number(data.price);


            currencies[
              holding.ticker
            ] = data.currency;

          }

        } catch (err) {

          console.error(
            `Market price error for ${holding.ticker}:`,
            err
          );

        }

      }


      setMarketPrices(prices);
      setMarketCurrencies(currencies);

    };


    fetchMarketData();

  }, [holdings]);


  // ==========================================
  // FETCH USD → INR
  // ==========================================

  useEffect(() => {

    const fetchRate = async () => {

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

      } catch (err) {

        console.error(
          "Exchange rate error:",
          err
        );

      }

    };


    fetchRate();

  }, []);


  // ==========================================
  // FORMAT CURRENCY
  // ==========================================

  const formatCurrency = (
    value
  ) => {

    return new Intl.NumberFormat(
      "en-IN",
      {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 2,
      }
    ).format(value);

  };


  // ==========================================
  // GET INR VALUE
  // ==========================================

  const getHoldingValue = (
    holding
  ) => {

    const quantity =
      Number(holding.quantity);


    const currentPrice =
      Number(
        marketPrices[
          holding.ticker
        ] || 0
      );


    let value =
      quantity * currentPrice;


    const currency =
      marketCurrencies[
        holding.ticker
      ];


    if (currency === "USD") {

      value =
        value * exchangeRate;

    }


    return value;

  };


  // ==========================================
  // GET INVESTED VALUE
  // ==========================================

  const getInvestedValue = (
    holding
  ) => {

    let value =
      Number(holding.quantity) *
      Number(holding.average_price);


    const currency =
      marketCurrencies[
        holding.ticker
      ];


    if (currency === "USD") {

      value =
        value * exchangeRate;

    }


    return value;

  };


  // ==========================================
  // ADD HOLDING
  // ==========================================

  const handleAddHolding = async (
    event
  ) => {

    event.preventDefault();

    setError("");


    try {

      await api.post(
        "/holdings/",
        {
          ticker:
            formData.ticker
              .trim()
              .toUpperCase(),

          quantity:
            formData.quantity,

          average_price:
            formData.average_price,
        }
      );


      // Clear form.

      setFormData({

        ticker: "",
        quantity: "",
        average_price: "",

      });


      // Refresh holdings.

      await fetchHoldings();

    } catch (err) {

      console.error(
        "Add holding error:",
        err
      );

      setError(
        "Unable to add this holding."
      );

    }

  };


  // ==========================================
  // DELETE HOLDING
  // ==========================================

  const handleDelete = async (
    id
  ) => {

    const confirmed =
      window.confirm(
        "Are you sure you want to remove this holding?"
      );


    if (!confirmed) {
      return;
    }


    try {

      await api.delete(
        `/holdings/${id}/`
      );


      setHoldings(
        holdings.filter(
          (holding) =>
            holding.id !== id
        )
      );

    } catch (err) {

      console.error(
        "Delete error:",
        err
      );

      setError(
        "Unable to delete this holding."
      );

    }

  };


  // ==========================================
  // START EDITING
  // ==========================================

  const startEditing = (
    holding
  ) => {

    setEditingId(
      holding.id
    );


    setEditData({

      ticker:
        holding.ticker,

      quantity:
        holding.quantity,

      average_price:
        holding.average_price,

    });

  };


  // ==========================================
  // SAVE EDIT
  // ==========================================

  const handleEdit = async (
    id
  ) => {

    try {

      await api.patch(
        `/holdings/${id}/`,
        {
          ticker:
            editData.ticker
              .trim()
              .toUpperCase(),

          quantity:
            editData.quantity,

          average_price:
            editData.average_price,
        }
      );


      setEditingId(null);

      await fetchHoldings();

    } catch (err) {

      console.error(
        "Edit error:",
        err
      );

      setError(
        "Unable to update this holding."
      );

    }

  };


  // ==========================================
  // FILTER + SORT
  // ==========================================

  const displayedHoldings =
    useMemo(() => {

      let result =
        [...holdings];


      // Search.

      if (search.trim()) {

        const query =
          search
            .trim()
            .toLowerCase();


        result =
          result.filter(
            (holding) =>
              holding.ticker
                .toLowerCase()
                .includes(query)
          );

      }


      // Sort.

      result.sort(
        (a, b) => {

          if (
            sortBy === "ticker"
          ) {

            return a.ticker.localeCompare(
              b.ticker
            );

          }


          if (
            sortBy === "value"
          ) {

            return (
              getHoldingValue(b) -
              getHoldingValue(a)
            );

          }


          if (
            sortBy === "profit"
          ) {

            const profitA =
              getHoldingValue(a) -
              getInvestedValue(a);

            const profitB =
              getHoldingValue(b) -
              getInvestedValue(b);

            return profitB - profitA;

          }


          return 0;

        }
      );


      return result;

    }, [
      holdings,
      search,
      sortBy,
      marketPrices,
      marketCurrencies,
      exchangeRate,
    ]);


  // ==========================================
  // TOTALS
  // ==========================================

  const totalValue =
    holdings.reduce(
      (total, holding) =>
        total +
        getHoldingValue(holding),
      0
    );


  const totalInvested =
    holdings.reduce(
      (total, holding) =>
        total +
        getInvestedValue(holding),
      0
    );


  const totalProfit =
    totalValue -
    totalInvested;


  const totalReturn =
    totalInvested > 0
      ? (
          totalProfit /
          totalInvested
        ) * 100
      : 0;


  // ==========================================
  // DIVERSIFICATION
  // ==========================================

  const allocationData =
    holdings.map(
      (holding) => {

        const value =
          getHoldingValue(
            holding
          );


        return {

          ticker:
            holding.ticker,

          value,

          percentage:
            totalValue > 0
              ? (
                  value /
                  totalValue
                ) * 100
              : 0,

        };

      }
    );


  const largestHolding =
    allocationData.length > 0
      ? allocationData.reduce(
          (largest, item) =>
            item.value >
            largest.value
              ? item
              : largest
        )
      : null;


  const concentration =
    allocationData.reduce(
      (total, item) => {

        const weight =
          item.percentage /
          100;

        return (
          total +
          weight * weight
        );

      },
      0
    );


  const diversificationScore =
    allocationData.length > 1
      ? Math.round(
          (1 - concentration) *
          100
        )
      : 0;


  // ==========================================
  // STOCK ICON
  // ==========================================

  const getStockIcon = (
    ticker
  ) => {

    const cleanTicker =
      ticker
        .replace(".NS", "")
        .toUpperCase();


    const icons = {

      AAPL: "●",

      MSFT: "⊞",

      GOOGL: "G",

      GOOG: "G",

      AMZN: "a",

      TSLA: "T",

      TCS: "T",

      RELIANCE: "R",

    };


    return (
      icons[cleanTicker] ||
      cleanTicker.charAt(0)
    );

  };


  // ==========================================
  // LOADING
  // ==========================================

  if (loading) {

    return (

      <div
        className="
          min-h-screen
          bg-[#020617]
          text-white
        "
      >

        <Navbar />

        <div
          className="
            flex
            min-h-[calc(100vh-58px)]
            items-center
            justify-center
          "
        >

          <p className="text-sm text-slate-500">
            Loading portfolio...
          </p>

        </div>

      </div>

    );

  }


  // ==========================================
  // MAIN UI
  // ==========================================

  return (

    <div
      className="
        min-h-screen
        bg-[#020617]
        text-white
      "
    >

      {/* =====================================
          BACKGROUND GLOW
          ===================================== */}

      <div
        className="
          pointer-events-none
          fixed
          right-[-120px]
          top-[-160px]
          h-[500px]
          w-[500px]
          rounded-full
          bg-blue-600/10
          blur-3xl
        "
      />


      <Navbar />


      <main
        className="
          relative
          mx-auto
          max-w-[1500px]
          px-5
          py-8
          lg:px-8
        "
      >


        {/* ===================================
            PAGE HEADER
            =================================== */}

        <div className="mb-5">

          <div
            className="
              mb-3
              h-[2px]
              w-8
              bg-gradient-to-r
              from-blue-500
              to-purple-500
            "
          />


          <h1
            className="
              text-4xl
              font-semibold
              tracking-tight
              sm:text-5xl
            "
          >
            Hello{" "}

            <span
              className="
                bg-gradient-to-r
                from-blue-400
                to-purple-500
                bg-clip-text
                text-transparent
              "
            >
              Riya!
            </span>

          </h1>


          <div
            className="
              mt-2
              flex
              items-center
              gap-3
              text-[10px]
              font-medium
              tracking-[0.25em]
              text-blue-400/80
            "
          >

            <span>TRACK</span>

            <span className="text-slate-700">
              |
            </span>

            <span>ANALYZE</span>

            <span className="text-slate-700">
              |
            </span>

            <span>FORECAST</span>

          </div>

        </div>


        {/* ===================================
            ERROR
            =================================== */}

        {error && (

          <div
            className="
              mb-4
              rounded-lg
              border
              border-red-500/20
              bg-red-500/10
              px-4
              py-3
              text-sm
              text-red-400
            "
          >
            {error}
          </div>

        )}


        {/* ===================================
            ADD HOLDING
            =================================== */}

        <section
          className="
            rounded-lg
            border
            border-blue-900/60
            bg-gradient-to-r
            from-[#06102b]
            to-[#050b21]
            p-4
            shadow-[0_0_30px_rgba(37,99,235,0.06)]
          "
        >

          <div
            className="
              flex
              flex-col
              gap-4
              xl:flex-row
              xl:items-center
            "
          >

            {/* Plus icon */}

            <div
              className="
                flex
                h-8
                w-8
                shrink-0
                items-center
                justify-center
                rounded-full
                bg-gradient-to-br
                from-blue-500
                to-indigo-600
                text-xl
                text-white
                shadow-[0_0_18px_rgba(59,130,246,0.3)]
              "
            >
              +
            </div>


            {/* Form */}

            <form
              onSubmit={
                handleAddHolding
              }
              className="
                grid
                flex-1
                grid-cols-1
                gap-3
                sm:grid-cols-2
                lg:grid-cols-4
                xl:grid-cols-5
              "
            >

              {/* Ticker */}

              <div>

                <label
                  className="
                    mb-1
                    block
                    text-[9px]
                    text-slate-500
                  "
                >
                  Ticker
                </label>

                <input
                  type="text"
                  placeholder="AAPL"
                  value={
                    formData.ticker
                  }
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      ticker:
                        e.target.value,
                    })
                  }
                  required
                  className="
                    h-9
                    w-full
                    rounded-md
                    border
                    border-indigo-900/70
                    bg-[#03091b]
                    px-3
                    text-xs
                    text-white
                    outline-none
                    placeholder:text-slate-600
                    focus:border-blue-500
                  "
                />

              </div>


              {/* Quantity */}

              <div>

                <label
                  className="
                    mb-1
                    block
                    text-[9px]
                    text-slate-500
                  "
                >
                  Quantity
                </label>

                <input
                  type="number"
                  min="0"
                  step="any"
                  placeholder="10"
                  value={
                    formData.quantity
                  }
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      quantity:
                        e.target.value,
                    })
                  }
                  required
                  className="
                    h-9
                    w-full
                    rounded-md
                    border
                    border-indigo-900/70
                    bg-[#03091b]
                    px-3
                    text-xs
                    text-white
                    outline-none
                    placeholder:text-slate-600
                    focus:border-blue-500
                  "
                />

              </div>


              {/* Buy price */}

              <div>

                <label
                  className="
                    mb-1
                    block
                    text-[9px]
                    text-slate-500
                  "
                >
                  Buy price
                </label>

                <input
                  type="number"
                  min="0"
                  step="any"
                  placeholder="150.00"
                  value={
                    formData.average_price
                  }
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      average_price:
                        e.target.value,
                    })
                  }
                  required
                  className="
                    h-9
                    w-full
                    rounded-md
                    border
                    border-indigo-900/70
                    bg-[#03091b]
                    px-3
                    text-xs
                    text-white
                    outline-none
                    placeholder:text-slate-600
                    focus:border-blue-500
                  "
                />

              </div>


              {/* Buy date */}

              <div>

                <label
                  className="
                    mb-1
                    block
                    text-[9px]
                    text-slate-500
                  "
                >
                  Buy date
                </label>

                <input
                  type="date"
                  className="
                    h-9
                    w-full
                    rounded-md
                    border
                    border-indigo-900/70
                    bg-[#03091b]
                    px-3
                    text-xs
                    text-slate-400
                    outline-none
                    focus:border-blue-500
                  "
                />

              </div>


              {/* Add button */}

              <div className="flex items-end">

                <button
                  type="submit"
                  className="
                    h-9
                    w-full
                    rounded-md
                    bg-gradient-to-r
                    from-blue-500
                    to-purple-600
                    text-xs
                    font-medium
                    text-white
                    shadow-[0_0_20px_rgba(79,70,229,0.2)]
                    transition
                    hover:brightness-110
                  "
                >
                  Add stock
                </button>

              </div>

            </form>

          </div>

        </section>


        {/* ===================================
            MAIN CONTENT GRID
            =================================== */}

        <div
          className="
            mt-4
            grid
            gap-4
            xl:grid-cols-[minmax(0,2fr)_minmax(280px,0.9fr)]
          "
        >


          {/* =================================
              HOLDINGS TABLE
              ================================= */}

          <section
            className="
              overflow-hidden
              rounded-lg
              border
              border-blue-900/50
              bg-[#03091b]/80
            "
          >

            {/* Table header */}

            <div
              className="
                border-b
                border-blue-900/30
                p-4
              "
            >

              <div
                className="
                  flex
                  flex-col
                  gap-3
                  sm:flex-row
                  sm:items-center
                  sm:justify-between
                "
              >

                <div>

                  <h2
                    className="
                      text-lg
                      font-semibold
                    "
                  >
                    Your Holdings
                  </h2>

                  <p
                    className="
                      mt-0.5
                      text-[10px]
                      text-slate-500
                    "
                  >
                    {holdings.length} positions ·
                    Live market data
                  </p>

                </div>


                {/* Search + sort */}

                <div
                  className="
                    flex
                    gap-2
                  "
                >

                  <div
                    className="
                      flex
                      h-8
                      items-center
                      gap-2
                      rounded-md
                      border
                      border-indigo-900/60
                      bg-[#020617]
                      px-3
                    "
                  >

                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      className="text-slate-500"
                    >

                      <circle
                        cx="11"
                        cy="11"
                        r="7"
                      />

                      <path
                        d="M20 20l-4-4"
                      />

                    </svg>

                    <input
                      type="text"
                      placeholder="Search holdings..."
                      value={search}
                      onChange={(e) =>
                        setSearch(
                          e.target.value
                        )
                      }
                      className="
                        w-28
                        bg-transparent
                        text-[10px]
                        text-white
                        outline-none
                        placeholder:text-slate-600
                        sm:w-36
                      "
                    />

                  </div>


                  <select
                    value={sortBy}
                    onChange={(e) =>
                      setSortBy(
                        e.target.value
                      )
                    }
                    className="
                      h-8
                      rounded-md
                      border
                      border-indigo-900/60
                      bg-[#020617]
                      px-2
                      text-[10px]
                      text-slate-400
                      outline-none
                    "
                  >

                    <option value="ticker">
                      Sort by Ticker
                    </option>

                    <option value="value">
                      Sort by Value
                    </option>

                    <option value="profit">
                      Sort by Profit
                    </option>

                  </select>

                </div>

              </div>

            </div>


            {/* Table */}

            <div className="overflow-x-auto">

              <table
                className="
                  w-full
                  min-w-[780px]
                  text-left
                "
              >

                <thead>

                  <tr
                    className="
                      border-b
                      border-blue-900/30
                      text-[9px]
                      uppercase
                      tracking-wide
                      text-slate-500
                    "
                  >

                    <th className="px-4 py-2">
                      Ticker
                    </th>

                    <th className="px-3 py-2">
                      Company
                    </th>

                    <th className="px-3 py-2">
                      Quantity
                    </th>

                    <th className="px-3 py-2">
                      Avg. Buy Price
                    </th>

                    <th className="px-3 py-2">
                      Current Price
                    </th>

                    <th className="px-3 py-2">
                      Current Value
                    </th>

                    <th className="px-3 py-2">
                      P&L
                    </th>

                    <th className="px-3 py-2">
                      Actions
                    </th>

                  </tr>

                </thead>


                <tbody>

                  {displayedHoldings.map(
                    (holding) => {

                      const currentPrice =
                        Number(
                          marketPrices[
                            holding.ticker
                          ] || 0
                        );


                      const value =
                        getHoldingValue(
                          holding
                        );


                      const invested =
                        getInvestedValue(
                          holding
                        );


                      const profit =
                        value -
                        invested;


                      const profitPercentage =
                        invested > 0
                          ? (
                              profit /
                              invested
                            ) * 100
                          : 0;


                      const isEditing =
                        editingId ===
                        holding.id;


                      return (

                        <tr
                          key={holding.id}
                          className="
                            border-b
                            border-blue-900/20
                            transition
                            hover:bg-blue-950/20
                          "
                        >

                          {/* Ticker */}

                          <td className="px-4 py-3">

                            {isEditing ? (

                              <input
                                value={
                                  editData.ticker
                                }
                                onChange={(e) =>
                                  setEditData({
                                    ...editData,
                                    ticker:
                                      e.target.value,
                                  })
                                }
                                className="
                                  w-20
                                  rounded
                                  border
                                  border-indigo-700
                                  bg-[#020617]
                                  px-2
                                  py-1
                                  text-xs
                                  text-white
                                  outline-none
                                "
                              />

                            ) : (

                              <div
                                className="
                                  flex
                                  items-center
                                  gap-3
                                "
                              >

                                <div
                                  className="
                                    flex
                                    h-8
                                    w-8
                                    items-center
                                    justify-center
                                    rounded-full
                                    bg-gradient-to-br
                                    from-blue-500
                                    to-indigo-700
                                    text-xs
                                    font-bold
                                    text-white
                                  "
                                >
                                  {getStockIcon(
                                    holding.ticker
                                  )}
                                </div>

                                <span
                                  className="
                                    text-xs
                                    font-medium
                                    text-white
                                  "
                                >
                                  {holding.ticker}
                                </span>

                              </div>

                            )}

                          </td>


                          {/* Company */}

                          <td className="px-3 py-3">

                            <span
                              className="
                                text-[10px]
                                text-slate-500
                              "
                            >
                              {holding.ticker}
                            </span>

                          </td>


                          {/* Quantity */}

                          <td className="px-3 py-3">

                            {isEditing ? (

                              <input
                                type="number"
                                step="any"
                                value={
                                  editData.quantity
                                }
                                onChange={(e) =>
                                  setEditData({
                                    ...editData,
                                    quantity:
                                      e.target.value,
                                  })
                                }
                                className="
                                  w-20
                                  rounded
                                  border
                                  border-indigo-700
                                  bg-[#020617]
                                  px-2
                                  py-1
                                  text-xs
                                  text-white
                                  outline-none
                                "
                              />

                            ) : (

                              <span className="text-xs text-slate-300">
                                {holding.quantity}
                              </span>

                            )}

                          </td>


                          {/* Average price */}

                          <td className="px-3 py-3">

                            {isEditing ? (

                              <input
                                type="number"
                                step="any"
                                value={
                                  editData.average_price
                                }
                                onChange={(e) =>
                                  setEditData({
                                    ...editData,
                                    average_price:
                                      e.target.value,
                                  })
                                }
                                className="
                                  w-24
                                  rounded
                                  border
                                  border-indigo-700
                                  bg-[#020617]
                                  px-2
                                  py-1
                                  text-xs
                                  text-white
                                  outline-none
                                "
                              />

                            ) : (

                              <span className="text-xs text-slate-400">
                                {Number(
                                  holding.average_price
                                ).toFixed(2)}
                              </span>

                            )}

                          </td>


                          {/* Current price */}

                          <td className="px-3 py-3">

                            <span className="text-xs text-slate-300">

                              {currentPrice > 0
                                ? currentPrice.toFixed(2)
                                : "—"}

                            </span>

                          </td>


                          {/* Current value */}

                          <td className="px-3 py-3">

                            <span
                              className="
                                text-xs
                                font-medium
                                text-slate-200
                              "
                            >
                              {formatCurrency(
                                value
                              )}
                            </span>

                          </td>


                          {/* P/L */}

                          <td className="px-3 py-3">

                            <div
                              className={`
                                text-xs
                                font-medium
                                ${
                                  profit >= 0
                                    ? "text-emerald-400"
                                    : "text-red-400"
                                }
                              `}
                            >

                              {profit >= 0
                                ? "+"
                                : ""}

                              {formatCurrency(
                                profit
                              )}

                              <div
                                className="
                                  text-[9px]
                                  opacity-80
                                "
                              >
                                {profitPercentage >= 0
                                  ? "+"
                                  : ""}
                                {profitPercentage.toFixed(
                                  2
                                )}
                                %
                              </div>

                            </div>

                          </td>


                          {/* Actions */}

                          <td className="px-3 py-3">

                            {isEditing ? (

                              <div className="flex gap-2">

                                <button
                                  onClick={() =>
                                    handleEdit(
                                      holding.id
                                    )
                                  }
                                  className="
                                    rounded
                                    border
                                    border-emerald-500/30
                                    bg-emerald-500/10
                                    px-2
                                    py-1
                                    text-[9px]
                                    text-emerald-400
                                  "
                                >
                                  Save
                                </button>


                                <button
                                  onClick={() =>
                                    setEditingId(
                                      null
                                    )
                                  }
                                  className="
                                    rounded
                                    border
                                    border-slate-700
                                    px-2
                                    py-1
                                    text-[9px]
                                    text-slate-400
                                  "
                                >
                                  Cancel
                                </button>

                              </div>

                            ) : (

                              <div className="flex gap-2">

                                {/* Edit */}

                                <button
                                  onClick={() =>
                                    startEditing(
                                      holding
                                    )
                                  }
                                  className="
                                    flex
                                    h-7
                                    w-7
                                    items-center
                                    justify-center
                                    rounded-full
                                    border
                                    border-indigo-900
                                    text-slate-500
                                    transition
                                    hover:border-blue-500
                                    hover:text-blue-400
                                  "
                                  title="Edit"
                                >

                                  <svg
                                    width="12"
                                    height="12"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="1.8"
                                  >

                                    <path
                                      d="M12 20h9"
                                    />

                                    <path
                                      d="M16.5 3.5a2.1 2.1 0 013 3L8 18l-4 1 1-4z"
                                    />

                                  </svg>

                                </button>


                                {/* Delete */}

                                <button
                                  onClick={() =>
                                    handleDelete(
                                      holding.id
                                    )
                                  }
                                  className="
                                    flex
                                    h-7
                                    w-7
                                    items-center
                                    justify-center
                                    rounded-full
                                    border
                                    border-indigo-900
                                    text-slate-500
                                    transition
                                    hover:border-red-500
                                    hover:text-red-400
                                  "
                                  title="Delete"
                                >

                                  <svg
                                    width="12"
                                    height="12"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="1.8"
                                  >

                                    <path
                                      d="M3 6h18"
                                    />

                                    <path
                                      d="M8 6V4h8v2"
                                    />

                                    <path
                                      d="M19 6l-1 15H6L5 6"
                                    />

                                  </svg>

                                </button>

                              </div>

                            )}

                          </td>

                        </tr>

                      );

                    }
                  )}


                  {/* Empty state */}

                  {displayedHoldings.length ===
                    0 && (

                    <tr>

                      <td
                        colSpan="8"
                        className="
                          px-6
                          py-14
                          text-center
                        "
                      >

                        <p
                          className="
                            text-sm
                            text-slate-500
                          "
                        >
                          {search
                            ? "No holdings match your search."
                            : "No holdings yet. Add your first stock above."}
                        </p>

                      </td>

                    </tr>

                  )}

                </tbody>

              </table>

            </div>

          </section>


          {/* =================================
              RIGHT SIDEBAR
              ================================= */}

          <div className="space-y-4">


            {/* =================================
                RISK CARD
                ================================= */}

            <section
              className="
                rounded-lg
                border
                border-blue-900/50
                bg-[#03091b]/80
                p-4
              "
            >

              <div
                className="
                  flex
                  items-center
                  justify-between
                "
              >

                <div
                  className="
                    flex
                    items-center
                    gap-2
                  "
                >

                  <div
                    className="
                      flex
                      h-7
                      w-7
                      items-center
                      justify-center
                      rounded-md
                      bg-blue-500/10
                      text-blue-400
                    "
                  >

                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                    >

                      <path
                        d="M12 3l8 4v5c0 5-3.5 8-8 9-4.5-1-8-4-8-9V7z"
                      />

                      <path
                        d="M9 12l2 2 4-4"
                      />

                    </svg>

                  </div>

                  <h3
                    className="
                      text-xs
                      font-semibold
                    "
                  >
                    Risk & Diversification
                  </h3>

                </div>


                <span
                  className="
                    rounded-full
                    bg-emerald-500/10
                    px-2
                    py-1
                    text-[9px]
                    font-medium
                    text-emerald-400
                  "
                >
                  {diversificationScore >= 70
                    ? "Good"
                    : diversificationScore >= 40
                    ? "Moderate"
                    : "High Risk"}
                </span>

              </div>


              <div
                className="
                  mt-5
                  flex
                  items-center
                  gap-5
                "
              >

                {/* Score circle */}

                <div
                  className="
                    relative
                    flex
                    h-24
                    w-24
                    shrink-0
                    items-center
                    justify-center
                    rounded-full
                    bg-[conic-gradient(from_0deg,#06b6d4,#2563eb,#7c3aed,#06b6d4)]
                  "
                >

                  <div
                    className="
                      flex
                      h-[72px]
                      w-[72px]
                      items-center
                      justify-center
                      rounded-full
                      bg-[#03091b]
                    "
                  >

                    <span
                      className="
                        text-xs
                        font-semibold
                        text-white
                      "
                    >
                      {Math.round(
                        diversificationScore /
                        10
                      )}
                      /10
                    </span>

                  </div>

                </div>


                {/* Risk details */}

                <div className="flex-1">

                  <p
                    className="
                      text-[9px]
                      text-slate-500
                    "
                  >
                    Sector Concentration
                  </p>

                  <div
                    className="
                      mt-2
                      h-1
                      overflow-hidden
                      rounded-full
                      bg-slate-800
                    "
                  >

                    <div
                      className="
                        h-full
                        rounded-full
                        bg-gradient-to-r
                        from-blue-500
                        to-purple-500
                      "
                      style={{
                        width: `${
                          Math.min(
                            largestHolding?.percentage ||
                              0,
                            100
                          )
                        }%`,
                      }}
                    />

                  </div>


                  <div
                    className="
                      mt-3
                      flex
                      justify-between
                    "
                  >

                    <span
                      className="
                        text-[9px]
                        text-slate-500
                      "
                    >
                      Top Holding
                    </span>

                    <span
                      className="
                        text-[9px]
                        text-slate-300
                      "
                    >
                      {largestHolding
                        ? `${largestHolding.percentage.toFixed(1)}%`
                        : "0%"}
                    </span>

                  </div>


                  <p
                    className="
                      mt-3
                      text-[9px]
                      leading-4
                      text-slate-500
                    "
                  >
                    {holdings.length > 1
                      ? "Your portfolio is diversified across multiple holdings."
                      : "Add more holdings to improve portfolio diversification."}
                  </p>

                </div>

              </div>

            </section>


            {/* =================================
                ALLOCATION CARD
                ================================= */}

            <section
              className="
                rounded-lg
                border
                border-blue-900/50
                bg-[#03091b]/80
                p-4
              "
            >

              <div
                className="
                  flex
                  items-center
                  justify-between
                "
              >

                <div
                  className="
                    flex
                    items-center
                    gap-2
                  "
                >

                  <div
                    className="
                      text-blue-400
                    "
                  >

                    <svg
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                    >

                      <path
                        d="M12 3a9 9 0 109 9h-9z"
                      />

                      <path
                        d="M12 3v9h9"
                      />

                    </svg>

                  </div>

                  <h3
                    className="
                      text-xs
                      font-semibold
                    "
                  >
                    Portfolio Allocation
                  </h3>

                </div>


                <span
                  className="
                    text-[9px]
                    text-blue-400
                  "
                >
                  View All →
                </span>

              </div>


              <div
                className="
                  mt-5
                  flex
                  items-center
                  gap-5
                "
              >

                {/* Donut */}

                <div
                  className="
                    relative
                    flex
                    h-28
                    w-28
                    shrink-0
                    items-center
                    justify-center
                    rounded-full
                    bg-[conic-gradient(#2563eb_0_25%,#06b6d4_25%_48%,#fbbf24_48%_65%,#ec4899_65%_82%,#6366f1_82%_100%)]
                  "
                >

                  <div
                    className="
                      flex
                      h-[78px]
                      w-[78px]
                      flex-col
                      items-center
                      justify-center
                      rounded-full
                      bg-[#03091b]
                    "
                  >

                    <span
                      className="
                        text-xs
                        font-semibold
                        text-white
                      "
                    >
                      {formatCurrency(
                        totalValue
                      )}
                    </span>

                    <span
                      className="
                        text-[8px]
                        text-slate-500
                      "
                    >
                      Total Value
                    </span>

                  </div>

                </div>


                {/* Allocation list */}

                <div
                  className="
                    min-w-0
                    flex-1
                    space-y-2
                  "
                >

                  {allocationData
                    .slice(0, 5)
                    .map(
                      (
                        item,
                        index
                      ) => (

                        <div
                          key={
                            item.ticker
                          }
                          className="
                            flex
                            items-center
                            justify-between
                            gap-2
                          "
                        >

                          <div
                            className="
                              flex
                              min-w-0
                              items-center
                              gap-2
                            "
                          >

                            <span
                              className={`
                                h-2
                                w-2
                                shrink-0
                                rounded-full
                                ${
                                  index === 0
                                    ? "bg-blue-500"
                                    : index === 1
                                    ? "bg-cyan-400"
                                    : index === 2
                                    ? "bg-yellow-400"
                                    : index === 3
                                    ? "bg-pink-500"
                                    : "bg-indigo-400"
                                }
                              `}
                            />

                            <span
                              className="
                                truncate
                                text-[9px]
                                text-slate-400
                              "
                            >
                              {item.ticker}
                            </span>

                          </div>


                          <span
                            className="
                              text-[9px]
                              text-slate-300
                            "
                          >
                            {item.percentage.toFixed(
                              1
                            )}
                            %
                          </span>

                        </div>

                      )
                    )}

                </div>

              </div>

            </section>


            {/* =================================
                PORTFOLIO SUMMARY
                ================================= */}

            <section
              className="
                rounded-lg
                border
                border-blue-900/50
                bg-[#03091b]/80
                p-4
              "
            >

              <div
                className="
                  grid
                  grid-cols-2
                  gap-3
                "
              >

                <div>

                  <p
                    className="
                      text-[9px]
                      text-slate-500
                    "
                  >
                    Portfolio Value
                  </p>

                  <p
                    className="
                      mt-1
                      text-sm
                      font-semibold
                    "
                  >
                    {formatCurrency(
                      totalValue
                    )}
                  </p>

                </div>


                <div>

                  <p
                    className="
                      text-[9px]
                      text-slate-500
                    "
                  >
                    Total Invested
                  </p>

                  <p
                    className="
                      mt-1
                      text-sm
                      font-semibold
                    "
                  >
                    {formatCurrency(
                      totalInvested
                    )}
                  </p>

                </div>


                <div>

                  <p
                    className="
                      text-[9px]
                      text-slate-500
                    "
                  >
                    Total P/L
                  </p>

                  <p
                    className={`
                      mt-1
                      text-sm
                      font-semibold
                      ${
                        totalProfit >= 0
                          ? "text-emerald-400"
                          : "text-red-400"
                      }
                    `}
                  >
                    {totalProfit >= 0
                      ? "+"
                      : ""}
                    {formatCurrency(
                      totalProfit
                    )}
                  </p>

                </div>


                <div>

                  <p
                    className="
                      text-[9px]
                      text-slate-500
                    "
                  >
                    Return
                  </p>

                  <p
                    className={`
                      mt-1
                      text-sm
                      font-semibold
                      ${
                        totalReturn >= 0
                          ? "text-emerald-400"
                          : "text-red-400"
                      }
                    `}
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

            </section>

          </div>

        </div>


        {/* ===================================
            EXCHANGE RATE
            =================================== */}

        <div
          className="
            mt-4
            flex
            justify-end
            text-[9px]
            text-slate-600
          "
        >
          USD → INR: ₹
          {exchangeRate.toFixed(2)}
        </div>

      </main>

    </div>

  );

}


export default Portfolio;