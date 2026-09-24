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
  heroEyebrow: "Fresh drops every week",
  heroEyebrowHi: "हर हफ़्ते नए प्रोडक्ट",
  heroTitle: "Explore. Shop.",
  heroTitleHi: "खोजें। खरीदें।",
  heroEmphasis: "Everyday essentials, delivered fast.",
  heroEmphasisHi: "रोज़मर्रा का सामान, तेज़ डिलीवरी।",
  heroDescription:
    "One modern multi-category marketplace for high quality tech, home & everyday essentials.",
  heroDescriptionHi: "तकनीक, घर और रोज़मर्रा की ज़रूरतों के लिए एक आधुनिक मार्केटप्लेस।",
  primaryCtaLabel: "Shop Now",
  primaryCtaLabelHi: "अभी खरीदें",
  secondaryCtaLabel: "See today's deals",
  secondaryCtaLabelHi: "आज की डील देखें",
  freeShippingThreshold: 999,
};
