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
  productId: string;
  variantId?: string;
  quantity: number;
  status: ReturnStatus;
  refundAmount?: number;
  reason?: string;
  rejectionReason?: string;
}

export interface CreateReturnRequest {
  orderId: string;
  customerId: string;
  productId: string;
  variantId?: string;
  quantity: number;
  reason?: string;
}
