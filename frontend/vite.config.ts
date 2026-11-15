import { fileURLToPath, URL } from "node:url";

import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

const API_PROXY_TARGET = process.env.API_PROXY_TARGET ?? "http://localhost:8000";
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
      // El backend aún no existe; cuando esté listo, todas las peticiones de
      // `/api/*` se reenvían aquí sin exponer CORS en desarrollo.
      "/api": {
        target: API_PROXY_TARGET,
        changeOrigin: true,
      },
    },
  },
  preview: {
    port: PORT,
  },
});
