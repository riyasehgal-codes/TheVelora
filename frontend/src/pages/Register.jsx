// Register.jsx

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/client";


function Register() {
  // Stores the values entered into the form.
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
  });

  // Stores any error message from the backend.
  const [error, setError] = useState("");

  // Used to move the user to another page after registration.
  const navigate = useNavigate();


  // Runs whenever the user types into an input.
  const handleChange = (event) => {
    setFormData({
      ...formData,
      [event.target.name]: event.target.value,
    });
  };


  // Runs when the registration form is submitted.
  const handleSubmit = async (event) => {
    event.preventDefault();

    setError("");

    try {
      // Send the registration data to Django.
      await api.post("/register/", formData);

      // Registration succeeded.
      // Send the user to the login page.
      navigate("/login");

    } catch (err) {
      // Django sends validation errors in the response.
      setError(
        err.response?.data?.username?.[0] ||
        err.response?.data?.email?.[0] ||
        err.response?.data?.password?.[0] ||
        "Registration failed. Please try again."
      );
    }
  };


  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100">

      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow">

        <h1 className="text-3xl font-bold">
          Create your Velora account
        </h1>

        <p className="mt-2 text-gray-500">
          Start tracking your portfolio.
        </p>


        {/* Show an error if registration fails */}
        {error && (
          <p className="mt-4 rounded-lg bg-red-100 p-3 text-sm text-red-600">
            {error}
          </p>
        )}


        <form onSubmit={handleSubmit} className="mt-6 space-y-4">

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


          {/* Email */}
          <input
            type="email"
            name="email"
            placeholder="Email"
            value={formData.email}
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


          <button
            type="submit"
            className="w-full rounded-lg bg-black p-3 font-medium text-white hover:bg-gray-800"
          >
            Create Account
          </button>

        </form>

      </div>

    </div>
  );
}


export default Register;