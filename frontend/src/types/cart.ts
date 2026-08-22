import { ThunkDispatch } from "redux-thunk";
import { Product, ProductAdmin } from "./product";

export interface Cart {
  product: Product | ProductAdmin;
  quantity: number;
  variantId?: string;
  variantName?: string;
}

/**
 * Identifies one cart line. A product can appear in multiple lines when it
 * has variants (one line per variant), so mutations must match on both.
 * undefined variantId only matches undefined (strict equality).
 */
export interface CartLineKey {
  productId: string;
  variantId?: string;
}

interface ADD_TO_CART {
  type: "ADD_TO_CART";
  payload: Cart;
}

interface REMOVE_FROM_CART {
  type: "REMOVE_FROM_CART";
  payload: CartLineKey;
}

interface DECREASE_PRODUCT_QUANTITY {
  type: "DECREASE_PRODUCT_QUANTITY";
  payload: CartLineKey;
}

interface INCREASE_PRODUCT_QUANTITY {
  type: "INCREASE_PRODUCT_QUANTITY";
  payload: CartLineKey;
}

interface CLEAR_ALL_ITEMS {
  type: "CLEAR_ALL_ITEMS";
}

export type CartAction =
  | ADD_TO_CART
  | REMOVE_FROM_CART
  | DECREASE_PRODUCT_QUANTITY
  | INCREASE_PRODUCT_QUANTITY
  | CLEAR_ALL_ITEMS;

export type CartState = Cart[];

export type CartDispatch = ThunkDispatch<CartState, void, CartAction>;
