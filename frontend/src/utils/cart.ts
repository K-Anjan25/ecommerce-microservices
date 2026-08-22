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

export const formatPrice = (value: number) => {
  return `₹ ${Number(value).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};
