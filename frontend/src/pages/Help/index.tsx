import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import SearchIcon from "@mui/icons-material/Search";
import ThumbUpOutlinedIcon from "@mui/icons-material/ThumbUpOutlined";
import ThumbDownOutlinedIcon from "@mui/icons-material/ThumbDownOutlined";
import SupportAgentOutlinedIcon from "@mui/icons-material/SupportAgentOutlined";
import ReceiptLongOutlinedIcon from "@mui/icons-material/ReceiptLongOutlined";
import ReplayOutlinedIcon from "@mui/icons-material/ReplayOutlined";
import LocationOnOutlinedIcon from "@mui/icons-material/LocationOnOutlined";
import CardGiftcardOutlinedIcon from "@mui/icons-material/CardGiftcardOutlined";
import StarsOutlinedIcon from "@mui/icons-material/StarsOutlined";
import ShareOutlinedIcon from "@mui/icons-material/ShareOutlined";
import ManageAccountsOutlinedIcon from "@mui/icons-material/ManageAccountsOutlined";
import HeadsetMicOutlinedIcon from "@mui/icons-material/HeadsetMicOutlined";
import LocalShippingOutlinedIcon from "@mui/icons-material/LocalShippingOutlined";
import PaymentsOutlinedIcon from "@mui/icons-material/PaymentsOutlined";
import PersonOutlineOutlinedIcon from "@mui/icons-material/PersonOutlineOutlined";
import { useStoreSettings } from "../../features/storefront";
import usePageMetadata from "../../hooks/usePageMetadata";

type QuickAction = {
  icon: React.ReactNode;
  title: string;
  copy: string;
  to: string;
  auth?: boolean;
};

type Faq = { q: string; a: React.ReactNode; group: string; keywords: string };

const QUICK_ACTIONS: QuickAction[] = [
  { icon: <ReceiptLongOutlinedIcon />, title: "Track an order", copy: "Live status for every order", to: "/orders", auth: true },
  { icon: <ReplayOutlinedIcon />, title: "Start a return", copy: "7-day window from delivery", to: "/returns", auth: true },
  { icon: <LocationOnOutlinedIcon />, title: "Delivery addresses", copy: "Add or update saved addresses", to: "/addresses", auth: true },
  { icon: <CardGiftcardOutlinedIcon />, title: "Gift cards", copy: "Redeem or check a balance", to: "/gift-cards" },
  { icon: <StarsOutlinedIcon />, title: "Loyalty points", copy: "Earn and redeem on orders", to: "/loyalty", auth: true },
  { icon: <ShareOutlinedIcon />, title: "Refer & earn", copy: "Share your code, both earn", to: "/referral", auth: true },
  { icon: <ManageAccountsOutlinedIcon />, title: "Account settings", copy: "Profile, email and password", to: "/account", auth: true },
  { icon: <HeadsetMicOutlinedIcon />, title: "Contact support", copy: "Raise a ticket with our team", to: "/contact" },
];

