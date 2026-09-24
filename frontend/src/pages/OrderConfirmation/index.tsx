import { useEffect } from "react";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import { trackEvent } from "../../utils/analytics";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import HourglassTopOutlinedIcon from "@mui/icons-material/HourglassTopOutlined";
import PaymentsOutlinedIcon from "@mui/icons-material/PaymentsOutlined";
import { useLocation, useNavigate } from "react-router-dom";

import { useQuery } from "react-query";

import { PaymentApi } from "../../api/paymentApi";
import { ProductApi } from "../../api/productApi";
import Card from "../../components/Card";
import CheckoutSteps from "../../components/CheckoutSteps";
import EmptyState from "../../components/EmptyState";
import { formatPrice } from "../../utils/cart";
import { showSuccess } from "../../utils/showSuccess";

type ConfirmationState = {
  orderId: string;
  orderStatus: string;
  paymentStatus: string;
  provider: string;
  amount: number;
  transactionId?: string;
  signedIn: boolean;
};

function OrderConfirmation() {
  const navigate = useNavigate();
  const location = useLocation();
  const confirmation = location.state as ConfirmationState | null;
  const canPollPayment = Boolean(confirmation?.signedIn
    && confirmation.paymentStatus === "PENDING"
    && confirmation.provider !== "CASH"
    && confirmation.orderId);
  const { data: observedPayment, isFetching: checkingPayment } = useQuery(
    ["order-confirmation-payment", confirmation?.orderId],
    () => PaymentApi.getPaymentForOrder(confirmation?.orderId ?? ""),
    { enabled: canPollPayment, refetchInterval: 5000, retry: false }
  );

  // Funnel analytics: a real conversion happened.
  useEffect(() => {
    if (confirmation?.orderId) trackEvent("ORDER_COMPLETED");
  }, [confirmation?.orderId]);

  // "You may also like" — bestsellers strip for the thank-you page.
  const { data: upsellProducts } = useQuery(
    "order-confirmation-upsell",
    () => ProductApi.getBestsellers(),
    { enabled: Boolean(confirmation?.orderId), staleTime: 5 * 60 * 1000 }
  );

  if (!confirmation?.orderId) {
    return (
      <>
        <CheckoutSteps current="done" />
        <EmptyState
          title="Confirmation details are no longer available"
          subtitle="For security, guest confirmation data is kept only during the completed checkout navigation. Signed-in customers can review orders from their account."
          action={<button className="primary-button" onClick={() => navigate("/")}>Continue shopping</button>}
        />
      </>
    );
  }

  const isCod = confirmation.provider === "CASH";
  const effectivePaymentStatus = observedPayment?.status ?? confirmation.paymentStatus;
  const effectiveOrderStatus = observedPayment?.status === "SUCCESS" ? "PAID" : confirmation.orderStatus;
  const isPendingProvider = effectivePaymentStatus === "PENDING" && !isCod;
  const providerFailed = effectivePaymentStatus === "FAILED" && !isCod;
  const paid = effectiveOrderStatus === "PAID" || effectivePaymentStatus === "SUCCESS";
  const Icon = paid ? CheckCircleOutlineIcon : isPendingProvider ? HourglassTopOutlinedIcon : PaymentsOutlinedIcon;
  const title = paid
    ? "Your order is confirmed."
    : isPendingProvider
    ? "Payment confirmation is pending."
    : providerFailed
    ? "Payment was not confirmed."
    : "Your order has been placed.";
  const copy = paid
    ? "Payment has been confirmed and your order is ready for fulfilment."
    : isPendingProvider
    ? "The provider accepted the payment initiation, but Cartly will not mark this order paid until a signed settlement confirmation arrives."
    : providerFailed
    ? "The provider reported a failed payment. Cartly will close the pending order and release its reservations after the verified failure transition."
    : "Cash is due when your delivery arrives. We have reserved your items and recorded the order.";

  return (
    <div>
      <CheckoutSteps current="done" />
      <section className="mx-auto max-w-3xl border-t border-ink py-10 sm:py-14">
        <div className="flex flex-col items-start gap-6 sm:flex-row">
          <span className={`flex h-14 w-14 shrink-0 items-center justify-center ${paid ? "bg-state-success-soft text-state-success-on" : "bg-sunken text-ink-soft"}`}>
            <Icon sx={{ fontSize: 28 }} />
          </span>
          <div className="min-w-0 flex-1">
            <p className="eyebrow">Order received</p>
            <h1 className="mt-2 font-heading text-3xl font-black tracking-tight text-ink sm:text-4xl">{title}</h1>
            <p className="mt-4 max-w-2xl text-sm leading-relaxed text-ink-soft">{copy}</p>
          </div>
        </div>

        <dl className="mt-10 grid border-y border-line sm:grid-cols-2">
          <div className="border-b border-line py-5 sm:border-b-0 sm:border-r sm:pr-6">
            <dt className="eyebrow">Order reference</dt>
            <dd className="mt-2 flex items-center gap-2 font-mono text-sm font-semibold text-ink">
              <span className="truncate">{confirmation.orderId}</span>
              <button
                type="button"
                aria-label="Copy order reference"
                className="icon-button h-8 w-8 shrink-0"
                onClick={() => {
                  navigator.clipboard.writeText(confirmation.orderId);
                  showSuccess("Order reference copied");
                }}
              >
                <ContentCopyIcon sx={{ fontSize: 15 }} />
              </button>
            </dd>
          </div>
          <div className="py-5 sm:pl-6">
            <dt className="eyebrow">Payment</dt>
            <dd className="mt-2 text-sm font-semibold text-ink">
              {confirmation.provider === "GIFT_CARD" ? "Paid by gift card" : confirmation.provider}
              <span className="mx-2 text-ink-muted">·</span>
              {formatPrice(confirmation.amount)}
            </dd>
            <p className="mt-1 text-xs text-ink-muted">
              {paid
                ? "Confirmed"
                : isCod
                ? "Due on delivery"
                : providerFailed
                ? "Provider reported failure"
                : "Awaiting signed provider settlement"}
              {checkingPayment && isPendingProvider ? " · checking status" : ""}
            </p>
          </div>
        </dl>

        {confirmation.transactionId && (
          <p className="mt-4 break-all text-xs text-ink-muted">
            Provider reference: <span className="font-mono text-ink-soft">{confirmation.transactionId}</span>
          </p>
        )}

        <div className="mt-10 flex flex-col gap-3 sm:flex-row">
          {confirmation.signedIn && (
            <button className="primary-button" onClick={() => navigate(`/orderDetail/${confirmation.orderId}`, { replace: true })}>
              View order details
            </button>
          )}
          <button className="secondary-button" onClick={() => navigate("/", { replace: true })}>
            Continue shopping
          </button>
        </div>
        {!confirmation.signedIn && (
          <p className="mt-5 border-l-2 border-accent pl-4 text-xs leading-relaxed text-ink-muted">
            Save the order reference above. A private tracking link has been sent to the checkout email; its capability is never placed in a query string or browser storage.
          </p>
        )}
      </section>

      {/* You may also like — concept-style product strip */}
      {upsellProducts && upsellProducts.length > 0 && (
        <section className="mx-auto max-w-5xl px-4 pb-14 sm:px-6">
          <div className="mb-5 flex items-end justify-between border-t border-line pt-8">
            <div>
              <p className="eyebrow !text-accent">While you wait</p>
              <h2 className="mt-1 font-heading text-xl font-extrabold tracking-tight text-ink sm:text-2xl">
                You may also like
              </h2>
            </div>
            <button
              onClick={() => navigate("/", { replace: true })}
              className="text-xs font-bold text-brand hover:underline"
            >
              Browse all →
            </button>
          </div>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-5">
            {upsellProducts.slice(0, 5).map((product) => (
              <Card key={`upsell-${product.id}`} product={product} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

export default OrderConfirmation;
