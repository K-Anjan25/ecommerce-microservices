import { api } from "./client";
import { EmailRetryAdmin, EmailRetryStatus } from "../types/emailRetry";

const list = async (status: EmailRetryStatus = "DEAD") => {
  const { data } = await api.get<EmailRetryAdmin[]>("/user/email-retries", {
    params: { status },
  });
  return data;
};

export const EmailRetryApi = { list };
