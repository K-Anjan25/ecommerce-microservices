import React from "react";

import Typography from "@mui/material/Typography";
import {
  Box,
  Button,
  Chip,
  Divider,
  IconButton,
  Paper,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import RemoveIcon from "@mui/icons-material/Remove";
import AddShoppingCartIcon from "@mui/icons-material/AddShoppingCart";
import Comments from "../../Comments";
import { useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "react-query";
import { ProductApi } from "../../../api/productApi";
import { CommentApi } from "../../../api/comment";
import { showSuccess } from "../../../utils/showSuccess";
import { CreateCommentRequest } from "../../../types/comment";
import { ProductAdmin, Product } from "../../../types/product";
import { useDispatch, useSelector } from "react-redux";
import { AppState } from "../../../store";
import {
  addToCart,
  decreaseProductQuantity,
  increaseProductQuantity,
  removeFromCart,
} from "../../../store/actions/cartAction";
import { formatPrice } from "../../../utils/cart";

type CardProps = {
  product: ProductAdmin | undefined;
};

const ProductCard = ({ product }: CardProps) => {
  const { productId } = useParams();
  const queryClient = useQueryClient();
  const dispatch = useDispatch<any>();
  const cartItems = useSelector((state: AppState) => state.cart);
  const quantity =
    cartItems.find((item) => item.product.id === product?.id)?.quantity ?? 0;

  const { data: comments } = useQuery(["products:comments"], () =>
    ProductApi.getCommentsByProductId(productId ?? "")
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

  const handleAdd = () => {
    if (!product) return;
    if (quantity === 0) {
      dispatch(addToCart({ product: product as unknown as Product, quantity: 1 }));
    } else {
      dispatch(increaseProductQuantity(product.id));
    }
  };

  const handleRemove = () => {
    if (!product) return;
    if (quantity <= 1) {
      dispatch(removeFromCart(product.id));
    } else {
      dispatch(decreaseProductQuantity(product.id));
    }
  };

  return (
    <div className="space-y-6">
      <Paper className="grid overflow-hidden lg:grid-cols-2">
        <Box className="relative flex min-h-[320px] items-center justify-center bg-brand-tint lg:min-h-full">
          {product?.imageUrl ? (
            <img
              src={product.imageUrl}
              alt={product.name}
              className="h-full max-h-[480px] w-full object-cover"
            />
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
          <Typography className="price-text text-3xl">
            {formatPrice(product?.unitPrice ?? 0)}
          </Typography>
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
            >
              {quantity ? "Add one more" : "Add to cart"}
            </Button>
          </Box>
        </Box>
      </Paper>

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
