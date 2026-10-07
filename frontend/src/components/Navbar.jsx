// Navbar.jsx

import { Link, useLocation, useNavigate } from "react-router-dom";
import { logout } from "../utils/auth";


function Navbar() {

  const location = useLocation();
  const navigate = useNavigate();


  // ==========================================
  // LOGOUT
  // ==========================================

  const handleLogout = () => {

    logout();

    navigate("/login");

  };


  // ==========================================
  // NAVIGATION ITEMS
  // ==========================================

  const navItems = [

    {
      label: "Home",
      path: "/portfolio",
      available: true,
    },

    {
      label: "Dashboard",
      path: "/",
      available: true,
    },

    {
      label: "Forecast",
      path: "/forecast",
      available: true,
    },

    {
      label: "News",
      path: "/news",
      available: false,
    },

    {
      label: "Alerts",
      path: "/alerts",
      available: false,
      badge: 1,
    },

    {
      label: "VeloraAI",
      path: "/velora-ai",
      available: false,
    },

  ];


  return (

    <nav
      className="
        sticky
        top-0
        z-50
        h-[58px]
        border-b
        border-indigo-900/30
        bg-[#020617]/95
        backdrop-blur-xl
      "
    >

      <div
        className="
          mx-auto
          flex
          h-full
          max-w-[1500px]
          items-center
          justify-between
          px-5
          lg:px-8
        "
      >


        {/* =====================================
            LOGO
            ===================================== */}

        <Link
          to="/portfolio"
          className="
            flex
            shrink-0
            items-center
            gap-3
          "
        >

          {/* V LOGO */}

          <div
            className="
              h-8
              w-9
            "
          >

            <svg
              viewBox="0 0 100 90"
              className="h-full w-full"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >

              <defs>

                <linearGradient
                  id="navbarVeloraGradient"
                  x1="20"
                  y1="5"
                  x2="75"
                  y2="85"
                  gradientUnits="userSpaceOnUse"
                >

                  <stop
                    offset="0%"
                    stopColor="#3B82F6"
                  />

                  <stop
                    offset="48%"
                    stopColor="#6366F1"
                  />

                  <stop
                    offset="100%"
                    stopColor="#A855F7"
                  />

                </linearGradient>

              </defs>


              <path
                d="
                  M 5 5
                  L 28 5
                  L 50 43
                  L 72 5
                  L 95 5
                  L 61 70
                  Q 50 88 39 70
                  Z
                "
                fill="url(#navbarVeloraGradient)"
              />

            </svg>

          </div>


          {/* WORDMARK */}

          <span
            className="
              hidden
              text-[14px]
              font-medium
              tracking-[0.38em]
              text-slate-200
              sm:block
            "
          >
            VELORA
          </span>

        </Link>


        {/* =====================================
            NAVIGATION
            ===================================== */}

        <div
          className="
            hidden
            items-center
            gap-1
            md:flex
          "
        >

          {navItems.map((item) => {

            const isActive =
              location.pathname === item.path;


            // Future pages are visually present
            // but not clickable until implemented.

            if (!item.available) {

              return (

                <div
                  key={item.label}
                  className="
                    relative
                    flex
                    cursor-default
                    items-center
                    gap-2
                    px-4
                    py-2
                    text-[11px]
                    text-slate-500
                  "
                >

                  {item.label}


                  {item.badge && (

                    <span
                      className="
                        flex
                        h-4
                        min-w-4
                        items-center
                        justify-center
                        rounded-full
                        bg-red-500
                        px-1
                        text-[9px]
                        font-semibold
                        text-white
                      "
                    >
                      {item.badge}
                    </span>

                  )}

                </div>

              );

            }


            return (

              <Link
                key={item.label}
                to={item.path}
                className={`
                  rounded-full
                  px-4
                  py-2
                  text-[11px]
                  font-medium
                  transition
                  ${
                    isActive
                      ? "bg-gradient-to-r from-blue-600/80 to-indigo-600/80 text-white shadow-[0_0_20px_rgba(59,130,246,0.2)]"
                      : "text-slate-400 hover:bg-indigo-950/40 hover:text-slate-200"
                  }
                `}
              >
                {item.label}
              </Link>

            );

          })}

        </div>


        {/* =====================================
            LOGOUT
            ===================================== */}

        <button
          onClick={handleLogout}
          className="
            flex
            items-center
            gap-2
            rounded-full
            border
            border-indigo-700/50
            bg-indigo-950/20
            px-4
            py-2
            text-[11px]
            font-medium
            text-slate-300
            transition
            hover:border-indigo-500/70
            hover:bg-indigo-900/30
            hover:text-white
          "
        >

          {/* Logout icon */}

          <svg
            width="15"
            height="15"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
          >

            <path
              d="M10 17l5-5-5-5"
            />

            <path
              d="M15 12H3"
            />

            <path
              d="M21 19V5a2 2 0 00-2-2h-5"
            />

          </svg>

          Logout

        </button>

      </div>

    </nav>

  );

}


export default Navbar;