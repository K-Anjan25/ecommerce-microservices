export interface StoreSettings {
  announcementEnabled: boolean;
  announcementText: string;
  announcementLinkText: string;
  announcementLinkUrl: string;
  heroEyebrow: string;
  heroTitle: string;
  heroEmphasis: string;
  heroDescription: string;
  primaryCtaLabel: string;
  secondaryCtaLabel: string;
  freeShippingThreshold: number;
}

export const DEFAULT_STORE_SETTINGS: StoreSettings = {
  announcementEnabled: true,
  announcementText: "Free shipping over ₹999",
  announcementLinkText: "Flash sale live",
  announcementLinkUrl: "/flash-sales",
  heroEyebrow: "New season · 2026",
  heroTitle: "Everything you",
  heroEmphasis: "need, one cart.",
  heroDescription:
    "A catalog you can actually search, a checkout that doesn't fight you, and rewards that stack.",
  primaryCtaLabel: "Shop the catalog",
  secondaryCtaLabel: "View flash sales",
  freeShippingThreshold: 999,
};
