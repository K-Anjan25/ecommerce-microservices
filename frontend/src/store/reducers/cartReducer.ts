import { CartAction, CartState } from "../../types/cart";

const defaultState: CartState = [];

const cartReducer = (state: CartState = defaultState, action: CartAction) => {
  switch (action.type) {
    case "ADD_TO_CART": {
      const existing = state.find(
        (cart) => cart.product.id === action.payload.product.id && cart.variantId === action.payload.variantId
      );
      if (existing) {
        return state.map((cart) =>
          cart.product.id === action.payload.product.id && cart.variantId === action.payload.variantId
            ? { ...cart, quantity: cart.quantity + action.payload.quantity }
            : cart
        );
      }
      return [...state, action.payload];
    }
    case "REMOVE_FROM_CART":
      return state.filter((cart) => cart.product.id !== action.payload);
    case "INCREASE_PRODUCT_QUANTITY":
      return state.map((cart) =>
        cart.product.id === action.payload
          ? { ...cart, quantity: cart.quantity + 1 }
          : cart
      );
    case "DECREASE_PRODUCT_QUANTITY":
      return state.map((cart) =>
        cart.product.id === action.payload
          ? { ...cart, quantity: Math.max(1, cart.quantity - 1) }
          : cart
      );
    case "CLEAR_ALL_ITEMS":
      return [];
    default:
      return state;
  }
};

export default cartReducer;
