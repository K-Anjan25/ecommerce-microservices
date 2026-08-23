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
  heroEyebrow: "The seasonal edit",
  heroTitle: "Curated finds",
  heroEmphasis: "for home & life.",
  heroDescription:
    "Thoughtful objects, honest materials and everyday essentials selected to last.",
  primaryCtaLabel: "Shop the collection",
  secondaryCtaLabel: "Explore the edit",
  freeShippingThreshold: 999,
};
