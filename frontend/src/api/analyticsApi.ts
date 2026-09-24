import { api } from "./client";

export interface AnalyticsSummary {
  days: number;
  funnel: {
    viewedProducts: number;
    addToCart: number;
    checkoutStarted: number;
    orders: number;
    realOrders: number;
    viewToCartPercent: number;
    cartToOrderPercent: number;
  };
  daily: {
    date: string;
    views: number;
    addToCarts: number;
    checkouts: number;
    orders: number;
  }[];
  topProducts: { productId: string; views: number }[];
}

// Admin only — funnel + traffic summary for the last N days.
const getSummary = async (days: number) => {
  const { data } = await api.get<AnalyticsSummary>("/v1/analytics/summary", { params: { days } });

  return data;
};

export const AnalyticsApi = { getSummary };
