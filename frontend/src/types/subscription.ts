export interface Subscription {
  id: string;
  productId: string;
  productName: string;
  unitPrice: number;
  quantity: number;
  intervalDays: number;
  nextRunAt: string;
  active: boolean;
  lastOrderId?: string | null;
  createdAt?: string;
}
