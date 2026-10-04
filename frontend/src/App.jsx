// App.jsx

import { Routes, Route } from "react-router-dom";

// Pages
import Dashboard from "./pages/Dashboard";
import Register from "./pages/Register";
import Login from "./pages/Login";
import Portfolio from "./pages/Portfolio";

// Protects pages that require login
import ProtectedRoute from "./components/ProtectedRoute";


function App() {

  return (
    <Routes>

      {/* ========================= */}
      {/* PUBLIC ROUTES */}
      {/* ========================= */}

      {/* Registration page */}
      <Route
        path="/register"
        element={<Register />}
      />

      {/* Login page */}
      <Route
        path="/login"
        element={<Login />}
      />


      {/* ========================= */}
      {/* PROTECTED ROUTES */}
      {/* ========================= */}

      {/* Dashboard */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />

      {/* Portfolio */}
      <Route
        path="/portfolio"
        element={
          <ProtectedRoute>
            <Portfolio />
          </ProtectedRoute>
        }
      />


      {/* ========================= */}
      {/* FUTURE ROUTES */}
      {/* ========================= */}

      {/*
        We will add these pages later
        as we progress through Velora:

        /forecast
        /news
        /alerts
        /velora-ai
        /settings
      */}


    </Routes>
  );
}


export default App;