import { CreateOrderRequest, DashboardStats, Order } from "../types/order";
import { Pagination } from "../types/pagination";
import { api } from "./client";

// API Methods - Requires authenticated user (ROLE_USER or ROLE_ADMIN)
const getOrders = async (pageNo: number = 0, pageSize: number = 10) => {
  const { data } = await api.get<Pagination<Order[]>>("/v1/orders", {
    params: { pageNo, pageSize },
  });
  return data;
};

const getGuestOrder = async (orderId: string, checkoutToken: string) => {
  const { data } = await api.get<Order>(`/v1/orders/${orderId}/guest`, {
    headers: { "X-Checkout-Token": checkoutToken },
  });
  return data;
};

const getGuestOrderTracking = async (orderId: string, checkoutToken: string) => {
  const { data } = await api.get<any[]>(`/v1/orders/${orderId}/guest/track`, {
    headers: { "X-Checkout-Token": checkoutToken },
  });
  return data;
};

const cancelGuestOrder = async (orderId: string, checkoutToken: string) => {
  const { data } = await api.post<Order>(`/v1/orders/${orderId}/guest/cancel`, undefined, {
    headers: { "X-Checkout-Token": checkoutToken },
  });
  return data;
};

const cancelMyOrder = async (orderId: string) => {
  const { data } = await api.post<Order>(`/v1/orders/${orderId}/cancel`);
  return data;
};

const getOrderById = async (orderId: string) => {
  const { data } = await api.get<Order>(`/v1/orders/${orderId}`);
  return data;
};

// Customer-scoped history of the signed-in user (server filters by userId).
const getMyOrders = async () => {
  const { data } = await api.get<Order[]>("/v1/orders/my");
  return data;
};

const createOrder = async (order: CreateOrderRequest) => {
  // Requires ROLE_USER or ROLE_ADMIN
  const { data } = await api.post<Order>("/v1/orders", order);
  return data;
};

const updateOrderStatus = async (orderId: string, status: string, note?: string) => {
  const { data } = await api.put<Order>(`/v1/orders/${orderId}/status`, undefined, {
    params: { status, note },
  });
  return data;
};

const getOrderTracking = async (orderId: string) => {
  const { data } = await api.get<any[]>(`/v1/orders/${orderId}/track`);
  return data;
};

// Regenerated server-side from current order data; returns a PDF blob.
const getInvoice = async (orderId: string) => {
  const res = await api.get<Blob>(`/v1/orders/${orderId}/invoice`, {
    responseType: "blob",
  });
  return res.data;
};

const getDashboardStats = async (days = 7) => {
  const { data } = await api.get<DashboardStats>("/v1/orders/stats/dashboard", {
    params: { days },
  });
  return data;
};

export const OrderApi = {
  getOrders,
  getMyOrders,
  getOrderById,
  getGuestOrder,
  getGuestOrderTracking,
  cancelGuestOrder,
  cancelMyOrder,
  createOrder,
  updateOrderStatus,
  getOrderTracking,
  getInvoice,
  getDashboardStats,
};
