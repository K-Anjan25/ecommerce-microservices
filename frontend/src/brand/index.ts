export { default as BrandMark } from "./BrandMark";
export { default as PaymentMarks } from "./PaymentMarks";

export const BRAND = {
  name: "Cartly",
  wordmark: "CARTLY",
  tagline: "One modern multi-category marketplace",
  promise: "High quality products across electronics, fashion, home, and more.",
  voice: ["bold", "direct", "energetic", "reliable"] as const,
} as const;
