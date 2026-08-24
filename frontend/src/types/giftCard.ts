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
