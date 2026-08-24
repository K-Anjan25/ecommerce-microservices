import { ReturnRequest, CreateReturnRequest } from "../types/returnRequest";
import { api } from "./client";

const getReturnRequestsByOrder = async (orderId: string) => {
  const { data } = await api.get<ReturnRequest[]>(`/v1/returns/order/${orderId}`);
  return data;
};

const getMyReturnRequests = async () => {
  const { data } = await api.get<ReturnRequest[]>("/v1/returns/my");
  return data;
};

// Admin queue: every return request (REQUESTED first).
const getAllReturnRequests = async () => {
  const { data } = await api.get<ReturnRequest[]>("/v1/returns/all");
  return data;
};

const createReturnRequest = async (returnRequest: CreateReturnRequest) => {
  const { data } = await api.post<ReturnRequest>("/v1/returns", returnRequest);
  return data;
};

const approveReturnRequest = async (returnRequestId: string) => {
  const { data } = await api.post<ReturnRequest>(`/v1/returns/${returnRequestId}/approve`);
  return data;
};

const rejectReturnRequest = async (params: { id: string; reason: string }) => {
  const { data } = await api.post<ReturnRequest>(`/v1/returns/${params.id}/reject?reason=${encodeURIComponent(params.reason)}`);
  return data;
};

const refundReturnRequest = async (returnRequestId: string) => {
  const { data } = await api.post<ReturnRequest>(`/v1/returns/${returnRequestId}/refund`);
  return data;
};

export const ReturnApi = {
  getReturnRequestsByOrder,
  getMyReturnRequests,
  getAllReturnRequests,
  createReturnRequest,
  approveReturnRequest,
  rejectReturnRequest,
  refundReturnRequest,
};
