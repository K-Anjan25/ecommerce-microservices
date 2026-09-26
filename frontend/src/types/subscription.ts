/** Subscribe & Save (auto-reorder) lifecycle. */
export type SubscriptionStatus = "ACTIVE" | "PAUSED" | "CANCELED";

/** What to do when the item is out of stock on the scheduled run. */
export type SubscriptionOosPolicy = "SKIP" | "WAIT" | "CANCEL";

export interface Subscription {
  id: string;
  productId: string;
  productName: string;
  variantId?: string | null;
  variantName?: string | null;
  unitPrice: number;
  quantity: number;
  intervalDays: number;
  nextRunAt: string;
  active: boolean;
  status: SubscriptionStatus;
  /** Discount % applied to each delivery's ship-day price (5 or 15). */
  discountPercent: number;
  pausedUntil?: string | null;
  /** Customer asked to skip the upcoming delivery once. */
  skipNext: boolean;
  oosPolicy: SubscriptionOosPolicy;
  lastOrderId?: string | null;
  createdAt?: string;
}

export interface PaymentMethodView {
  id: string;
  provider: string;
  brand?: string | null;
  last4?: string | null;
  isDefault: boolean;
}
