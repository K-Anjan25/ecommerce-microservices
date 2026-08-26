import { Category } from "./category";
import { Comment } from "./comment";

export interface ProductVariant {
  id: string;
  name: string;
  sku: string;
  price: number;
  quantityInStock: number;
  attributes: string;
}

export interface ProductParam {
  size: number;
  page: number;
  filter: string;
  sort: string;
  searchTerm: string;
  brand?: string;
  minPrice?: number;
  maxPrice?: number;
  minRating?: number;
}

interface BaseProduct {
  id: string;
  name: string;
  unitPrice: number;
  description: string;
  imageUrl: string;
  images?: string[];
  brand?: string;
  originalPrice?: number;
  badge?: string;
  featured?: boolean;
  avgRating?: number;
  ratingCount?: number;
  variants?: ProductVariant[];
  quantityInStock?: number;
  flashPrice?: number;
  flashSaleEndsAt?: string;
  flashSaleActive?: boolean;
}

export interface ProductAdminParam {
  pageNo: number;
  pageSize: number;
}

export interface Product extends BaseProduct {
  categoryName: string;
}

export interface ProductAdmin extends BaseProduct {
  createdDate: string;
  category: Category;
  comments: Comment[];
}

export interface FacetCount {
  value: string;
  count: number;
}

export interface Facets {
  brands: FacetCount[];
  categories: FacetCount[];
  priceMin?: number;
  priceMax?: number;
}

export interface ProductSearchResponse {
  content: Product[];
  facets: Facets;
}

export interface ProductSearchSuggestion {
  id: string;
  name: string;
  brand?: string;
  category: string;
  unitPrice: number;
  imageUrl?: string;
}

export interface ProductVariantForm {
  id?: string;
  name: string;
  sku?: string;
  /** Kept as strings in form state; coerced on submit. */
  price?: string;
  quantityInStock?: string;
  attributes?: string;
}

export interface ProductVariantPayload {
  id?: string;
  name: string;
  sku?: string;
  price?: number;
  quantityInStock?: number;
  attributes?: string;
}

/** Wire format for POST/PUT /v1/products. */
export interface ProductPayload extends Omit<ProductForm, "variants"> {
  variants: ProductVariantPayload[];
}

export interface ProductForm {
  name: string;
  unitPrice: number | undefined;
  categoryId: Category["id"] | undefined;
  description: string;
  quantityInStock?: number | undefined;
  imageUrl: string;
  brand?: string;
  originalPrice?: number | undefined;
  badge?: string;
  featured?: boolean;
  /** Gallery beyond the cover image; sent as `images[]` (sort order = index). */
  images: string[];
  /** Send always: `[]` clears variants, rows with `id` keep their identity. */
  variants: ProductVariantForm[];
}
