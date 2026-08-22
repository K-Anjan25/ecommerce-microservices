import {
  Coupon,
  CreateCouponRequest,
  UpdateCouponRequest,
} from "../types/coupon";
import { api } from "./axios";

// Admin-only coupon management (ROLE_ADMIN through the gateway).
const getCoupons = async () => {
  const { data } = await api.get<Coupon[]>("/v1/coupons");
  return data;
};

const createCoupon = async (coupon: CreateCouponRequest) => {
  const { data } = await api.post<Coupon>("/v1/coupons", coupon);
  return data;
};

const updateCoupon = async (id: string, changes: UpdateCouponRequest) => {
  const { data } = await api.put<Coupon>(`/v1/coupons/${id}`, changes);
  return data;
};

const deleteCoupon = async (id: string) => {
  await api.delete(`/v1/coupons/${id}`);
};

// Customer-facing validation (auth-required). Backend recomputes the discount
// at order time — this is for the checkout preview only.
const validateCoupon = async (code: string, orderAmount: number) => {
  const { data } = await api.post<{
    valid: boolean;
    code: string;
    discountAmount: number;
    totalAfterDiscount: number;
    message?: string;
  }>("/v1/coupons/validate", { code, orderAmount });
  return data;
};

export const CouponApi = {
  getCoupons,
  createCoupon,
  updateCoupon,
  deleteCoupon,
  validateCoupon,
};
