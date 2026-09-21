import { formatPrice as formatDisplayPrice } from "./currency";
import { Cart } from "../types/cart";

export const calculateCountOfCartItems = (items: Cart[]) => {
  return items.reduce((accumalator, item) => accumalator + item.quantity, 0);
};

export const calculateTotalPriceOfCartItems = (items: Cart[]) => {
  return items
    .reduce((accumalator, item) => {
      const price =
        item.variantId && item.product.variants
          ? item.product.variants.find((v) => v.id === item.variantId)?.price ?? item.product.unitPrice
          : item.product.unitPrice;
      return accumalator + item.quantity * price;
    }, 0)
    .toFixed(2);
};

export const calculateTotalPriceOfOneProduct = (
  unitPrice: number,
  quantity: number
) => {
  return Math.round(unitPrice * quantity * 100) / 100;
};

/**
 * Money formatter for the whole storefront. Amounts are stored and charged in
 * INR; the display currency (utils/currency) converts for international
 * visitors and always renders INR values verbatim when INR is selected.
 */
export const formatPrice = (value: number) => {
  return formatDisplayPrice(Number(value));
};
