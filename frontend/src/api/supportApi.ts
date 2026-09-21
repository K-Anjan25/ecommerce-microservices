import { api } from "./client";

export type SupportTicketStatus = "OPEN" | "IN_PROGRESS" | "RESOLVED";

export interface CreateSupportTicketPayload {
  name: string;
  email: string;
  topic: string;
  orderNumber?: string;
  message: string;
}

export interface SupportTicket {
  id?: string;
  ticketRef: string;
  name: string;
  email: string;
  topic: string;
  orderNumber?: string | null;
  message: string;
  status: SupportTicketStatus;
  createdAt: string;
  updatedAt?: string;
}

export const SUPPORT_TOPICS = [
  "Order issue",
  "Returns & refunds",
  "Payments & billing",
  "Account & sign-in",
  "Product question",
  "Feedback",
  "Other",
] as const;

/** Public: raises a ticket from the storefront contact form. */
export const createSupportTicket = async (payload: CreateSupportTicketPayload) => {
  const { data } = await api.post<SupportTicket>("/v1/support/tickets", payload);
  return data;
};
