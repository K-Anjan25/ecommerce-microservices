/**
 * Recently-viewed products — Amazon-style "Your recently viewed items".
 *
 * Snapshots are stored in localStorage the moment a product page loads, so
 * the home-page strip renders instantly with zero API calls. Capped at 12,
 * newest first, de-duplicated by id.
 */

export interface ViewedProductSnapshot {
  id: string;
  name: string;
  unitPrice: number;
  imageUrl?: string;
  brand?: string;
  at?: number;
}

const KEY = "cartly-recently-viewed";
const CAP = 12;

export const recordRecentlyViewed = (product: ViewedProductSnapshot): void => {
  if (typeof window === "undefined" || !product?.id) return;
  try {
    const rest = getRecentlyViewed().filter((item) => item.id !== product.id);
    const next = [{ ...product, at: Date.now() }, ...rest].slice(0, CAP);
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    /* storage unavailable (private mode/quota) — feature silently degrades */
  }
};

export const getRecentlyViewed = (excludeId?: string): ViewedProductSnapshot[] => {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const list = JSON.parse(raw) as ViewedProductSnapshot[];
    if (!Array.isArray(list)) return [];
    return list.filter(
      (item) =>
        item &&
        typeof item.id === "string" &&
        item.id !== excludeId &&
        typeof item.name === "string"
    );
  } catch {
    return [];
  }
};

export const clearRecentlyViewed = (): void => {
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
};
