/**
 * Destination countries offered in address forms.
 *
 * India is the domestic market (GST, pincode courier rates, COD). The other
 * countries are served through international shipping zones — checkout quotes
 * them live from /v1/shipping/zones/quote, so a country only lights up as
 * deliverable when a staff-configured active zone covers it.
 */
export interface Country {
  code: string;
  name: string;
  /** International dialing code, e.g. +91. */
  dial: string;
}

export const INDIA: Country = { code: "IN", name: "India", dial: "+91" };

export const COUNTRIES: Country[] = [
  INDIA,
  { dial: "+61", code: "AU", name: "Australia" },
  { dial: "+973", code: "BH", name: "Bahrain" },
  { dial: "+32", code: "BE", name: "Belgium" },
  { dial: "+1", code: "CA", name: "Canada" },
  { dial: "+33", code: "FR", name: "France" },
  { dial: "+49", code: "DE", name: "Germany" },
  { dial: "+81", code: "JP", name: "Japan" },
  { dial: "+965", code: "KW", name: "Kuwait" },
  { dial: "+60", code: "MY", name: "Malaysia" },
  { dial: "+960", code: "MV", name: "Maldives" },
  { dial: "+230", code: "MU", name: "Mauritius" },
  { dial: "+977", code: "NP", name: "Nepal" },
  { dial: "+31", code: "NL", name: "Netherlands" },
  { dial: "+64", code: "NZ", name: "New Zealand" },
  { dial: "+968", code: "OM", name: "Oman" },
  { dial: "+974", code: "QA", name: "Qatar" },
  { dial: "+65", code: "SG", name: "Singapore" },
  { dial: "+27", code: "ZA", name: "South Africa" },
  { dial: "+82", code: "KR", name: "South Korea" },
  { dial: "+34", code: "ES", name: "Spain" },
  { dial: "+94", code: "LK", name: "Sri Lanka" },
  { dial: "+46", code: "SE", name: "Sweden" },
  { dial: "+41", code: "CH", name: "Switzerland" },
  { dial: "+66", code: "TH", name: "Thailand" },
  { dial: "+971", code: "AE", name: "United Arab Emirates" },
  { dial: "+44", code: "GB", name: "United Kingdom" },
  { dial: "+1", code: "US", name: "United States" },
];

export const countryName = (code?: string): string =>
  COUNTRIES.find((c) => c.code === (code ?? "IN"))?.name ?? "India";

export const isIndia = (code?: string): boolean => (code ?? "IN") === "IN";

/** Dialing code for a country, defaulting to India's +91. */
export const dialFor = (code?: string): string =>
  COUNTRIES.find((c) => c.code === (code ?? "IN"))?.dial ?? "+91";

/** Loose international postal code: 3–10 letters/digits/space/hyphen. */
export const POSTAL_CODE_RE = /^[A-Za-z0-9][A-Za-z0-9 -]{1,9}$/;
