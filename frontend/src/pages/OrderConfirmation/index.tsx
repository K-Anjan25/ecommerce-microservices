import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import HourglassTopOutlinedIcon from "@mui/icons-material/HourglassTopOutlined";
import PaymentsOutlinedIcon from "@mui/icons-material/PaymentsOutlined";
import { useLocation, useNavigate } from "react-router-dom";

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
  const isPendingProvider = confirmation.paymentStatus === "PENDING" && !isCod;
  const paid = confirmation.orderStatus === "PAID" || confirmation.paymentStatus === "SUCCESS";
  const Icon = paid ? CheckCircleOutlineIcon : isPendingProvider ? HourglassTopOutlinedIcon : PaymentsOutlinedIcon;
  const title = paid
    ? "Your order is confirmed."
    : isPendingProvider
    ? "Payment confirmation is pending."
    : "Your order has been placed.";
  const copy = paid
    ? "Payment has been confirmed and your order is ready for fulfilment."
    : isPendingProvider
    ? "The provider accepted the payment initiation, but Cartly will not mark this order paid until a signed settlement confirmation arrives."
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
            <h1 className="mt-2 font-display text-4xl font-normal text-ink sm:text-5xl">{title}</h1>
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
              {paid ? "Confirmed" : isCod ? "Due on delivery" : "Awaiting signed provider settlement"}
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
    </div>
  );
}

export default OrderConfirmation;
