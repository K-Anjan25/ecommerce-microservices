import React from "react";
import { useQuery } from "react-query";
import { useNavigate, useParams } from "react-router-dom";
import { ProductApi } from "../../../api/productApi";
import ProductCard from "../../../components/Card/ProductCard";
import ProductViewPlaceholder from "../../../components/ProductViewPlaceholder";
import EmptyState from "../../../components/EmptyState";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { Box, Button } from "@mui/material";

function Product() {
  const { productId } = useParams();
  const navigate = useNavigate();

  const {
    data: product,
    isLoading,
    isError,
    refetch,
  } = useQuery(["products:product", productId], () =>
    ProductApi.getProductById(productId ?? "")
  );

  return (
    <div className="space-y-6">
      <Button
        startIcon={<ArrowBackIcon />}
        onClick={() => navigate("/")}
        className="!text-brand"
      >
        Back to shop
      </Button>

      {isLoading && (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <ProductViewPlaceholder />
          <ProductViewPlaceholder />
        </div>
      )}

      {isError && (
        <div className="panel">
          <EmptyState
            icon={<ErrorOutlineIcon fontSize="large" />}
            title="Couldn't load this product"
            subtitle="Something went wrong while fetching the product. Try again."
            action={
              <Button
                variant="contained"
                className="!bg-brand !text-paper hover:!bg-brand-main"
                onClick={() => refetch()}
              >
                Try again
              </Button>
            }
          />
        </div>
      )}

      {product && !isError && (
        <Box className="mx-auto max-w-5xl">
          <ProductCard product={product} />
        </Box>
      )}
    </div>
  );
}

export default Product;
