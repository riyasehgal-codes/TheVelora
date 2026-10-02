// Import Vite's configuration helper.
import { defineConfig } from "vite";

// Allows Vite to work with React.
import react from "@vitejs/plugin-react";

// Tailwind CSS integration for Vite.
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [
    // React plugin.
    react(),

    // Tailwind CSS plugin.
    tailwindcss(),
  ],
});