export enum GiftCardStatus {
  ACTIVE = "ACTIVE",
  REDEEMED = "REDEEMED",
  EXPIRED = "EXPIRED",
  REFUNDED = "REFUNDED",
}

export interface GiftCard {
  id: string;
  code: string;
  balance: number;
  initialBalance: number;
  expiryDate: string;
  status: GiftCardStatus;
  recipientEmail?: string;
}

export type GiftCardPurchaseProvider = "STRIPE" | "RAZORPAY";

export interface GiftCardPurchaseRequest {
  amount: number;
  contactEmail: string;
  recipientEmail?: string;
  expiryDate: string;
  provider: GiftCardPurchaseProvider;
}

export interface GiftCardPurchaseResponse {
  purchaseId: string;
  orderId: string;
  payment: import("./payment").PaymentResponse;
}

export interface GiftCardPurchaseRefundResponse {
  purchaseId: string;
  orderId: string;
  status: "REFUNDED";
  refundedAmount?: number;
  refundTransactionId?: string;
  refundedAt?: string;
}

export interface GiftCardPurchaseAdmin {
  purchaseId: string;
  orderId: string;
  customerId: string;
  amount: number;
  expiryDate: string;
  recipientEmail?: string;
  status: "PENDING_PAYMENT" | "FAILED" | "ISSUED" | "REFUNDED";
  giftCardId?: string;
  refundedAmount?: number;
  refundTransactionId?: string;
  createdAt?: string;
  issuedAt?: string;
  refundedAt?: string;
}

/** Admin manual issuance (`POST /v1/gift-cards/issue`). */
export interface IssueGiftCardRequest {
  amount: number;
  recipientEmail?: string;
  /** `YYYY-MM-DD` — must be today or later. */
  expiryDate: string;
  reason: string;
}
