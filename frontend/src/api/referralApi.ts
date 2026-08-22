import { api } from "./axios";

const getMyReferralCode = async () => {
  const { data } = await api.get<string>("/user/referral/code");
  return data;
};

const validateReferralCode = async (code: string) => {
  const { data } = await api.get<boolean>(`/user/referral/validate/${code}`);
  return data;
};

export const ReferralApi = {
  getMyReferralCode,
  validateReferralCode,
};
