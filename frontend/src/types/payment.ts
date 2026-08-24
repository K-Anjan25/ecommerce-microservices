export type PaymentProvider = "RAZORPAY" | "STRIPE" | "CASH";
export type PaymentStatus = "PENDING" | "SUCCESS" | "FAILED" | "REFUNDED";

export interface PaymentRequest {
  orderId: string;
  provider: PaymentProvider;
  checkoutToken?: string;
}

export interface PaymentResponse {
  orderId: string;
  amount: number;
  currency: string;
  provider: PaymentProvider;
  status: PaymentStatus;
  transactionId?: string;
  /** Stripe.js client secret only; never a server-side provider secret. */
  clientSecret?: string;
  message?: string;
}

export interface Payment extends PaymentResponse {
  id: string;
  createdAt: string;
}
