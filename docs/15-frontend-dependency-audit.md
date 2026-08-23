# Frontend dependency security audit

Audit date: 2026-08-23.

## Changes applied

- Axios `1.13.6` → `1.19.0` to remove the active high-severity prototype
  pollution, header-injection, credential-leak, recursion and proxy advisories.
- Vite `5.4` → `8.2.2` and `@vitejs/plugin-react` `4.x` → `6.1.0` to remove
  the vulnerable esbuild/dev-server and path-traversal dependency chain.
- Applied npm's non-breaking transitive remediations for Babel, PostCSS,
  nanoid, form-data, and brace-expansion.
- Renamed Vite config to `vite.config.mts` for Vite 8's native ESM config loader.

The audit moved from **11 findings (6 high)** to **2 moderate findings, 0 high,
0 critical**. `npm run audit:security` exits non-zero if a high or critical
finding appears; run it in release checks and locally before dependency updates.

## Accepted residual risk

The two moderate findings are in React Router 6. The registry's available fix is
React Router 7, a major migration. One advisory concerns SSR hydration, which
this client-only Vite SPA does not use. The redirect advisory is constrained by
Cartly's routing design: application destinations are static internal paths;
user input is not passed to `navigate`, `<Link>`, or redirect responses.

A React Router 7 migration should be done as a dedicated ticket with route,
auth-redirect, deep-link, and browser-history regression tests rather than an
unreviewed forced audit upgrade.

## Commands

```bash
cd frontend
npm run audit:security
npm run build
```
