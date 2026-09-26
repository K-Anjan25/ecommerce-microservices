import { Category } from "./category";
import { Comment } from "./comment";

export interface ProductVariant {
  id: string;
  name: string;
  sku: string;
  price: number;
  quantityInStock: number;
  attributes: string;
  /** Swatch chip colour for the variant selector, e.g. "#1c1c1c". */
  swatchHex?: string | null;
  /** Primary shot of this variant; the gallery swaps to variant images when selected. */
  imageUrl?: string | null;
}

/** Gallery image with variant/angle metadata (imageGallery entries). */
export interface ProductImage {
  id?: string;
  /** Full-resolution URL (brand CDN original) — gallery/zoom. */
  url: string;
  /** Card/thumbnail-size URL (source-CDN resize). Null → use url. */
  thumbUrl?: string | null;
  sortOrder?: number;
  /** Null/undefined for product-level shots. */
  variantId?: string | null;
  /** front | side | back | top | detail | variant | gallery */
  angle?: string | null;
  altText?: string | null;
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
  /** Rich gallery (variant/angle metadata). Falls back to `images` when absent. */
  imageGallery?: ProductImage[];
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
  /** Subscribe & Save eligibility (auto-reorder offer on the buy box). */
  subscribeEligible?: boolean;
  /** Grouped specification tables as JSON: [{"group","items":[{"label","value"}]}]. */
  specifications?: string | null;
  /** Cartly Plus member-only deal percent (priced server-side). */
  memberDealPercent?: number | null;
}

export interface ProductAdminParam {
  pageNo: number;
  pageSize: number;
}

export interface Product extends BaseProduct {
  categoryName: string;
  /** Multi-locale overrides JSON: {"hi":{"name":"...","description":"..."}} */
  translations?: string | null;
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
  /** Swatch chip colour, e.g. "#1c1c1c". */
  swatchHex?: string;
  /** Primary shot of this variant. */
  imageUrl?: string;
}

export interface ProductVariantPayload {
  id?: string;
  name: string;
  sku?: string;
  price?: number;
  quantityInStock?: number;
  attributes?: string;
  swatchHex?: string;
  imageUrl?: string;
}

/** Wire format for POST/PUT /v1/products. */
export interface ProductPayload extends Omit<ProductForm, "variants"> {
  variants: ProductVariantPayload[];

  translations?: string | null;
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
  /** Subscribe & Save eligibility (auto-reorder offer on the buy box). */
  subscribeEligible?: boolean;
}
