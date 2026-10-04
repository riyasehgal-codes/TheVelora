// Portfolio.jsx

import { useEffect, useState } from "react";

import api, {
  getMarketPrice,
  getExchangeRate,
} from "../api/client";

import Navbar from "../components/Navbar";


function Portfolio() {

  // ==========================================
  // STATE
  // ==========================================

  const [holdings, setHoldings] = useState([]);

  const [marketPrices, setMarketPrices] =
    useState({});

  const [marketCurrencies, setMarketCurrencies] =
    useState({});

  // USD -> INR exchange rate
  const [exchangeRate, setExchangeRate] =
    useState(1);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [formData, setFormData] = useState({
    ticker: "",
    quantity: "",
    average_price: "",
  });

  const [editingId, setEditingId] =
    useState(null);


  // ==========================================
  // FETCH HOLDINGS
  // ==========================================

  const fetchHoldings = async () => {

    try {

      const response = await api.get(
        "/holdings/"
      );

      setHoldings(response.data);

      await fetchMarketPrices(
        response.data
      );

    } catch (err) {

      console.error(err);

      setError(
        "Unable to load your portfolio."
      );

    } finally {

      setLoading(false);

    }
  };


  // ==========================================
  // FETCH MARKET PRICES
  // ==========================================

  const fetchMarketPrices = async (
    holdingsList
  ) => {

    const prices = {};
    const currencies = {};

    for (
      const holding of holdingsList
    ) {

      try {

        const data =
          await getMarketPrice(
            holding.ticker
          );

        prices[holding.ticker] =
          data.price;

        currencies[holding.ticker] =
          data.currency;

      } catch (err) {

        console.error(
          `Unable to fetch price for ${holding.ticker}:`,
          err
        );

      }

    }

    setMarketPrices(prices);

    setMarketCurrencies(
      currencies
    );

  };


  // ==========================================
  // FETCH USD -> INR EXCHANGE RATE
  // ==========================================

  const fetchExchangeRate = async () => {

    try {

      const data =
        await getExchangeRate(
          "USD",
          "INR"
        );

      setExchangeRate(
        Number(data.rate)
      );

    } catch (err) {

      console.error(
        "Unable to fetch exchange rate:",
        err
      );

    }

  };


  // ==========================================
  // INITIAL LOAD
  // ==========================================

  useEffect(() => {

    fetchHoldings();

    fetchExchangeRate();

  }, []);


  // ==========================================
  // FORM HANDLING
  // ==========================================

  const handleChange = (
    event
  ) => {

    setFormData({
      ...formData,

      [event.target.name]:
        event.target.value,
    });

  };


  // ==========================================
  // ADD / UPDATE HOLDING
  // ==========================================

  const handleSubmit = async (
    event
  ) => {

    event.preventDefault();

    setError("");

    try {

      if (editingId) {

        await api.patch(
          `/holdings/${editingId}/`,
          {
            ticker:
              formData.ticker.toUpperCase(),

            quantity:
              formData.quantity,

            average_price:
              formData.average_price,
          }
        );

      } else {

        await api.post(
          "/holdings/",
          {
            ticker:
              formData.ticker.toUpperCase(),

            quantity:
              formData.quantity,

            average_price:
              formData.average_price,
          }
        );

      }

      // Reset form
      setFormData({
        ticker: "",
        quantity: "",
        average_price: "",
      });

      setEditingId(null);

      // Refresh portfolio
      fetchHoldings();

    } catch (err) {

      console.error(err);

      setError(
        "Unable to save holding. Please check your details."
      );

    }

  };


  // ==========================================
  // EDIT HOLDING
  // ==========================================

  const handleEdit = (
    holding
  ) => {

    setEditingId(
      holding.id
    );

    setFormData({
      ticker:
        holding.ticker,

      quantity:
        holding.quantity,

      average_price:
        holding.average_price,
    });

  };


  // ==========================================
  // DELETE HOLDING
  // ==========================================

  const handleDelete = async (
    id
  ) => {

    const confirmed =
      window.confirm(
        "Are you sure you want to delete this holding?"
      );

    if (!confirmed) {
      return;
    }

    try {

      await api.delete(
        `/holdings/${id}/`
      );

      fetchHoldings();

    } catch (err) {

      console.error(err);

      setError(
        "Unable to delete this holding."
      );

    }

  };


  // ==========================================
  // CANCEL EDIT
  // ==========================================

  const handleCancelEdit = () => {

    setEditingId(null);

    setFormData({
      ticker: "",
      quantity: "",
      average_price: "",
    });

  };


  // ==========================================
  // CALCULATE INVESTED VALUE
  // ==========================================

  const calculateInvestedValue = (
    holding
  ) => {

    return (
      Number(holding.quantity) *
      Number(holding.average_price)
    );

  };


  // ==========================================
  // CALCULATE CURRENT VALUE
  // ==========================================

  const calculateCurrentValue = (
    holding
  ) => {

    const currentPrice =
      marketPrices[
        holding.ticker
      ];

    if (
      currentPrice === undefined
    ) {

      return null;

    }

    return (
      Number(holding.quantity) *
      Number(currentPrice)
    );

  };


  // ==========================================
  // CONVERT VALUE TO INR
  // ==========================================

  const convertToINR = (
    value,
    currency
  ) => {

    if (value === null) {
      return null;
    }

    // INR doesn't need conversion.
    if (currency === "INR") {

      return value;

    }

    // USD -> INR
    if (currency === "USD") {

      return (
        value *
        exchangeRate
      );

    }

    return value;

  };


  // ==========================================
  // GET INVESTED VALUE IN INR
  // ==========================================

  const calculateInvestedValueINR = (
    holding
  ) => {

    const investedValue =
      calculateInvestedValue(
        holding
      );

    const currency =
      marketCurrencies[
        holding.ticker
      ];

    return convertToINR(
      investedValue,
      currency
    );

  };


  // ==========================================
  // GET CURRENT VALUE IN INR
  // ==========================================

  const calculateCurrentValueINR = (
    holding
  ) => {

    const currentValue =
      calculateCurrentValue(
        holding
      );

    if (currentValue === null) {
      return null;
    }

    const currency =
      marketCurrencies[
        holding.ticker
      ];

    return convertToINR(
      currentValue,
      currency
    );

  };


  // ==========================================
  // PROFIT / LOSS
  // ==========================================

  const calculateProfitLoss = (
    holding
  ) => {

    const currentValue =
      calculateCurrentValue(
        holding
      );

    if (currentValue === null) {
      return null;
    }

    const investedValue =
      calculateInvestedValue(
        holding
      );

    return (
      currentValue -
      investedValue
    );

  };


  // ==========================================
  // PROFIT / LOSS %
  // ==========================================

  const calculateProfitLossPercentage = (
    holding
  ) => {

    const profitLoss =
      calculateProfitLoss(
        holding
      );

    const investedValue =
      calculateInvestedValue(
        holding
      );

    if (
      profitLoss === null ||
      investedValue === 0
    ) {

      return null;

    }

    return (
      (
        profitLoss /
        investedValue
      ) *
      100
    );

  };


  // ==========================================
  // PORTFOLIO TOTALS
  // ==========================================

  const totalInvested =
    holdings.reduce(
      (
        total,
        holding
      ) => {

        const value =
          calculateInvestedValueINR(
            holding
          );

        if (value === null) {
          return total;
        }

        return total + value;

      },
      0
    );


  const totalCurrentValue =
    holdings.reduce(
      (
        total,
        holding
      ) => {

        const value =
          calculateCurrentValueINR(
            holding
          );

        if (value === null) {
          return total;
        }

        return total + value;

      },
      0
    );


  const totalProfitLoss =
    totalCurrentValue -
    totalInvested;


  const totalReturnPercentage =
    totalInvested > 0
      ? (
          totalProfitLoss /
          totalInvested
        ) * 100
      : 0;


  // ==========================================
  // CURRENCY SYMBOL
  // ==========================================

  const getCurrencySymbol = (
    ticker
  ) => {

    const currency =
      marketCurrencies[
        ticker
      ];

    if (currency === "USD") {
      return "$";
    }

    if (currency === "INR") {
      return "₹";
    }

    return "";

  };


  // ==========================================
  // UI
  // ==========================================

  return (

    <div className="min-h-screen bg-gray-100">

      <Navbar />


      <main className="mx-auto max-w-6xl p-8">


        {/* =====================================
            PAGE HEADER
        ====================================== */}

        <h1 className="text-3xl font-bold">
          Portfolio
        </h1>

        <p className="mt-2 text-gray-600">
          Manage your current holdings.
        </p>


        {/* =====================================
            PORTFOLIO SUMMARY
        ====================================== */}

        <div className="mt-8 grid gap-4 md:grid-cols-4">


          {/* Total Invested */}

          <div className="rounded-2xl bg-white p-5 shadow">

            <p className="text-sm text-gray-500">
              Total Invested
            </p>

            <p className="mt-2 text-2xl font-bold">
              ₹
              {totalInvested.toFixed(2)}
            </p>

            <p className="mt-1 text-xs text-gray-400">
              Base currency: INR
            </p>

          </div>


          {/* Current Value */}

          <div className="rounded-2xl bg-white p-5 shadow">

            <p className="text-sm text-gray-500">
              Current Value
            </p>

            <p className="mt-2 text-2xl font-bold">
              ₹
              {totalCurrentValue.toFixed(2)}
            </p>

            <p className="mt-1 text-xs text-gray-400">
              Base currency: INR
            </p>

          </div>


          {/* Profit / Loss */}

          <div className="rounded-2xl bg-white p-5 shadow">

            <p className="text-sm text-gray-500">
              Total Profit / Loss
            </p>

            <p
              className={`mt-2 text-2xl font-bold ${
                totalProfitLoss >= 0
                  ? "text-green-600"
                  : "text-red-600"
              }`}
            >

              {totalProfitLoss >= 0
                ? "+"
                : "-"}

              ₹
              {Math.abs(
                totalProfitLoss
              ).toFixed(2)}

            </p>

          </div>


          {/* Return */}

          <div className="rounded-2xl bg-white p-5 shadow">

            <p className="text-sm text-gray-500">
              Total Return
            </p>

            <p
              className={`mt-2 text-2xl font-bold ${
                totalReturnPercentage >= 0
                  ? "text-green-600"
                  : "text-red-600"
              }`}
            >

              {totalReturnPercentage >= 0
                ? "+"
                : ""}

              {totalReturnPercentage.toFixed(
                2
              )}

              %

            </p>

          </div>

        </div>


        {/* =====================================
            EXCHANGE RATE INFORMATION
        ====================================== */}

        <div className="mt-4 rounded-xl bg-white p-4 shadow">

          <p className="text-sm text-gray-600">

            USD → INR exchange rate:

            <span className="ml-2 font-semibold">

              ₹
              {Number(
                exchangeRate
              ).toFixed(2)}

            </span>

          </p>

        </div>


        {/* =====================================
            ADD / EDIT HOLDING
        ====================================== */}

        <div className="mt-8 rounded-2xl bg-white p-6 shadow">

          <h2 className="text-xl font-semibold">

            {editingId
              ? "Edit Holding"
              : "Add Holding"}

          </h2>


          <form
            onSubmit={handleSubmit}
            className="mt-4 grid gap-4 md:grid-cols-4"
          >

            <input
              type="text"
              name="ticker"
              placeholder="Ticker (e.g. TCS)"
              value={
                formData.ticker
              }
              onChange={
                handleChange
              }
              className="rounded-lg border p-3 outline-none focus:ring-2"
              required
            />


            <input
              type="number"
              name="quantity"
              placeholder="Quantity"
              value={
                formData.quantity
              }
              onChange={
                handleChange
              }
              min="0"
              step="0.000001"
              className="rounded-lg border p-3 outline-none focus:ring-2"
              required
            />


            <input
              type="number"
              name="average_price"
              placeholder="Average Price"
              value={
                formData.average_price
              }
              onChange={
                handleChange
              }
              min="0"
              step="0.01"
              className="rounded-lg border p-3 outline-none focus:ring-2"
              required
            />


            <button
              type="submit"
              className="rounded-lg bg-black p-3 font-medium text-white hover:bg-gray-800"
            >

              {editingId
                ? "Update Holding"
                : "Add Holding"}

            </button>

          </form>


          {editingId && (

            <button
              onClick={
                handleCancelEdit
              }
              className="mt-3 rounded-lg border px-4 py-2 hover:bg-gray-100"
            >
              Cancel Edit
            </button>

          )}

        </div>


        {/* =====================================
            ERROR MESSAGE
        ====================================== */}

        {error && (

          <p className="mt-4 rounded-lg bg-red-100 p-4 text-red-600">

            {error}

          </p>

        )}


        {/* =====================================
            HOLDINGS
        ====================================== */}

        <div className="mt-8">

          <h2 className="text-xl font-semibold">
            Your Holdings
          </h2>


          {loading && (

            <p className="mt-4 text-gray-500">
              Loading holdings...
            </p>

          )}


          {!loading &&
            holdings.length === 0 && (

              <p className="mt-4 text-gray-500">
                You don't have any holdings yet.
              </p>

            )}


          <div className="mt-4 space-y-4">


            {holdings.map(
              (holding) => {

                const investedValue =
                  calculateInvestedValue(
                    holding
                  );

                const currentValue =
                  calculateCurrentValue(
                    holding
                  );

                const profitLoss =
                  calculateProfitLoss(
                    holding
                  );

                const profitLossPercentage =
                  calculateProfitLossPercentage(
                    holding
                  );

                const currencySymbol =
                  getCurrencySymbol(
                    holding.ticker
                  );


                return (

                  <div
                    key={
                      holding.id
                    }
                    className="rounded-xl bg-white p-6 shadow"
                  >


                    {/* Holding header */}

                    <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">


                      <div>

                        <h3 className="text-xl font-bold">
                          {holding.ticker}
                        </h3>


                        <p className="mt-1 text-gray-600">
                          Quantity:{" "}
                          {holding.quantity}
                        </p>


                        <p className="text-gray-600">

                          Average Price:{" "}

                          {currencySymbol}

                          {Number(
                            holding.average_price
                          ).toFixed(2)}

                        </p>


                        <p className="text-gray-600">

                          Current Price:{" "}

                          {marketPrices[
                            holding.ticker
                          ] !== undefined

                            ? `${currencySymbol}${Number(
                                marketPrices[
                                  holding.ticker
                                ]
                              ).toFixed(2)}`

                            : "Loading..."}

                        </p>

                      </div>


                      {/* Buttons */}

                      <div className="flex gap-3">

                        <button
                          onClick={() =>
                            handleEdit(
                              holding
                            )
                          }
                          className="rounded-lg border px-4 py-2 hover:bg-gray-100"
                        >
                          Edit
                        </button>


                        <button
                          onClick={() =>
                            handleDelete(
                              holding.id
                            )
                          }
                          className="rounded-lg bg-red-600 px-4 py-2 text-white hover:bg-red-700"
                        >
                          Delete
                        </button>

                      </div>

                    </div>


                    {/* Holding calculations */}

                    <div className="mt-6 grid gap-4 md:grid-cols-3">


                      {/* Invested */}

                      <div className="rounded-xl bg-gray-50 p-4">

                        <p className="text-sm text-gray-500">
                          Invested Value
                        </p>


                        <p className="mt-1 text-lg font-semibold">

                          {currencySymbol}

                          {investedValue.toFixed(
                            2
                          )}

                        </p>

                      </div>


                      {/* Current Value */}

                      <div className="rounded-xl bg-gray-50 p-4">

                        <p className="text-sm text-gray-500">
                          Current Value
                        </p>


                        <p className="mt-1 text-lg font-semibold">

                          {currentValue !== null

                            ? `${currencySymbol}${currentValue.toFixed(
                                2
                              )}`

                            : "Loading..."}

                        </p>

                      </div>


                      {/* Profit / Loss */}

                      <div className="rounded-xl bg-gray-50 p-4">

                        <p className="text-sm text-gray-500">
                          Profit / Loss
                        </p>


                        <p
                          className={`mt-1 text-lg font-semibold ${
                            profitLoss !== null &&
                            profitLoss >= 0
                              ? "text-green-600"
                              : "text-red-600"
                          }`}
                        >

                          {profitLoss !== null

                            ? `${
                                profitLoss >= 0
                                  ? "+"
                                  : "-"
                              }${currencySymbol}${Math.abs(
                                profitLoss
                              ).toFixed(2)}`

                            : "Loading..."}

                        </p>


                        {profitLossPercentage !== null && (

                          <p className="mt-1 text-sm text-gray-500">

                            {profitLossPercentage >= 0
                              ? "+"
                              : ""}

                            {profitLossPercentage.toFixed(
                              2
                            )}

                            %

                          </p>

                        )}

                      </div>

                    </div>

                  </div>

                );

              }
            )}

          </div>

        </div>

      </main>

    </div>

  );
}


export default Portfolio;