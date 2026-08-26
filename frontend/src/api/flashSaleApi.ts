import { FlashSale } from "../types/flashSale";
import { api } from "./client";

// Flash sales live in product-service (/v1/flash-sales/**). The gateway route
// is behind AuthFilter: GET needs any signed-in user, writes need ROLE_ADMIN.

const getActiveFlashSales = async () => {
  const { data } = await api.get<FlashSale[]>("/v1/flash-sales");
  return data;
};

const getAllFlashSales = async () => {
  const { data } = await api.get<FlashSale[]>("/v1/flash-sales/admin/all");
  return data;
};

const createFlashSale = async (sale: FlashSale) => {
  const { data } = await api.post<FlashSale>("/v1/flash-sales", sale);
  return data;
};

const deleteFlashSale = async (id: number) => {
  await api.delete(`/v1/flash-sales/${id}`);
};

export const FlashSaleApi = {
  getActiveFlashSales,
  getAllFlashSales,
  createFlashSale,
  deleteFlashSale,
};
