import { NavLink, useNavigate } from "react-router-dom";
import { logout } from "../utils/auth";


function Navbar() {

  const navigate = useNavigate();


  const handleLogout = () => {

    logout();

    navigate("/login");

  };


  const navLinkClass = ({ isActive }) =>
    `text-sm transition ${
      isActive
        ? "text-white"
        : "text-slate-400 hover:text-white"
    }`;


  return (

    <nav className="border-b border-slate-800 bg-[#020617]">

      <div className="mx-auto flex max-w-7xl items-center justify-between px-8 py-4">

        {/* -------------------------------- */}
        {/* Logo */}
        {/* -------------------------------- */}

        <NavLink
          to="/"
          className="flex items-center gap-3"
        >

          {/* V Logo */}

          <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-blue-500/40 bg-blue-500/10">

            <span className="text-sm font-bold text-blue-400">
              V
            </span>

          </div>


          <span className="text-lg font-semibold tracking-tight text-white">
            Velora
          </span>

        </NavLink>


        {/* -------------------------------- */}
        {/* Navigation */}
        {/* -------------------------------- */}

        <div className="flex items-center gap-7">

          <NavLink
            to="/"
            className={navLinkClass}
          >
            Home
          </NavLink>


          <NavLink
            to="/portfolio"
            className={navLinkClass}
          >
            Portfolio
          </NavLink>


          <NavLink
            to="/forecast"
            className={navLinkClass}
          >
            Forecast
          </NavLink>


          <NavLink
            to="/news"
            className={navLinkClass}
          >
            News
          </NavLink>


          {/* Alerts — coming next */}

          <NavLink
            to="/alerts"
            className={navLinkClass}
          >
            <span className="flex items-center gap-2">

              Alerts

              <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-blue-500 px-1 text-[9px] font-semibold text-white">
                0
              </span>

            </span>
          </NavLink>


          {/* Velora AI — coming later */}

          <span className="cursor-not-allowed text-sm text-slate-600">
            VeloraAI
          </span>


          {/* -------------------------------- */}
          {/* Logout */}
          {/* -------------------------------- */}

          <button
            onClick={handleLogout}
            className="rounded-lg border border-slate-700 px-4 py-2 text-sm text-slate-300 transition hover:border-slate-500 hover:bg-slate-900 hover:text-white"
          >
            Logout
          </button>

        </div>

      </div>

    </nav>

  );
}


export default Navbar;