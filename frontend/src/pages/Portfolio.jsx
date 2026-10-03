// Portfolio.jsx

import { useEffect, useState } from "react";
import api from "../api/client";
import Navbar from "../components/Navbar";


function Portfolio() {

  // Stores all holdings belonging to the logged-in user.
  const [holdings, setHoldings] = useState([]);

  // Shows a loading message while fetching data.
  const [loading, setLoading] = useState(true);

  // Stores API error messages.
  const [error, setError] = useState("");

  /*
    Stores the values entered in the
    Add/Edit Holding form.
  */
  const [formData, setFormData] = useState({
    ticker: "",
    quantity: "",
    average_price: "",
  });

  /*
    Stores the ID of the holding currently
    being edited.

    null = we are adding a new holding.
  */
  const [editingId, setEditingId] = useState(null);


  /*
    Fetch all holdings belonging to the
    currently logged-in user.
  */
  const fetchHoldings = async () => {

    try {

      const response = await api.get("/holdings/");

      setHoldings(response.data);

    } catch (err) {

      setError("Unable to load your portfolio.");

    } finally {

      setLoading(false);

    }
  };


  /*
    Fetch holdings when the page first loads.
  */
  useEffect(() => {

    fetchHoldings();

  }, []);


  /*
    Update form values whenever the user
    types into an input.
  */
  const handleChange = (event) => {

    setFormData({
      ...formData,
      [event.target.name]: event.target.value,
    });

  };


  /*
    Create a new holding OR update an
    existing holding.
  */
  const handleSubmit = async (event) => {

    event.preventDefault();

    setError("");

    try {

      /*
        If editingId exists, update that holding.

        Otherwise, create a new holding.
      */
      if (editingId) {

        await api.patch(
          `/holdings/${editingId}/`,
          {
            ticker: formData.ticker.toUpperCase(),
            quantity: formData.quantity,
            average_price: formData.average_price,
          }
        );

      } else {

        await api.post("/holdings/", {
          ticker: formData.ticker.toUpperCase(),
          quantity: formData.quantity,
          average_price: formData.average_price,
        });

      }


      // Clear the form after saving.
      setFormData({
        ticker: "",
        quantity: "",
        average_price: "",
      });


      // Exit edit mode.
      setEditingId(null);


      // Get the latest data from Django.
      fetchHoldings();

    } catch (err) {

      setError(
        "Unable to save holding. Please check your details."
      );

    }
  };


  /*
    Put an existing holding's information
    into the form for editing.
  */
  const handleEdit = (holding) => {

    setEditingId(holding.id);

    setFormData({
      ticker: holding.ticker,
      quantity: holding.quantity,
      average_price: holding.average_price,
    });

  };


  /*
    Delete a holding.
  */
  const handleDelete = async (id) => {

    const confirmed = window.confirm(
      "Are you sure you want to delete this holding?"
    );

    // Stop if the user clicks Cancel.
    if (!confirmed) {
      return;
    }


    try {

      await api.delete(`/holdings/${id}/`);

      // Refresh the holdings list.
      fetchHoldings();

    } catch (err) {

      setError(
        "Unable to delete this holding."
      );

    }
  };


  /*
    Cancel editing and return to
    Add Holding mode.
  */
  const handleCancelEdit = () => {

    setEditingId(null);

    setFormData({
      ticker: "",
      quantity: "",
      average_price: "",
    });

  };


  return (
    <div className="min-h-screen bg-gray-100">
        {/* Navigation bar */}
        <Navbar />

      <main className="mx-auto max-w-6xl p-8">

        {/* ========================= */}
        {/* PAGE HEADER */}
        {/* ========================= */}

        <h1 className="text-3xl font-bold">
          Portfolio
        </h1>

        <p className="mt-2 text-gray-600">
          Manage your current holdings.
        </p>


        {/* ========================= */}
        {/* ADD / EDIT HOLDING FORM */}
        {/* ========================= */}

        <div className="mt-8 rounded-2xl bg-white p-6 shadow">

          <h2 className="text-xl font-semibold">
            {editingId ? "Edit Holding" : "Add Holding"}
          </h2>


          <form
            onSubmit={handleSubmit}
            className="mt-4 grid gap-4 md:grid-cols-4"
          >

            {/* Ticker */}

            <input
              type="text"
              name="ticker"
              placeholder="Ticker (e.g. TCS)"
              value={formData.ticker}
              onChange={handleChange}
              className="rounded-lg border p-3 outline-none focus:ring-2"
              required
            />


            {/* Quantity */}

            <input
              type="number"
              name="quantity"
              placeholder="Quantity"
              value={formData.quantity}
              onChange={handleChange}
              min="0"
              step="0.000001"
              className="rounded-lg border p-3 outline-none focus:ring-2"
              required
            />


            {/* Average price */}

            <input
              type="number"
              name="average_price"
              placeholder="Average Price"
              value={formData.average_price}
              onChange={handleChange}
              min="0"
              step="0.01"
              className="rounded-lg border p-3 outline-none focus:ring-2"
              required
            />


            {/* Submit button */}

            <button
              type="submit"
              className="rounded-lg bg-black p-3 font-medium text-white hover:bg-gray-800"
            >
              {editingId ? "Update Holding" : "Add Holding"}
            </button>

          </form>


          {/* Cancel button appears only while editing */}

          {editingId && (
            <button
              onClick={handleCancelEdit}
              className="mt-3 rounded-lg border px-4 py-2 hover:bg-gray-100"
            >
              Cancel Edit
            </button>
          )}

        </div>


        {/* ========================= */}
        {/* ERROR MESSAGE */}
        {/* ========================= */}

        {error && (
          <p className="mt-4 rounded-lg bg-red-100 p-4 text-red-600">
            {error}
          </p>
        )}


        {/* ========================= */}
        {/* HOLDINGS LIST */}
        {/* ========================= */}

        <div className="mt-8">

          <h2 className="text-xl font-semibold">
            Your Holdings
          </h2>


          {/* Loading */}

          {loading && (
            <p className="mt-4 text-gray-500">
              Loading holdings...
            </p>
          )}


          {/* Empty portfolio */}

          {!loading && holdings.length === 0 && (
            <p className="mt-4 text-gray-500">
              You don't have any holdings yet.
            </p>
          )}


          {/* Holdings */}

          <div className="mt-4 space-y-4">

            {holdings.map((holding) => (

              <div
                key={holding.id}
                className="flex flex-col justify-between gap-4 rounded-xl bg-white p-6 shadow md:flex-row md:items-center"
              >

                {/* Holding information */}

                <div>

                  <h3 className="text-xl font-bold">
                    {holding.ticker}
                  </h3>

                  <p className="mt-1 text-gray-600">
                    Quantity: {holding.quantity}
                  </p>

                  <p className="text-gray-600">
                    Average Price: ₹{holding.average_price}
                  </p>

                </div>


                {/* Edit + Delete buttons */}

                <div className="flex gap-3">

                  <button
                    onClick={() => handleEdit(holding)}
                    className="rounded-lg border px-4 py-2 hover:bg-gray-100"
                  >
                    Edit
                  </button>


                  <button
                    onClick={() => handleDelete(holding.id)}
                    className="rounded-lg bg-red-600 px-4 py-2 text-white hover:bg-red-700"
                  >
                    Delete
                  </button>

                </div>

              </div>

            ))}

          </div>

        </div>

      </main>

    </div>
  );
}


export default Portfolio;