export type PaymentReconciliationStatus = "OPEN" | "RESOLVED";

export interface PaymentReconciliationCase {
  id: string;
  paymentId: number;
  orderId: string;
  provider: "STRIPE" | "RAZORPAY" | "CASH";
  transactionId?: string;
  amount: number;
  currency: string;
  status: PaymentReconciliationStatus;
  reason: string;
  createdAt: string;
  updatedAt: string;
  resolvedAt?: string;
}
