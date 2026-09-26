import { Membership, MembershipPlan } from "../types/membership";
import { api } from "./client";

// Cartly Plus membership — join / manage. Prices are fixed server-side.
const status = async () => {
  const { data } = await api.get<Membership>("/v1/memberships");
  return data;
};

const join = async (plan: MembershipPlan) => {
  const { data } = await api.post<Membership>("/v1/memberships/join", { plan });
  return data;
};

/** Keep benefits until the period end; stops the auto-renew charge. */
const cancel = async () => {
  const { data } = await api.post<Membership>("/v1/memberships/cancel", {});
  return data;
};

const setAutoRenew = async (enabled: boolean) => {
  const { data } = await api.post<Membership>("/v1/memberships/auto-renew", { enabled });
  return data;
};

export const MembershipApi = {
  status,
  join,
  cancel,
  setAutoRenew,
};
