import React from "react";
import { useQuery } from "react-query";
import { useNavigate, useParams } from "react-router-dom";
import { Skeleton } from "@mui/material";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";

import { ProductApi } from "../../../api/productApi";
import ProductDetail from "../../../components/Card/ProductCard";
import EmptyState from "../../../components/EmptyState";
import usePageMetadata from "../../../hooks/usePageMetadata";

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

  const metadata = React.useMemo(() => {
    const cover = product?.images?.[0] || product?.imageUrl;
    const description = product?.description?.slice(0, 160) || "Discover considered products selected by Cartly.";
    const rating = product?.ratingCount
      ? { "@type": "AggregateRating", ratingValue: product.avgRating ?? 0, reviewCount: product.ratingCount }
      : undefined;
    return {
      title: product ? `${product.name} — Cartly` : "Product — Cartly",
      description,
      canonicalPath: productId ? `/products/${productId}` : undefined,
      image: cover,
      type: "product" as const,
      jsonLd: product
        ? {
            "@context": "https://schema.org",
            "@type": "Product",
            name: product.name,
            description,
            image: product.images?.length ? product.images : cover ? [cover] : undefined,
            sku: product.id,
            brand: product.brand ? { "@type": "Brand", name: product.brand } : undefined,
            aggregateRating: rating,
            offers: {
              "@type": "Offer",
              priceCurrency: "INR",
              price: product.unitPrice,
              availability:
                (product.quantityInStock ?? 0) > 0
                  ? "https://schema.org/InStock"
                  : "https://schema.org/OutOfStock",
              url: new URL(`/products/${product.id}`, window.location.origin).href,
            },
          }
        : undefined,
    };
  }, [product, productId]);
  usePageMetadata(metadata);

  const crumbs: { label: string; to?: string }[] = [
    { label: "Home", to: "/" },
    ...(product?.category?.name ? [{ label: product.category.name, to: "/" }] : []),
    { label: product?.name ?? "Product" },
  ];

  return (
    <div className="space-y-6">
      {/* breadcrumb replaces the old "Back to shop" button */}
      <nav aria-label="Breadcrumb">
        <ol className="flex flex-wrap items-center gap-1 text-xs text-ink-muted">
          {crumbs.map((c, i) => (
            <li key={c.label + i} className="flex items-center gap-1">
              {c.to ? (
                <button
                  onClick={() => navigate(c.to!)}
                  className="font-semibold transition hover:text-ink"
                >
                  {c.label}
                </button>
              ) : (
                <span className="max-w-[16rem] truncate font-semibold text-ink">{c.label}</span>
              )}
              {i < crumbs.length - 1 && <ChevronRightIcon sx={{ fontSize: 13 }} />}
            </li>
          ))}
        </ol>
      </nav>

      {isLoading && (
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
          <div className="grid gap-6 md:grid-cols-[5.5rem_minmax(0,1fr)]">
            <div className="hidden gap-2 md:flex md:flex-col">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} variant="rectangular" height={72} className="!rounded-sm" />
              ))}
            </div>
            <div className="space-y-6">
              <Skeleton variant="rectangular" className="!aspect-[4/3] !h-auto !rounded-lg" />
              <div className="space-y-3">
                <Skeleton width="30%" />
                <Skeleton width="70%" height={40} />
                <Skeleton width="40%" height={48} />
                <Skeleton variant="rectangular" height={48} className="!rounded-sm" />
              </div>
            </div>
          </div>
          <Skeleton variant="rectangular" height={280} className="!rounded-lg" />
        </div>
      )}

      {isError && (
        <div className="panel">
          <EmptyState
            icon={<ErrorOutlineIcon fontSize="large" />}
            title="Couldn't load this product"
            subtitle="Something went wrong while fetching the product. Try again."
            action={
              <button className="primary-button" onClick={() => refetch()}>
                Try again
              </button>
            }
          />
        </div>
      )}

      {product && !isError && <ProductDetail product={product} />}
    </div>
  );
}

export default Product;