/** FAQs reflect actual platform behavior (server-priced orders, provider settlement, mixed-tender refunds). */
const FAQS: Faq[] = [
  {
    group: "Orders & delivery",
    q: "How do I track my order?",
    keywords: "track tracking status shipped delivery guest link",
    a: <>Open <strong>Orders</strong> in your account — every order shows its live status (pending → paid → shipped → delivered). Guest orders include a tracking link in the confirmation email that works without signing in.</>,
  },
  {
    group: "Orders & delivery",
    q: "When does my order ship?",
    keywords: "dispatch ship shipping time days fast 24 hours",
    a: <>In-stock items are dispatched within 24 hours of payment confirmation and typically deliver in 2–7 business days depending on your pin code. You'll see the expected window at checkout.</>,
  },
  {
    group: "Orders & delivery",
    q: "Do you ship internationally?",
    keywords: "international abroad overseas country outside india export worldwide shipping",
    a: <>Yes — we ship to 16 countries across North America, Europe, the Middle East, Asia-Pacific and Oceania (including the US, UK, UAE, Singapore, Australia and Japan) via DHL Express in 7–14 days. Shipping is ₹2,499, free on orders over ₹25,000, and import duties &amp; VAT (estimated at checkout) are shown before you pay. You can pick your display currency in the header; every order is securely charged in Indian Rupees (₹). India orders keep GST invoicing, pincode rates and COD.</>,
  },
  {
    group: "Orders & delivery",
    q: "When is shipping free?",
    keywords: "free shipping cost threshold charges fee",
    a: <>Standard delivery is free on orders over the free-shipping threshold shown at checkout. Below it, the exact shipping cost for your address is calculated by the server before you pay — you never get surprise charges.</>,
  },
  {
    group: "Orders & delivery",
    q: "Can I order without an account?",
    keywords: "guest checkout without account no account email",
    a: <>Yes — guest checkout lets you buy with just an email and address. You'll get a confirmation email with an order number and a tracking link. You can create an account later with the same email.</>,
  },
  {
    group: "Payments",
    q: "Which payment methods can I use?",
    keywords: "card visa mastercard upi razorpay stripe netbanking gst currency",
    a: <>Cards (Visa, Mastercard, Discover), and UPI/netbanking through Razorpay or international cards through Stripe — the available options are shown at checkout. All amounts are in Indian Rupees with GST calculated by the server.</>,
  },
  {
    group: "Payments",
    q: "My bank shows a debit — is my order paid?",
    keywords: "paid debit failed pending settlement authorization capture bank",
    a: <>An order only counts as paid once the payment provider returns a <strong>signed, verified settlement result</strong> to us. If a payment fails or times out, the order stays pending and any temporary authorization is released by your bank automatically. Nothing ships until settlement is confirmed.</>,
  },
  {
    group: "Payments",
    q: "How do gift cards work at checkout?",
    keywords: "gift card voucher redeem balance tax checkout code",
    a: <>Enter the gift-card code in checkout and its balance is applied <strong>after tax</strong> — only the remainder, if any, is charged to your payment provider. Gift-card value can't be redeemed for cash.</>,
  },
  {
    group: "Returns & refunds",
    q: "What is the returns window?",
    keywords: "return refund exchange days 7 request reason",
    a: <>You can request a return within 7 days of delivery from <strong>Orders → Return</strong>. Pick a reason, submit, and our team reviews it — you'll see the status on the order and in your Returns list.</>,
  },
  {
    group: "Returns & refunds",
    q: "How are refunds paid if I used a gift card too?",
    keywords: "mixed tender refund split gift card first remainder original payment",
    a: <>Mixed-tender refunds return your gift-card value <strong>first</strong>, and the remainder goes back to your card or payment provider. You'll see the split on the refund summary.</>,
  },
  {
    group: "Account",
    q: "I forgot my password — what now?",
    keywords: "password reset forgot sign in login email link",
    a: <>Use <strong>Forgot your password?</strong> on the sign-in page. We email a reset link to your registered address; the link lets you set a new password once.</>,
  },
  {
    group: "Account",
    q: "How do loyalty points and referrals work?",
    keywords: "loyalty points rewards refer referral code earn redeem",
    a: <>Earn loyalty points on qualifying orders and redeem them at checkout. With referrals, you get a personal code — when a friend orders with it, you both receive rewards. Points and rewards hold no cash value and can't be transferred.</>,
  },
  {
    group: "Account",
    q: "How do I delete my account or data?",
    keywords: "delete account data privacy removal gdpr request",
    a: <>Raise an <Link to="/contact" className="font-semibold text-brand hover:underline">Account &amp; sign-in</Link> ticket with the subject “Data deletion” and we'll process your request, keeping only the records commerce and tax law require (order and invoice history).</>,
  },
];

const GROUPS = ["All", ...Array.from(new Set(FAQS.map((f) => f.group)))];

/** Where a 👎 on a topic should land in the contact form. */
const GROUP_TO_TOPIC: Record<string, string> = {
  "Orders & delivery": "Order issue",
  "Payments": "Payments & billing",
  "Returns & refunds": "Returns & refunds",
  "Account": "Account & sign-in",
};

