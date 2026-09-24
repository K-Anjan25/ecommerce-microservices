import { Subscription } from "../types/subscription";
import { api } from "./client";

// Signed-in customer's own subscriptions.
const getMySubscriptions = async () => {
  const { data } = await api.get<Subscription[]>("/v1/subscriptions");
  return data;
};

const createSubscription = async (payload: {
  productId: string;
  quantity: number;
  intervalDays: number;
}) => {
  const { data } = await api.post<Subscription>("/v1/subscriptions", payload);
  return data;
};

/** Pause (active=false) / resume / change cadence or quantity. */
const updateSubscription = async (
  id: string,
  payload: { active?: boolean; intervalDays?: number; quantity?: number }
) => {
  const { data } = await api.put<Subscription>(`/v1/subscriptions/${id}`, payload);
  return data;
};

const cancelSubscription = async (id: string) => {
  await api.delete(`/v1/subscriptions/${id}`);
};

export const SubscriptionApi = {
  getMySubscriptions,
  createSubscription,
  updateSubscription,
  cancelSubscription,
};
