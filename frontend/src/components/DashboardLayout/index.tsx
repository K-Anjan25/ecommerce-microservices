import React, { useState } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import Navbar from "../Navbar";
import MobileTabBar from "../MobileTabBar";
import { BrandMark, PaymentMarks } from "../../brand";
import { api } from "../../api/client";
import { CheckoutHeader } from "../../features/checkout";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";

const FOOTER_LINKS = [
  { label: "Help", to: "/help" },
  { label: "Account", to: "/account" },
  { label: "Services", to: "/services" },
  { label: "Contact", to: "/contact" },
  { label: "Terms", to: "/terms" },
];

function DashboardLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [subscribed, setSubscribed] = useState(false);
  const [subscribeError, setSubscribeError] = useState("");
  const isShop = location.pathname === "/";
  const isCheckout = ["/checkout", "/stripe-payment", "/stripe-payment-return", "/order-confirmation"].includes(location.pathname);

  return (
    <div className="flex min-h-screen flex-col bg-canvas text-ink">
      {isCheckout ? <CheckoutHeader /> : <Navbar />}

      <main
        id="main-content"
        tabIndex={-1}
        key={location.pathname}
        className={`animate-fade-up flex-1 ${isCheckout ? "page-shell pb-10 pt-6 sm:pt-8" : `pb-20 lg:pb-12 ${isShop ? "pt-6" : "page-shell pt-6 sm:pt-8"}`}`}
      >
        <Outlet />
      </main>

      {/* Concept B clean white footer with inline payment icons and newsletter signup */}
      {!isCheckout && (
        <footer className="mt-auto border-t border-line bg-paper py-10">
          <div className="page-shell flex flex-col md:flex-row items-center justify-between gap-8">
            {/* Left: Navigation links and copyright */}
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-x-6 gap-y-2 text-xs font-semibold text-ink-soft">
              {FOOTER_LINKS.map((link) => (
                <button
                  key={link.label}
                  onClick={() => navigate(link.to)}
                  className="transition hover:text-brand"
                >
                  {link.label}
                </button>
              ))}
              <span className="text-ink-muted">© 2026 Cartly Inc.</span>
            </div>

            {/* Right: Payment badges and Email signup */}
            <div className="flex flex-wrap items-center justify-center gap-4">
              {/* Accepted card artwork (Visa · Mastercard · Discover) */}
              <PaymentMarks />

              {/* Email signup field — POSTs to /v1/newsletter/subscribe */}
              {subscribed ? (
                <span className="flex items-center gap-2 rounded-lg border border-state-success/30 bg-state-success-soft px-4 py-2 text-xs font-bold text-state-success-on">
                  ✓ You&apos;re on the list — watch your inbox for deals.
                </span>
              ) : (
                <form
                  onSubmit={async (e) => {
                    e.preventDefault();
                    const email = new FormData(e.currentTarget).get("email") as string;
                    setSubscribeError("");
                    try {
                      await api.post("/v1/newsletter/subscribe", { email });
                      setSubscribed(true);
                    } catch {
                      setSubscribeError("Couldn't sign you up right now — please try again.");
                    }
                  }}
                  className="relative flex items-center"
                  noValidate
                >
                  <input
                    name="email"
                    type="email"
                    placeholder={subscribeError ? "Try a valid email" : "Email signup"}
                    required
                    aria-label="Email for newsletter signup"
                    aria-invalid={Boolean(subscribeError)}
                    className={`h-9 w-48 sm:w-56 rounded-lg border bg-paper pl-4 pr-10 text-xs text-ink outline-none transition placeholder:text-ink-muted focus:border-brand focus:ring-2 focus:ring-brand/15 ${
                      subscribeError ? "border-state-danger" : "border-line"
                    }`}
                  />
                  <button
                    type="submit"
                    aria-label="Submit newsletter"
                    className="absolute right-1 flex h-7 w-7 items-center justify-center rounded-full bg-brand text-white transition hover:bg-brand-dark"
                  >
                    <ArrowForwardIcon sx={{ fontSize: 14 }} />
                  </button>
                </form>
              )}
            </div>
          </div>
        </footer>
      )}

      {!isCheckout && <MobileTabBar />}
    </div>
  );
}

export default DashboardLayout;
