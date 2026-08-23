import { LoyaltyPoint, LoyaltyPointType } from "../types/loyaltyPoint";
import { api } from "./client";

const getBalance = async () => {
  const { data } = await api.get<number>("/v1/loyalty/balance");
  return data;
};

const getHistory = async () => {
  const { data } = await api.get<LoyaltyPoint[]>("/v1/loyalty/history");
  return data;
};

const redeemPoints = async (points: number) => {
  const { data } = await api.post<LoyaltyPoint>("/v1/loyalty/redeem", null, { params: { points } });
  return data;
};

export const LoyaltyPointApi = {
  getBalance,
  getHistory,
  redeemPoints,
};
