import { Category } from "../types/category";
import { api } from "./axios";

// Public endpoint - no authentication required
const getCategories = async () => {
  const { data } = await api.get<Category[]>("/v1/categories");

  return data;
};

// Admin only endpoint - Requires ROLE_ADMIN authentication
const saveCategory = async (category: { name: string }) => {
  // Requires ROLE_ADMIN
  const { data } = await api.post("/v1/categories", category);

  return data;
};

export const CategoryApi = {
  getCategories,
  saveCategory,
};
