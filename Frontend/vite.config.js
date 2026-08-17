import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      "/api": {
        target: "http://backend:5000",
        changeOrigin: true,
      },
    },
    port: 5174,
    hmr: {
      overlay: false,
    },
  },
  esbuild: {
    jsx: "automatic",
  },
});
