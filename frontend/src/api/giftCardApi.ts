import { api } from "./client";
import { GiftCard, PurchaseGiftCardRequest } from "../types/giftCard";

const purchaseGiftCard = async (request: PurchaseGiftCardRequest) => {
  const { data } = await api.post<GiftCard>("/v1/gift-cards/purchase", request);
  return data;
};

const getMyGiftCards = async () => {
  const { data } = await api.get<GiftCard[]>("/v1/gift-cards");
  return data;
};

export const GiftCardApi = { purchaseGiftCard, getMyGiftCards };
