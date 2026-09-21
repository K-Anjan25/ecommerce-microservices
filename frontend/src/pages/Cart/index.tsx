import { useFormik } from "formik";
import { useEffect, useState } from "react";
import { useMutation } from "react-query";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Box, Button } from "@mui/material";
import { LoadingButton } from "@mui/lab";
import ShoppingCartOutlinedIcon from "@mui/icons-material/ShoppingCartOutlined";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import LocalShippingOutlinedIcon from "@mui/icons-material/LocalShippingOutlined";
import ReplayOutlinedIcon from "@mui/icons-material/ReplayOutlined";

import { OrderApi } from "../../api/orderApi";
import { WishlistApi, WISHLIST_QUERY_KEY } from "../../hooks/useWishlist";
import { useQueryClient } from "react-query";
import BookmarkAddedOutlinedIcon from "@mui/icons-material/BookmarkAddedOutlined";
import FavoriteBorderIcon from "@mui/icons-material/FavoriteBorder";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import { loadSavedForLater, saveForLater, removeFromSaved } from "../../utils/saveForLater";
import { PaymentApi } from "../../api/paymentApi";
import { ProductApi } from "../../api/productApi";
import CartLine from "../../components/CartLine";
import CheckoutSteps from "../../components/CheckoutSteps";
import Modal from "../../components/Modal";
import EmptyState from "../../components/EmptyState";
import SelectInput from "../../components/SelectInput";
import TextInput from "../../components/TextInput";
import createOrderForm from "../../forms/orderForm";
import { AppState } from "../../store";
import {
  clearAllItems,
  addToCart,
  removeFromCart,
} from "../../store/actions/cartAction";
import { CreateOrderRequest } from "../../types/order";
import {
  calculateCountOfCartItems,
  calculateTotalPriceOfCartItems,
  formatPrice,
} from "../../utils/cart";
import { showSuccess } from "../../utils/showSuccess";
import { showError } from "../../utils/showError";
import statesAndDistrict from "../../formdata.json";
import { useI18n } from "../../features/i18n";

const FREE_SHIPPING_THRESHOLD = 999;

