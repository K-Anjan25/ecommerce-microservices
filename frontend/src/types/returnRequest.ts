export enum ReturnStatus {
  REQUESTED = "REQUESTED",
  APPROVED = "APPROVED",
  REJECTED = "REJECTED",
  REFUNDED = "REFUNDED",
}

export interface ReturnRequest {
  id: string;
  orderId: string;
  customerId: string;
  createdDate?: string;
  productId: string;
  variantId?: string;
  quantity: number;
  status: ReturnStatus;
  refundAmount?: number;
  refundTransactionId?: string;
  reason?: string;
  rejectionReason?: string;
}

export interface CreateReturnRequest {
  orderId: string;
  productId: string;
  variantId?: string;
  quantity: number;
  reason?: string;
}
