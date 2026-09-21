/**
 * Destination countries offered in address forms.
 *
 * The storefront currently ships across India only (see checkout) —
 * international addresses can be saved and will light up automatically once
 * international shipping rates exist. Keep the list curated and sorted.
 */
export interface Country {
  code: string;
  name: string;
}

export const INDIA: Country = { code: "IN", name: "India" };

export const COUNTRIES: Country[] = [
  INDIA,
  { code: "AU", name: "Australia" },
  { code: "BH", name: "Bahrain" },
  { code: "BE", name: "Belgium" },
  { code: "CA", name: "Canada" },
  { code: "FR", name: "France" },
  { code: "DE", name: "Germany" },
  { code: "JP", name: "Japan" },
  { code: "KW", name: "Kuwait" },
  { code: "MY", name: "Malaysia" },
  { code: "MV", name: "Maldives" },
  { code: "MU", name: "Mauritius" },
  { code: "NP", name: "Nepal" },
  { code: "NL", name: "Netherlands" },
  { code: "NZ", name: "New Zealand" },
  { code: "OM", name: "Oman" },
  { code: "QA", name: "Qatar" },
  { code: "SG", name: "Singapore" },
  { code: "ZA", name: "South Africa" },
  { code: "KR", name: "South Korea" },
  { code: "ES", name: "Spain" },
  { code: "LK", name: "Sri Lanka" },
  { code: "SE", name: "Sweden" },
  { code: "CH", name: "Switzerland" },
  { code: "TH", name: "Thailand" },
  { code: "AE", name: "United Arab Emirates" },
  { code: "GB", name: "United Kingdom" },
  { code: "US", name: "United States" },
];

export const countryName = (code?: string): string =>
  COUNTRIES.find((c) => c.code === (code ?? "IN"))?.name ?? "India";

export const isIndia = (code?: string): boolean => (code ?? "IN") === "IN";

/** Loose international postal code: 3–10 letters/digits/space/hyphen. */
export const POSTAL_CODE_RE = /^[A-Za-z0-9][A-Za-z0-9 -]{1,9}$/;
