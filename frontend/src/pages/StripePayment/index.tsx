import { loadStripe } from "@stripe/stripe-js";
import { Elements, PaymentElement, useElements, useStripe } from "@stripe/react-stripe-js";
import ArrowBackOutlinedIcon from "@mui/icons-material/ArrowBackOutlined";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import { Alert } from "@mui/material";
import { FormEvent, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import CheckoutSteps from "../../components/CheckoutSteps";
import EmptyState from "../../components/EmptyState";
import { PaymentResponse } from "../../types/payment";
import { formatPrice } from "../../utils/cart";
import { showError } from "../../utils/showError";
import { showSuccess } from "../../utils/showSuccess";

const stripePublishableKey = (import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY as string | undefined)?.trim();
const stripePromise = stripePublishableKey ? loadStripe(stripePublishableKey) : null;

type StripePaymentState = {
  orderId: string;
  payment: PaymentResponse;
  signedIn: boolean;
};

function StripePaymentForm({ confirmation }: { confirmation: StripePaymentState }) {
  const stripe = useStripe();
  const elements = useElements();
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const { payment } = confirmation;

  const goToConfirmation = () => {
    navigate("/order-confirmation", {
      replace: true,
      state: {
        orderId: confirmation.orderId,
        orderStatus: "PENDING",
        paymentStatus: "PENDING",
        provider: "STRIPE",
        amount: Number(payment.amount),
        transactionId: payment.transactionId,
        signedIn: confirmation.signedIn,
      },
    });
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!stripe || !elements || submitting) return;
    setSubmitting(true);
    try {
      const result = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/stripe-payment-return?orderId=${encodeURIComponent(confirmation.orderId)}`,
        },
        // Card payments complete inline; 3DS and other required redirects use
        // the return page above. Neither path treats the browser result as
        // Cartly settlement — only a verified webhook does that.
        redirect: "if_required",
      });
      if (result.error) {
        showError(result.error.message ?? "Stripe could not complete the payment");
        return;
      }
      showSuccess("Payment submitted — waiting for signed provider confirmation");
      goToConfirmation();
    } catch {
      showError("Stripe could not complete the payment; your order remains pending for review");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-6">
      <div className="border-y border-line py-5">
        <PaymentElement options={{ layout: "tabs" }} />
      </div>
      <div className="flex flex-col gap-3 sm:flex-row">
        <button type="submit" disabled={!stripe || !elements || submitting} className="primary-button">
          <LockOutlinedIcon sx={{ fontSize: 16 }} />
          {submitting ? "Confirming…" : `Pay ${formatPrice(Number(payment.amount))}`}
        </button>
        <button
          type="button"
          className="secondary-button"
          onClick={() => {
            showError("Payment was not confirmed; your order remains pending");
            goToConfirmation();
          }}
          disabled={submitting}
        >
          Review pending order
        </button>
      </div>
    </form>
  );
}

export default function StripePaymentPage() {
  const location = useLocation();
  const confirmation = location.state as StripePaymentState | null;

  if (!confirmation?.orderId || !confirmation.payment?.clientSecret) {
    return (
      <div className="page-shell">
        <CheckoutSteps current="details" />
        <EmptyState
          icon={<LockOutlinedIcon fontSize="large" />}
          title="Stripe payment session unavailable"
          subtitle="Your order was kept pending. Return to the confirmation screen or review the order from your account."
        />
      </div>
    );
  }

  if (!stripePromise) {
    return (
      <div className="page-shell">
        <CheckoutSteps current="details" />
        <EmptyState
          icon={<LockOutlinedIcon fontSize="large" />}
          title="Stripe checkout is not configured"
          subtitle="The order remains pending and will not be marked paid without provider confirmation."
          action={<button className="secondary-button" onClick={() => window.history.back()}><ArrowBackOutlinedIcon sx={{ fontSize: 16 }} />Go back</button>}
        />
      </div>
    );
  }

  return (
    <div className="page-shell pb-12">
      <CheckoutSteps current="details" />
      <div className="mx-auto max-w-2xl">
        <p className="eyebrow">Secure payment</p>
        <h1 className="mt-2 font-display text-5xl font-normal tracking-[-0.03em] text-ink">Complete your payment</h1>
        <p className="mt-3 text-sm text-ink-soft">
          Order <span className="font-mono text-xs text-ink">{confirmation.orderId}</span> · {formatPrice(Number(confirmation.payment.amount))}
        </p>
        <Alert severity="info" className="mt-6">
          Stripe may ask for an extra verification step. Cartly will wait for its signed provider confirmation before marking this order paid.
        </Alert>
        <div className="mt-8">
          <Elements
            stripe={stripePromise}
            options={{
              clientSecret: confirmation.payment.clientSecret,
              appearance: {
                theme: "stripe",
                variables: {
                  colorPrimary: "#A4472D",
                  colorText: "#221A16",
                  colorBackground: "#FBF9F4",
                  borderRadius: "0px",
                },
              },
            }}
          >
            <StripePaymentForm confirmation={confirmation} />
          </Elements>
        </div>
      </div>
    </div>
  );
}
