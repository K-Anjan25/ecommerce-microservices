import { api } from "./client";
import { GiftCard } from "../types/giftCard";

const getMyGiftCards = async () => {
  const { data } = await api.get<GiftCard[]>("/v1/gift-cards");
  return data;
};

export const GiftCardApi = { getMyGiftCards };
