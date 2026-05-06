import React from "react";
import ReactDOM from "react-dom/client";
import { LanguageProvider } from "./hooks/useLanguage";
import { AuthProvider } from "./hooks/useAuth";
import App from "./App";
import PasswordGate from "./components/PasswordGate";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <PasswordGate>
      <AuthProvider>
        <LanguageProvider>
          <App />
        </LanguageProvider>
      </AuthProvider>
    </PasswordGate>
  </React.StrictMode>
);
