import React from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { Tooltip } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import RemoveIcon from "@mui/icons-material/Remove";
import AddShoppingCartIcon from "@mui/icons-material/AddShoppingCart";
import ImageOutlinedIcon from "@mui/icons-material/ImageOutlined";
import CompareArrowsIcon from "@mui/icons-material/CompareArrows";
import StarRoundedIcon from "@mui/icons-material/StarRounded";

import {
  addToCart,
  decreaseProductQuantity,
  increaseProductQuantity,
  removeFromCart,
} from "../../store/actions/cartAction";
import { AppState } from "../../store";
import { Product, ProductAdmin } from "../../types/product";
import { formatPrice } from "../../utils/cart";
import { addToCompare, isInCompare } from "../../utils/compare";
import { showSuccess } from "../../utils/showSuccess";

type CardProps = {
  product: Product | ProductAdmin;
  onClick?: (event: React.MouseEvent) => void;
  /** Cart-line variant context: pass when the card represents a specific cart line. */
  variantId?: string;
  variantName?: string;
};

/**
 * Product card — wireframe 07 "anatomy".
 *
 * Layout order (top → bottom): cover · badges (top-left) · wishlist/compare
 * (top-right) · brand eyebrow · name · rating · price row · full-width
 * add-to-cart bar that slides up on hover (always visible on touch).
 */
