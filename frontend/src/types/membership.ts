export type MembershipStatus = "NONE" | "ACTIVE" | "EXPIRED";
export type MembershipPlan = "MONTHLY" | "ANNUAL";

export interface Membership {
  status: MembershipStatus;
  plan?: MembershipPlan | null;
  pricePaid?: number | null;
  startedAt?: string | null;
  currentPeriodEnd?: string | null;
  autoRenew?: boolean;
  userId?: string | null;
}
