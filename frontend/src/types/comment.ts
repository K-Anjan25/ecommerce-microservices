export interface Comment {
  id: string;
  createdBy: string;
  createdDate: string;
  text: string;
  creator: string;
  rating?: number;
}

export interface CreateCommentRequest {
  productId: string;
  text: string;
  rating?: number;
}
