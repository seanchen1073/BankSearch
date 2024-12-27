import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: "dist",
    sourcemap: false,
    rollupOptions: {
      input: "index.html",
    },
    define: {
      "import.meta.env.VITE_GOOGLE_MAPS_API_KEY": JSON.stringify(process.env.VITE_GOOGLE_MAPS_API_KEY),
    },
  },

  server: {
    historyApiFallback: true,
    proxy: {
      "/api": {
        target: "http://localhost:8000",
        changeOrigin: true,
        secure: false,
      },
    },
  },
});
