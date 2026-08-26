/**
 * Origin helpers that work on both the server and the client.
 *
 * The browser always answers from `window.location.origin`. During SSR there
 * is no window, so absolute URLs resolve from the environment instead:
 * - `currentOrigin` (site URLs: canonical, og:, JSON-LD) uses SSR_SITE_ORIGIN.
 * - `apiOrigin` (same-origin API calls made by server-side prefetch) prefers
 *   SSR_API_ORIGIN / GATEWAY_URL so data is fetched from the api-gateway.
 */
function env(name: string): string | undefined {
  return typeof process !== "undefined" ? process.env?.[name] : undefined;
}

export function currentOrigin(): string {
  if (typeof window !== "undefined") return window.location.origin;
  return env("SSR_SITE_ORIGIN") || "http://localhost:3000";
}

export function apiOrigin(): string {
  if (typeof window !== "undefined") return window.location.origin;
  return env("SSR_API_ORIGIN") || env("GATEWAY_URL") || currentOrigin();
}
