// Dashboard.jsx

// Import the Navbar component.
import Navbar from "../components/Navbar";

function Dashboard() {
  return (
    <div className="min-h-screen bg-gray-100">

      {/* Navigation bar */}
      <Navbar />

      {/* Main dashboard content */}
      <main className="p-8">

        <h1 className="text-3xl font-bold">
          Dashboard
        </h1>

        <p className="mt-2 text-gray-600">
          Welcome to your Velora portfolio dashboard.
        </p>

      </main>

    </div>
  );
}

export default Dashboard;