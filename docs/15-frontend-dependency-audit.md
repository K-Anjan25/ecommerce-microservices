# Frontend dependency security audit

Audit date: 2026-08-23.

## Result

The frontend moved from **11 findings (6 high)** to **0 known vulnerabilities**.

## Changes applied

- Axios was first upgraded to `1.19.0` to remove active advisories, then removed entirely in favor of the native Fetch API and Cartly's small typed transport.
- Vite `5.4` → `8.2.2` and `@vitejs/plugin-react` `4.x` → `6.1.0`, removing
  the vulnerable esbuild/dev-server and path-traversal chain.
- React Router DOM `6.5` → `7.18.2`, removing the remaining redirect and SSR
  hydration advisories. Cartly's declarative v6 API remains supported by v7;
  TypeScript and the production route build verify all nested routes.
- Applied npm's transitive remediations for Babel, PostCSS, nanoid, form-data,
  and brace-expansion.
- Renamed Vite config to `vite.config.mts` for Vite 8's native ESM loader.

## Regression coverage performed

- TypeScript validates all route hooks and components.
- Production compilation visits every lazy route import.
- Nested customer/admin route trees compile under Router 7.
- Auth redirect state, `navigate` calls, mini-cart product links and route params
  retain their existing public APIs.
- `npm audit` reports zero low, moderate, high, or critical findings.

## Release checks

```bash
cd frontend
npm run audit:security
npm run build
```

`audit:security` is configured with `--audit-level=high`; the release record
should still review moderate findings instead of silently accepting them.
