import { useNavigate } from "react-router-dom";
import StorefrontOutlinedIcon from "@mui/icons-material/StorefrontOutlined";
import LocalShippingOutlinedIcon from "@mui/icons-material/LocalShippingOutlined";
import ReplayOutlinedIcon from "@mui/icons-material/ReplayOutlined";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import CardGiftcardOutlinedIcon from "@mui/icons-material/CardGiftcardOutlined";
import StarsOutlinedIcon from "@mui/icons-material/StarsOutlined";
import ShareOutlinedIcon from "@mui/icons-material/ShareOutlined";
import BoltOutlinedIcon from "@mui/icons-material/BoltOutlined";
import FavoriteBorderOutlinedIcon from "@mui/icons-material/FavoriteBorderOutlined";
import CompareArrowsOutlinedIcon from "@mui/icons-material/CompareArrowsOutlined";
import PersonOffOutlinedIcon from "@mui/icons-material/PersonOffOutlined";
import TravelExploreOutlinedIcon from "@mui/icons-material/TravelExploreOutlined";
import { BRAND, PaymentMarks } from "../../brand";
import { useStoreSettings } from "../../features/storefront";
import usePageMetadata from "../../hooks/usePageMetadata";

type Service = {
  icon: React.ReactNode;
  title: string;
  copy: React.ReactNode;
  actions: { label: string; to: string }[];
};

