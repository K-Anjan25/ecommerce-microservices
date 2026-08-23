import { Box, Checkbox, Divider, FormControlLabel } from "@mui/material";
import { LoadingButton } from "@mui/lab";
import { useFormik } from "formik";
import { useEffect, useState } from "react";
import { useMutation, useQuery } from "react-query";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import ShoppingCartOutlinedIcon from "@mui/icons-material/ShoppingCartOutlined";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import LocalShippingOutlinedIcon from "@mui/icons-material/LocalShippingOutlined";
import BoltOutlinedIcon from "@mui/icons-material/BoltOutlined";
import CreditCardIcon from "@mui/icons-material/CreditCard";
import PaymentsOutlinedIcon from "@mui/icons-material/PaymentsOutlined";
import PlaceOutlinedIcon from "@mui/icons-material/PlaceOutlined";
import RedeemOutlinedIcon from "@mui/icons-material/RedeemOutlined";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";

import { OrderApi } from "../../api/orderApi";
import { PaymentApi } from "../../api/paymentApi";
import { AddressApi } from "../../api/addressApi";
import { ShippingApi } from "../../api/shippingApi";
import { CouponApi } from "../../api/couponApi";
import CartLine from "../../components/CartLine";
import CheckoutSteps from "../../components/CheckoutSteps";
import EmptyState from "../../components/EmptyState";
import SelectInput from "../../components/SelectInput";
import TextInput from "../../components/TextInput";
import createOrderForm from "../../forms/orderForm";
import { AppState } from "../../store";
import { clearAllItems } from "../../store/actions/cartAction";
import { CreateOrderRequest, ShippingMethod } from "../../types/order";
import { PaymentRequest, PaymentProvider } from "../../types/payment";
import { SavedAddress } from "../../types/address";
import {
  calculateCountOfCartItems,
  calculateTotalPriceOfCartItems,
  formatPrice,
} from "../../utils/cart";
import { showError } from "../../utils/showError";
import { showSuccess } from "../../utils/showSuccess";
import statesAndDistrict from "../../formdata.json";

const FORM_ID = "checkout-form";

/** Section wrapper — numbered, so the single-scroll flow stays legible. */
function Section({
  step,
  title,
  subtitle,
  icon: Icon,
  children,
}: {
  step: number;
  title: string;
  subtitle?: string;
  icon: typeof PlaceOutlinedIcon;
  children: React.ReactNode;
}) {
  return (
    <section className="panel p-5 sm:p-6">
      <div className="mb-5 flex items-start gap-3">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-contrast text-xs font-bold text-oncontrast">
          {step}
        </span>
        <div className="min-w-0">
          <h2 className="flex items-center gap-2 font-heading text-base font-bold text-ink">
            <Icon sx={{ fontSize: 17 }} className="text-ink-muted" />
            {title}
          </h2>
          {subtitle && <p className="mt-0.5 text-xs text-ink-muted">{subtitle}</p>}
        </div>
      </div>
      {children}
    </section>
  );
}

