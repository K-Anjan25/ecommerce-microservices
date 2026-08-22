import { CreateOrderRequest, Order } from "../types/order";
import { Pagination } from "../types/pagination";
import { api } from "./axios";

// API Methods - Requires authenticated user (ROLE_USER or ROLE_ADMIN)
const getOrders = async (pageNo: number = 0, pageSize: number = 10) => {
  const { data } = await api.get<Pagination<Order[]>>("/v1/orders", {
    params: { pageNo, pageSize },
  });
  return data;
};

const getOrderById = async (orderId: string) => {
  const { data } = await api.get<Order>(`/v1/orders/${orderId}`);
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

export const OrderApi = {
  getOrders,
  getOrderById,
  createOrder,
  getInvoice,
};
