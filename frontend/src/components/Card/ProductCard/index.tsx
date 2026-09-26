import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
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
import AutorenewIcon from "@mui/icons-material/Autorenew";
import WorkspacePremiumOutlinedIcon from "@mui/icons-material/WorkspacePremiumOutlined";

import Comments from "../../Comments";
import ProductGallery from "../../ProductGallery";
import StyledSelect from "../../StyledSelect";
import { MembershipApi } from "../../../api/membershipApi";
import Questions from "../../Questions";
import PriceWatch from "../../PriceWatch";
import StockWatch from "../../StockWatch";
import Card from "../index";
import { ProductApi } from "../../../api/productApi";
import { CommentApi } from "../../../api/comment";
import { showSuccess } from "../../../utils/showSuccess";
import { showError } from "../../../utils/showError";
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
import { useI18n } from "../../../features/i18n";
import { trackEvent } from "../../../utils/analytics";
import { SubscriptionApi } from "../../../api/subscriptionApi";
import { localizedDescription, localizedName } from "../../../utils/localizedEntity";

type CardProps = {
  product: ProductAdmin | undefined;
};

const TABS = ["Description", "Specifications", "Q&A", "Reviews", "Shipping & returns"] as const;
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
  const { t, language } = useI18n();
  const cartItems = useSelector((state: AppState) => state.cart);
  const { data: user } = useSelector((state: AppState) => state.user);
  const navigate = useNavigate();

  const [selectedVariantId, setSelectedVariantId] = useState<string>("");
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [tab, setTab] = useState<Tab>("Description");
  const [subscribeInterval, setSubscribeInterval] = useState(30);
  const [subscribing, setSubscribing] = useState(false);
  const [purchaseMode, setPurchaseMode] = useState<"one-time" | "subscribe">("one-time");

  // Funnel analytics: one product-view beacon per loaded product.
  useEffect(() => {
    if (product?.id) trackEvent("VIEW_PRODUCT", product.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [product?.id]);

  const variants = product?.variants ?? [];
  const selectedVariant = variants.find((v) => v.id === selectedVariantId);
  const displayPrice = selectedVariant?.price ?? product?.unitPrice ?? 0;
  const displayStock = selectedVariant?.quantityInStock ?? product?.quantityInStock ?? 0;
  // Gallery: rich (variant/angle-aware) when available, plain URL list otherwise.
  const galleryImages = useMemo(() => {
    const rich: { url: string; thumbUrl?: string | null; angle?: string | null; variantId?: string | null; altText?: string | null }[] =
      product?.imageGallery && product.imageGallery.length > 0
        ? product.imageGallery
        : (product?.images ?? []).map((u) => ({ url: u }));
    if (rich.length === 0 && product?.imageUrl) {
      return [{ url: product.imageUrl, angle: "front" }];
    }
    return rich;
  }, [product]);

  // Selecting a variant swaps the gallery to that colourway's shots first,
  // then shared product-level angles (Amazon PDP behaviour).
  const visibleImages = useMemo(() => {
    let list = galleryImages;
    if (selectedVariant) {
      const hero = selectedVariant.imageUrl
        ? [{ url: selectedVariant.imageUrl, thumbUrl: selectedVariant.imageUrl, angle: "variant", variantId: selectedVariant.id }]
        : [];
      const variantShots = galleryImages.filter((i) => i.variantId === selectedVariant.id);
      const shared = galleryImages.filter((i) => !i.variantId);
      list = [...hero, ...variantShots, ...shared];
    }
    const seen = new Set<string>();
    return list.filter((i) => (seen.has(i.url) ? false : (seen.add(i.url), true)));
  }, [galleryImages, selectedVariant]);
  const images = visibleImages.map((i) => i.url);

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



  const createMutation = useMutation(CommentApi.saveComment, {
    onSuccess: () => {
      showSuccess("Comment has been created successfully");
      queryClient.invalidateQueries("products:comments");
    },
    onError: (error: any) =>
      showError(error?.response?.data?.message ?? "Could not post your review"),
  });

  const handleCreateComment = (comment: string, rating?: number, images?: string[]) =>
    createMutation.mutateAsync({
      productId,
      text: comment,
      rating,
      images,
    } as CreateCommentRequest);

  const handleVariantChange = (variantId: string) => {
    setSelectedVariantId(variantId === selectedVariantId ? "" : variantId);
    setCurrentImageIndex(0);
  };

  const handleAdd = () => {
    if (!product) return;
    if (quantity === 0) {
      trackEvent("ADD_TO_CART", product.id);
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

  // Cartly Plus — member deals & boosted Subscribe & Save are priced
  // server-side; this mirrors them for display only.
  const { data: membership } = useQuery("my-membership", MembershipApi.status, {
    enabled: !!user?.isLogedIn,
  });

  // Grouped specification tables (products.specifications JSON from the seed).
  const specGroups: { group: string; items: { label: string; value: string }[] }[] =
    React.useMemo(() => {
      const raw = product?.specifications;
      if (!raw) return [];
      try {
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed : [];
      } catch {
        return [];
      }
    }, [product?.specifications]);
  const isPlus = membership?.status === "ACTIVE";
  const memberDealPercent = product?.memberDealPercent ?? 0;
  const memberPrice =
    memberDealPercent > 0
      ? Math.round(effectivePrice * (1 - memberDealPercent / 100))
      : null;

  // Subscribe & Save: 5% off each delivery's price (15% when 5+ subscriptions
  // batch in one calendar month). Cartly Plus members earn 10%/20% instead —
  // applied server-side at placement.
  const subscribeEligible = !!product?.subscribeEligible;
  const ssPrice = Math.round(effectivePrice * (isPlus ? 0.9 : 0.95));

  const handleStartSubscription = async () => {
    if (!product) return;
    if (!user.isLogedIn) {
      navigate("/login", { state: { from: { pathname: `/products/${productId}` } } });
      return;
    }
    setSubscribing(true);
    try {
      await SubscriptionApi.createSubscription({
        productId: product.id,
        variantId: selectedVariantId || null,
        quantity: Math.max(1, quantity || 1),
        intervalDays: subscribeInterval,
      });
      showSuccess(t("subscribe.success"));
    } catch (error: any) {
      showError(error?.response?.data?.message ?? t("subscribe.error"));
    } finally {
      setSubscribing(false);
    }
  };

  return (
    <div className="space-y-10">
      <div>
        {/* ══ editorial gallery + purchasing column ══════════════════ */}
        <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1.12fr)_minmax(22rem,0.88fr)] xl:gap-12">
          {/* carousel gallery: swipe/arrow slides, thumbs, dots, full-res lightbox */}
          <ProductGallery
            images={visibleImages}
            name={product ? localizedName(product, language) : ""}
            overlays={
              <>
                {!!discount && (
                  <span className="pointer-events-auto rounded-full bg-accent px-2.5 py-1 text-xs font-bold text-ink shadow-sm">
                    −{discount}%
                  </span>
                )}
                {isFlashSaleActive && (
                  <span className="pointer-events-auto rounded-full bg-action px-2.5 py-1 text-xs font-bold text-white shadow-sm">
                    <BoltOutlinedIcon sx={{ fontSize: 13 }} /> Flash sale
                  </span>
                )}
              </>
            }
          />

            {/* ── buy box ─────────────────────────────────────────── */}
            <div className="space-y-6 lg:sticky lg:top-24">
              <div className="border-b border-line pb-5">
                <p className="eyebrow">
                  {product?.brand || product?.category?.name || "Cartly"}
                </p>
                <h1 className="mt-2 font-heading text-3xl font-extrabold leading-[1.05] tracking-tight text-ink sm:text-4xl">
                  {product ? localizedName(product, language) : ""}
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
                    className={`font-heading text-2xl font-extrabold tracking-tight sm:text-3xl ${
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
                <p className="mt-1 text-xs text-ink-muted">{t("product.taxesIncluded")}</p>
                {isPlus && memberPrice != null && (
                  <p className="mt-2 flex flex-wrap items-center gap-2 text-sm font-bold text-brand">
                    <WorkspacePremiumOutlinedIcon sx={{ fontSize: 16 }} />
                    Cartly Plus price {formatPrice(memberPrice)}
                    <span className="rounded-full bg-brand-soft px-2 py-0.5 text-[11px] font-bold">
                      −{memberDealPercent}% member deal
                    </span>
                  </p>
                )}
                {isFlashSaleActive && flashCountdown && (
                  <p className="mt-2 text-sm font-bold text-state-danger">
                    Flash sale ends in {flashCountdown}
                  </p>
                )}
              </div>

              {/* variants as chips, not a dropdown */}
              {variants.length > 0 && (
                <div>
                  <p className="eyebrow mb-2">{t("product.variant")}</p>
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
                          {variant.swatchHex && (
                            <span
                              aria-hidden
                              className="mr-1.5 inline-block h-3.5 w-3.5 rounded-full border border-black/10 align-middle"
                              style={{ background: variant.swatchHex }}
                            />
                          )}
                          {variant.name}
                          <span className={active ? "text-oncontrast/70" : "text-ink-muted"}>
                            {formatPrice(variant.price)}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              <span className={stockChip}>{stockLabel}</span>

              {/* purchase mode — one-time vs Subscribe & Save (Amazon buy box) */}
              {subscribeEligible && (
                <div className="space-y-2 rounded-xl border border-line p-3">
                  <label
                    className={`flex cursor-pointer items-start gap-2.5 rounded-lg p-1.5 ${
                      purchaseMode === "one-time" ? "bg-sunken" : ""
                    }`}
                  >
                    <input
                      type="radio"
                      name="purchase-mode"
                      checked={purchaseMode === "one-time"}
                      onChange={() => setPurchaseMode("one-time")}
                      className="mt-1"
                    />
                    <span>
                      <span className="block text-sm font-bold text-ink">
                        {t("subscribe.oneTime")} — {formatPrice(effectivePrice)}
                      </span>
                    </span>
                  </label>
                  <label
                    className={`flex cursor-pointer items-start gap-2.5 rounded-lg p-1.5 ${
                      purchaseMode === "subscribe" ? "bg-brand-soft/50 ring-1 ring-brand/40" : ""
                    }`}
                  >
                    <input
                      type="radio"
                      name="purchase-mode"
                      checked={purchaseMode === "subscribe"}
                      onChange={() => setPurchaseMode("subscribe")}
                      className="mt-1"
                    />
                    <span>
                      <span className="block text-sm font-bold text-ink">
                        {t("subscribe.title")} — {formatPrice(ssPrice)}{" "}
                        <span className="rounded-full bg-accent px-2 py-0.5 text-[11px] font-bold">
                          {t("subscribe.saveBadge")}
                        </span>
                      </span>
                      <span className="mt-1 flex flex-wrap items-center gap-2 text-xs text-ink-soft">
                        <StyledSelect
                          ariaLabel="Subscribe & Save delivery frequency"
                          value={String(subscribeInterval)}
                          onChange={(v) => setSubscribeInterval(Number(v))}
                          options={[14, 30, 60, 90, 180].map((d) => ({
                            value: String(d),
                            label: `${t("subscribe.deliverEvery")} ${d} ${t("subscribe.days")}`,
                          }))}
                        />
                        {t("subscribe.tierHint")}
                      </span>
                    </span>
                  </label>
                </div>
              )}

              {/* CTA row — same eye-line as the price */}
              <div className="flex flex-wrap items-center gap-3">
                {quantity > 0 && (
                  <div className="flex h-12 items-center rounded-sm border border-line bg-paper px-1 shadow-none transition focus-within:border-brand">
                    <button
                      onClick={handleRemove}
                      aria-label={t("product.decreaseQty")}
                      className="flex h-10 w-10 items-center justify-center rounded-xs text-ink transition hover:bg-sunken active:scale-95"
                    >
                      <RemoveIcon sx={{ fontSize: 18 }} />
                    </button>
                    <span className="min-w-[2.25rem] select-none text-center font-heading text-base font-bold text-ink">
                      {quantity}
                    </span>
                    <button
                      onClick={handleAdd}
                      disabled={displayStock > 0 && quantity >= displayStock}
                      aria-label={t("product.increaseQty")}
                      className="flex h-10 w-10 items-center justify-center rounded-xs text-ink transition hover:bg-sunken active:scale-95 disabled:cursor-not-allowed disabled:opacity-30"
                    >
                      <AddIcon sx={{ fontSize: 18 }} />
                    </button>
                  </div>
                )}
                <button
                  onClick={purchaseMode === "subscribe" ? handleStartSubscription : handleAdd}
                  disabled={
                    purchaseMode === "subscribe"
                      ? subscribing
                      : displayStock <= 0 || (displayStock > 0 && quantity >= displayStock)
                  }
                  className="primary-button !h-12 min-w-[11rem] flex-1 sm:flex-none"
                >
                  {purchaseMode === "subscribe" ? (
                    <>
                      <AutorenewIcon sx={{ fontSize: 18 }} />
                      {subscribing ? "…" : `${t("subscribe.cta")} · ${formatPrice(ssPrice)}`}
                    </>
                  ) : (
                    <>
                      <AddShoppingCartIcon sx={{ fontSize: 18 }} />
                      {quantity
                        ? displayStock > 0 && quantity >= displayStock
                          ? "Max stock reached"
                          : t("product.addMore")
                        : t("product.add")}
                    </>
                  )}
                </button>
                <Tooltip title={t("product.compare")}>
                  <button
                    onClick={handleCompare}
                    aria-label={t("product.compare")}
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
              {productId && displayStock <= 0 && <StockWatch productId={productId} />}

              {/* Cartly Plus strip */}
              {isPlus ? (
                <div className="flex items-start gap-2 rounded-xl bg-brand-soft/50 p-3 text-xs font-semibold text-ink">
                  <WorkspacePremiumOutlinedIcon sx={{ fontSize: 16, mt: 0.2 }} />
                  <span>
                    Cartly Plus: free express delivery on this order
                    {subscribeEligible && " + boosted Subscribe & Save (10%/20%)"}.
                  </span>
                </div>
              ) : (
                <button
                  onClick={() => navigate("/cartly-plus")}
                  className="flex w-full items-center justify-between rounded-xl border border-dashed border-brand/50 bg-brand-soft/30 p-3 text-xs font-bold text-brand transition hover:bg-brand-soft/60"
                >
                  <span className="flex items-center gap-2">
                    <WorkspacePremiumOutlinedIcon sx={{ fontSize: 16 }} />
                    Cartly Plus — free express delivery + member-only prices
                  </span>
                  <span>Learn more →</span>
                </button>
              )}

              {/* delivery / trust panel */}
              <div className="divide-y divide-line border-y border-line">
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
                    <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center text-brand">
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

      {/* ══ tabs ════════════════════════════════════════════════════ */}
      <section className="border-y border-line">
        <div className="no-scrollbar flex gap-7 overflow-x-auto border-b border-line">
          {TABS.map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`shrink-0 border-b-2 px-0 py-4 text-xs font-semibold uppercase tracking-[0.08em] transition ${tab === t ? "border-brand text-brand" : "border-transparent text-ink-muted hover:text-ink"}`}
            >
              {t}
              {t === "Reviews" && comments?.length ? ` · ${comments.length}` : ""}
            </button>
          ))}
        </div>

        <div className="py-7 sm:py-9">
          {tab === "Description" && (
            <p className="max-w-3xl whitespace-pre-line text-sm leading-relaxed text-ink-soft">
              {product
                ? localizedDescription(product, language) ||
                  "No description has been added for this product yet."
                : "No description has been added for this product yet."}
            </p>
          )}

          {tab === "Specifications" && (
            <div className="max-w-3xl space-y-8">
              {specGroups.length > 0 ? (
                specGroups.map((group) => (
                  <div key={group.group}>
                    <p className="eyebrow mb-2">{group.group}</p>
                    <dl className="divide-y divide-line border-y border-line">
                      {group.items.map((item) => (
                        <div key={item.label} className="flex gap-6 py-3 text-sm">
                          <dt className="w-44 shrink-0 font-semibold text-ink-soft">
                            {item.label}
                          </dt>
                          <dd className="min-w-0 flex-1 text-ink">{item.value}</dd>
                        </div>
                      ))}
                    </dl>
                  </div>
                ))
              ) : (
                <dl className="max-w-2xl divide-y divide-line">
                  {specs.map(([k, v]) => (
                    <div key={k} className="flex gap-6 py-3 text-sm">
                      <dt className="w-40 shrink-0 font-semibold capitalize text-ink-soft">{k}</dt>
                      <dd className="text-ink">{v}</dd>
                    </div>
                  ))}
                </dl>
              )}
            </div>
          )}

          {tab === "Q&A" && productId && <Questions productId={productId} />}

          {tab === "Reviews" && (
            <Comments comments={comments ?? []} onCreateComment={handleCreateComment} />
          )}

          {tab === "Shipping & returns" && (
            <div className="max-w-3xl space-y-4 text-sm leading-relaxed text-ink-soft">
              <p>
                <span className="font-bold text-ink">{t("product.delivery")}</span> Standard shipping is free
                over ₹999 and arrives in 4–6 working days. Express and same-day options are
                priced by pincode at checkout, and the exact rate is shown before you pay.
              </p>
              <p>
                <span className="font-bold text-ink">{t("product.returns")}</span> Request a return on any
                order item within 7 days of delivery from the order detail page. Once an admin
                approves it, stock is restored and the refund is issued to the original payment
                method — cash-on-delivery orders are refunded to your saved account details.
              </p>
              <p>
                <span className="font-bold text-ink">{t("product.taxes")}</span> GST is applied per line and on
                shipping, at the rate configured for your delivery state, and appears on the
                PDF invoice emailed on payment.
              </p>
            </div>
          )}
        </div>
      </section>

      {/* ══ Subscribe & Save explainer (controls live in the buy box) ══ */}
      {productId && subscribeEligible && (
        <section className="rounded-2xl border border-line bg-brand-soft/30 p-5">
          <p className="font-heading text-base font-extrabold text-ink">{t("subscribe.title")}</p>
          <p className="mt-1 text-xs text-ink-soft">
            {t("subscribe.subtitle")} {t("subscribe.reminderNote")}
          </p>
        </section>
      )}

      {/* ══ related ═════════════════════════════════════════════════ */}
      {relatedProducts && relatedProducts.length > 0 && (
        <section>
          <div className="mb-5">
            <p className="eyebrow">{t("product.moreLikeThis")}</p>
            <h2 className="section-title mt-1">{t("product.youMayAlsoLike")}</h2>
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
