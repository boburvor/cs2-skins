import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Dev rejimda /api va /uploads so'rovlari backend (5432) ga yo'naltiriladi
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      "/api": "http://localhost:5432",
      "/uploads": "http://localhost:5432",
    },
  },
});