function Cart() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const items = useSelector((state: AppState) => state.cart);
  const isLoggedIn = useSelector((state: AppState) => state.user.data.isLogedIn);
  const [modalOpen, setModalOpen] = useState(searchParams.get("order") === "true");
  const [districts, setDistricts] = useState<{ name: string; id: string }[]>([]);
  const [savedItems, setSavedItems] = useState<{ product: { id: string; name?: string; unitPrice?: number }; quantity: number; variantId?: string; variantName?: string }[]>(loadSavedForLater);
  const dispatch = useDispatch<any>();
  const queryClient = useQueryClient();
  const { t } = useI18n();

  // Move a cart line to the wishlist (sign-in required — /v1/wishlist is
  // behind the gateway AuthFilter).
  const wishlistMutation = useMutation(WishlistApi.addItem, {
    onSuccess: () => queryClient.invalidateQueries(WISHLIST_QUERY_KEY),
    onError: () => showError("Could not move to wishlist"),
  });

  const parkForLater = (item: any) => {
    setSavedItems((prev) => saveForLater(prev as any, item));
    dispatch(removeFromCart(item.product.id, item.variantId));
    showSuccess("Saved for later");
  };

  const moveToWishlist = (item: any) => {
    if (!isLoggedIn) {
      navigate("/login");
      return;
    }
    wishlistMutation.mutate({
      productId: item.product.id,
      productName: item.product.name,
      unitPrice: item.product.unitPrice ?? (item.product as any).price,
    });
    dispatch(removeFromCart(item.product.id, item.variantId));
    showSuccess("Moved to wishlist");
  };

  const moveToCart = (saved: any) => {
    dispatch(addToCart(saved));
    setSavedItems((prev) => removeFromSaved(prev as any, { productId: saved.product.id, variantId: saved.variantId }));
    showSuccess("Moved to cart");
  };

  const discardSaved = (saved: any) => {
    setSavedItems((prev) => removeFromSaved(prev as any, { productId: saved.product.id, variantId: saved.variantId }));
  };

  const form = useFormik({
    ...createOrderForm({ guest: !isLoggedIn }),
    onSubmit: (values) => {
      const products = items.map((item) => ({
        productId: item.product.id,
        quantity: item.quantity,
        variantId: item.variantId,
      }));
      const order = {
        address: {
          state: values.state,
          district: values.district,
          addressDetail: values.addressDetail,
          phoneNumber: values.phoneNumber || undefined,
        },
        items: products,
        state: values.state,
        customerEmail: isLoggedIn ? undefined : values.customerEmail,
        phoneNumber: values.phoneNumber || undefined,
      } as CreateOrderRequest;
      createMutation.mutate(order);
    },
  });

  useEffect(() => {
    setDistricts(getDistricts(form.values.state) ?? []);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.values.state]);

  const openModal = () => {
    setModalOpen(true);
    setSearchParams({ order: "true" });
  };

  const closeModal = () => {
    setModalOpen(false);
    setSearchParams({ order: "false" });
    form.resetForm();
  };

  const createMutation = useMutation(OrderApi.createOrder, {
    onSuccess: async (order) => {
      try {
        await PaymentApi.initiatePayment({
          orderId: order.id,
          provider: "CASH",
          checkoutToken: order.checkoutToken,
        });
      } catch (ignored) {}
      showSuccess("Order placed successfully — pay on delivery");
      dispatch(clearAllItems());
      closeModal();
      navigate("/order-confirmation", {
        replace: true,
        state: {
          orderId: order.id,
          orderStatus: "PENDING",
          paymentStatus: "PENDING",
          provider: "CASH",
          amount: Number(order.totalAmount),
          signedIn: isLoggedIn,
        },
      });
    },
    onError: (e: any) => {
      const res = e.response?.data?.message as string;
      if (res && res.startsWith("[") && res.endsWith("]")) {
        getProducts(res);
      } else {
        showError(e.response?.data?.message ?? e.message ?? "Order could not be created");
      }
    },
  });

  const states = statesAndDistrict.map((state: any) => ({
    name: state.state_name,
    id: state.state_name,
  }));

  const getDistricts = (stateName: string) =>
    statesAndDistrict
      .find((state: any) => state.state_name === stateName)
      ?.districts.map((district: any) => ({
        name: district.district_name,
        id: district.district_name,
      }));

  const getProducts = async (res: string) => {
    if (!res) return;
    try {
      const productIds = res.substring(1, res.length - 1).split(",") as string[];
      const products = await ProductApi.getProductsByIds(productIds);
      showError(`${products.map((p) => p.name)} not in stock!`);
    } catch {
      showError("Some products are not available");
    }
  };

  useEffect(() => {
    const savedFormData = sessionStorage.getItem("cart_form");
    if (savedFormData) form.setValues(JSON.parse(savedFormData));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    sessionStorage.setItem("cart_form", JSON.stringify(form.values));
  }, [form.values]);

  const itemCount = calculateCountOfCartItems(items);
  const subtotal = Number(calculateTotalPriceOfCartItems(items));
  const freeShippingGap = Math.max(0, FREE_SHIPPING_THRESHOLD - subtotal);
  const progress = Math.min(100, (subtotal / FREE_SHIPPING_THRESHOLD) * 100);

  if (items.length === 0) {
    return (
      <div className="page-shell">
        <CheckoutSteps current="cart" />
        <div className="panel">
          <EmptyState
            icon={<ShoppingCartOutlinedIcon fontSize="large" />}
            title={t("cart.empty")}
            subtitle="Looks like you haven't added any products yet. Explore the shop and find something you like."
            action={
              <button className="primary-button" onClick={() => navigate("/")}>
                {t("cart.continue")}
              </button>
            }
          />
        </div>
      </div>
    );
  }

  return (
    <div className="page-shell pb-12">
      <CheckoutSteps current="cart" />

      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">Step 1 of 3</p>
          <h1 className="page-title mt-1">{t("cart.title")}</h1>
          <p className="page-subtitle">
            {itemCount} item{itemCount === 1 ? "" : "s"} · review quantities before checkout
          </p>
        </div>
        <button onClick={() => navigate("/")} className="secondary-button !py-2">
          <ArrowBackIcon sx={{ fontSize: 16 }} />
          {t("cart.continue")}
        </button>
      </div>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_23rem]">
        {/* ── line items ─────────────────────────────────────────── */}
        <div className="space-y-6">
          {/* free-shipping nudge */}
          <div className="border-y border-line py-5">
            <div className="flex items-center gap-2 text-sm">
              <LocalShippingOutlinedIcon sx={{ fontSize: 18 }} className="text-brand" />
              {freeShippingGap > 0 ? (
                <span className="text-ink-soft">
                  Add{" "}
                  <span className="font-bold text-ink">{formatPrice(freeShippingGap)}</span>{" "}
                  more for free shipping
                </span>
              ) : (
                <span className="font-semibold text-state-success">
                  You&apos;ve unlocked free shipping
                </span>
              )}
            </div>
            <div className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-sunken">
              <div
                className="h-full rounded-full bg-action transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {/* ── saved for later ─────────────────────────────────────── */}
          {savedItems.length > 0 && (
            <section aria-label="Saved for later" className="border border-line">
              <div className="border-b border-line px-5 py-3">
                <h2 className="font-heading text-base font-extrabold tracking-tight">
                  Saved for later{" "}
                  <span className="ml-1 text-xs font-semibold text-ink-muted">
                    ({savedItems.length})
                  </span>
                </h2>
              </div>
              <ul className="divide-y divide-line">
                {savedItems.map((saved) => (
                  <li
                    key={`${saved.product.id}-${saved.variantId ?? "base"}`}
                    className="flex items-center gap-4 px-5 py-4"
                  >
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-bold text-ink">
                        {saved.product.name}
                      </span>
                      {saved.variantName && (
                        <span className="block text-xs text-ink-muted">{saved.variantName}</span>
                      )}
                      <span className="block text-xs text-ink-soft">
                        {formatPrice(Number(saved.product.unitPrice ?? 0))}
                      </span>
                    </span>
                    <button
                      type="button"
                      onClick={() => moveToCart(saved)}
                      className="secondary-button !px-3 !py-1.5 !text-xs"
                    >
                      Move to cart
                    </button>
                    <button
                      type="button"
                      onClick={() => discardSaved(saved)}
                      aria-label="Remove saved item"
                      className="flex h-8 w-8 items-center justify-center text-ink-soft transition hover:text-state-danger"
                    >
                      <DeleteOutlineIcon sx={{ fontSize: 17 }} />
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          )}

          <div className="border-y border-line">
            <ul className="divide-y divide-line">
              {items.map((item) => (
                <div key={`${item.product.id}-${item.variantId ?? "base"}`}>
                  <CartLine item={item} />
                  <div className="mt-1.5 flex gap-4 pl-1 text-xs font-semibold">
                    <button
                      type="button"
                      onClick={() => parkForLater(item)}
                      className="inline-flex items-center gap-1 text-ink-soft transition hover:text-brand"
                    >
                      <BookmarkAddedOutlinedIcon sx={{ fontSize: 15 }} />
                      Save for later
                    </button>
                    <button
                      type="button"
                      onClick={() => moveToWishlist(item)}
                      className="inline-flex items-center gap-1 text-ink-soft transition hover:text-brand"
                    >
                      <FavoriteBorderIcon sx={{ fontSize: 15 }} />
                      Wishlist
                    </button>
                  </div>
                </div>
              ))}
            </ul>
          </div>

          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 px-1 text-xs text-ink-muted">
            <span className="flex items-center gap-1.5">
              <ReplayOutlinedIcon sx={{ fontSize: 15 }} /> 7-day returns on every item
            </span>
            <span className="flex items-center gap-1.5">
              <LockOutlinedIcon sx={{ fontSize: 15 }} /> Payment is captured only on confirmation
            </span>
          </div>
        </div>

        {/* ── sticky summary ─────────────────────────────────────── */}
        <aside className="lg:sticky lg:top-24 lg:h-fit">
          <div className="border-t border-ink py-5">
            <h2 className="font-heading text-xl font-extrabold tracking-tight">Order summary</h2>

            <dl className="mt-4 space-y-2.5 text-sm">
              <div className="flex justify-between">
                <dt className="text-ink-soft">Subtotal ({itemCount} items)</dt>
                <dd className="font-semibold">{formatPrice(subtotal)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-ink-soft">Shipping</dt>
                <dd className="font-semibold text-ink-muted">
                  {freeShippingGap > 0 ? "At checkout" : "Free"}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-ink-soft">Tax &amp; discounts</dt>
                <dd className="font-semibold text-ink-muted">At checkout</dd>
              </div>
            </dl>

            <div className="mt-4 flex items-baseline justify-between border-t border-line pt-4">
              <span className="font-medium">Total so far</span>
              <span className="font-heading text-2xl font-extrabold">{formatPrice(subtotal)}</span>
            </div>

            <button onClick={() => navigate("/checkout")} className="primary-button mt-5 w-full !py-3">
              {t("cart.checkout")}
            </button>
            <LoadingButton
              variant="text"
              fullWidth
              onClick={openModal}
              loading={createMutation.isLoading}
              className="!mt-2 !text-sm !font-semibold !text-ink-soft hover:!bg-sunken"
            >
              Quick order (cash on delivery)
            </LoadingButton>

            <p className="mt-4 flex items-center justify-center gap-1.5 text-[0.6875rem] text-ink-muted">
              <LockOutlinedIcon sx={{ fontSize: 13 }} />
              Secure checkout · coupons, gift cards &amp; points apply next
            </p>
          </div>
        </aside>
      </div>

      <Modal
        open={modalOpen}
        setOpen={setModalOpen}
        title="Delivery information"
        disableBtn={true}
        onClose={closeModal}
      >
        <form onSubmit={form.handleSubmit} className="space-y-4 pt-2">
          {!isLoggedIn && (
            <TextInput
              name="customerEmail"
              label="Email address"
              form={form}
              type="email"
            />
          )}
          <TextInput
            name="phoneNumber"
            label="Mobile number (optional)"
            form={form}
            type="tel"
            inputProps={{ maxLength: 10, inputMode: "numeric" }}
          />
          <SelectInput name="state" label="State" form={form} data={states} />
          <SelectInput name="district" label="District" form={form} data={districts} />
          <TextInput name="addressDetail" label="Address detail" form={form} />
          <Box className="flex gap-2 pt-2">
            <Button
              fullWidth
              variant="outlined"
              className="!border-line !text-ink hover:!bg-sunken"
              onClick={closeModal}
            >
              Cancel
            </Button>
            <LoadingButton
              fullWidth
              variant="contained"
              type="submit"
              loading={createMutation.isLoading}
            >
              Place order
            </LoadingButton>
          </Box>
        </form>
      </Modal>
    </div>
  );
}

export default Cart;
