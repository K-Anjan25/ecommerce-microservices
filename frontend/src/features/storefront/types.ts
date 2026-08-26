export interface StoreSettings {
  /** Merchant identity used on invoices and customer emails. */
  storeName: string;
  storeTagline: string;
  supportEmail: string;
  invoiceFooterNote: string;
  announcementEnabled: boolean;
  announcementText: string;
  announcementTextHi: string;
  announcementLinkText: string;
  announcementLinkTextHi: string;
  announcementLinkUrl: string;
  heroEyebrow: string;
  heroEyebrowHi: string;
  heroTitle: string;
  heroTitleHi: string;
  heroEmphasis: string;
  heroEmphasisHi: string;
  heroDescription: string;
  heroDescriptionHi: string;
  primaryCtaLabel: string;
  primaryCtaLabelHi: string;
  secondaryCtaLabel: string;
  secondaryCtaLabelHi: string;
  freeShippingThreshold: number;
}

export const DEFAULT_STORE_SETTINGS: StoreSettings = {
  storeName: "Cartly",
  storeTagline: "",
  supportEmail: "",
  invoiceFooterNote: "",
  announcementEnabled: true,
  announcementText: "Free shipping over ₹999",
  announcementTextHi: "₹999 से ऊपर मुफ़्त डिलीवरी",
  announcementLinkText: "Flash sale live",
  announcementLinkTextHi: "फ्लैश सेल देखें",
  announcementLinkUrl: "/flash-sales",
  heroEyebrow: "The seasonal edit",
  heroEyebrowHi: "इस मौसम का चयन",
  heroTitle: "Curated finds",
  heroTitleHi: "चुनी हुई चीज़ें",
  heroEmphasis: "for home & life.",
  heroEmphasisHi: "घर और जीवन के लिए।",
  heroDescription:
    "Thoughtful objects, honest materials and everyday essentials selected to last.",
  heroDescriptionHi: "सोच-समझकर चुनी गई सुंदर और रोज़मर्रा की चीज़ें।",
  primaryCtaLabel: "Shop the collection",
  primaryCtaLabelHi: "कलेक्शन देखें",
  secondaryCtaLabel: "Explore the edit",
  secondaryCtaLabelHi: "एडिट देखें",
  freeShippingThreshold: 999,
};
