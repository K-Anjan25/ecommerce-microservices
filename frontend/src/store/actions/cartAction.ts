import { Cart, CartDispatch } from "../../types/cart";

export const addToCart = (cart: Cart) => (dispatch: CartDispatch) => {
  dispatch({ type: "ADD_TO_CART", payload: cart });
};

export const removeFromCart =
  (productId: string, variantId?: string) => (dispatch: CartDispatch) => {
    dispatch({
      type: "REMOVE_FROM_CART",
      payload: { productId, variantId },
    });
  };

export const decreaseProductQuantity =
  (productId: string, variantId?: string) => (dispatch: CartDispatch) => {
    dispatch({
      type: "DECREASE_PRODUCT_QUANTITY",
      payload: { productId, variantId },
    });
  };

export const increaseProductQuantity =
  (productId: string, variantId?: string) => (dispatch: CartDispatch) => {
    dispatch({
      type: "INCREASE_PRODUCT_QUANTITY",
      payload: { productId, variantId },
    });
  };

export const clearAllItems = () => (dispatch: CartDispatch) => {
  dispatch({ type: "CLEAR_ALL_ITEMS" });
};
