/** @format */

import { defineConfig, loadEnv } from "vite";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "VITE_");

  return {
    base: "/",
    server: {
      port: 5173,
      // Redirige /api al backend: funciona desde la PC y desde el teléfono (vite --host)
      allowedHosts: true,
      proxy: {
        "/api": {
          target: env.VITE_PROXY_TARGET || "http://localhost:3000",
          changeOrigin: true,
          secure: false,
        },
      },
    },
    preview: {
      port: 5173,
      host: true,
      proxy: {
        "/api": {
          target: env.VITE_PROXY_TARGET || "http://localhost:3000",
          changeOrigin: true,
          secure: false,
        },
      },
    },
    plugins: [
      react(),
      tailwindcss(),
      VitePWA({
        registerType: "autoUpdate",
        injectRegister: "auto",
        includeAssets: [
          "favicon.png",
          "logo.png",
          "logo-muelita.png",
          "icons/icon-192x192.png",
          "icons/icon-512x512.png",
          "icons/apple-touch-icon.png",
        ],
        manifest: {
          /* id: "/", */
          name: "Consultorio Odontológico M&V",
          short_name: "M&V Turnos",
          description:
            "Sistema de gestión odontológica, turnos, pacientes y caja para el Consultorio M&V.",
          start_url: "/",
          scope: "/",
          display: "standalone",
          orientation: "portrait-primary",
          background_color: "#ffffff",
          theme_color: "#2eb086",
          icons: [
            {
              src: "/icons/icon-192x192.png",
              sizes: "192x192",
              type: "image/png",
              purpose: "any",
            },
            {
              src: "/icons/icon-512x512.png",
              sizes: "512x512",
              type: "image/png",
              purpose: "maskable",
            },
          ],
        },
        workbox: {
          globPatterns: ["**/*.{js,css,html,ico,png,svg,woff2}"],
          navigateFallback: "/index.html",
          navigateFallbackDenylist: [/^\/api/],
          cleanupOutdatedCaches: true,
          clientsClaim: true,
          skipWaiting: true,
          runtimeCaching: [
            {
              // APIs del backend: NetworkFirst
              urlPattern: ({ url }) => url.pathname.startsWith("/api/"),
              handler: "NetworkFirst",
              options: {
                cacheName: "api-cache",
                networkTimeoutSeconds: 5,
                expiration: {
                  maxEntries: 50,
                  maxAgeSeconds: 60 * 60 * 24, // 24 horas
                },
                cacheableResponse: {
                  statuses: [0, 200],
                },
              },
            },
            {
              // Imágenes y fuentes: StaleWhileRevalidate
              urlPattern: ({ request }) =>
                request.destination === "image" ||
                request.destination === "font",
              handler: "StaleWhileRevalidate",
              options: {
                cacheName: "static-assets-cache",
                expiration: {
                  maxEntries: 60,
                  maxAgeSeconds: 30 * 24 * 60 * 60, // 30 días
                },
              },
            },
          ],
        },
        devOptions: {
          enabled: false,
        },
      }),
    ],
    optimizeDeps: {
      exclude: [
        "@fullcalendar/react",
        "@fullcalendar/core",
        "@fullcalendar/daygrid",
        "@fullcalendar/timegrid",
        "@fullcalendar/interaction",
      ],
    },
  };
});
