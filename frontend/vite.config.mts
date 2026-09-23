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
      // 127.0.0.1 on purpose: on Windows, "localhost" resolves to ::1 first
      // and an IPv4-only target refuses the connection (ECONNREFUSED ::1).
      "/v1": { target: "http://127.0.0.1:8889", agent: false },
      "/user": { target: "http://127.0.0.1:8889", agent: false },
      "/file": { target: "http://127.0.0.1:8889", agent: false },
      "/api": { target: "http://127.0.0.1:8889", agent: false },
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
