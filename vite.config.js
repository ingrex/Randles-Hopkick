import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
 
export default defineConfig({
  plugins: [react(), tailwindcss()],
 
  server: {
    proxy: {
      // Any request to /api/** gets forwarded to the backend
      "/api": {
        target: "https://randnhop.onrender.com",
        changeOrigin: true,   // rewrites the Host header → fixes CORS
        secure: true,         // backend is HTTPS
        // No rewrite needed — paths already start with /api/v1/...
      },
    },
  },
});
 