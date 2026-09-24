export interface Comment {
  id: string;
  createdBy: string;
  createdDate: string;
  text: string;
  creator: string;
  rating?: number;
  /** Server-verified: the reviewer has an active order for this product. */
  verifiedPurchase?: boolean;
}

export interface CreateCommentRequest {
  productId: string;
  text: string;
  rating?: number;
}
