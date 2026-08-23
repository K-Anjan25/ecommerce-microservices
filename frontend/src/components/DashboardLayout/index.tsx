import React from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import Navbar from "../Navbar";
import MobileTabBar from "../MobileTabBar";

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

  return (
    <div className="flex min-h-screen flex-col bg-canvas">
      <Navbar />

      <main
        key={location.pathname}
        className={`animate-fade-up flex-1 pb-24 lg:pb-12 ${
          isShop ? "pt-6" : "page-shell pt-6 sm:pt-8"
        }`}
      >
        <Outlet />
      </main>

      {/* ── footer ────────────────────────────────────────────────────── */}
      <footer className="grain mt-auto bg-contrast text-oncontrast">
        <div className="page-shell grid gap-10 py-14 md:grid-cols-[1.4fr_repeat(3,1fr)]">
          <div>
            <p className="font-heading text-lg font-extrabold tracking-[0.18em]">CARTLY</p>
            <p className="mt-3 max-w-xs text-sm leading-relaxed text-ink-muted">
              Everything you need, one cart. Built on Spring Boot microservices with a
              React storefront — catalog, checkout, payments and loyalty in one place.
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              {["Visa", "Mastercard", "UPI", "Razorpay", "COD"].map((p) => (
                <span
                  key={p}
                  className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[0.625rem] font-semibold text-ink-muted"
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
                      className="text-sm text-ink-muted transition hover:text-accent"
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
          <div className="page-shell flex flex-col items-center justify-between gap-2 py-5 text-xs text-ink-muted sm:flex-row">
            <span>© {new Date().getFullYear()} Cartly. All rights reserved.</span>
            <span className="font-mono">api-gateway · user · product · commerce</span>
          </div>
        </div>
      </footer>

      <MobileTabBar />
    </div>
  );
}

export default DashboardLayout;
