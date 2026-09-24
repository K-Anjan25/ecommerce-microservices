import { Cart } from "../types/cart";

/**
 * "Save for later" — items parked from the cart, persisted locally so they
 * survive reloads. Kept out of Redux on purpose: it is per-browser UI state,
 * unlike the cart which is part of the checkout flow.
 */

const KEY = "cartly-save-for-later";

const sameLine = (
  line: { product: { id: string }; variantId?: string },
  key: { productId: string; variantId?: string }
) => line.product.id === key.productId && line.variantId === key.variantId;

export const loadSavedForLater = (): Cart[] => {
  try {
    const raw = localStorage.getItem(KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const persist = (items: Cart[]) => {
  try {
    localStorage.setItem(KEY, JSON.stringify(items));
  } catch {
    /* storage unavailable */
  }
};

export const saveForLater = (items: Cart[], line: Cart): Cart[] => {
  const next = [
    line,
    ...items.filter((item) => !sameLine(item, { productId: line.product.id, variantId: line.variantId })),
  ];
  persist(next);
  return next;
};

export const removeFromSaved = (items: Cart[], key: { productId: string; variantId?: string }): Cart[] => {
  const next = items.filter((item) => !sameLine(item, key));
  persist(next);
  return next;
};
