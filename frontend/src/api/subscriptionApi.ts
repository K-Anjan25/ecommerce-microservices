import { Subscription } from "../types/subscription";
import { api } from "./client";

// Signed-in customer's own subscriptions (Subscribe & Save).
const getMySubscriptions = async () => {
  const { data } = await api.get<Subscription[]>("/v1/subscriptions");
  return data;
};

const createSubscription = async (payload: {
  productId: string;
  variantId?: string | null;
  quantity: number;
  intervalDays: number;
}) => {
  const { data } = await api.post<Subscription>("/v1/subscriptions", payload);
  return data;
};

/** Pause / resume / change cadence, quantity, pause window or OOS policy. */
const updateSubscription = async (
  id: string,
  payload: {
    active?: boolean;
    intervalDays?: number;
    quantity?: number;
    pauseUntil?: string;
    oosPolicy?: "SKIP" | "WAIT" | "CANCEL";
  }
) => {
  const { data } = await api.put<Subscription>(`/v1/subscriptions/${id}`, payload);
  return data;
};

/** Skip just the upcoming delivery; the schedule resumes afterwards. */
const skipNext = async (id: string) => {
  const { data } = await api.post<Subscription>(`/v1/subscriptions/${id}/skip`);
  return data;
};

/** Move the next delivery to another date (naive local wall clock). */
const reschedule = async (id: string, nextDeliveryDate: string) => {
  const { data } = await api.post<Subscription>(
    `/v1/subscriptions/${id}/reschedule`,
    { nextDeliveryDate }
  );
  return data;
};

/** Soft cancel — history is kept. */
const cancelSubscription = async (id: string) => {
  const { data } = await api.delete<Subscription>(`/v1/subscriptions/${id}`);
  return data;
};

// ── Admin ──────────────────────────────────────────────────────────────────
export interface SubscriptionForecastWeek {
  weekStart: string;
  deliveries: number;
  units: number;
  estValue: number;
}

const adminList = async () => {
  const { data } = await api.get<Subscription[]>("/v1/admin/subscriptions");
  return data;
};

const adminForecast = async (weeks = 8) => {
  const { data } = await api.get<SubscriptionForecastWeek[]>(
    "/v1/admin/subscriptions/forecast",
    { params: { weeks } }
  );
  return data;
};

export const SubscriptionApi = {
  getMySubscriptions,
  createSubscription,
  updateSubscription,
  skipNext,
  reschedule,
  cancelSubscription,
  adminList,
  adminForecast,
};
