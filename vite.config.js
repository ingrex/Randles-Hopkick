import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],

  // 👇 IMPORTANT: fixes routing + deployment base path
  base: "/",

  // 👇 ONLY for local development (Vite dev server)
  server: {
    proxy: {
      "/api": {
        target: "https://randnhop.onrender.com",
        changeOrigin: true,
        secure: true
      }
    }
  },

  // 👇 ensures proper build output for Vercel
  build: {
    outDir: "dist"
  }
});
