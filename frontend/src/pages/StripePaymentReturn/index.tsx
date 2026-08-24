import HourglassTopOutlinedIcon from "@mui/icons-material/HourglassTopOutlined";
import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import CheckoutSteps from "../../components/CheckoutSteps";
import Loader from "../../components/Loader";

export default function StripePaymentReturnPage() {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const contextRaw = sessionStorage.getItem("stripe-payment-context");
    // Stripe may append a client-secret query parameter for redirect flows;
    // consume it only as part of the provider return and scrub the URL before
    // rendering/navigating further. It is never forwarded to Cartly APIs.
    window.history.replaceState(null, "", "/stripe-payment-return");
    sessionStorage.removeItem("stripe-payment-context");
    let context: {
      orderId?: string;
      amount?: number;
      transactionId?: string;
      signedIn?: boolean;
    } = {};
    try {
      context = contextRaw ? JSON.parse(contextRaw) : {};
    } catch {
      context = {};
    }

    const orderId = new URLSearchParams(location.search).get("orderId") || context.orderId;
    if (!orderId) {
      navigate("/order-confirmation", { replace: true });
      return;
    }

    // Stripe redirect_status is a browser hint only. The server remains
    // pending until its signed webhook confirms success or failure.
    navigate("/order-confirmation", {
      replace: true,
      state: {
        orderId,
        orderStatus: "PENDING",
        paymentStatus: "PENDING",
        provider: "STRIPE",
        amount: Number(context.amount ?? 0),
        transactionId: context.transactionId,
        signedIn: Boolean(context.signedIn),
      },
    });
  }, [location.search, navigate]);

  return (
    <div className="page-shell">
      <CheckoutSteps current="details" />
      <div className="flex flex-col items-center justify-center gap-4 py-20 text-center">
        <HourglassTopOutlinedIcon className="text-ink-muted" sx={{ fontSize: 34 }} />
        <Loader />
      </div>
    </div>
  );
}