/** Selectable option card — used for delivery + payment method. */
function OptionCard({
  active,
  onClick,
  title,
  copy,
  price,
  icon: Icon,
}: {
  active: boolean;
  onClick: () => void;
  title: string;
  copy: string;
  price?: string;
  icon: typeof BoltOutlinedIcon;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`flex flex-1 items-start gap-3 rounded-sm border p-4 text-left transition ${
        active
          ? "border-brand bg-brand-tint ring-1 ring-brand"
          : "border-line bg-paper hover:border-ink-faint"
      }`}
    >
      <span
        className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
          active ? "bg-action text-oncontrast" : "bg-sunken text-ink-soft"
        }`}
      >
        <Icon sx={{ fontSize: 17 }} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-baseline justify-between gap-2">
          <span className="text-sm font-bold text-ink">{title}</span>
          {price && <span className="shrink-0 text-sm font-bold text-ink">{price}</span>}
        </span>
        <span className="mt-0.5 block text-xs text-ink-soft">{copy}</span>
      </span>
    </button>
  );
}

function Checkout() {
  const navigate = useNavigate();
  const dispatch = useDispatch<any>();
  const items = useSelector((state: AppState) => state.cart);
  const isLoggedIn = useSelector((state: AppState) => state.user.data.isLogedIn);
  const [districts, setDistricts] = useState<{ name: string; id: string }[]>([]);
  const [shippingMethod, setShippingMethod] = useState<ShippingMethod>(ShippingMethod.STANDARD);
  const [paymentProvider, setPaymentProvider] = useState<PaymentProvider>("RAZORPAY");
  const [giftWrap, setGiftWrap] = useState(false);
  const [couponInput, setCouponInput] = useState("");
  const [coupon, setCoupon] = useState<{ code: string; discount: number } | null>(null);
  const [reviewOpen, setReviewOpen] = useState(false);
  const subtotal = Number(calculateTotalPriceOfCartItems(items));
  const itemCount = calculateCountOfCartItems(items);

  const { data: defaultAddress } = useQuery("defaultAddress", AddressApi.getDefaultAddress, {
    retry: false,
  });

  const applyAddress = (address: SavedAddress) => {
    form.setValues({
      ...form.values,
      state: address.state,
      district: address.district,
      addressDetail: address.addressDetail,
    });
    setDistricts(
      statesAndDistrict
        .find((s: any) => s.state_name === address.state)
        ?.districts.map((d: any) => ({ name: d.district_name, id: d.district_name })) ?? []
    );
  };

  const form = useFormik({
    ...createOrderForm({ guest: !isLoggedIn, requirePincode: true }),
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
        },
        items: products,
        shippingMethod,
        customerEmail: isLoggedIn ? undefined : values.customerEmail,
        giftWrap,
        pincode: values.pincode,
        state: values.state,
        couponCode: coupon?.code,
      } as CreateOrderRequest;

      createOrderMutation.mutate(order);
    },
  });

  // Server-computed shipping quote + tax rule (both endpoints sit behind the
  // gateway AuthFilter, so they are only queried for logged-in users; guests
  // fall back to the legacy flat estimate below).
  const pincode = (form.values.pincode ?? "").trim();
  const pincodeValid = /^\d{6}$/.test(pincode);

  const { data: shippingQuote, isFetching: shippingFetching } = useQuery(
    ["shippingQuote", pincode, subtotal],
    () => ShippingApi.calculateShipping(pincode, subtotal),
    { enabled: isLoggedIn && pincodeValid, retry: false }
  );

  const { data: taxRule } = useQuery(
    ["taxRule", form.values.state],
    () => ShippingApi.getTaxRule(form.values.state),
    { enabled: isLoggedIn && Boolean(form.values.state), retry: false }
  );

  const hasShippingQuote = Boolean(shippingQuote?.active);
  const shippingCost = hasShippingQuote
    ? Number(shippingQuote?.cost ?? 0)
    : subtotal >= 500
    ? 0
    : shippingMethod === ShippingMethod.EXPRESS
    ? 100
    : 50;
  const giftWrapFee = giftWrap ? 50 : 0;
  const discount = coupon?.discount ?? 0;
  const taxRate = taxRule?.rate ?? 0.18;
  const taxLabel = taxRule ? `${taxRule.taxName} ${Math.round(taxRate * 100)}%` : "18% GST";
  // Mirrors the backend: tax applies to subtotal + shipping - discount + gift wrap.
  const tax = Number(((subtotal + shippingCost - discount + giftWrapFee) * taxRate).toFixed(2));
  const total = subtotal + shippingCost - discount + giftWrapFee + tax;

  // A cart change invalidates the applied coupon (discount depends on subtotal).
  useEffect(() => {
    setCoupon(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subtotal]);

  const couponMutation = useMutation(
    () => CouponApi.validateCoupon(couponInput.trim().toUpperCase(), subtotal),
    {
      onSuccess: (res) => {
        if (res.valid) {
          setCoupon({ code: res.code, discount: Number(res.discountAmount) });
          showSuccess(`Coupon ${res.code} applied`);
        } else {
          showError(res.message ?? "Coupon is not valid");
        }
      },
      onError: (e: any) =>
        showError(e.response?.data?.message ?? "Coupon could not be applied"),
    }
  );

  const applyCoupon = () => {
    if (!couponInput.trim()) return;
    couponMutation.mutate();
  };

  const createOrderMutation = useMutation(OrderApi.createOrder, {
    onSuccess: (order) => {
      const payment = {
        orderId: order.id,
        amount: order.totalAmount ?? total,
        currency: "INR",
        provider: paymentProvider,
      } as PaymentRequest;

      paymentMutation.mutate(payment);
    },
    onError: (e: any) => {
      showError(e.response?.data?.message ?? "Order could not be created");
    },
  });

  const paymentMutation = useMutation(PaymentApi.initiatePayment, {
    onSuccess: (payment) => {
      if (payment.status === "FAILED") {
        showError(payment.message ?? "Payment failed");
        return;
      }

      const isCod = payment.provider === "CASH" || payment.status === "PENDING";
      showSuccess(
        isCod
          ? "Order placed successfully — pay on delivery"
          : "Payment completed and order has been created successfully"
      );
      dispatch(clearAllItems());
      sessionStorage.removeItem("checkout_form");
      navigate("/");
    },
    onError: (e: any) => {
      showError(e.response?.data?.message ?? "Payment could not be completed");
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

  useEffect(() => {
    setDistricts(getDistricts(form.values.state) ?? []);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.values.state]);

  useEffect(() => {
    const savedFormData = sessionStorage.getItem("checkout_form");
    if (savedFormData) form.setValues(JSON.parse(savedFormData));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    sessionStorage.setItem("checkout_form", JSON.stringify(form.values));
  }, [form.values]);

  const busy = createOrderMutation.isLoading || paymentMutation.isLoading;

  if (items.length === 0) {
    return (
      <div className="page-shell">
        <CheckoutSteps current="details" />
        <div className="panel">
          <EmptyState
            icon={<ShoppingCartOutlinedIcon fontSize="large" />}
            title="Your cart is empty"
            subtitle="Add products to your cart before checking out."
            action={
              <button className="primary-button" onClick={() => navigate("/")}>
                Continue shopping
              </button>
            }
          />
        </div>
      </div>
    );
  }

  /* ── shared summary block (aside on desktop, sheet-free on mobile) ─── */
  const summaryRows = (
    <dl className="space-y-2.5 text-sm">
      <div className="flex justify-between">
        <dt className="text-ink-soft">Subtotal ({itemCount} items)</dt>
        <dd className="font-semibold">{formatPrice(subtotal)}</dd>
      </div>
      {coupon && (
        <div className="flex justify-between">
          <dt className="font-semibold text-state-success">Coupon {coupon.code}</dt>
          <dd className="font-semibold text-state-success">−{formatPrice(coupon.discount)}</dd>
        </div>
      )}
      <div className="flex justify-between">
        <dt className="text-ink-soft">
          Shipping
          {hasShippingQuote && (
            <span className="block text-[0.6875rem] text-ink-muted">
              {shippingQuote?.carrier} · {shippingQuote?.estimatedDaysMin}–
              {shippingQuote?.estimatedDaysMax} days
            </span>
          )}
        </dt>
        <dd className="font-semibold">
          {shippingCost === 0 ? (
            <span className="text-state-success">FREE</span>
          ) : (
            formatPrice(shippingCost)
          )}
        </dd>
      </div>
      {isLoggedIn && pincodeValid && !shippingFetching && !hasShippingQuote && (
        <p className="text-[0.6875rem] text-ink-muted">
          No courier rate found for this pincode — flat rate applies.
        </p>
      )}
      <div className="flex justify-between">
        <dt className="text-ink-soft">Tax ({taxLabel})</dt>
        <dd className="font-semibold">{formatPrice(tax)}</dd>
      </div>
      {giftWrap && (
        <div className="flex justify-between">
          <dt className="text-ink-soft">Gift wrap</dt>
          <dd className="font-semibold">{formatPrice(giftWrapFee)}</dd>
        </div>
      )}
    </dl>
  );

  return (
    <div className="page-shell pb-28 lg:pb-8">
      <CheckoutSteps current="details" />

      <div className="mb-6">
        <p className="eyebrow">Step 2 of 3</p>
        <h1 className="page-title mt-1">Checkout</h1>
        <p className="page-subtitle">
          {itemCount} item{itemCount === 1 ? "" : "s"} · everything below is confirmed before
          payment is taken.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
        {/* ══ left: the flow ══════════════════════════════════════════ */}
        <form id={FORM_ID} onSubmit={form.handleSubmit} className="space-y-4">
          <Section
            step={1}
            title="Delivery address"
            subtitle={isLoggedIn ? undefined : "Guest checkout — no account needed"}
            icon={PlaceOutlinedIcon}
          >
            <div className="space-y-3">
              {!isLoggedIn && (
                <TextInput
                  name="customerEmail"
                  label="Email for order updates"
                  form={form}
                  type="email"
                />
              )}

              {defaultAddress && (
                <button
                  type="button"
                  onClick={() => applyAddress(defaultAddress)}
                  className="flex w-full items-center justify-between gap-3 rounded-sm border border-line bg-canvas px-4 py-3 text-left transition hover:border-brand hover:bg-brand-tint"
                >
                  <span className="min-w-0">
                    <span className="block text-sm font-bold text-ink">Use saved address</span>
                    <span className="block truncate text-xs text-ink-soft">
                      {defaultAddress.addressDetail}, {defaultAddress.district},{" "}
                      {defaultAddress.state}
                    </span>
                  </span>
                  <span className="shrink-0 text-xs font-bold text-brand">Apply</span>
                </button>
              )}

              <div className="grid gap-3 sm:grid-cols-2">
                <SelectInput name="state" label="State" form={form} data={states} />
                <SelectInput name="district" label="District" form={form} data={districts} />
              </div>
              <TextInput
                name="pincode"
                label="Delivery pincode"
                form={form}
                inputProps={{ maxLength: 6, inputMode: "numeric" }}
              />
              <TextInput
                name="addressDetail"
                label="Address detail"
                form={form}
                multiline
                rows={3}
              />
            </div>
          </Section>

          <Section
            step={2}
            title="Delivery method"
            subtitle={
              pincodeValid && hasShippingQuote
                ? "Rate quoted for your pincode"
                : "Flat rate — free over ₹500"
            }
            icon={LocalShippingOutlinedIcon}
          >
            <div className="flex flex-col gap-3 sm:flex-row">
              <OptionCard
                active={shippingMethod === ShippingMethod.STANDARD}
                onClick={() => setShippingMethod(ShippingMethod.STANDARD)}
                title="Standard"
                copy="3–5 working days"
                price={subtotal >= 500 ? "Free" : formatPrice(50)}
                icon={LocalShippingOutlinedIcon}
              />
              <OptionCard
                active={shippingMethod === ShippingMethod.EXPRESS}
                onClick={() => setShippingMethod(ShippingMethod.EXPRESS)}
                title="Express"
                copy="1–2 working days"
                price={subtotal >= 500 ? "Free" : formatPrice(100)}
                icon={BoltOutlinedIcon}
              />
            </div>
          </Section>

          <Section
            step={3}
            title="Payment"
            subtitle={
              paymentProvider === "CASH"
                ? "Pay in cash when your order is delivered"
                : "Razorpay will open to complete your payment"
            }
            icon={CreditCardIcon}
          >
            <div className="flex flex-col gap-3 sm:flex-row">
              <OptionCard
                active={paymentProvider === "RAZORPAY"}
                onClick={() => setPaymentProvider("RAZORPAY")}
                title="Card / UPI"
                copy="Razorpay · requires configured keys"
                icon={CreditCardIcon}
              />
              <OptionCard
                active={paymentProvider === "CASH"}
                onClick={() => setPaymentProvider("CASH")}
                title="Cash on delivery"
                copy="Pay the courier on arrival"
                icon={PaymentsOutlinedIcon}
              />
            </div>
          </Section>

          <Section
            step={4}
            title="Credits & extras"
            subtitle="Coupons, gift wrap and loyalty in one place"
            icon={RedeemOutlinedIcon}
          >
            <div className="space-y-4">
              {isLoggedIn ? (
                coupon ? (
                  <div className="flex items-center justify-between gap-3 rounded-sm border border-state-success/30 bg-state-success-soft px-4 py-3">
                    <span className="min-w-0">
                      <span className="block text-sm font-bold text-state-success">
                        {coupon.code} applied
                      </span>
                      <span className="text-xs text-state-success-on">
                        You saved {formatPrice(coupon.discount)}
                      </span>
                    </span>
                    <button
                      type="button"
                      onClick={() => setCoupon(null)}
                      className="shrink-0 text-xs font-bold text-state-success-on underline-offset-2 hover:underline"
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <div className="flex items-start gap-2">
                    <div className="flex-1">
                      <TextInput
                        name="couponCode"
                        label="Coupon / gift card code"
                        form={form}
                        value={couponInput}
                        onChange={(e: any) => setCouponInput(e.target.value)}
                      />
                    </div>
                    <LoadingButton
                      variant="contained"
                      onClick={applyCoupon}
                      loading={couponMutation.isLoading}
                      className="!h-10"
                    >
                      Apply
                    </LoadingButton>
                  </div>
                )
              ) : (
                <p className="rounded-sm border border-line bg-canvas px-4 py-3 text-xs text-ink-soft">
                  Sign in to apply coupons, gift cards and loyalty points.
                </p>
              )}

              <FormControlLabel
                control={
                  <Checkbox
                    checked={giftWrap}
                    onChange={(e) => setGiftWrap(e.target.checked)}
                    name="giftWrap"
                    color="primary"
                  />
                }
                label={<span className="text-sm">Gift wrap this order (+₹50)</span>}
              />
            </div>
          </Section>

          {/* review — collapsed by default; the cart is one click back */}
          <section className="panel">
            <button
              type="button"
              onClick={() => setReviewOpen((o) => !o)}
              aria-expanded={reviewOpen}
              className="flex w-full items-center justify-between gap-3 p-5 text-left sm:p-6"
            >
              <span className="flex items-center gap-3">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-sunken text-xs font-bold text-ink">
                  {itemCount}
                </span>
                <span>
                  <span className="block font-heading text-base font-bold text-ink">
                    Review items
                  </span>
                  <span className="text-xs text-ink-muted">
                    {reviewOpen ? "Hide" : "Show"} what you&apos;re buying
                  </span>
                </span>
              </span>
              <ExpandMoreIcon
                className={`shrink-0 text-ink-muted transition ${reviewOpen ? "rotate-180" : ""}`}
              />
            </button>
            {reviewOpen && (
              <div className="border-t border-line px-5 sm:px-6">
                <ul className="divide-y divide-line">
                  {items.map((item) => (
                    <CartLine
                      key={`${item.product.id}-${item.variantId ?? "base"}`}
                      item={item}
                      readOnly
                    />
                  ))}
                </ul>
                <div className="py-4">
                  <button
                    type="button"
                    onClick={() => navigate("/cart")}
                    className="secondary-button !py-2"
                  >
                    Edit cart
                  </button>
                </div>
              </div>
            )}
          </section>
        </form>

        {/* ══ right: sticky summary ═══════════════════════════════════ */}
        <aside className="lg:sticky lg:top-24 lg:h-fit">
          <div className="panel-raised p-5">
            <h2 className="mb-4 font-heading text-base font-bold">Order summary</h2>
            {summaryRows}
            <Divider className="!my-4" />
            <div className="flex items-baseline justify-between">
              <span className="font-heading text-base font-bold">Total</span>
              <span className="font-heading text-2xl font-extrabold">{formatPrice(total)}</span>
            </div>
            <LoadingButton
              form={FORM_ID}
              type="submit"
              fullWidth
              variant="contained"
              size="large"
              loading={busy}
              className="!mt-5 !hidden !py-3 lg:!flex"
            >
              Pay {formatPrice(total)}
            </LoadingButton>
            <p className="mt-4 flex items-center justify-center gap-1.5 text-[0.6875rem] text-ink-muted">
              <LockOutlinedIcon sx={{ fontSize: 13 }} />
              256-bit secure · PCI compliant
            </p>
            <Box className="mt-3 flex flex-wrap justify-center gap-1.5">
              {["Visa", "Mastercard", "UPI", "COD"].map((m) => (
                <span
                  key={m}
                  className="rounded-full border border-line px-2.5 py-1 text-[0.625rem] font-semibold text-ink-muted"
                >
                  {m}
                </span>
              ))}
            </Box>
          </div>
        </aside>
      </div>

      {/* ══ mobile sticky pay bar ═════════════════════════════════════ */}
      <div className="fixed inset-x-0 bottom-[3.875rem] z-40 border-t border-line bg-paper/95 p-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] backdrop-blur-md lg:hidden">
        <div className="mx-auto flex max-w-container items-center gap-3">
          <div className="min-w-0">
            <p className="text-[0.625rem] uppercase tracking-wide text-ink-muted">Total</p>
            <p className="font-heading text-lg font-extrabold leading-none">
              {formatPrice(total)}
            </p>
          </div>
          <LoadingButton
            form={FORM_ID}
            type="submit"
            variant="contained"
            loading={busy}
            className="!ml-auto !flex-1 !py-3"
          >
            Pay now
          </LoadingButton>
        </div>
      </div>
    </div>
  );
}

export default Checkout;
