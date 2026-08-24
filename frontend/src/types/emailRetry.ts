export type EmailRetryStatus = "PENDING" | "DEAD";

export interface EmailRetryAdmin {
  id: string;
  status: EmailRetryStatus;
  attempts: number;
  createdAt: string;
  lastAttemptAt?: string;
  nextAttemptAt: string;
}
