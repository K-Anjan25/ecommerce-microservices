import { AccountForm } from "../types/account";
import { ProfileForm } from "../types/profile";
import { Login, UserCredentials, AdminUser } from "../types/user";
import { api } from "./client";

const getUserById = async (customerId: string) => {
  const { data } = await api.get<UserCredentials>(
    `/user/getById/${customerId}`
  );
  return data;
};

const requestPasswordReset = async (email: string) => {
  const { data } = await api.post(`/user/password-reset/request`, { email });
  return data;
};

const confirmPasswordReset = async (token: string, newPassword: string) => {
  const { data } = await api.post(`/user/password-reset/confirm`, { token, newPassword });
  return data;
};

const updateUser = async (profile: ProfileForm) => {
  const { data } = await api.put<Login>(`/user/update`, profile);
  return data;
};

const updatePassword = async (account: AccountForm) => {
  const { data } = await api.put<Login>(`/user/updatePassword`, account);
  return data;
};

// ---- Phone sign-in / sign-up (no SMS provider in preview: the OTP comes
// back as devCode and is logged by the service) ----

export interface PhoneOtpSent {
  expiresInSeconds: number;
  /** Present only when the backend has no SMS provider configured. */
  devCode: string | null;
}

const requestPhoneOtp = async (phone: string) => {
  const { data } = await api.post<PhoneOtpSent>("/user/otp/request", { phone });
  return data;
};

const verifyPhoneOtp = async (phone: string, code: string) => {
  const { data } = await api.post<Login>("/user/otp/verify", { phone, code });
  return data;
};

const registerPhone = async (payload: {
  phone: string;
  code: string;
  firstName: string;
  lastName: string;
  email?: string;
}) => {
  const { data } = await api.post<Login>("/user/phone/register", payload);
  return data;
};

const getAllUsers = async () => {
  const { data } = await api.get<AdminUser[]>(`/user/all`);
  return data;
};

const disableUser = async (userId: string) => {
  const { data } = await api.put(`/user/disable/${userId}`);
  return data;
};

const enableUser = async (userId: string) => {
  const { data } = await api.put(`/user/enable/${userId}`);
  return data;
};

const updateStaffRole = async (
  userId: string,
  role: "ROLE_USER" | "ROLE_MANAGER" | "ROLE_CS"
) => {
  const { data } = await api.put<AdminUser>(`/user/role/${userId}`, undefined, {
    params: { role },
  });
  return data;
};

const verifyMfa = async (email: string, code: string): Promise<Login> => {
  const { data } = await api.post<Login>(`/user/mfa/verify`, { email, code });
  return data;
};

const setMfaEnabled = async (enabled: boolean): Promise<{ mfaEnabled: boolean }> => {
  const { data } = await api.post<{ mfaEnabled: boolean }>(`/user/mfa`, { enabled });
  return data;
};

export const UserApi = {
  getUserById,
  requestPhoneOtp,
  verifyPhoneOtp,
  registerPhone,
  requestPasswordReset,
  confirmPasswordReset,
  updateUser,
  updatePassword,
  getAllUsers,
  disableUser,
  enableUser,
  updateStaffRole,
  verifyMfa,
  setMfaEnabled,
};
