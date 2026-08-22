import { CartAction, CartState } from "../../types/cart";

const defaultState: CartState = [];

// A cart line is identified by (productId, variantId): the same product can
// be in the cart once per variant. undefined variantId must only match
// undefined (strict equality — not null or anything else).
const sameLine = (
  line: { product: { id: string }; variantId?: string },
  key: { productId: string; variantId?: string }
) => line.product.id === key.productId && line.variantId === key.variantId;

const cartReducer = (state: CartState = defaultState, action: CartAction) => {
  switch (action.type) {
    case "ADD_TO_CART": {
      const existing = state.find((line) => sameLine(line, { productId: action.payload.product.id, variantId: action.payload.variantId }));
      if (existing) {
        return state.map((line) =>
          sameLine(line, { productId: action.payload.product.id, variantId: action.payload.variantId })
            ? { ...line, quantity: line.quantity + action.payload.quantity }
            : line
        );
      }
      return [...state, action.payload];
    }
    case "REMOVE_FROM_CART":
      return state.filter((line) => !sameLine(line, action.payload));
    case "INCREASE_PRODUCT_QUANTITY":
      return state.map((line) =>
        sameLine(line, action.payload)
          ? { ...line, quantity: line.quantity + 1 }
          : line
      );
    case "DECREASE_PRODUCT_QUANTITY":
      return state.map((line) =>
        sameLine(line, action.payload)
          ? { ...line, quantity: Math.max(1, line.quantity - 1) }
          : line
      );
    case "CLEAR_ALL_ITEMS":
      return [];
    default:
      return state;
  }
};

export default cartReducer;
