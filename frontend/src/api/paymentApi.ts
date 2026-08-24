import { api } from "./client";
import { PaymentRequest, PaymentResponse } from "../types/payment";

const initiatePayment = async (
  paymentRequest: PaymentRequest
): Promise<PaymentResponse> => {
  const { data } = await api.post<PaymentResponse>("/v1/payments", paymentRequest);
  return data;
};

const getPaymentForOrder = async (orderId: string) => {
  const { data } = await api.get<PaymentResponse>(`/v1/payments/order/${orderId}`);
  return data;
};

export const PaymentApi = {
  initiatePayment,
  getPaymentForOrder,
};
