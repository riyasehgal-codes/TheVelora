// Navbar.jsx
// Navigation bar used across Velora.

function Navbar() {
  return (
    <nav className="flex items-center justify-between border-b bg-white px-8 py-4">

      {/* Velora logo/name */}
      <h1 className="text-2xl font-bold">
        Velora
      </h1>

      {/* Navigation links */}
      <div className="flex gap-6">

        <a href="/" className="text-gray-600 hover:text-black">
          Dashboard
        </a>

        <a href="/" className="text-gray-600 hover:text-black">
          Portfolio
        </a>

        <a href="/" className="text-gray-600 hover:text-black">
          Forecast
        </a>

      </div>

    </nav>
  );
}

export default Navbar;