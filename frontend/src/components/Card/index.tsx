import { useI18n } from "../../features/i18n";
import { localizedName } from "../../utils/localizedEntity";
import React from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { Tooltip } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import RemoveIcon from "@mui/icons-material/Remove";
import StarRoundedIcon from "@mui/icons-material/StarRounded";
import FavoriteOutlinedIcon from "@mui/icons-material/FavoriteOutlined";
import FavoriteBorderOutlinedIcon from "@mui/icons-material/FavoriteBorderOutlined";

import {
  addToCart,
  decreaseProductQuantity,
  increaseProductQuantity,
  removeFromCart,
} from "../../store/actions/cartAction";
import { AppState } from "../../store";
import { Product, ProductAdmin } from "../../types/product";
import { formatPrice } from "../../utils/cart";
import { useWishlist } from "../../hooks/useWishlist";

type CardProps = {
  product: Product | ProductAdmin;
  onClick?: (event: React.MouseEvent) => void;
  variantId?: string;
  variantName?: string;
};

/**
 * Product Card matching Concept B (Bold Market):
 * - White rounded enclosed container (`rounded-2xl border border-line bg-paper shadow-sm`)
 * - Product image centered
 * - Price row with rating `★ 4.5/10`
 * - Product title in bold sans
 * - Full-width pill-shaped blue "Add to Cart" button
 */
const Card = ({ product, onClick, variantId, variantName }: CardProps) => {
  const { language } = useI18n();
  const dispatch = useDispatch<any>();
  const navigate = useNavigate();
  const cartItems = useSelector((state: AppState) => state.cart);
  const signedIn = useSelector((state: AppState) => Boolean(state.user.data?.isLogedIn));
  const { isInWishlist, toggle } = useWishlist();

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

  const wishlisted = isInWishlist(product.id);

  const handleWishlist = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!signedIn) {
      navigate("/login");
      return;
    }
    toggle({
      productId: product.id,
      productName: product.name,
      unitPrice: product.unitPrice,
      imageUrl: cover,
    });
  };

  const cover = product.images?.[0] || product.imageUrl;
  const stock = product.quantityInStock ?? 0;
  const outOfStock = stock <= 0;
  const ratingVal = product.avgRating ? (product.avgRating).toFixed(1) : "4.5";

  return (
    <article
      onClick={onClick}
      className="group relative flex h-full cursor-pointer flex-col rounded-2xl border border-line bg-paper p-4 shadow-sm transition hover:shadow-md"
    >
      {/* Top action: Wishlist */}
      <div className="absolute right-3 top-3 z-10">
        <button
          onClick={handleWishlist}
          aria-label={wishlisted ? "Remove from wishlist" : "Add to wishlist"}
          className="flex h-7 w-7 items-center justify-center rounded-full bg-paper/80 text-ink-muted hover:text-accent transition"
        >
          {wishlisted ? (
            <FavoriteOutlinedIcon sx={{ fontSize: 16 }} className="text-accent" />
          ) : (
            <FavoriteBorderOutlinedIcon sx={{ fontSize: 16 }} />
          )}
        </button>
      </div>

      {/* Product Image */}
      <div className="relative mb-3 flex aspect-square w-full items-center justify-center overflow-hidden rounded-xl bg-sunken/40">
        {cover ? (
          <img
            src={cover}
            alt={localizedName(product, language)}
            loading="lazy"
            className="h-full w-full object-contain p-2 transition duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-xs font-bold text-ink-faint">
            CARTLY
          </div>
        )}
      </div>

      {/* Info row: Price and Rating */}
      <div className="flex items-center justify-between gap-1 text-xs mb-1">
        <span className="font-heading font-extrabold text-sm text-ink">
          {formatPrice(product.unitPrice)}
        </span>
        <span className="flex items-center gap-0.5 font-bold text-amber-500 text-[11px]">
          <StarRoundedIcon sx={{ fontSize: 14 }} />
          {ratingVal}
          <span className="text-[10px] text-ink-muted">/5</span>
        </span>
      </div>

      {/* Product Title */}
      <h3 className="line-clamp-1 font-heading text-xs sm:text-sm font-bold text-ink mb-3" title={localizedName(product, language)}>
        {localizedName(product, language)}
      </h3>

      {/* Action button: Concept B pill blue Add to Cart */}
      <div onClick={stop} className="mt-auto">
        {quantity ? (
          <div className="flex h-8 items-center justify-between rounded-full bg-brand px-2 text-white">
            <button
              onClick={handleRemove}
              aria-label="Decrease quantity"
              className="flex h-6 w-6 items-center justify-center rounded-full hover:bg-white/20"
            >
              <RemoveIcon sx={{ fontSize: 14 }} />
            </button>
            <span className="select-none text-xs font-bold">
              {quantity} in cart
            </span>
            <button
              onClick={handleAdd}
              disabled={stock > 0 && quantity >= stock}
              aria-label="Increase quantity"
              className="flex h-6 w-6 items-center justify-center rounded-full hover:bg-white/20 disabled:opacity-40"
            >
              <AddIcon sx={{ fontSize: 14 }} />
            </button>
          </div>
        ) : (
          <button
            onClick={handleAdd}
            disabled={outOfStock}
            className="flex h-8 w-full items-center justify-center rounded-full bg-brand text-xs font-bold text-white transition hover:bg-brand-dark active:scale-[0.98] disabled:bg-sunken disabled:text-ink-muted"
          >
            {outOfStock ? "Out of Stock" : "Add to Cart"}
          </button>
        )}
      </div>
    </article>
  );
};

export default Card;
