import { PRODUCT_PARAM } from "../constants/product";
import { Comment } from "../types/comment";
import { Pagination } from "../types/pagination";
import {
  Product,
  ProductAdminParam,
  ProductAdmin,
  ProductParam,
  ProductForm,
  ProductSearchResponse,
} from "../types/product";
import { api } from "./axios";

// Public endpoints - no authentication required
const getProducts = async (params: ProductParam = { ...PRODUCT_PARAM }) => {
  const { data } = await api.get<ProductSearchResponse>("/v1/products", {
    params,
  });

  return data;
};

const getProductBrands = async () => {
  const { data } = await api.get<string[]>("/v1/products/brands");
  return data;
};

const suggestProducts = async (term: string) => {
  const { data } = await api.get<string[]>("/v1/products/suggest", {
    params: { term },
  });
  return data;
};

// ----- Price-drop watchlist (Phase 8) -----
const isWatchingPrice = async (productId: string, email: string) => {
  const { data } = await api.get<{ watching: boolean }>(
    `/v1/products/${productId}/watch`,
    { params: { email } }
  );
  return data.watching;
};

const watchPrice = async (productId: string, email: string) => {
  await api.post(`/v1/products/${productId}/watch`, { email });
};

const unwatchPrice = async (productId: string, email: string) => {
  await api.delete(`/v1/products/${productId}/watch`, { params: { email } });
};

const getProductsByPagination = async (params: ProductAdminParam) => {
  const { data } = await api.get<Pagination<ProductAdmin[]>>(
    "/v1/products/getAll",
    {
      params,
    }
  );
  return data;
};

const getProductById = async (id: string) => {
  // Public endpoint
  const { data } = await api.get<ProductAdmin>(`/v1/products/${id}`);

  return data;
};

const getProductsByIds = async (productIds: string[]) => {
  // Public endpoint
  const { data } = await api.get<ProductAdmin[]>(
    `/v1/products/findByIds/${productIds.toString()}`
  );

  return data;
};

const getCommentsByProductId = async (productId: string) => {
  // Public endpoint
  const { data } = await api.get<Comment[]>(
    `/v1/products/${productId}/comments`
  );

  return data;
};

const getRelatedProducts = async (productId: string) => {
  const { data } = await api.get<Product[]>(`/v1/products/${productId}/related`);
  return data;
};

const getBestsellers = async () => {
  const { data } = await api.get<Record<string, number>>("/v1/orders/stats/bestsellers");
  const entries = Object.entries(data)
    .sort((a, b) => (b[1] as number) - (a[1] as number))
    .slice(0, 8)
    .map(([id]) => id);
  if (entries.length === 0) return [];
  const { data: products } = await api.get<Product[]>(`/v1/products/findByIds/${entries.join(",")}`);
  return products;
};

const getBoughtTogether = async (productId: string) => {
  const { data } = await api.get<string[]>(`/v1/orders/bought-together/${productId}`);
  if (data.length === 0) return [];
  const { data: products } = await api.get<Product[]>(`/v1/products/findByIds/${data.join(",")}`);
  return products;
};

const getFlashSales = async () => {
  const { data } = await api.get<Product[]>("/v1/flash-sales");
  return data;
};

// Admin only endpoints - Requires ROLE_ADMIN authentication
const saveProduct = async (product: ProductForm) => {
  // Requires ROLE_ADMIN
  const { data } = await api.post(`/v1/products`, {
    ...product,
  });

  return data;
};

const updateProduct = async (updateProduct: {
  data: ProductForm;
  id: string;
}) => {
  // Requires ROLE_ADMIN
  const { data } = await api.put(`/v1/products/${updateProduct.id}`, {
    ...updateProduct.data,
  });

  return data;
};

const deleteProduct = async (id: string) => {
  // Requires ROLE_ADMIN
  const { data } = await api.delete(`/v1/products/${id}`);
  return data;
};

export const ProductApi = {
  getProducts,
  getProductBrands,
  suggestProducts,
  isWatchingPrice,
  watchPrice,
  unwatchPrice,
  getProductsByPagination,
  deleteProduct,
  getProductById,
  saveProduct,
  updateProduct,
  getProductsByIds,
  getCommentsByProductId,
  getRelatedProducts,
  getBestsellers,
  getBoughtTogether,
  getFlashSales,
};
