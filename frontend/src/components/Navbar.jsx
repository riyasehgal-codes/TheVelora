
import { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { logout } from "../utils/auth";

function Navbar() {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = () => {
    setMenuOpen(false);
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

  const linkClass = ({ isActive }) =>
    `block rounded-xl px-4 py-3 text-sm font-medium tracking-wide transition-all duration-200 ${
      isActive
        ? "border border-blue-500/40 bg-blue-600/20 text-blue-200 shadow-[0_0_18px_rgba(37,99,235,0.15)]"
        : "border border-transparent text-slate-400 hover:border-slate-700/80 hover:bg-slate-900/70 hover:text-white"
    }`;

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-blue-950/80 bg-[#030817]/95 backdrop-blur-xl">
      <div className="mx-auto flex min-h-[66px] max-w-[1500px] items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">

        {/* Brand */}
        <NavLink
          to="/"
          onClick={() => setMenuOpen(false)}
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

        {/* Desktop Navigation */}
        <div className="hidden flex-1 items-center justify-center gap-1 lg:flex xl:gap-2">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.end}
              className={({ isActive }) =>
                `rounded-full px-3 py-2 text-xs font-medium tracking-wide transition-all duration-200 xl:px-4 ${
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

        {/* Desktop Logout */}
        <button
          type="button"
          onClick={handleLogout}
          className="hidden shrink-0 items-center gap-2 rounded-full border border-slate-700/90 bg-slate-950/40 px-4 py-2 text-xs font-medium text-slate-300 transition-all duration-200 hover:border-blue-500/50 hover:bg-blue-500/10 hover:text-white lg:inline-flex"
        >
          <LogoutIcon />
          Logout
        </button>

        {/* Mobile Menu Button */}
        <button
          type="button"
          onClick={() => setMenuOpen((prev) => !prev)}
          className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-700/80 bg-slate-900/70 text-slate-300 transition hover:border-blue-500/50 hover:bg-blue-500/10 hover:text-white lg:hidden"
          aria-label={menuOpen ? "Close navigation menu" : "Open navigation menu"}
          aria-expanded={menuOpen}
          aria-controls="mobile-navigation"
        >
          {menuOpen ? (
            <svg
              viewBox="0 0 24 24"
              fill="none"
              className="h-5 w-5"
              aria-hidden="true"
            >
              <path
                d="m6 6 12 12M18 6 6 18"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
              />
            </svg>
          ) : (
            <svg
              viewBox="0 0 24 24"
              fill="none"
              className="h-5 w-5"
              aria-hidden="true"
            >
              <path
                d="M4 7h16M4 12h16M4 17h16"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
              />
            </svg>
          )}
        </button>
      </div>

      {/* Mobile Dropdown */}
      <div
        id="mobile-navigation"
        className={`overflow-hidden border-t border-blue-950/70 bg-[#030817] transition-all duration-300 ease-in-out lg:hidden ${
          menuOpen
            ? "max-h-[500px] opacity-100"
            : "max-h-0 border-transparent opacity-0"
        }`}
      >
        <div className="space-y-2 px-4 py-4 sm:px-6">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.end}
              onClick={() => setMenuOpen(false)}
              className={linkClass}
            >
              {link.label}
            </NavLink>
          ))}

          <div className="border-t border-slate-800 pt-3">
            <button
              type="button"
              onClick={handleLogout}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-700/80 bg-slate-900/70 px-4 py-3 text-sm font-medium text-slate-300 transition hover:border-red-500/40 hover:bg-red-500/10 hover:text-red-300"
            >
              <LogoutIcon />
              Logout
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}

function LogoutIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className="h-4 w-4"
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
  );
}

export default Navbar;
