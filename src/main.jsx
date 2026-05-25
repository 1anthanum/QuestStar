import React from "react";
import ReactDOM from "react-dom/client";
import { LanguageProvider } from "./hooks/useLanguage";
import { AuthProvider } from "./hooks/useAuth";
import App from "./App";
import PasswordGate from "./components/PasswordGate";
import ErrorBoundary from "./components/ErrorBoundary";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <ErrorBoundary name="Root">
      <PasswordGate>
        <AuthProvider>
          <LanguageProvider>
            <ErrorBoundary name="App">
              <App />
            </ErrorBoundary>
          </LanguageProvider>
        </AuthProvider>
      </PasswordGate>
    </ErrorBoundary>
  </React.StrictMode>
);

// ── PWA: register the service worker (production only, to avoid dev-cache staleness) ──
if (import.meta.env.PROD && "serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").catch(() => {
      /* SW registration failed — app still works online */
    });
  });
}
