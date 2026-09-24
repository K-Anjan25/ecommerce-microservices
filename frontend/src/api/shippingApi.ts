import { ShippingQuote, TaxRule } from "../types/shipping";
import { api } from "./client";

// Zone-based international quote (POST /v1/shipping/zones/quote). Returns
// available=false when the destination country is not in any active zone.
export interface IntlQuote {
  available: boolean;
  zoneName?: string;
  cost: number;
  freeAbove?: number;
  estimatedDaysMin: number;
  estimatedDaysMax: number;
  carrier: string;
  /** Import duty / VAT fraction, e.g. 0.15 for 15%. */
  dutyRate: number;
  dutyName: string;
}

// Shape returned by the backend (countries is a CSV string there).
export interface ShippingZone {
  id?: string;
  name: string;
  countries: string;
  cost: number;
  freeAbove?: number;
  estimatedDaysMin: number;
  estimatedDaysMax: number;
  carrier: string;
  dutyRate: number;
  dutyName: string;
  active: boolean;
}

// GET /v1/shipping/zones — every configured zone (active and inactive).
const getZones = async () => {
  const { data } = await api.get<ShippingZone[]>("/v1/shipping/zones");
  return data ?? [];
};

const quoteInternational = async (country: string, subtotal: number) => {
  const { data } = await api.post<IntlQuote>("/v1/shipping/zones/quote", {
    country,
    subtotal,
  });
  return data;
};

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

// ---- Admin: shipping rate management (/v1/shipping/rates, ROLE_ADMIN) ----

export type ShippingRate = ShippingQuote & { id: string };

const getRates = async () => {
  const { data } = await api.get<ShippingRate[]>("/v1/shipping/rates");
  return data;
};

const createRate = async (rate: Omit<ShippingRate, "id">) => {
  const { data } = await api.post<ShippingRate>("/v1/shipping/rates", rate);
  return data;
};

const updateRate = async (id: string, rate: Omit<ShippingRate, "id">) => {
  const { data } = await api.put<ShippingRate>(`/v1/shipping/rates/${id}`, rate);
  return data;
};

const deleteRate = async (id: string) => {
  await api.delete(`/v1/shipping/rates/${id}`);
};

export const ShippingApi = {
  calculateShipping,
  quoteInternational,
  getZones,
  getTaxRule,
  getRates,
  createRate,
  updateRate,
  deleteRate,
};