const Card = ({ product, onClick, variantId, variantName }: CardProps) => {
  const dispatch = useDispatch<any>();
  const navigate = useNavigate();
  const cartItems = useSelector((state: AppState) => state.cart);
  const quantity =
    cartItems.find(
      (item) => item.product.id === product.id && item.variantId === variantId
    )?.quantity ?? 0;

  const stop = (e: React.MouseEvent) => e.stopPropagation();

  const handleAdd = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (quantity === 0) {
      dispatch(addToCart({ product, quantity: 1, variantId, variantName }));
    } else {
      dispatch(increaseProductQuantity(product.id, variantId));
    }
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (quantity <= 1) {
      dispatch(removeFromCart(product.id, variantId));
    } else {
      dispatch(decreaseProductQuantity(product.id, variantId));
    }
  };

  const handleCompare = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isInCompare(product.id)) {
      navigate("/compare");
      return;
    }
    addToCompare(product.id);
    showSuccess(`${product.name} added to compare`);
  };

  const categoryName =
    "categoryName" in product ? product.categoryName : product.category?.name;
  const cover = product.images?.[0] || product.imageUrl;
  const stock = product.quantityInStock ?? 0;
  const outOfStock = stock <= 0;
  const onSale = !!product.originalPrice && product.originalPrice > product.unitPrice;
  const discount = onSale
    ? Math.round(((product.originalPrice! - product.unitPrice) / product.originalPrice!) * 100)
    : 0;

  return (
    <article
      onClick={onClick}
      className="group relative flex h-full cursor-pointer flex-col overflow-hidden rounded-lg border border-line bg-paper transition duration-200 hover:-translate-y-1 hover:border-ink-faint hover:shadow-lift"
    >
      {/* ── cover ─────────────────────────────────────────────────────── */}
      <div className="relative aspect-[4/3] overflow-hidden bg-sunken">
        {cover ? (
          <img
            src={cover}
            alt={product.name}
            loading="lazy"
            className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.06]"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-ink-faint">
            <ImageOutlinedIcon sx={{ fontSize: 38 }} />
          </div>
        )}

        {/* badges — top-left stack */}
        <div className="absolute left-2.5 top-2.5 flex flex-col items-start gap-1.5">
          {onSale && <span className="badge-sale">−{discount}%</span>}
          {product.badge && !onSale && (
            <span className="badge-sale !bg-contrast">{product.badge}</span>
          )}
          {product.flashSaleActive && (
            <span className="badge-sale !bg-brand">Flash</span>
          )}
        </div>

        {/* compare — top-right */}
        <div className="absolute right-2.5 top-2.5 flex flex-col gap-1.5">
          <Tooltip title="Compare" placement="left">
            <button
              onClick={handleCompare}
              aria-label="Add to compare"
              className={`flex h-8 w-8 items-center justify-center rounded-full border backdrop-blur transition ${
                isInCompare(product.id)
                  ? "border-brand bg-brand text-oncontrast"
                  : "border-line bg-paper/90 text-ink-soft hover:border-ink hover:text-ink"
              }`}
            >
              <CompareArrowsIcon sx={{ fontSize: 16 }} />
            </button>
          </Tooltip>
        </div>

        {/* stock — bottom-left, quiet unless it matters */}
        {(outOfStock || stock <= 5) && (
          <span
            className={`absolute bottom-2.5 left-2.5 ${
              outOfStock ? "badge-stock-out" : "badge-stock-low"
            }`}
          >
            {outOfStock ? "Out of stock" : `Only ${stock} left`}
          </span>
        )}
      </div>

      {/* ── body ──────────────────────────────────────────────────────── */}
      <div className="flex flex-1 flex-col gap-1 p-3.5 pb-14 sm:p-4 sm:pb-16">
        <p className="text-eyebrow truncate font-bold uppercase text-ink-muted">
          {product.brand || categoryName || "Cartly"}
        </p>

        <h3 className="line-clamp-2 font-heading text-sm font-semibold leading-snug text-ink sm:text-[0.9375rem]">
          {product.name}
        </h3>

        {variantName && (
          <span className="chip !px-2.5 !py-0.5 !text-[0.625rem] w-fit">{variantName}</span>
        )}

        {!!product.ratingCount && (
          <p className="flex items-center gap-1 text-xs text-ink-soft">
            <StarRoundedIcon sx={{ fontSize: 15 }} className="text-amber-500" />
            <span className="font-semibold text-ink">{product.avgRating?.toFixed(1)}</span>
            <span className="text-ink-muted">({product.ratingCount})</span>
          </p>
        )}

        <div className="mt-auto flex items-baseline gap-2 pt-2">
          <span className="price-text text-base sm:text-lg">
            {formatPrice(product.unitPrice)}
          </span>
          {onSale && (
            <span className="text-xs text-ink-muted line-through">
              {formatPrice(product.originalPrice!)}
            </span>
          )}
        </div>
      </div>

      {/* ── action bar — docked to the card foot ─────────────────────── */}
      <div
        onClick={stop}
        className="absolute inset-x-0 bottom-0 p-2.5"
      >
        {quantity ? (
          <div className="flex h-10 items-center justify-between rounded-sm bg-contrast px-1.5 text-oncontrast">
            <button
              onClick={handleRemove}
              aria-label="Decrease quantity"
              className="flex h-8 w-8 items-center justify-center rounded-xs transition hover:bg-white/10"
            >
              <RemoveIcon sx={{ fontSize: 16 }} />
            </button>
            <span className="text-sm font-bold">{quantity} in cart</span>
            <button
              onClick={handleAdd}
              aria-label="Increase quantity"
              className="flex h-8 w-8 items-center justify-center rounded-xs transition hover:bg-white/10"
            >
              <AddIcon sx={{ fontSize: 16 }} />
            </button>
          </div>
        ) : outOfStock ? (
          <button
            onClick={onClick}
            className="flex h-10 w-full items-center justify-center rounded-sm border border-line bg-paper text-xs font-bold uppercase tracking-wide text-ink-soft"
          >
            View product
          </button>
        ) : (
          <button
            onClick={handleAdd}
            className="flex h-10 w-full items-center justify-center gap-2 rounded-sm bg-contrast text-xs font-bold text-oncontrast transition hover:bg-brand sm:text-sm"
          >
            <AddShoppingCartIcon sx={{ fontSize: 16 }} />
            Add to cart
          </button>
        )}
      </div>
    </article>
  );
};

export default Card;
