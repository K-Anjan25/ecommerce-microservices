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

const resetPassword = async (gmail: string) => {
  const { data } = await api.get<UserCredentials>(
    `/user/resetpassword/${gmail}`
  );
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

const updateStaffRole = async (userId: string, role: "ROLE_USER" | "ROLE_MANAGER") => {
  const { data } = await api.put<AdminUser>(`/user/role/${userId}`, undefined, {
    params: { role },
  });
  return data;
};

export const UserApi = {
  getUserById,
  resetPassword,
  updateUser,
  updatePassword,
  getAllUsers,
  disableUser,
  enableUser,
  updateStaffRole,
};
