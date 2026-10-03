import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";

import App from "./App";
import "./index.css";


createRoot(document.getElementById("root")).render(
  <StrictMode>
    {/* 
      BrowserRouter allows React to handle different URLs
      such as /register, /login and /dashboard.
    */}
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>
);