// Login.jsx

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/client";


function Login() {

  // Stores whatever the user types into the form.
  const [formData, setFormData] = useState({
    username: "",
    password: "",
  });

  // Stores an error message if login fails.
  const [error, setError] = useState("");

  // Lets us move the user to another page after login.
  const navigate = useNavigate();


  // Runs whenever the user types in an input.
  const handleChange = (event) => {
    setFormData({
      ...formData,
      [event.target.name]: event.target.value,
    });
  };


  // Runs when the login form is submitted.
  const handleSubmit = async (event) => {
    event.preventDefault();

    // Remove any previous error.
    setError("");

    try {

      // Send username + password to Django.
      const response = await api.post("/login/", formData);

      /*
        Django returns two JWT tokens:

        access  → used for authenticated API requests
        refresh → used to get a new access token later
      */

      localStorage.setItem(
        "accessToken",
        response.data.access
      );

      localStorage.setItem(
        "refreshToken",
        response.data.refresh
      );

      // Login successful → go to dashboard.
      navigate("/");

    } catch (err) {

      // Show a simple error message if credentials are incorrect.
      setError(
        "Invalid username or password."
      );
    }
  };


  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100">

      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow">

        <h1 className="text-3xl font-bold">
          Welcome back
        </h1>

        <p className="mt-2 text-gray-500">
          Login to your Velora account.
        </p>


        {/* Display error only when login fails */}
        {error && (
          <p className="mt-4 rounded-lg bg-red-100 p-3 text-sm text-red-600">
            {error}
          </p>
        )}


        <form
          onSubmit={handleSubmit}
          className="mt-6 space-y-4"
        >

          {/* Username */}
          <input
            type="text"
            name="username"
            placeholder="Username"
            value={formData.username}
            onChange={handleChange}
            className="w-full rounded-lg border p-3 outline-none focus:ring-2"
            required
          />


          {/* Password */}
          <input
            type="password"
            name="password"
            placeholder="Password"
            value={formData.password}
            onChange={handleChange}
            className="w-full rounded-lg border p-3 outline-none focus:ring-2"
            required
          />


          {/* Login button */}
          <button
            type="submit"
            className="w-full rounded-lg bg-black p-3 font-medium text-white hover:bg-gray-800"
          >
            Login
          </button>

        </form>

      </div>

    </div>
  );
}


export default Login;