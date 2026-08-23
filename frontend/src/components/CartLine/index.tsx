import React from "react";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import AddIcon from "@mui/icons-material/Add";
import RemoveIcon from "@mui/icons-material/Remove";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import ImageOutlinedIcon from "@mui/icons-material/ImageOutlined";

import {
  decreaseProductQuantity,
  increaseProductQuantity,
  removeFromCart,
} from "../../store/actions/cartAction";
import { Cart as CartItem } from "../../types/cart";
import { formatPrice } from "../../utils/cart";

/**
 * Compact cart line — wireframe 04.
 * The cart used to reuse the *grid* product card, which is a browse component:
 * 4:3 cover, description, compare button. A cart line only needs identity,
 * quantity, line total and remove.
 */
function CartLine({ item, readOnly = false }: { item: CartItem; readOnly?: boolean }) {
  const dispatch = useDispatch<any>();
  const navigate = useNavigate();
  const { product, quantity, variantId, variantName } = item;

  const unitPrice =
    variantId && product.variants
      ? product.variants.find((v) => v.id === variantId)?.price ?? product.unitPrice
      : product.unitPrice;

  const cover = product.images?.[0] || product.imageUrl;
  const stock = product.quantityInStock ?? 0;

  return (
    <li className="flex gap-4 py-4 first:pt-0 last:pb-0">
      <button
        onClick={() => navigate(`/products/${product.id}`)}
        className="h-20 w-20 shrink-0 overflow-hidden rounded-sm border border-line bg-sunken sm:h-24 sm:w-24"
        aria-label={`View ${product.name}`}
      >
        {cover ? (
          <img src={cover} alt="" loading="lazy" className="h-full w-full object-cover" />
        ) : (
          <span className="flex h-full items-center justify-center text-ink-faint">
            <ImageOutlinedIcon />
          </span>
        )}
      </button>

      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <button
              onClick={() => navigate(`/products/${product.id}`)}
              className="block truncate text-left font-heading text-sm font-bold text-ink hover:underline sm:text-[0.9375rem]"
            >
              {product.name}
            </button>
            <p className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-ink-muted">
              {product.brand && <span className="font-semibold uppercase">{product.brand}</span>}
              {variantName && (
                <span className="chip !px-2 !py-0.5 !text-[0.625rem]">{variantName}</span>
              )}
            </p>
          </div>
          <p className="shrink-0 text-right">
            <span className="price-text text-sm sm:text-base">
              {formatPrice(unitPrice * quantity)}
            </span>
            {quantity > 1 && (
              <span className="block text-[0.6875rem] text-ink-muted">
                {formatPrice(unitPrice)} each
              </span>
            )}
          </p>
        </div>

        {stock > 0 && stock <= 5 && (
          <span className="badge-stock-low w-fit">Only {stock} left</span>
        )}
        {stock <= 0 && <span className="badge-stock-out w-fit">Out of stock</span>}

        {!readOnly && (
          <div className="mt-auto flex items-center justify-between gap-3 pt-2">
            <div className="flex h-9 items-center rounded-sm border border-line bg-paper">
              <button
                aria-label="Decrease quantity"
                onClick={() =>
                  quantity <= 1
                    ? dispatch(removeFromCart(product.id, variantId))
                    : dispatch(decreaseProductQuantity(product.id, variantId))
                }
                className="flex h-full w-9 items-center justify-center text-ink transition hover:bg-sunken"
              >
                <RemoveIcon sx={{ fontSize: 15 }} />
              </button>
              <span className="min-w-8 text-center text-sm font-bold">{quantity}</span>
              <button
                aria-label="Increase quantity"
                onClick={() => dispatch(increaseProductQuantity(product.id, variantId))}
                className="flex h-full w-9 items-center justify-center text-ink transition hover:bg-sunken"
              >
                <AddIcon sx={{ fontSize: 15 }} />
              </button>
            </div>

            <button
              onClick={() => dispatch(removeFromCart(product.id, variantId))}
              className="flex items-center gap-1 text-xs font-semibold text-ink-muted transition hover:text-state-danger"
            >
              <DeleteOutlineIcon sx={{ fontSize: 16 }} />
              Remove
            </button>
          </div>
        )}
      </div>
    </li>
  );
}

export default CartLine;
