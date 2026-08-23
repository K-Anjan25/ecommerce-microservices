import React, { useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { useMutation, useQuery, useQueryClient } from "react-query";
import { Rating, Tooltip } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import RemoveIcon from "@mui/icons-material/Remove";
import AddShoppingCartIcon from "@mui/icons-material/AddShoppingCart";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import ImageOutlinedIcon from "@mui/icons-material/ImageOutlined";
import CompareArrowsIcon from "@mui/icons-material/CompareArrows";
import LocalShippingOutlinedIcon from "@mui/icons-material/LocalShippingOutlined";
import ReplayOutlinedIcon from "@mui/icons-material/ReplayOutlined";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import CardGiftcardOutlinedIcon from "@mui/icons-material/CardGiftcardOutlined";
import BoltOutlinedIcon from "@mui/icons-material/BoltOutlined";

import Comments from "../../Comments";
import PriceWatch from "../../PriceWatch";
import Card from "../index";
import { ProductApi } from "../../../api/productApi";
import { CommentApi } from "../../../api/comment";
import { showSuccess } from "../../../utils/showSuccess";
import { CreateCommentRequest } from "../../../types/comment";
import { ProductAdmin, ProductVariant } from "../../../types/product";
import { AppState } from "../../../store";
import {
  addToCart,
  decreaseProductQuantity,
  increaseProductQuantity,
  removeFromCart,
} from "../../../store/actions/cartAction";
import { formatPrice } from "../../../utils/cart";
import { addToCompare, isInCompare } from "../../../utils/compare";
import useCountdown from "../../../hooks/useCountdown";

type CardProps = {
  product: ProductAdmin | undefined;
};

const TABS = ["Description", "Specifications", "Reviews", "Shipping & returns"] as const;
type Tab = (typeof TABS)[number];

/**
 * Product detail — wireframe 03.
 * Gallery (thumb rail + main) · buy box · sticky summary rail · tabs for the
 * long-form content that used to run down one endless column.
 */
const ProductCard = ({ product }: CardProps) => {
  const { productId } = useParams();
  const queryClient = useQueryClient();
  const dispatch = useDispatch<any>();
  const cartItems = useSelector((state: AppState) => state.cart);

  const [selectedVariantId, setSelectedVariantId] = useState<string>("");
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [tab, setTab] = useState<Tab>("Description");

  const variants = product?.variants ?? [];
  const selectedVariant = variants.find((v) => v.id === selectedVariantId);
  const displayPrice = selectedVariant?.price ?? product?.unitPrice ?? 0;
  const displayStock = selectedVariant?.quantityInStock ?? product?.quantityInStock ?? 0;
  const images =
    product?.images && product.images.length > 0
      ? product.images
      : product?.imageUrl
      ? [product.imageUrl]
      : [];

  const flashPrice = product?.flashPrice ?? 0;
  const isFlashSaleActive =
    product?.flashSaleActive && flashPrice > 0 && flashPrice < displayPrice;
  const flashCountdown = useCountdown(
    isFlashSaleActive ? product?.flashSaleEndsAt : undefined
  );

  const effectivePrice = isFlashSaleActive ? flashPrice : displayPrice;
  const compareAt =
    isFlashSaleActive
      ? displayPrice
      : product?.originalPrice && product.originalPrice > displayPrice
      ? product.originalPrice
      : undefined;
  const discount = compareAt
    ? Math.round(((compareAt - effectivePrice) / compareAt) * 100)
    : 0;

  const quantity =
    cartItems.find(
      (item) => item.product.id === product?.id && item.variantId === selectedVariantId
    )?.quantity ?? 0;

  const { data: comments } = useQuery([
    "products:comments",
    productId,
  ], () => ProductApi.getCommentsByProductId(productId ?? ""));

  const { data: relatedProducts } = useQuery(
    ["products:related", productId],
    () => ProductApi.getRelatedProducts(productId ?? ""),
    { enabled: Boolean(productId), retry: false }
  );

  const { data: boughtTogether } = useQuery(
    ["products:bought-together", productId],
    () => ProductApi.getBoughtTogether(productId ?? ""),
    { enabled: Boolean(productId), retry: false }
  );

  const createMutation = useMutation(CommentApi.saveComment, {
    onSuccess: () => {
      showSuccess("Comment has been created successfully");
      queryClient.invalidateQueries("products:comments");
    },
  });

  const handleCreateComment = (comment: string) =>
    createMutation.mutate({ productId, text: comment } as CreateCommentRequest);

  const handleVariantChange = (variantId: string) => {
    setSelectedVariantId(variantId === selectedVariantId ? "" : variantId);
    setCurrentImageIndex(0);
  };

  const handleAdd = () => {
    if (!product) return;
    if (quantity === 0) {
      dispatch(
        addToCart({
          product,
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

  const handleCompare = () => {
    if (!product) return;
    addToCompare(product.id);
    showSuccess(`${product.name} added to compare`);
  };

  /** Parsed `attributes` JSON of the selected variant, used by the Specs tab. */
  const specs = useMemo(() => {
    const rows: [string, string][] = [];
    if (product?.brand) rows.push(["Brand", product.brand]);
    if (product?.category?.name) rows.push(["Category", product.category.name]);
    if (selectedVariant?.sku) rows.push(["SKU", selectedVariant.sku]);
    if (product?.badge) rows.push(["Badge", product.badge]);
    rows.push(["Availability", displayStock > 0 ? `${displayStock} in stock` : "Out of stock"]);
    try {
      const parsed = selectedVariant?.attributes ? JSON.parse(selectedVariant.attributes) : null;
      if (parsed && typeof parsed === "object") {
        Object.entries(parsed).forEach(([k, v]) => rows.push([k, String(v)]));
      }
    } catch {
      /* attributes isn't JSON — ignore */
    }
    return rows;
  }, [product, selectedVariant, displayStock]);

  const stockChip =
    displayStock <= 0 ? "badge-stock-out" : displayStock <= 5 ? "badge-stock-low" : "badge-stock-in";
  const stockLabel =
    displayStock <= 0
      ? "Out of stock"
      : displayStock <= 5
      ? `Only ${displayStock} left`
      : `In stock · ${displayStock} available`;

  return (
    <div className="space-y-10">
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem] xl:gap-8">
        {/* ══ gallery + buy box ══════════════════════════════════════ */}
        <div className="grid gap-6 md:grid-cols-[5.5rem_minmax(0,1fr)] lg:grid-cols-[5rem_minmax(0,1fr)] xl:grid-cols-[5.5rem_minmax(0,1fr)]">
          {/* thumbnail rail */}
          {images.length > 1 && (
            <div className="no-scrollbar order-2 flex gap-2 overflow-x-auto md:order-1 md:flex-col md:overflow-y-auto">
              {images.map((src, idx) => (
                <button
                  key={src + idx}
                  onClick={() => setCurrentImageIndex(idx)}
                  aria-label={`View image ${idx + 1}`}
                  className={`h-16 w-16 shrink-0 overflow-hidden rounded-sm border transition md:h-[4.5rem] md:w-full ${
                    idx === currentImageIndex
                      ? "border-ink ring-2 ring-ink/10"
                      : "border-line opacity-70 hover:opacity-100"
                  }`}
                >
                  <img src={src} alt="" className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          )}

          <div
            className={`order-1 space-y-6 md:order-2 ${
              images.length > 1 ? "" : "md:col-span-2"
            }`}
          >
            {/* main image */}
            <div className="relative aspect-[4/3] overflow-hidden rounded-lg border border-line bg-sunken">
              {images.length > 0 ? (
                <img
                  src={images[currentImageIndex]}
                  alt={product?.name}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full items-center justify-center text-ink-faint">
                  <ImageOutlinedIcon sx={{ fontSize: 64 }} />
                </div>
              )}

              {!!discount && (
                <span className="badge-sale absolute left-4 top-4 !px-3 !py-1.5 !text-xs">
                  −{discount}%
                </span>
              )}
              {isFlashSaleActive && (
                <span className="badge-sale absolute right-4 top-4 !bg-action !px-3 !py-1.5 !text-xs">
                  <BoltOutlinedIcon sx={{ fontSize: 13 }} /> Flash sale
                </span>
              )}

              {images.length > 1 && (
                <>
                  <button
                    aria-label="Previous image"
                    onClick={() =>
                      setCurrentImageIndex((p) => (p - 1 + images.length) % images.length)
                    }
                    className="absolute left-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-line bg-paper/90 text-ink backdrop-blur transition hover:bg-paper"
                  >
                    <ChevronLeftIcon fontSize="small" />
                  </button>
                  <button
                    aria-label="Next image"
                    onClick={() => setCurrentImageIndex((p) => (p + 1) % images.length)}
                    className="absolute right-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-line bg-paper/90 text-ink backdrop-blur transition hover:bg-paper"
                  >
                    <ChevronRightIcon fontSize="small" />
                  </button>
                </>
              )}
            </div>

            {/* ── buy box ─────────────────────────────────────────── */}
            <div className="space-y-5">
              <div>
                <p className="eyebrow">
                  {product?.brand || product?.category?.name || "Cartly"}
                </p>
                <h1 className="mt-1.5 font-heading text-2xl font-extrabold leading-tight tracking-tight text-ink sm:text-3xl">
                  {product?.name}
                </h1>
                {!!product?.ratingCount && (
                  <div className="mt-2 flex flex-wrap items-center gap-2 text-sm">
                    <Rating value={product.avgRating ?? 0} precision={0.1} size="small" readOnly />
                    <span className="font-semibold text-ink">
                      {product.avgRating?.toFixed(1)}
                    </span>
                    <span className="text-ink-muted">· {product.ratingCount} reviews</span>
                  </div>
                )}
              </div>

              {/* price */}
              <div>
                <div className="flex flex-wrap items-baseline gap-3">
                  <span
                    className={`font-heading text-3xl font-extrabold tracking-tight sm:text-4xl ${
                      isFlashSaleActive ? "text-state-danger" : "text-ink"
                    }`}
                  >
                    {formatPrice(effectivePrice)}
                  </span>
                  {compareAt && (
                    <span className="text-base text-ink-muted line-through">
                      {formatPrice(compareAt)}
                    </span>
                  )}
                  {!!discount && (
                    <span className="rounded-full bg-accent px-2.5 py-1 text-xs font-bold text-ink">
                      Save {discount}%
                    </span>
                  )}
                </div>
                <p className="mt-1 text-xs text-ink-muted">Inclusive of all taxes</p>
                {isFlashSaleActive && flashCountdown && (
                  <p className="mt-2 text-sm font-bold text-state-danger">
                    Flash sale ends in {flashCountdown}
                  </p>
                )}
              </div>

              {/* variants as chips, not a dropdown */}
              {variants.length > 0 && (
                <div>
                  <p className="eyebrow mb-2">Variant</p>
                  <div className="flex flex-wrap gap-2">
                    {variants.map((variant: ProductVariant) => {
                      const active = variant.id === selectedVariantId;
                      const soldOut = (variant.quantityInStock ?? 0) <= 0;
                      return (
                        <button
                          key={variant.id}
                          onClick={() => handleVariantChange(variant.id)}
                          disabled={soldOut}
                          className={`chip !px-4 !py-2 !text-sm ${active ? "chip-ink" : ""} ${
                            soldOut ? "!text-ink-faint line-through" : ""
                          }`}
                        >
                          {variant.name}
                          <span className={active ? "text-white/70" : "text-ink-muted"}>
                            {formatPrice(variant.price)}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              <span className={stockChip}>{stockLabel}</span>

              {/* CTA row — same eye-line as the price */}
              <div className="flex flex-wrap items-center gap-3">
                {quantity > 0 && (
                  <div className="flex h-12 items-center gap-1 rounded-sm border border-line bg-paper px-1.5">
                    <button
                      onClick={handleRemove}
                      aria-label="Decrease quantity"
                      className="flex h-9 w-9 items-center justify-center rounded-xs text-ink transition hover:bg-sunken"
                    >
                      <RemoveIcon fontSize="small" />
                    </button>
                    <span className="min-w-8 text-center text-sm font-bold">{quantity}</span>
                    <button
                      onClick={handleAdd}
                      aria-label="Increase quantity"
                      className="flex h-9 w-9 items-center justify-center rounded-xs text-ink transition hover:bg-sunken"
                    >
                      <AddIcon fontSize="small" />
                    </button>
                  </div>
                )}
                <button
                  onClick={handleAdd}
                  disabled={displayStock <= 0}
                  className="primary-button !h-12 min-w-[11rem] flex-1 sm:flex-none"
                >
                  <AddShoppingCartIcon sx={{ fontSize: 18 }} />
                  {quantity ? "Add one more" : "Add to cart"}
                </button>
                <Tooltip title="Compare">
                  <button
                    onClick={handleCompare}
                    aria-label="Add to compare"
                    className={`flex h-12 w-12 items-center justify-center rounded-sm border transition ${
                      product && isInCompare(product.id)
                        ? "border-brand bg-brand-soft text-brand"
                        : "border-line bg-paper text-ink-soft hover:border-ink hover:text-ink"
                    }`}
                  >
                    <CompareArrowsIcon sx={{ fontSize: 19 }} />
                  </button>
                </Tooltip>
              </div>

              {productId && <PriceWatch productId={productId} />}

              {/* delivery / trust panel */}
              <div className="panel divide-y divide-line">
                {[
                  {
                    icon: LocalShippingOutlinedIcon,
                    title: "Free delivery over ₹999",
                    copy: "Standard 4–6 days · express available at checkout",
                  },
                  {
                    icon: ReplayOutlinedIcon,
                    title: "7-day returns",
                    copy: "Request from your order detail — refund to source",
                  },
                  {
                    icon: LockOutlinedIcon,
                    title: "Secure checkout",
                    copy: "UPI · cards · Razorpay · cash on delivery",
                  },
                  {
                    icon: CardGiftcardOutlinedIcon,
                    title: "Gift wrap & gift cards",
                    copy: "Add a message at checkout",
                  },
                ].map(({ icon: Icon, title, copy }) => (
                  <div key={title} className="flex items-start gap-3 p-4">
                    <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-soft text-brand">
                      <Icon sx={{ fontSize: 17 }} />
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-ink">{title}</p>
                      <p className="text-xs text-ink-soft">{copy}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ══ sticky rail ═══════════════════════════════════════════ */}
        <aside className="space-y-4 lg:sticky lg:top-24 lg:h-fit">
          <div className="panel-raised p-5">
            <p className="eyebrow">Your selection</p>
            <p className="mt-2 line-clamp-2 font-heading text-base font-bold text-ink">
              {product?.name}
            </p>
            {selectedVariant && (
              <span className="chip mt-2 !px-2.5 !py-0.5 !text-[0.6875rem]">
                {selectedVariant.name}
              </span>
            )}
            <dl className="mt-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-ink-soft">Unit price</dt>
                <dd className="font-semibold">{formatPrice(effectivePrice)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-ink-soft">In cart</dt>
                <dd className="font-semibold">{quantity}</dd>
              </div>
              <div className="flex justify-between border-t border-line pt-2">
                <dt className="font-bold">Line total</dt>
                <dd className="price-text">{formatPrice(effectivePrice * quantity)}</dd>
              </div>
            </dl>
            <button
              onClick={handleAdd}
              disabled={displayStock <= 0}
              className="primary-button mt-4 w-full"
            >
              {quantity ? "Add one more" : "Add to cart"}
            </button>
            <p className="mt-3 text-xs text-ink-muted">
              Earn <span className="font-bold text-brand">
                {Math.floor(effectivePrice / 100)} loyalty points
              </span>{" "}
              on this item. Coupons and gift cards apply at checkout.
            </p>
          </div>

          {boughtTogether && boughtTogether.length > 0 && (
            <div className="panel p-5">
              <p className="eyebrow mb-3">Frequently bought together</p>
              <ul className="space-y-3">
                {boughtTogether.slice(0, 3).map((item) => (
                  <li key={item.id} className="flex items-center gap-3">
                    <span className="h-12 w-12 shrink-0 overflow-hidden rounded-sm border border-line bg-sunken">
                      {(item.images?.[0] || item.imageUrl) && (
                        <img
                          src={item.images?.[0] || item.imageUrl}
                          alt=""
                          className="h-full w-full object-cover"
                        />
                      )}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold text-ink">
                        {item.name}
                      </span>
                      <span className="text-xs text-ink-muted">
                        {formatPrice(item.unitPrice)}
                      </span>
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </aside>
      </div>

      {/* ══ tabs ════════════════════════════════════════════════════ */}
      <section className="panel overflow-hidden">
        <div className="no-scrollbar flex gap-2 overflow-x-auto border-b border-line p-3">
          {TABS.map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`chip !py-2 ${tab === t ? "chip-ink" : ""}`}
            >
              {t}
              {t === "Reviews" && comments?.length ? ` · ${comments.length}` : ""}
            </button>
          ))}
        </div>

        <div className="p-5 sm:p-7">
          {tab === "Description" && (
            <p className="max-w-3xl whitespace-pre-line text-sm leading-relaxed text-ink-soft">
              {product?.description || "No description has been added for this product yet."}
            </p>
          )}

          {tab === "Specifications" && (
            <dl className="max-w-2xl divide-y divide-line">
              {specs.map(([k, v]) => (
                <div key={k} className="flex gap-6 py-3 text-sm">
                  <dt className="w-40 shrink-0 font-semibold capitalize text-ink-soft">{k}</dt>
                  <dd className="text-ink">{v}</dd>
                </div>
              ))}
            </dl>
          )}

          {tab === "Reviews" && (
            <Comments comments={comments ?? []} onCreateComment={handleCreateComment} />
          )}

          {tab === "Shipping & returns" && (
            <div className="max-w-3xl space-y-4 text-sm leading-relaxed text-ink-soft">
              <p>
                <span className="font-bold text-ink">Delivery.</span> Standard shipping is free
                over ₹999 and arrives in 4–6 working days. Express and same-day options are
                priced by pincode at checkout, and the exact rate is shown before you pay.
              </p>
              <p>
                <span className="font-bold text-ink">Returns.</span> Request a return on any
                order item within 7 days of delivery from the order detail page. Once an admin
                approves it, stock is restored and the refund is issued to the original payment
                method — cash-on-delivery orders are refunded to your saved account details.
              </p>
              <p>
                <span className="font-bold text-ink">Taxes.</span> GST is applied per line and on
                shipping, at the rate configured for your delivery state, and appears on the
                PDF invoice emailed on payment.
              </p>
            </div>
          )}
        </div>
      </section>

      {/* ══ related ═════════════════════════════════════════════════ */}
      {relatedProducts && relatedProducts.length > 0 && (
        <section>
          <div className="mb-5">
            <p className="eyebrow">More like this</p>
            <h2 className="section-title mt-1">You may also like</h2>
          </div>
          <div className="product-grid">
            {relatedProducts.slice(0, 4).map((related) => (
              <Card key={related.id} product={related} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
};

export default ProductCard;