/** Platform services — every card links into the feature that delivers it. */
function Services() {
  const navigate = useNavigate();
  const { settings } = useStoreSettings();

  usePageMetadata({
    title: `Services — ${BRAND.name}`,
    description: "Delivery, payments, returns, gift cards, rewards and more — every service Cartly provides around your order.",
    canonicalPath: "/services",
  });

  const SERVICES: Service[] = [
    {
      icon: <StorefrontOutlinedIcon />,
      title: "Marketplace shopping",
      copy: <>One catalog across electronics, fashion, home, beauty, kitchen, sports, grocery and toys — with brand, price and rating filters and full-text search.</>,
      actions: [{ label: "Browse the catalog", to: "/" }],
    },
    {
      icon: <BoltOutlinedIcon />,
      title: "Flash sales",
      copy: <>Limited-time price drops with live countdowns and stock limits. Sale pricing is enforced by the server, so the price you see at checkout is the price you pay.</>,
      actions: [{ label: "See today's deals", to: "/flash-sales" }],
    },
    {
      icon: <PersonOffOutlinedIcon />,
      title: "Guest checkout",
      copy: <>Buy without creating an account — we only need an email and a delivery address. Guests can track, and cancel before dispatch, with the links in the confirmation email.</>,
      actions: [{ label: "Start shopping", to: "/" }],
    },
    {
      icon: <LocalShippingOutlinedIcon />,
      title: "Fast, tracked delivery",
      copy: <>In-stock orders dispatch within 24 hours. Standard shipping is free over ₹{settings.freeShippingThreshold || 999}; rates for your address are calculated before you pay, and every order has live status tracking.</>,
      actions: [{ label: "Track an order", to: "/orders" }, { label: "Manage addresses", to: "/addresses" }],
    },
    {
      icon: <LockOutlinedIcon />,
      title: "Secure payments",
      copy: <>Pay by card, UPI or netbanking. An order is only marked paid after the provider returns a verified, signed settlement result — and every amount, including GST, is calculated server-side.</>,
      actions: [{ label: "Payment questions", to: "/help" }],
    },
    {
      icon: <ReplayOutlinedIcon />,
      title: "Returns & refunds",
      copy: <>7-day returns from the Orders page, with clear reasons and status tracking. Refunds go back to your gift-card balance first, then to the original payment method for the remainder.</>,
      actions: [{ label: "Start a return", to: "/returns" }],
    },
    {
      icon: <CardGiftcardOutlinedIcon />,
      title: "Gift cards",
      copy: <>Redeem a gift card at checkout — its balance applies after tax, and only the remainder is charged to your payment provider. Check any card's balance any time.</>,
      actions: [{ label: "Gift cards & balances", to: "/gift-cards" }],
    },
    {
      icon: <StarsOutlinedIcon />,
      title: "Loyalty rewards",
      copy: <>Earn points on qualifying orders and redeem them against future checkouts. Your balance and history are always visible in your account.</>,
      actions: [{ label: "View loyalty points", to: "/loyalty" }],
    },
    {
      icon: <ShareOutlinedIcon />,
      title: "Refer & earn",
      copy: <>Share your personal referral code — when a friend places their first order with it, you both receive rewards automatically.</>,
      actions: [{ label: "Get your code", to: "/referral" }],
    },
    {
      icon: <FavoriteBorderOutlinedIcon />,
      title: "Wishlist",
      copy: <>Save products for later, at the current listed price, and move them into your cart whenever you're ready.</>,
      actions: [{ label: "Open wishlist", to: "/wishlist" }],
    },
    {
      icon: <CompareArrowsOutlinedIcon />,
      title: "Compare products",
      copy: <>Line up products side by side on price, rating and availability before you commit.</>,
      actions: [{ label: "Open compare", to: "/compare" }],
    },
    {
      icon: <TravelExploreOutlinedIcon />,
      title: "Order tracking & history",
      copy: <>Every order — current and past — with invoices, payment summaries, delivery status and returns in one place.</>,
      actions: [{ label: "Open orders", to: "/orders" }],
    },
  ];

  return (
    <div className="space-y-10 pb-10">
      {/* Hero */}
      <section className="overflow-hidden rounded-2xl border border-line bg-contrast p-7 text-oncontrast shadow-sm sm:p-12">
        <p className="eyebrow !text-accent">Platform services</p>
        <h1 className="mt-3 max-w-2xl font-heading text-3xl font-black tracking-tight sm:text-5xl sm:leading-[1.05]">
          Everything around your order, handled.
        </h1>
        <p className="mt-4 max-w-xl text-sm leading-relaxed text-oncontrast/75 sm:text-base">
          {BRAND.name} isn't just a catalog — here's every service the platform
          provides, each one available from your account right now.
        </p>
        <div className="mt-7 flex flex-wrap items-center gap-3">
          <button
            onClick={() => navigate("/")}
            className="rounded-full bg-brand px-6 py-2.5 text-sm font-bold text-white transition hover:bg-brand-dark"
          >
            Start shopping
          </button>
          <button
            onClick={() => navigate("/contact")}
            className="rounded-full border border-oncontrast/30 px-6 py-2.5 text-sm font-bold text-oncontrast transition hover:border-oncontrast/60"
          >
            Talk to support
          </button>
        </div>
      </section>

      {/* Service cards */}
      <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {SERVICES.map((service) => (
          <article
            key={service.title}
            className="flex flex-col rounded-2xl border border-line bg-paper p-7 shadow-sm transition hover:shadow-lift"
          >
            <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-soft text-brand [&>svg]:text-[24px]">
              {service.icon}
            </span>
            <h2 className="mt-4 font-heading text-lg font-extrabold tracking-tight text-ink">
              {service.title}
            </h2>
            <p className="mt-2 flex-1 text-sm leading-relaxed text-ink-soft">{service.copy}</p>
            <div className="mt-5 flex flex-wrap gap-2 border-t border-line pt-4">
              {service.actions.map((action) => (
                <button
                  key={action.label}
                  onClick={() => navigate(action.to)}
                  className="rounded-full border border-line px-4 py-1.5 text-xs font-bold text-ink transition hover:border-brand hover:bg-brand-soft hover:text-brand"
                >
                  {action.label} →
                </button>
              ))}
            </div>
          </article>
        ))}
      </section>

      {/* Accepted cards strip */}
      <section className="flex flex-col items-center justify-between gap-5 rounded-2xl border border-line bg-paper p-7 shadow-sm sm:flex-row sm:p-8">
        <div>
          <h2 className="font-heading text-lg font-extrabold tracking-tight text-ink">
            Cards we accept
          </h2>
          <p className="mt-1 text-sm text-ink-soft">
            Plus UPI and netbanking at checkout. Prices include GST where shown.
          </p>
        </div>
        <PaymentMarks />
      </section>

      {/* Fine print pointers */}
      <section className="rounded-2xl border border-line bg-paper p-7 shadow-sm sm:p-8">
        <h2 className="font-heading text-lg font-extrabold tracking-tight text-ink">
          The fine print, in plain sight
        </h2>
        <p className="mt-2 max-w-3xl text-sm leading-relaxed text-ink-soft">
          Service terms — pricing, delivery windows, the 7-day returns policy,
          refund routing and rewards rules — are documented in full in our{" "}
          <button
            onClick={() => navigate("/terms")}
            className="font-semibold text-brand underline underline-offset-2 hover:underline"
          >
            Terms of Service
          </button>
          . Questions about any of it: the{" "}
          <button
            onClick={() => navigate("/help")}
            className="font-semibold text-brand underline underline-offset-2 hover:underline"
          >
            Help center
          </button>{" "}
          answers the common ones, and{" "}
          <button
            onClick={() => navigate("/contact")}
            className="font-semibold text-brand underline underline-offset-2 hover:underline"
          >
            support
          </button>{" "}
          handles the rest.
        </p>
      </section>
    </div>
  );
}

export default Services;
