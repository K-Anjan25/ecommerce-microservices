import { api } from "./client";
import { LoyaltyPoint } from "../types/loyaltyPoint";

const getBalance = async () => {
  const { data } = await api.get<number>("/v1/loyalty/balance");
  return data;
};

const getHistory = async () => {
  const { data } = await api.get<LoyaltyPoint[]>("/v1/loyalty/history");
  return data;
};

export const LoyaltyPointApi = { getBalance, getHistory };
