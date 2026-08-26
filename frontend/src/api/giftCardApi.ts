import { api } from "./client";
import {
  GiftCard,
  GiftCardPurchaseAdmin,
  GiftCardPurchaseRequest,
  GiftCardPurchaseRefundResponse,
  GiftCardPurchaseResponse,
  IssueGiftCardRequest,
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

// Administrative manual issuance (ROLE_ADMIN/SUPER_ADMIN). The returned card
// is ACTIVE immediately — hand the code to the recipient over a trusted channel.
const issueGiftCard = async (request: IssueGiftCardRequest) => {
  const { data } = await api.post<GiftCard>("/v1/gift-cards/issue", request);
  return data;
};

export const GiftCardApi = {
  getMyGiftCards,
  purchaseGiftCard,
  listPurchases,
  refundPurchase,
  issueGiftCard,
};
