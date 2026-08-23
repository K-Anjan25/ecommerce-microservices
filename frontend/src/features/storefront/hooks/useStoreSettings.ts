import { useQuery } from "react-query";
import { StoreSettingsApi } from "../api";
import { DEFAULT_STORE_SETTINGS } from "../types";

/** One canonical storefront-content query shared by shell, home and admin. */
export function useStoreSettings() {
  const query = useQuery("store-settings", StoreSettingsApi.get, {
    staleTime: 5 * 60 * 1000,
    retry: false,
  });

  return {
    ...query,
    settings: query.data ?? DEFAULT_STORE_SETTINGS,
  };
}
