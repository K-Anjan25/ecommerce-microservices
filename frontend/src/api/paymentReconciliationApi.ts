import { api } from "./client";
import {
  PaymentReconciliationCase,
  PaymentReconciliationStatus,
} from "../types/paymentReconciliation";

const list = async (status: PaymentReconciliationStatus = "OPEN") => {
  const { data } = await api.get<PaymentReconciliationCase[]>(
    "/v1/payments/reconciliation",
    { params: { status } }
  );
  return data;
};

export const PaymentReconciliationApi = { list };
