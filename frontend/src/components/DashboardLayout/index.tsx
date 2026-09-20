import React from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import Navbar from "../Navbar";
import MobileTabBar from "../MobileTabBar";
import { BrandMark } from "../../brand";
import { CheckoutHeader } from "../../features/checkout";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";

const FOOTER_LINKS = [
  { label: "Help", to: "/" },
  { label: "Account", to: "/account" },
  { label: "Services", to: "/" },
  { label: "Contact", to: "/" },
  { label: "Terms", to: "/" },
];

function DashboardLayout() {
  const navigate = useNavigate();
  const location = useLocation();
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
        <footer className="mt-auto border-t border-line bg-paper py-8">
          <div className="page-shell flex flex-col md:flex-row items-center justify-between gap-6">
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
              {/* Payment brand mock chips */}
              <div className="flex items-center gap-1.5">
                <span className="flex h-6 w-9 items-center justify-center rounded bg-[#1A1F71] text-[9px] font-black text-white">
                  VISA
                </span>
                <span className="flex h-6 w-9 items-center justify-center rounded bg-[#EB001B] text-[8px] font-black text-white">
                  MC
                </span>
                <span className="flex h-6 w-9 items-center justify-center rounded bg-[#0070BA] text-[8px] font-bold text-white">
                  DISC
                </span>
              </div>

              {/* Email signup pill input matching Concept B */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  alert("Thank you for signing up!");
                }}
                className="relative flex items-center"
              >
                <input
                  type="email"
                  placeholder="Email signup"
                  required
                  className="h-9 w-48 sm:w-56 rounded-full border border-line bg-canvas pl-4 pr-10 text-xs text-ink outline-none transition focus:border-brand"
                />
                <button
                  type="submit"
                  aria-label="Submit newsletter"
                  className="absolute right-1 flex h-7 w-7 items-center justify-center rounded-full bg-brand text-white transition hover:bg-brand-dark"
                >
                  <ArrowForwardIcon sx={{ fontSize: 14 }} />
                </button>
              </form>
            </div>
          </div>
        </footer>
      )}

      {!isCheckout && <MobileTabBar />}
    </div>
  );
}

export default DashboardLayout;
