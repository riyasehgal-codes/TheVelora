import { NavLink, useNavigate } from "react-router-dom";
import { logout } from "../utils/auth";

function Navbar() {
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const links = [
    { label: "Home", to: "/", end: true },
    { label: "Portfolio", to: "/portfolio" },
    { label: "Forecast", to: "/forecast" },
    { label: "News", to: "/news" },
    { label: "Alerts", to: "/alerts" },
    { label: "VeloraAI", to: "/ai-chat" },
  ];

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-blue-950/80 bg-[#030817]/95 backdrop-blur-xl">
      <div className="mx-auto flex min-h-[66px] max-w-[1500px] flex-wrap items-center justify-between gap-x-6 gap-y-3 px-4 py-3 sm:px-6 lg:px-8">
        {/* Brand */}
        <NavLink
          to="/"
          className="group flex shrink-0 items-center gap-3"
          aria-label="Velora home"
        >
          <span className="relative flex h-8 w-8 items-center justify-center">
            <span className="absolute left-[3px] top-[2px] h-[25px] w-[10px] skew-x-[27deg] rounded-[2px] bg-gradient-to-b from-cyan-400 to-blue-600 transition group-hover:brightness-125" />
            <span className="absolute right-[3px] top-[2px] h-[25px] w-[10px] -skew-x-[27deg] rounded-[2px] bg-gradient-to-b from-blue-600 to-fuchsia-500 transition group-hover:brightness-125" />
          </span>
          <span className="text-[15px] font-semibold tracking-[0.34em] text-slate-200 transition group-hover:text-white">
            VELORA
          </span>
        </NavLink>

        {/* Navigation */}
        <div className="flex flex-1 flex-wrap items-center justify-center gap-1 sm:gap-2 lg:gap-3">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.end}
              className={({ isActive }) =>
                `rounded-full px-3.5 py-2 text-[12px] font-medium tracking-wide transition-all duration-200 sm:px-4 ${
                  isActive
                    ? "border border-blue-500/40 bg-blue-600/20 text-blue-200 shadow-[0_0_18px_rgba(37,99,235,0.18)]"
                    : "border border-transparent text-slate-400 hover:border-slate-700/80 hover:bg-slate-900/70 hover:text-white"
                }`
              }
            >
              {link.label}
            </NavLink>
          ))}
        </div>

        {/* Logout */}
        <button
          type="button"
          onClick={handleLogout}
          className="group inline-flex shrink-0 items-center gap-2 rounded-full border border-slate-700/90 bg-slate-950/40 px-4 py-2 text-xs font-medium text-slate-300 transition-all duration-200 hover:border-blue-500/50 hover:bg-blue-500/10 hover:text-white"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            className="h-4 w-4 text-slate-400 transition group-hover:text-blue-300"
            aria-hidden="true"
          >
            <path
              d="M10 7V5.8A1.8 1.8 0 0 1 11.8 4h6.4A1.8 1.8 0 0 1 20 5.8v12.4a1.8 1.8 0 0 1-1.8 1.8h-6.4a1.8 1.8 0 0 1-1.8-1.8V17"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
            />
            <path
              d="M14 12H4m0 0 3.2-3.2M4 12l3.2 3.2"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <span>Logout</span>
        </button>
      </div>
    </nav>
  );
}

export default Navbar;