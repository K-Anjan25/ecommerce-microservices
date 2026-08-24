import { api } from "./client";
import {
  GiftCard,
  GiftCardPurchaseAdmin,
  GiftCardPurchaseRequest,
  GiftCardPurchaseRefundResponse,
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

const listPurchases = async (status: GiftCardPurchaseAdmin["status"]) => {
  const { data } = await api.get<GiftCardPurchaseAdmin[]>("/v1/gift-cards/purchases", {
    params: { status },
  });
  return data;
};

const refundPurchase = async (purchaseId: string) => {
  const { data } = await api.post<GiftCardPurchaseRefundResponse>(
    `/v1/gift-cards/purchases/${purchaseId}/refund`
  );
  return data;
};

export const GiftCardApi = { getMyGiftCards, purchaseGiftCard, listPurchases, refundPurchase };
