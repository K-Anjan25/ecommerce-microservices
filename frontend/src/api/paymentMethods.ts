import { PaymentMethodView } from "../types/subscription";
import { api } from "./client";

/** Vaulted payment methods ("remember for my subscriptions"). */
const myMethods = async () => {
  const { data } = await api.get<PaymentMethodView[]>("/v1/payment-methods");
  return data;
};

/** Save a provider-side reusable charge token (Razorpay token / Stripe PM id). */
const save = async (payload: {
  provider: string;
  token: string;
  brand?: string;
  last4?: string;
  isDefault?: boolean;
}) => {
  const { data } = await api.post<PaymentMethodView>("/v1/payment-methods", payload);
  return data;
};

const remove = async (id: string) => {
  await api.delete(`/v1/payment-methods/${id}`);
};

export const PaymentMethodApi = { myMethods, save, remove };
