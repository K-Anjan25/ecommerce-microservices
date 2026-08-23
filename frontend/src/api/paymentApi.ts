import { api } from "./client";
import { PaymentRequest, PaymentResponse } from "../types/payment";

const initiatePayment = async (
  paymentRequest: PaymentRequest
): Promise<PaymentResponse> => {
  const { data } = await api.post<PaymentResponse>("/v1/payments", paymentRequest);
  return data;
};

export const PaymentApi = {
  initiatePayment,
};
