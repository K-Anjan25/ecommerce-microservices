import { dialFor } from "../formdata/countries";

/** Per-country local number rules: length + first-digit pattern. */
export function isValidLocalNumber(dial: string, localNumber: string): boolean {
  const digits = localNumber.replace(/[\s-]/g, "");
  if (dial === "+91") return /^[6-9]\d{9}$/.test(digits);
  return /^\d{6,14}$/.test(digits);
}

/** Compose an E.164 phone (e.g. +919876543210) from dial code + local number. */
export function toE164(dial: string, localNumber: string): string {
  return `${dial}${localNumber.replace(/[\s-]/g, "")}`;
}

/** Split an E.164 phone into { dial, local } using the known country list. */
export function splitE164(phone?: string): { dial: string; local: string } {
  if (!phone) return { dial: "+91", local: "" };
  const match = phone.match(/^(\+\d{1,4})(\d{6,14})$/);
  if (!match) return { dial: "+91", local: phone };
  return { dial: match[1], local: match[2] };
}

/** Pretty label for a dial select, e.g. "+91 (India)". */
export function dialLabel(dial: string, name: string): string {
  return `${dial} (${name})`;
}

export { dialFor };
