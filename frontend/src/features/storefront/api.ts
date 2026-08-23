import { api } from "../../api/client";
import { StoreSettings } from "./types";

const get = async () => {
  const { data } = await api.get<StoreSettings>("/v1/store-settings");
  return data;
};

const update = async (settings: StoreSettings) => {
  const { data } = await api.put<StoreSettings>("/v1/store-settings", settings);
  return data;
};

export const StoreSettingsApi = { get, update };
