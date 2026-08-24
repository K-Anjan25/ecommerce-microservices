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

// Regenerated server-side from current order data; returns a PDF blob.
const getInvoice = async (orderId: string) => {
  const res = await api.get<Blob>(`/v1/orders/${orderId}/invoice`, {
    responseType: "blob",
  });
  return res.data;
};

const getDashboardStats = async () => {
  const { data } = await api.get<DashboardStats>("/v1/orders/stats/dashboard");
  return data;
};

export const OrderApi = {
  getOrders,
  getMyOrders,
  getOrderById,
  getGuestOrder,
  createOrder,
  getInvoice,
  getDashboardStats,
};
