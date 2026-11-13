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
    const initialSplash = document.getElementById("initial-splash");
    if (!initialSplash) return;

    const timer = setTimeout(() => {
      initialSplash.classList.add("fade-out");
      setTimeout(() => {
        initialSplash.remove();
      }, 450);
    }, 350);

    return () => clearTimeout(timer);
  }, []);

  return (
    <AppProviders>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3500,
          style: {
            borderRadius: "12px",
            background: "#0d1f33",
            color: "#fff",
            fontSize: "14px",
            fontWeight: 500,
            boxShadow: "0 10px 25px -5px rgba(13, 31, 51, 0.25)",
          },
          success: {
            iconTheme: {
              primary: "#2eb086",
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

