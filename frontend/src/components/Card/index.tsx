import React from "react";

import Typography from "@mui/material/Typography";
import { Card as MuiCard, Box, Chip, IconButton } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import RemoveIcon from "@mui/icons-material/Remove";
import AddShoppingCartIcon from "@mui/icons-material/AddShoppingCart";
import { useDispatch, useSelector } from "react-redux";
import {
  addToCart,
  decreaseProductQuantity,
  increaseProductQuantity,
  removeFromCart,
} from "../../store/actions/cartAction";
import { AppState } from "../../store";
import { Product } from "../../types/product";
import { formatPrice } from "../../utils/cart";

type CardProps = {
  product: Product;
  onClick?: (event: React.MouseEvent) => void;
};

const Card = ({ product, onClick }: CardProps) => {
  const dispatch = useDispatch<any>();
  const cartItems = useSelector((state: AppState) => state.cart);
  const quantity =
    cartItems.find((item) => item.product.id === product.id)?.quantity ?? 0;

  const stop = (e: React.MouseEvent) => e.stopPropagation();

  const handleAdd = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (quantity === 0) {
      dispatch(addToCart({ product, quantity: 1 }));
    } else {
      dispatch(increaseProductQuantity(product.id));
    }
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (quantity <= 1) {
      dispatch(removeFromCart(product.id));
    } else {
      dispatch(decreaseProductQuantity(product.id));
    }
  };

  return (
    <MuiCard
      className="group flex h-full cursor-pointer flex-col overflow-hidden transition hover:-translate-y-1 hover:shadow-lift"
      onClick={onClick}
    >
      <Box className="relative aspect-[4/3] overflow-hidden bg-brand-tint">
        {product.imageUrl ? (
          <img
            src={product.imageUrl}
            alt={product.name}
            className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
          />
        ) : (
          <Box className="flex h-full w-full items-center justify-center">
            <AddShoppingCartIcon className="text-4xl text-brand/30" />
          </Box>
        )}
        {product.categoryName && (
          <Chip
            label={product.categoryName}
            size="small"
            className="absolute left-3 top-3 !bg-white/90 !font-semibold !text-brand shadow-sm backdrop-blur"
          />
        )}
        <Chip
          size="small"
          label={
            (product.quantityInStock ?? 0) <= 0
              ? "Out of stock"
              : product.quantityInStock! <= 5
              ? `Low stock · ${product.quantityInStock}`
              : `In stock · ${product.quantityInStock}`
          }
          className={`absolute right-3 top-3 shadow-sm backdrop-blur ${
            (product.quantityInStock ?? 0) <= 0
              ? "!bg-rose-100/90 !text-rose-700"
              : product.quantityInStock! <= 5
              ? "!bg-amber-100/90 !text-amber-800"
              : "!bg-emerald-100/90 !text-emerald-700"
          }`}
        />
      </Box>

      <Box className="flex flex-1 flex-col gap-1 p-4">
        <Typography
          variant="subtitle1"
          className="line-clamp-1 font-semibold text-ink"
        >
          {product.name}
        </Typography>
        <Typography
          variant="body2"
          color="text.secondary"
          className="line-clamp-2 text-ink-soft"
        >
          {product.description}
        </Typography>

        <Box className="mt-auto flex items-center justify-between pt-3">
          <Typography className="price-text text-lg">
            {formatPrice(product.unitPrice)}
          </Typography>

          {quantity ? (
            <Box
              className="flex items-center gap-1 rounded-full border border-ink/10 bg-brand-tint px-1 py-0.5"
              onClick={stop}
            >
              <IconButton size="small" onClick={handleRemove}>
                <RemoveIcon fontSize="small" />
              </IconButton>
              <Typography className="min-w-6 text-center text-sm font-bold">
                {quantity}
              </Typography>
              <IconButton size="small" onClick={handleAdd}>
                <AddIcon fontSize="small" />
              </IconButton>
            </Box>
          ) : (
            <IconButton
              size="small"
              onClick={handleAdd}
              className="!bg-brand !text-paper transition hover:!bg-brand-main"
            >
              <AddShoppingCartIcon fontSize="small" />
            </IconButton>
          )}
        </Box>
      </Box>
    </MuiCard>
  );
};

export default Card;
