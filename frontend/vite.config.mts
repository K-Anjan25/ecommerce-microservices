import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    strictPort: true,
    host: true,
    // Allow the hosted sandbox/preview domains (e.g. Arena e2b previews) in
    // addition to localhost. Harmless locally.
    allowedHosts: [".e2b.app", ".localhost", "localhost"],
    proxy: {
      "/v1": { target: "http://localhost:8889", agent: false },
      "/user": { target: "http://localhost:8889", agent: false },
      "/file": { target: "http://localhost:8889", agent: false },
      "/api": { target: "http://localhost:8889", agent: false },
    },
  },
  build: {
    chunkSizeWarningLimit: 1200,
  },
  // SSR: bundle all dependencies into the production server bundle. Several
  // (MUI v5) ship node-incompatible ESM with directory imports, so the
  // server must not resolve them from node_modules at runtime. In dev,
  // `ssrLoadModule` handles CJS/ESM interop itself and requires the default
  // externalization. The SPA build ignores this option.
  ssr: {
    noExternal: process.env.NODE_ENV === "production" ? true : [],
  },
});
