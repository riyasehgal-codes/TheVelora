// Navbar.jsx

import { useNavigate } from "react-router-dom";
import { logout } from "../utils/auth";


function Navbar() {

  // Allows us to redirect after logout.
  const navigate = useNavigate();


  const handleLogout = () => {

    // Remove JWT tokens.
    logout();

    // Send the user back to login.
    navigate("/login");
  };


  return (
    <nav className="flex items-center justify-between border-b bg-white px-8 py-4">

      {/* Velora logo/name */}

      <h1 className="text-2xl font-bold">
        Velora
      </h1>


      {/* Navigation links */}

      <div className="flex items-center gap-6">

        <a
          href="/"
          className="text-gray-600 hover:text-black"
        >
          Dashboard
        </a>

        <a
          href="/portfolio"
          className="text-gray-600 hover:text-black"
        >
          Portfolio
        </a>

        <a
          href="/forecast"
          className="text-gray-600 hover:text-black"
        >
          Forecast
        </a>


        {/* Logout */}

        <button
          onClick={handleLogout}
          className="rounded-lg border px-4 py-2 hover:bg-gray-100"
        >
          Logout
        </button>

      </div>

    </nav>
  );
}


export default Navbar;