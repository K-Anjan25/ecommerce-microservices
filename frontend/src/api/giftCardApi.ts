import { api } from "./client";
import {
  GiftCard,
  GiftCardPurchaseRequest,
  GiftCardPurchaseResponse,
} from "../types/giftCard";

const getMyGiftCards = async () => {
  const { data } = await api.get<GiftCard[]>("/v1/gift-cards");
  return data;
};

const purchaseGiftCard = async (request: GiftCardPurchaseRequest) => {
  const { data } = await api.post<GiftCardPurchaseResponse>("/v1/gift-cards/purchase", request);
  return data;
};

export const GiftCardApi = { getMyGiftCards, purchaseGiftCard };
