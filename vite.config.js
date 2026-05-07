import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";


export default defineConfig({
  plugins: [react(), tailwindcss()],

  
  base: "/",

  
  server: {
    proxy: {
      "/api": {
        target: "https://randnhop.onrender.com",
        changeOrigin: true,
        secure: true
      }
    }
  },

 
  build: {
    outDir: "dist"
  }
});
