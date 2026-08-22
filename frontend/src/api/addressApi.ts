import { SavedAddress } from "../types/address";
import { api } from "./axios";

const getSavedAddresses = async () => {
  const { data } = await api.get<SavedAddress[]>("/v1/addresses");
  return data;
};

const getDefaultAddress = async () => {
  const { data } = await api.get<SavedAddress>("/v1/addresses/default");
  return data;
};

const createSavedAddress = async (address: Omit<SavedAddress, "id">) => {
  const { data } = await api.post<SavedAddress>("/v1/addresses", address);
  return data;
};

const deleteSavedAddress = async (addressId: string) => {
  await api.delete(`/v1/addresses/${addressId}`);
};

export const AddressApi = {
  getSavedAddresses,
  getDefaultAddress,
  createSavedAddress,
  deleteSavedAddress,
};
