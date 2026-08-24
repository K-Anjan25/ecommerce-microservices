export interface OrderParam {
  pageNo: number;
  pageSize: number;
}

export interface Order {
  id: string;
  customerId: string;
  address: OrderAdress;
  items: OrderItem[];
  orderStatus: OrderStatus;
  createdDate: string;
  totalAmount: number;
  discountAmount?: number;
  shippingAmount?: number;
  taxAmount?: number;
  shippingMethod?: ShippingMethod;
  giftWrap?: boolean;
  giftWrapFee?: number;
  checkoutToken?: string;
}

export interface CreateOrderRequest {
  items: OrderItem[];
  address: OrderAdress;
  paymentId?: string;
  shippingMethod?: ShippingMethod;
  customerEmail?: string;
  giftWrap?: boolean;
  pincode?: string;
  state?: string;
  couponCode?: string;
}

interface OrderAdress {
  state: string;
  district: string;
  addressDetail: string;
}

export interface OrderItem {
  productId: string;
  quantity: number;
  variantId?: string;
}

enum OrderStatus {
  PENDING = "PENDING",
  PAID = "PAID",
  APPROVED = "APPROVED",
  CANCELLING = "CANCELLING",
  CANCELLED = "CANCELLED",
  REFUNDED = "REFUNDED",
}

export enum ShippingMethod {
  STANDARD = "STANDARD",
  EXPRESS = "EXPRESS",
}

export interface DashboardStats {
  revenueToday: number;
  revenueLast7Days: number;
  avgOrderValue: number;
  totalOrders: number;
  ordersToday: number;
  ordersByStatus: Record<string, number>;
  dailyRevenue: { date: string; revenue: number; orders: number }[];
  topProducts: { productId: string; unitsSold: number; revenue: number }[];
}

export interface OrderForm {
  state: string;
  district: string;
  addressDetail: string;
  pincode: string;
  customerEmail?: string;
}
