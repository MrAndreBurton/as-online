import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import App from "./App";
import "./index.css";

import { AuthProvider } from "./contexts/AuthContext";
import "./portal.css";

import "./styles/recurringCalendar.css";


ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <HelmetProvider>
      <BrowserRouter>
        <AuthProvider>
         <App />
         </AuthProvider>
        </BrowserRouter>
      </HelmetProvider>
    </React.StrictMode>
  );

