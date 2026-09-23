import { Category } from "../types/category";
import { api } from "./client";

// Public endpoint - no authentication required
const getCategories = async () => {
  const { data } = await api.get<Category[]>("/v1/categories");

  return data;
};

// Admin only endpoint - Requires ROLE_ADMIN authentication
const saveCategory = async (category: {
  name: string;
  parentId?: number | null;
  description?: string | null;
  imageUrl?: string | null;
}) => {
  // Requires ROLE_ADMIN
  const { data } = await api.post("/v1/categories", category);

  return data;
};

// Admin only endpoint - Requires ROLE_ADMIN. Name changes regenerate the slug
// unless an explicit slug is provided.
const updateCategory = async (
  id: number,
  category: {
    name: string;
    slug?: string;
    parentId?: number | null;
    sortOrder?: number;
    description?: string | null;
    imageUrl?: string | null;
  }
) => {
  // Requires ROLE_ADMIN
  const { data } = await api.put(`/v1/categories/${id}`, category);

  return data;
};

// Admin only endpoint - Requires ROLE_ADMIN. The server refuses (409) while
// products are still assigned to the category.
const deleteCategory = async (id: number) => {
  // Requires ROLE_ADMIN
  await api.delete(`/v1/categories/${id}`);
};

// Admin only endpoint - Requires ROLE_ADMIN. Re-parents the category
// (parentId null = top level) and places it at `position` among its new
// siblings. The server rejects moves into the category's own subtree.
const moveCategory = async (id: number, parentId: number | null, position: number) => {
  // Requires ROLE_ADMIN
  const { data } = await api.put(`/v1/categories/${id}/position`, { parentId, position });

  return data;
};

export const CategoryApi = {
  getCategories,
  saveCategory,
  updateCategory,
  moveCategory,
  deleteCategory,
};
