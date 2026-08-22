import { GiftCard, PurchaseGiftCardRequest } from "../types/giftCard";
import { api } from "./axios";

const purchaseGiftCard = async (request: PurchaseGiftCardRequest) => {
  const { data } = await api.post<GiftCard>("/v1/gift-cards/purchase", request);
  return data;
};

const getGiftCardByCode = async (code: string) => {
  const { data } = await api.get<GiftCard>(`/v1/gift-cards/${code}`);
  return data;
};

const redeemGiftCard = async (code: string, amount: number) => {
  const { data } = await api.post<GiftCard>(`/v1/gift-cards/${code}/redeem?amount=${amount}`);
  return data;
};

const getUserGiftCards = async () => {
  const { data } = await api.get<GiftCard[]>("/v1/gift-cards");
  return data;
};

export const GiftCardApi = {
  purchaseGiftCard,
  getGiftCardByCode,
  redeemGiftCard,
  getUserGiftCards,
};
