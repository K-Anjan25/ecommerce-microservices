import React, { useState } from "react";

import Typography from "@mui/material/Typography";
import {
  Box,
  Button,
  Chip,
  Divider,
  IconButton,
  Paper,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import RemoveIcon from "@mui/icons-material/Remove";
import AddShoppingCartIcon from "@mui/icons-material/AddShoppingCart";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import Comments from "../../Comments";
import { useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "react-query";
import { ProductApi } from "../../../api/productApi";
import { CommentApi } from "../../../api/comment";
import { showSuccess } from "../../../utils/showSuccess";
import { CreateCommentRequest } from "../../../types/comment";
import { ProductAdmin, Product, ProductVariant } from "../../../types/product";
import Card from "../index";
import { useDispatch, useSelector } from "react-redux";
import { AppState } from "../../../store";
import {
  addToCart,
  decreaseProductQuantity,
  increaseProductQuantity,
  removeFromCart,
} from "../../../store/actions/cartAction";
import { formatPrice } from "../../../utils/cart";
import useCountdown from "../../../hooks/useCountdown";

type CardProps = {
  product: ProductAdmin | undefined;
};

const ProductCard = ({ product }: CardProps) => {
  const { productId } = useParams();
  const queryClient = useQueryClient();
  const dispatch = useDispatch<any>();
  const cartItems = useSelector((state: AppState) => state.cart);
  const [selectedVariantId, setSelectedVariantId] = useState<string>("");
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const variants = product?.variants ?? [];
  const selectedVariant = variants.find((v) => v.id === selectedVariantId);
  const displayPrice = selectedVariant?.price ?? product?.unitPrice ?? 0;
  const displayStock = selectedVariant?.quantityInStock ?? product?.quantityInStock ?? 0;
  const images = product?.images && product.images.length > 0 ? product.images : (product?.imageUrl ? [product.imageUrl] : []);
  const flashPrice = product?.flashPrice ?? 0;
  const isFlashSaleActive = product?.flashSaleActive && flashPrice > 0 && flashPrice < displayPrice;
  const flashCountdown = useCountdown(isFlashSaleActive ? product?.flashSaleEndsAt : undefined);

  const quantity =
    cartItems.find(
      (item) => item.product.id === product?.id && item.variantId === selectedVariantId
    )?.quantity ?? 0;

  const { data: comments } = useQuery(["products:comments"], () =>
    ProductApi.getCommentsByProductId(productId ?? "")
  );

  const { data: relatedProducts } = useQuery(
    ["products:related", productId],
    () => ProductApi.getRelatedProducts(productId ?? ""),
    { enabled: Boolean(productId) }
  );

  const { data: boughtTogether } = useQuery(
    ["products:bought-together", productId],
    () => ProductApi.getBoughtTogether(productId ?? ""),
    { enabled: Boolean(productId) }
  );

  const handleCreateComment = (comment: string) => {
    const commentRequest = {
      productId,
      text: comment,
    } as CreateCommentRequest;

    createMutation.mutate(commentRequest);
  };

  const createMutation = useMutation(CommentApi.saveComment, {
    onSuccess: () => {
      showSuccess("Comment has been created successfully");
      queryClient.invalidateQueries("products:comments");
    },
  });

  const handleVariantChange = (variantId: string) => {
    setSelectedVariantId(variantId);
    setCurrentImageIndex(0);
  };

  const handleAdd = () => {
    if (!product) return;
    if (quantity === 0) {
      dispatch(
        addToCart({
          product: product as unknown as ProductAdmin,
          quantity: 1,
          variantId: selectedVariantId || undefined,
          variantName: selectedVariant?.name,
        })
      );
    } else {
      dispatch(increaseProductQuantity(product.id, selectedVariantId || undefined));
    }
  };

  const handleRemove = () => {
    if (!product) return;
    if (quantity <= 1) {
      dispatch(removeFromCart(product.id, selectedVariantId || undefined));
    } else {
      dispatch(decreaseProductQuantity(product.id, selectedVariantId || undefined));
    }
  };

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % images.length);
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  return (
    <div className="space-y-6">
      <Paper className="grid overflow-hidden lg:grid-cols-2">
        <Box className="relative flex min-h-[320px] items-center justify-center bg-brand-tint lg:min-h-full">
          {images.length > 0 ? (
            <>
              <img
                src={images[currentImageIndex]}
                alt={product?.name}
                className="h-full max-h-[480px] w-full object-cover"
              />
              {images.length > 1 && (
                <>
                  <IconButton
                    className="absolute left-2 top-1/2 -translate-y-1/2 !bg-white/80"
                    onClick={prevImage}
                  >
                    <ChevronLeftIcon />
                  </IconButton>
                  <IconButton
                    className="absolute right-2 top-1/2 -translate-y-1/2 !bg-white/80"
                    onClick={nextImage}
                  >
                    <ChevronRightIcon />
                  </IconButton>
                  <Box className="absolute bottom-4 left-1/2 flex -translate-x-1/2 gap-1">
                    {images.map((_, idx) => (
                      <Box
                        key={idx}
                        className={`h-2 w-2 rounded-full ${
                          idx === currentImageIndex ? "!bg-brand" : "!bg-white/60"
                        }`}
                      />
                    ))}
                  </Box>
                </>
              )}
            </>
          ) : (
            <AddShoppingCartIcon className="text-8xl text-brand/20" />
          )}
        </Box>

        <Box className="flex flex-col gap-4 p-6 sm:p-10">
          {product?.category?.name && (
            <Chip
              label={product.category.name}
              size="small"
              className="w-fit !bg-brand-soft !font-semibold !text-brand"
            />
          )}
          <Typography variant="h4" component="h1" className="font-bold">
            {product?.name}
          </Typography>
          <Box className="flex flex-col">
            {product?.originalPrice && product.originalPrice > displayPrice && (
              <Typography variant="body1" className="line-through text-ink-soft">
                {formatPrice(product.originalPrice)}
              </Typography>
            )}
            {isFlashSaleActive ? (
              <>
                <Typography variant="body1" className="line-through text-ink-soft">
                  {formatPrice(displayPrice)}
                </Typography>
                <Typography className="price-text text-3xl !text-rose-600">
                  {formatPrice(flashPrice)}
                </Typography>
                <Chip
                  size="small"
                  label="FLASH SALE"
                  className="w-fit !bg-rose-100 !text-rose-700 !font-bold"
                />
                {flashCountdown && (
                  <Typography className="text-sm font-semibold text-rose-600">
                    Ends in: {flashCountdown}
                  </Typography>
                )}
              </>
            ) : (
              <Typography className="price-text text-3xl">
                {formatPrice(displayPrice)}
              </Typography>
            )}
          </Box>
          <Chip
            size="small"
            label={
              displayStock <= 0
                ? "Out of stock"
                : displayStock <= 5
                ? `Low stock · ${displayStock} left`
                : `In stock · ${displayStock} available`
            }
            className={`w-fit ${
              displayStock <= 0
                ? "!bg-rose-100 !text-rose-700"
                : displayStock <= 5
                ? "!bg-amber-100 !text-amber-800"
                : "!bg-emerald-100 !text-emerald-700"
            }`}
          />
          {variants.length > 0 && (
            <FormControl size="small" className="w-full max-w-xs">
              <InputLabel id="variant-select-label">Variant</InputLabel>
              <Select
                labelId="variant-select-label"
                value={selectedVariantId}
                label="Variant"
                onChange={(e) => handleVariantChange(e.target.value)}
              >
                {variants.map((variant: ProductVariant) => (
                  <MenuItem key={variant.id} value={variant.id}>
                    {variant.name} — {formatPrice(variant.price)} (SKU: {variant.sku})
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          )}
          <Divider />
          <Typography className="text-ink-soft">{product?.description}</Typography>

          <Box className="mt-auto flex flex-wrap items-center gap-4 pt-4">
            {quantity ? (
              <Box className="flex items-center gap-2 rounded-full border border-ink/10 bg-brand-tint px-2 py-1">
                <IconButton size="small" onClick={handleRemove}>
                  <RemoveIcon fontSize="small" />
                </IconButton>
                <Typography className="min-w-8 text-center text-base font-bold">
                  {quantity}
                </Typography>
                <IconButton size="small" onClick={handleAdd}>
                  <AddIcon fontSize="small" />
                </IconButton>
              </Box>
            ) : null}
            <Button
              variant="contained"
              size="large"
              startIcon={<AddShoppingCartIcon />}
              className="!bg-brand !text-paper hover:!bg-brand-main"
              onClick={handleAdd}
              disabled={displayStock <= 0}
            >
              {quantity ? "Add one more" : "Add to cart"}
            </Button>
          </Box>
        </Box>
      </Paper>

      {relatedProducts && relatedProducts.length > 0 && (
        <Paper className="p-6 sm:p-8">
          <Typography variant="h6" className="mb-4 font-bold">
            You may also like
          </Typography>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-4">
            {relatedProducts.map((related) => (
              <Card key={related.id} product={related} />
            ))}
          </div>
        </Paper>
      )}

      {boughtTogether && boughtTogether.length > 0 && (
        <Paper className="p-6 sm:p-8">
          <Typography variant="h6" className="mb-4 font-bold">
            Frequently bought together
          </Typography>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-4">
            {boughtTogether.map((item) => (
              <Card key={item.id} product={item} />
            ))}
          </div>
        </Paper>
      )}

      <Paper className="p-6 sm:p-8">
        <Comments
          comments={comments ?? []}
          onCreateComment={handleCreateComment}
        />
      </Paper>
    </div>
  );
};

export default ProductCard;
