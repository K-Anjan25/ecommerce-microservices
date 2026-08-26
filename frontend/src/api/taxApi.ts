import { TaxRule } from "../types/shipping";
import { api } from "./client";

// Admin tax-rule management (/v1/tax/rules, ROLE_ADMIN through the gateway).
// The storefront checkout reads the active rule per state; this is the CRUD.

const getRules = async () => {
  const { data } = await api.get<TaxRule[]>("/v1/tax/rules");
  return data;
};

const createRule = async (rule: TaxRule) => {
  const { data } = await api.post<TaxRule>("/v1/tax/rules", rule);
  return data;
};

const updateRule = async (id: string, rule: TaxRule) => {
  const { data } = await api.put<TaxRule>(`/v1/tax/rules/${id}`, rule);
  return data;
};

const deleteRule = async (id: string) => {
  await api.delete(`/v1/tax/rules/${id}`);
};

export const TaxApi = { getRules, createRule, updateRule, deleteRule };
