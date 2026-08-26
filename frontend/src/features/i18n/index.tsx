import React, { createContext, useContext, useEffect, useMemo, useState } from "react";

export type Language = "en" | "hi";
const STORAGE_KEY = "cartly-language";

const messages = {
  en: {
    "nav.shop": "Shop", "nav.deals": "Deals", "nav.gifts": "Gift Cards", "nav.rewards": "Rewards",
    "nav.orders": "Orders", "nav.returns": "Returns", "nav.addresses": "Addresses", "nav.compare": "Compare", "nav.wishlist": "Wishlist",
    "nav.account": "Account", "nav.login": "Login", "nav.register": "Create account", "nav.logout": "Logout",
    "search.placeholder": "Search products, brands and categories", "search.action": "Search", "search.products": "Products",
    "search.hint": "Use ↑ ↓ to browse · Enter to search · Esc to close",
    "cart.label": "Your bag", "cart.empty": "Your bag is empty", "cart.explore": "Explore the collection",
    "cart.subtotal": "Subtotal", "cart.checkout": "Checkout", "cart.review": "Review bag", "cart.title": "Your cart", "cart.continue": "Continue shopping",
    "product.add": "Add to cart", "product.addMore": "Add one more", "product.view": "View product", "product.inCart": "in cart",
    "common.refine": "Refine", "common.clear": "Clear all", "common.loading": "Loading…", "common.skip": "Skip to content",
    "checkout.title": "Checkout", "checkout.total": "Total", "checkout.pay": "Pay now",
    "mobile.you": "You", "mobile.search": "Search", "mobile.cart": "Cart"
  },
  hi: {
    "nav.shop": "खरीदें", "nav.deals": "ऑफ़र", "nav.gifts": "गिफ़्ट कार्ड", "nav.rewards": "रिवॉर्ड्स",
    "nav.orders": "ऑर्डर", "nav.returns": "रिटर्न", "nav.addresses": "पते", "nav.compare": "तुलना", "nav.wishlist": "विशलिस्ट",
    "nav.account": "खाता", "nav.login": "लॉग इन", "nav.register": "खाता बनाएँ", "nav.logout": "लॉग आउट",
    "search.placeholder": "उत्पाद, ब्रांड और श्रेणियाँ खोजें", "search.action": "खोजें", "search.products": "उत्पाद",
    "search.hint": "चुनने के लिए ↑ ↓ · खोजने के लिए Enter · बंद करने के लिए Esc",
    "cart.label": "आपका बैग", "cart.empty": "आपका बैग खाली है", "cart.explore": "कलेक्शन देखें",
    "cart.subtotal": "उप-योग", "cart.checkout": "चेकआउट", "cart.review": "बैग की समीक्षा करें", "cart.title": "आपका कार्ट", "cart.continue": "खरीदारी जारी रखें",
    "product.add": "बैग में जोड़ें", "product.addMore": "एक और जोड़ें", "product.view": "उत्पाद देखें", "product.inCart": "बैग में",
    "common.refine": "फ़िल्टर", "common.clear": "सभी हटाएँ", "common.loading": "लोड हो रहा है…", "common.skip": "मुख्य सामग्री पर जाएँ",
    "checkout.title": "चेकआउट", "checkout.total": "कुल", "checkout.pay": "अभी भुगतान करें",
    "mobile.you": "आप", "mobile.search": "खोजें", "mobile.cart": "बैग"
  }
} as const;

type MessageKey = keyof typeof messages.en;
type I18nValue = { language: Language; locale: string; setLanguage: (language: Language) => void; toggleLanguage: () => void; t: (key: MessageKey) => string };
const I18nContext = createContext<I18nValue | null>(null);

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguage] = useState<Language>(
    () => (typeof window !== "undefined" && localStorage.getItem(STORAGE_KEY) === "hi") ? "hi" : "en"
  );
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, language);
    document.documentElement.lang = language;
  }, [language]);
  const value = useMemo<I18nValue>(() => ({
    language,
    locale: language === "hi" ? "hi-IN" : "en-IN",
    setLanguage,
    toggleLanguage: () => setLanguage((current) => current === "en" ? "hi" : "en"),
    t: (key) => messages[language][key] ?? messages.en[key],
  }), [language]);
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const value = useContext(I18nContext);
  if (!value) throw new Error("useI18n must be used inside I18nProvider");
  return value;
}
