import { fileURLToPath, URL } from "node:url";

import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

// Servidor Flask de la estación de telemetría (backend/servidor).
const API_PROXY_TARGET = process.env.API_PROXY_TARGET ?? "http://localhost:5000";
const PORT = Number(process.env.PORT) || 5173;

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  server: {
    port: PORT,
    proxy: {
      // `/api/*` → servidor Flask (evita CORS en desarrollo):
      //   /api/clima → /clima   (telemetría de la estación ESP32)
      //   /api/datos → /datos   (lecturas BLE)
      "/api": {
        target: API_PROXY_TARGET,
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ""),
      },
    },
  },
  preview: {
    port: PORT,
  },
});