/** Help center: searchable FAQs plus quick actions wired to real platform routes. */
function Help() {
  const navigate = useNavigate();
  const { settings } = useStoreSettings();
  const [query, setQuery] = useState("");
  const [group, setGroup] = useState("All");
  const [votes, setVotes] = useState<Record<string, "up" | "down">>(() => {
    try {
      return JSON.parse(localStorage.getItem("cartly-help-votes") || "{}");
    } catch {
      return {};
    }
  });

  const recordVote = (question: string, value: "up" | "down") => {
    const next = { ...votes, [question]: value };
    setVotes(next);
    try {
      localStorage.setItem("cartly-help-votes", JSON.stringify(next));
    } catch {
      /* storage unavailable — vote still shows for this visit */
    }
  };

  usePageMetadata({
    title: "Help center — Cartly",
    description: "Track orders, start returns, manage your account and get answers about shopping on Cartly.",
    canonicalPath: "/help",
  });

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    return FAQS.filter((f) => group === "All" || f.group === group).filter(
      (f) =>
        !q ||
        f.q.toLowerCase().includes(q) ||
        f.keywords.toLowerCase().includes(q)
    );
  }, [query, group]);

  const supportEmail = settings.supportEmail || "support@cartly.com";

  return (
    <div className="space-y-10 pb-10">
      {/* Hero */}
      <section className="overflow-hidden rounded-2xl border border-[#0747A6]/40 bg-gradient-to-br from-[#0052CC] to-[#091E42] p-7 text-oncontrast shadow-lift sm:p-12">
        <p className="eyebrow !text-[#BFDBFE]">Help center</p>
        <h1 className="mt-3 max-w-2xl font-heading text-3xl font-black tracking-tight sm:text-5xl sm:leading-[1.05]">
          How can we help?
        </h1>
        <p className="mt-4 max-w-xl text-sm leading-relaxed text-oncontrast/75 sm:text-base">
          Answers about orders, payments, returns and your account — and a real
          support team when you need one.
        </p>
        <div className="relative mt-7 max-w-xl">
          <SearchIcon sx={{ fontSize: 20 }} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-ink-muted" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search help articles — e.g. refund, gift card, tracking…"
            aria-label="Search help articles"
            className="h-12 w-full rounded-xl border border-transparent bg-paper pl-11 pr-4 text-sm text-ink shadow-lift outline-none transition placeholder:text-ink-muted focus:border-brand focus:ring-2 focus:ring-brand/20"
          />
        </div>
      </section>

      {/* Quick actions */}
      <section>
        <h2 className="font-heading text-xl font-extrabold tracking-tight text-ink sm:text-2xl">
          Do it yourself
        </h2>
        <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {QUICK_ACTIONS.map((action) => (
            <button
              key={action.title}
              onClick={() => navigate(action.auth && !localStorage.getItem("access-token") ? "/login" : action.to)}
              className="flex items-start gap-4 rounded-2xl border border-line bg-paper p-6 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-lift"
            >
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-soft text-brand [&>svg]:text-[22px]">
                {action.icon}
              </span>
              <span className="min-w-0">
                <span className="block text-sm font-bold text-ink">{action.title}</span>
                <span className="mt-1 block text-xs leading-relaxed text-ink-soft">{action.copy}</span>
              </span>
            </button>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h2 className="font-heading text-xl font-extrabold tracking-tight text-ink sm:text-2xl">
            Frequently asked questions
          </h2>
          <div className="flex flex-wrap gap-2">
            {GROUPS.map((g) => (
              <button
                key={g}
                onClick={() => setGroup(g)}
                className={`chip ${group === g ? "chip-active" : ""}`}
              >
                {g}
              </button>
            ))}
          </div>
        </div>

        {results.length === 0 ? (
          <div className="mt-5 rounded-2xl border border-line bg-paper p-8 text-center shadow-sm">
            <p className="text-sm font-bold text-ink">No articles match “{query}”.</p>
            <p className="mt-2 text-sm text-ink-soft">
              Our team can help directly —{" "}
              <Link
                to={`/contact?topic=${encodeURIComponent("Other")}`}
                className="font-semibold text-brand hover:underline"
              >
                raise a ticket
              </Link>{" "}
              and we'll reply to your email.
            </p>
          </div>
        ) : (
          <div className="mt-5 grid gap-4 lg:grid-cols-2">
            {results.map((faq) => (
              <details
                key={faq.q}
                className="group rounded-2xl border border-line bg-paper p-6 shadow-sm transition open:shadow-lift"
              >
                <summary className="flex cursor-pointer list-none items-start justify-between gap-4">
                  <span>
                    <span className="eyebrow !text-brand">{faq.group}</span>
                    <span className="mt-1 block text-sm font-bold text-ink">{faq.q}</span>
                  </span>
                  <span className="mt-1 shrink-0 text-lg font-black leading-none text-ink-muted transition group-open:rotate-45" aria-hidden="true">
                    +
                  </span>
                </summary>
                <p className="mt-3 border-t border-line pt-3 text-sm leading-relaxed text-ink-soft [&_strong]:text-ink">
                  {faq.a}
                </p>
                <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-line pt-3">
                  {votes[faq.q] ? (
                    <p className="text-xs font-semibold text-state-success-on">
                      Thanks — feedback recorded{votes[faq.q] === "down" ? ". A ticket helps us fix gaps fast:" : "!"}
                      {votes[faq.q] === "down" && (
                        <button
                          onClick={() =>
                            navigate(
                              `/contact?topic=${encodeURIComponent(GROUP_TO_TOPIC[faq.group] ?? "Other")}&about=${encodeURIComponent(faq.q)}`
                            )
                          }
                          className="ml-2 inline-flex items-center gap-1 rounded-full border border-line px-3 py-1 font-bold text-brand transition hover:border-brand hover:bg-brand-soft"
                        >
                          <SupportAgentOutlinedIcon sx={{ fontSize: 13 }} />
                          Raise a ticket
                        </button>
                      )}
                    </p>
                  ) : (
                    <>
                      <span className="text-xs font-semibold text-ink-muted">Was this helpful?</span>
                      <span className="flex items-center gap-1.5">
                        <button
                          onClick={() => recordVote(faq.q, "up")}
                          aria-label="Yes, this was helpful"
                          className="flex h-7 w-7 items-center justify-center rounded-full border border-line text-ink-soft transition hover:border-brand hover:bg-brand-soft hover:text-brand"
                        >
                          <ThumbUpOutlinedIcon sx={{ fontSize: 14 }} />
                        </button>
                        <button
                          onClick={() => recordVote(faq.q, "down")}
                          aria-label="No, this wasn't helpful"
                          className="flex h-7 w-7 items-center justify-center rounded-full border border-line text-ink-soft transition hover:border-state-danger hover:bg-state-danger-soft hover:text-state-danger"
                        >
                          <ThumbDownOutlinedIcon sx={{ fontSize: 14 }} />
                        </button>
                      </span>
                    </>
                  )}
                </div>
              </details>
            ))}
          </div>
        )}
      </section>

      {/* Still stuck */}
      <section className="rounded-2xl border border-line bg-paper p-7 shadow-sm sm:p-10">
        <div className="grid gap-6 md:grid-cols-[1.4fr_1fr] md:items-center">
          <div>
            <h2 className="font-heading text-xl font-extrabold tracking-tight text-ink sm:text-2xl">
              Still stuck? Talk to a person.
            </h2>
            <p className="mt-2 max-w-xl text-sm leading-relaxed text-ink-soft">
              Raise a support ticket with your order number and we'll get back to
              your email — usually within one business day.
            </p>
          </div>
          <div className="flex flex-col gap-3">
            <button
              onClick={() => navigate("/contact")}
              className="primary-button w-full md:w-auto md:justify-center"
            >
              Contact support
            </button>
            <p className="text-center text-xs text-ink-muted md:text-left">
              or email <span className="font-semibold text-ink">{supportEmail}</span>
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}

export default Help;
