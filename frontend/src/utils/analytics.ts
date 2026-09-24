/**
 * Storefront funnel analytics — anonymous, session-scoped, fire-and-forget.
 *
 * Events: VIEW_PRODUCT → ADD_TO_CART → CHECKOUT_STARTED → ORDER_COMPLETED.
 * POSTs never block or break the UI: keepalive fetch, swallowed errors.
 */

const SESSION_KEY = "cartly-analytics-session";

export type FunnelEvent =
  | "VIEW_PRODUCT"
  | "ADD_TO_CART"
  | "CHECKOUT_STARTED"
  | "ORDER_COMPLETED";

const getSessionId = (): string => {
  try {
    let id = sessionStorage.getItem(SESSION_KEY);
    if (!id) {
      id = crypto.randomUUID();
      sessionStorage.setItem(SESSION_KEY, id);
    }
    return id;
  } catch {
    return "anonymous";
  }
};

export const trackEvent = (type: FunnelEvent, productId?: string): void => {
  if (typeof window === "undefined") return;
  try {
    const body = JSON.stringify({ type, sessionId: getSessionId(), productId });
    // Fire-and-forget: keepalive lets it complete even on page unload.
    void fetch("/v1/analytics/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
      keepalive: true,
    }).catch(() => {
      /* analytics must never surface */
    });
  } catch {
    /* ignore */
  }
};
