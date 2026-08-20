import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    strictPort: true,
    proxy: {
      "/v1": { target: "http://localhost:8889", agent: false },
      "/user": { target: "http://localhost:8889", agent: false },
      "/api": { target: "http://localhost:8889", agent: false },
    },
  },
  build: {
    chunkSizeWarningLimit: 1200,
  },
});
