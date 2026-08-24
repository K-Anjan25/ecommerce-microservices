import { useQuery } from "react-query";
import { useI18n } from "../../i18n";
import { StoreSettingsApi } from "../api";
import { DEFAULT_STORE_SETTINGS, StoreSettings } from "../types";

const HINDI_FIELDS: (keyof StoreSettings)[] = [
  "announcementText",
  "announcementLinkText",
  "heroEyebrow",
  "heroTitle",
  "heroEmphasis",
  "heroDescription",
  "primaryCtaLabel",
  "secondaryCtaLabel",
];

/** One canonical storefront-content query shared by shell, home and admin. */
export function useStoreSettings() {
  const { language } = useI18n();
  const query = useQuery("store-settings", StoreSettingsApi.get, {
    staleTime: 5 * 60 * 1000,
    retry: false,
  });

  const source = query.data ?? DEFAULT_STORE_SETTINGS;
  const settings = language === "hi"
    ? HINDI_FIELDS.reduce((localized, field) => {
        const hindiField = `${field}Hi` as keyof StoreSettings;
        const hindiValue = source[hindiField];
        return { ...localized, [field]: hindiValue || source[field] };
      }, source)
    : source;

  return {
    ...query,
    settings,
  };
}
