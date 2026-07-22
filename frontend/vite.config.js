import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    host: true, // écoute sur le réseau local → accessible depuis d'autres PC (ex : le portable de Hassan)
    proxy: {
      "/api": "http://localhost:4000",
    },
  },
});
