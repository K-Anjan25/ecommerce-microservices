import { Comment as CommentType } from "./comment";

export interface Comment {
  id: string;
  createdBy: string;
  createdDate: string;
  text: string;
  creator: string;
  rating?: number;
  /** Server-verified: the reviewer has an active order for this product. */
  verifiedPurchase?: boolean;
  /** Photos the customer attached of the product they received. */
  images?: CommentImage[];
}

export interface CommentImage {
  id?: string;
  imageUrl: string;
  altText?: string;
  sortOrder?: number;
}

export interface CreateCommentRequest {
  productId: string;
  text: string;
  rating?: number;
  /** Data-URL photos of the received product (client-downscaled, max 8). */
  images?: string[];
}

export type { CommentType };
