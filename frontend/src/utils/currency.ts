/**
 * Display-currency switcher.
 *
 * The platform prices, taxes and **charges** in Indian Rupees (INR) — providers
 * settle INR even for foreign cards. This module only converts *displayed*
 * prices using fixed approximate reference rates so international visitors can
 * read the catalog in a familiar currency. Checkout always shows the real INR
 * charge next to the approximation.
 */

export interface DisplayCurrency {
  code: "INR" | "USD" | "EUR" | "GBP" | "AED" | "AUD";
  label: string;
  symbol: string;
  locale: string;

  /** INR → currency reference rate (approximate; display only). */
  rate: number;
}

export const DISPLAY_CURRENCIES: DisplayCurrency[] = [
  { code: "INR", label: "₹ INR", symbol: "₹", locale: "en-IN", rate: 1 },
  { code: "USD", label: "$ USD", symbol: "$", locale: "en-US", rate: 0.012 },
  { code: "EUR", label: "€ EUR", symbol: "€", locale: "de-DE", rate: 0.011 },
  { code: "GBP", label: "£ GBP", symbol: "£", locale: "en-GB", rate: 0.0095 },
  { code: "AED", label: "AED", symbol: "AED ", locale: "en-AE", rate: 0.044 },
  { code: "AUD", label: "A$ AUD", symbol: "A$", locale: "en-AU", rate: 0.018 },
];

const STORAGE_KEY = "cartly-display-currency";
export const CURRENCY_CHANGE_EVENT = "cartly-currency";

export const getDisplayCurrency = (): DisplayCurrency => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return DISPLAY_CURRENCIES.find((c) => c.code === stored) ?? DISPLAY_CURRENCIES[0];
  } catch {
    return DISPLAY_CURRENCIES[0];
  }
};

export const setDisplayCurrency = (code: DisplayCurrency["code"]) => {
  try {
    localStorage.setItem(STORAGE_KEY, code);
  } catch {
    /* storage unavailable */
  }
  window.dispatchEvent(new CustomEvent(CURRENCY_CHANGE_EVENT, { detail: code }));
};

export const isINR = (): boolean => getDisplayCurrency().code === "INR";

/** Convert an INR amount into the active display currency, formatted. */
export const formatPrice = (inrValue: number, options?: { forceINR?: boolean }): string => {
  const currency = options?.forceINR ? DISPLAY_CURRENCIES[0] : getDisplayCurrency();
  const converted = Number(inrValue) * currency.rate;
  return new Intl.NumberFormat(currency.locale, {
    style: "currency",
    currency: currency.code,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(converted);
};
