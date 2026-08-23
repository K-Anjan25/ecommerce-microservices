import { useState } from "react";
import { useMutation } from "react-query";
import CardGiftcardOutlinedIcon from "@mui/icons-material/CardGiftcardOutlined";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";

import { GiftCardApi } from "../../api/giftCardApi";
import FeatureHero from "../../components/FeatureHero";
import { showSuccess } from "../../utils/showSuccess";
import { showError } from "../../utils/showError";
import { GiftCard, GiftCardStatus } from "../../types/giftCard";
import { formatPrice } from "../../utils/cart";

const PRESETS = [500, 1000, 2500, 5000];
const VALIDITY = [
  { days: "180", label: "6 months" },
  { days: "365", label: "1 year" },
  { days: "730", label: "2 years" },
];

function GiftCards() {
  const [amount, setAmount] = useState("");
  const [recipientEmail, setRecipientEmail] = useState("");
  const [days, setDays] = useState("365");
  const [purchased, setPurchased] = useState<GiftCard | null>(null);

  const purchaseMutation = useMutation(GiftCardApi.purchaseGiftCard, {
    onSuccess: (data) => {
      showSuccess("Gift card purchased successfully!");
      setPurchased(data);
    },
    onError: (e: any) =>
      showError(e.response?.data?.message ?? "Failed to purchase gift card"),
  });

  const handlePurchase = () => {
    if (!amount || Number(amount) <= 0) {
      showError("Please enter a valid amount");
      return;
    }
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + Number(days));
    purchaseMutation.mutate({
      amount: Number(amount),
      recipientEmail: recipientEmail || undefined,
      expiryDate: expiryDate.toISOString().split("T")[0],
    });
  };

  const preview = Number(amount) > 0 ? Number(amount) : 0;

  return (
    <div className="page-shell space-y-6">
      <FeatureHero
        eyebrow="Gift cards"
        title="The one present that always fits."
        description="Pick an amount, choose how long it stays valid, and we'll email the code straight to whoever it's for. Redeemable at checkout alongside coupons."
      />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
        {/* ── form ─────────────────────────────────────────────────── */}
        <section className="border-t border-ink py-7 sm:py-8">
          <h2 className="font-display text-3xl font-normal">Buy a gift card</h2>

          <div className="mt-6 space-y-6">
            <div>
              <p className="eyebrow mb-2">Amount</p>
              <div className="flex flex-wrap gap-2">
                {PRESETS.map((p) => (
                  <button
                    key={p}
                    onClick={() => setAmount(String(p))}
                    className={`chip !px-4 !py-2 !text-sm ${
                      amount === String(p) ? "chip-ink" : ""
                    }`}
                  >
                    ₹{p.toLocaleString("en-IN")}
                  </button>
                ))}
              </div>
              <div className="relative mt-3 max-w-xs">
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-ink-muted">
                  ₹
                </span>
                <input
                  type="number"
                  min={1}
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="Custom amount"
                  aria-label="Gift card amount in rupees"
                  className="input-control pl-7"
                />
              </div>
            </div>

            <div>
              <p className="eyebrow mb-2">Valid for</p>
              <div className="flex flex-wrap gap-2">
                {VALIDITY.map((v) => (
                  <button
                    key={v.days}
                    onClick={() => setDays(v.days)}
                    className={`chip !px-4 !py-2 !text-sm ${days === v.days ? "chip-ink" : ""}`}
                  >
                    {v.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="eyebrow mb-2">Recipient</p>
              <input
                type="email"
                value={recipientEmail}
                onChange={(e) => setRecipientEmail(e.target.value)}
                placeholder="their@email.com (optional)"
                aria-label="Recipient email"
                className="input-control max-w-sm"
              />
              <p className="mt-2 text-xs text-ink-muted">
                Leave blank to keep the code for yourself — it will still appear below.
              </p>
            </div>

            <button
              onClick={handlePurchase}
              disabled={purchaseMutation.isLoading}
              className="primary-button !py-3 sm:w-auto"
            >
              {purchaseMutation.isLoading
                ? "Processing…"
                : `Purchase${preview ? ` ${formatPrice(preview)}` : ""} gift card`}
            </button>
          </div>
        </section>

        {/* ── live card preview / result ────────────────────────────── */}
        <aside className="space-y-4 lg:sticky lg:top-24 lg:h-fit">
          <div className="relative overflow-hidden border border-brand bg-action p-6 text-oncontrast">
            <div className="flex items-start justify-between">
              <span className="font-heading text-sm font-extrabold tracking-[0.18em]">CARTLY</span>
              <CardGiftcardOutlinedIcon sx={{ fontSize: 22 }} className="text-accent" />
            </div>
            <p className="mt-10 font-heading text-3xl font-extrabold tracking-tight text-accent">
              {preview ? formatPrice(preview) : "₹ ——"}
            </p>
            <p className="mt-1 text-xs text-ink-muted">
              Gift card · valid {VALIDITY.find((v) => v.days === days)?.label}
            </p>
            <p className="mt-6 font-mono text-sm tracking-[0.25em] text-oncontrast/80">
              {purchased?.code ?? "XXXX-XXXX-XXXX"}
            </p>
          </div>

          {purchased ? (
            <div className="border-t border-ink py-5">
              <div className="flex items-center justify-between gap-3">
                <p className="font-heading text-sm font-bold text-ink">Gift card created</p>
                <span
                  className={
                    purchased.status === GiftCardStatus.ACTIVE
                      ? "badge-stock-in"
                      : "badge-stock-out"
                  }
                >
                  {purchased.status}
                </span>
              </div>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(purchased.code);
                  showSuccess("Gift card code copied");
                }}
                className="secondary-button mt-4 w-full font-mono"
              >
                <ContentCopyIcon sx={{ fontSize: 15 }} />
                {purchased.code}
              </button>
              <dl className="mt-4 space-y-2 text-sm">
                <div className="flex justify-between">
                  <dt className="text-ink-soft">Balance</dt>
                  <dd className="font-semibold">{formatPrice(purchased.initialBalance)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-ink-soft">Expires</dt>
                  <dd className="font-semibold">{purchased.expiryDate}</dd>
                </div>
              </dl>
            </div>
          ) : (
            <div className="border-t border-line py-5 text-xs leading-relaxed text-ink-soft">
              <p className="mb-2 font-heading text-sm font-bold text-ink">Good to know</p>
              <ul className="space-y-1.5">
                <li>· Redeem at checkout in the credits section.</li>
                <li>· Balance carries across orders until it runs out.</li>
                <li>· Works alongside coupons and loyalty points.</li>
                <li>· A recipient email gets the code delivered automatically.</li>
              </ul>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}

export default GiftCards;
