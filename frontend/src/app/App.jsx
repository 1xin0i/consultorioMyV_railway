/** @format */

import { useEffect } from "react";
import { BrowserRouter as Router } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { AppProviders } from "./providers/AppProviders";
import { AppRouter } from "./router";
import { ReloadPrompt } from "@/shared/components/pwa/ReloadPrompt";

export function App() {
  // Retira el splash inyectado en index.html una vez que React monta
  useEffect(() => {
    const initialSplash =
      document.getElementById("splash-screen") ||
      document.getElementById("initial-splash");
    if (!initialSplash) return;

    const timer = setTimeout(() => {
      initialSplash.classList.add("oculto");
      initialSplash.classList.add("fade-out");
      setTimeout(() => {
        initialSplash.remove();
      }, 450);
    }, 200);

    return () => clearTimeout(timer);
  }, []);

  return (
    <AppProviders>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3500,
          style: {
            borderRadius: "14px",
            background: "#ffffff",
            color: "#1e293b",
            fontSize: "13px",
            fontWeight: 600,
            boxShadow:
              "0 10px 25px -5px rgba(15, 23, 42, 0.12), 0 8px 10px -6px rgba(15, 23, 42, 0.08)",
            border: "1px solid #e2e8f0",
            padding: "12px 16px",
          },
          success: {
            iconTheme: {
              primary: "#10b981",
              secondary: "#ffffff",
            },
          },
          error: {
            iconTheme: {
              primary: "#ef4444",
              secondary: "#ffffff",
            },
          },
        }}
      />
      <ReloadPrompt />
      <Router>
        <AppRouter />
      </Router>
    </AppProviders>
  );
}

export default App;

