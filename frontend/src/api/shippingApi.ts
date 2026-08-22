import { ShippingQuote, TaxRule } from "../types/shipping";
import { api } from "./axios";

// POST /v1/shipping/calculate — pincode-based quote (requires an authenticated
// user: the gateway AuthFilter guards /v1/shipping/**). Returns an inactive
// quote (active=false, carrier "N/A", cost 0) when no rate exists for the pincode.
const calculateShipping = async (pincode: string, subtotal: number) => {
  const { data } = await api.post<ShippingQuote>("/v1/shipping/calculate", {
    pincode,
    subtotal,
  });
  return data;
};

// GET /v1/tax/rule/{state} — active tax rule for a state.
// The backend answers 204 No Content when the state has no rule configured.
const getTaxRule = async (state: string) => {
  const { data } = await api.get<TaxRule>(
    `/v1/tax/rule/${encodeURIComponent(state)}`
  );
  return data ?? null;
};

export const ShippingApi = {
  calculateShipping,
  getTaxRule,
};
