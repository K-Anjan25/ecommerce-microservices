import React from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import Navbar from "../Navbar";
import MobileTabBar from "../MobileTabBar";
import { BrandMark } from "../../brand";
import { CheckoutHeader } from "../../features/checkout";
import { useI18n } from "../../features/i18n";

const FOOTER_LINKS: { title: string; items: { label: string; to: string }[] }[] = [
  {
    title: "Shop",
    items: [
      { label: "All products", to: "/" },
      { label: "Flash sales", to: "/flash-sales" },
      { label: "Gift cards", to: "/gift-cards" },
      { label: "Compare", to: "/compare" },
    ],
  },
  {
    title: "Account",
    items: [
      { label: "My orders", to: "/orders" },
      { label: "Addresses", to: "/addresses" },
      { label: "Loyalty points", to: "/loyalty" },
      { label: "Referral", to: "/referral" },
    ],
  },
  {
    title: "Support",
    items: [
      { label: "Returns", to: "/returns" },
      { label: "Track an order", to: "/orders" },
      { label: "Profile", to: "/account" },
      { label: "Sign in", to: "/login" },
    ],
  },
];

function DashboardLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const isShop = location.pathname === "/";
  const isCheckout = ["/checkout", "/stripe-payment", "/stripe-payment-return", "/order-confirmation"].includes(location.pathname);
  const { t } = useI18n();

  return (
    <div className="flex min-h-screen flex-col bg-canvas">
      <a
        href="#main-content"
        className="fixed left-3 top-3 z-[100] -translate-y-20 bg-action px-4 py-2 text-sm font-semibold text-oncontrast transition focus:translate-y-0"
      >
        {t("common.skip")}
      </a>
      {isCheckout ? <CheckoutHeader /> : <Navbar />}

      <main
        id="main-content"
        tabIndex={-1}
        key={location.pathname}
        className={`animate-fade-up flex-1 ${isCheckout ? "page-shell pb-10 pt-6 sm:pt-8" : `pb-24 lg:pb-12 ${isShop ? "pt-6" : "page-shell pt-6 sm:pt-8"}`}`}
      >
        <Outlet />
      </main>

      {/* Checkout deliberately removes catalog navigation and promotional exits. */}
      {!isCheckout && (
      <footer className="mt-auto bg-contrast text-oncontrast">
        <div className="page-shell grid gap-10 py-14 md:grid-cols-[1.4fr_repeat(3,1fr)]">
          <div>
            <BrandMark inverse />
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-oncontrast/60">
              A considered collection for home and life. Thoughtful objects, honest pricing,
              secure checkout and support that stays with you after delivery.
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              {["Visa", "Mastercard", "UPI", "Razorpay", "COD"].map((p) => (
                <span
                  key={p}
                  className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[0.625rem] font-semibold text-oncontrast/70"
                >
                  {p}
                </span>
              ))}
            </div>
          </div>

          {FOOTER_LINKS.map((col) => (
            <div key={col.title}>
              <p className="text-eyebrow font-bold uppercase text-oncontrast">{col.title}</p>
              <ul className="mt-4 space-y-2.5">
                {col.items.map((item) => (
                  <li key={item.label}>
                    <button
                      onClick={() => navigate(item.to)}
                      className="text-sm text-oncontrast/70 transition hover:text-accent"
                    >
                      {item.label}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="border-t border-white/10">
          <div className="page-shell flex flex-col items-center justify-between gap-2 py-5 text-xs text-oncontrast/60 sm:flex-row">
            <span>© {new Date().getFullYear()} Cartly. All rights reserved.</span>
            <span>Curated for everyday · Hyderabad, India</span>
          </div>
        </div>
      </footer>
      )}

      {!isCheckout && <MobileTabBar />}
    </div>
  );
}

export default DashboardLayout;
