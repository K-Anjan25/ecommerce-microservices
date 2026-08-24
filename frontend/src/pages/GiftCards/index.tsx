import { Skeleton, TextField } from "@mui/material";
import CardGiftcardOutlinedIcon from "@mui/icons-material/CardGiftcardOutlined";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import React, { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "react-query";
import { useSelector } from "react-redux";
import { AppState } from "../../store";
import { useNavigate } from "react-router-dom";

import { GiftCardApi } from "../../api/giftCardApi";
import EmptyState from "../../components/EmptyState";
import FeatureHero from "../../components/FeatureHero";
import { GiftCardPurchaseRequest, GiftCardStatus } from "../../types/giftCard";
import { formatPrice } from "../../utils/cart";
import { showError } from "../../utils/showError";
import { showSuccess } from "../../utils/showSuccess";

function defaultExpiryDate() {
  const date = new Date();
  date.setFullYear(date.getFullYear() + 1);
  return date.toISOString().slice(0, 10);
}

function GiftCards() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const userEmail = useSelector((state: AppState) => state.user.data.email ?? "");
  const { data: cards = [], isLoading } = useQuery("myGiftCards", GiftCardApi.getMyGiftCards, {
    retry: false,
  });
  const [amount, setAmount] = useState("1000");
  const [contactEmail, setContactEmail] = useState(userEmail);
  const [recipientEmail, setRecipientEmail] = useState("");
  const [expiryDate, setExpiryDate] = useState(defaultExpiryDate());

  const purchaseMutation = useMutation(GiftCardApi.purchaseGiftCard, {
    onSuccess: (result) => {
      queryClient.invalidateQueries("myGiftCards");
      if (result.payment.status === "FAILED") {
        showError(result.payment.message ?? "Gift card payment failed");
        return;
      }
      if (result.payment.provider === "STRIPE" && result.payment.clientSecret) {
        sessionStorage.setItem("stripe-payment-context", JSON.stringify({
          orderId: result.orderId,
          amount: Number(result.payment.amount),
          currency: result.payment.currency,
          transactionId: result.payment.transactionId,
          signedIn: true,
        }));
        navigate("/stripe-payment", {
          replace: true,
          state: { orderId: result.orderId, payment: result.payment, signedIn: true },
        });
        return;
      }
      showError("The provider did not return a payment session; the purchase remains pending for review");
    },
    onError: (error: any) => {
      showError(error.response?.data?.message ?? "Gift card purchase could not be started");
    },
  });

  const submitPurchase = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const request: GiftCardPurchaseRequest = {
      amount: Number(amount),
      contactEmail: contactEmail.trim(),
      recipientEmail: recipientEmail.trim() || undefined,
      expiryDate,
      provider: "STRIPE",
    };
    purchaseMutation.mutate(request);
  };

  return (
    <div className="page-shell space-y-8">
      <FeatureHero
        eyebrow="Gift card wallet"
        title="Your Cartly credit, kept in one place."
        description="Review cards already issued to your account, copy an active code, and apply it securely during checkout."
      />

      <section className="border-y border-line py-6 sm:py-8">
        <div className="flex items-start gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center bg-sunken text-ink-soft">
            <LockOutlinedIcon sx={{ fontSize: 20 }} />
          </span>
          <div>
            <h2 className="font-heading text-sm font-bold text-ink">Give Cartly credit, securely</h2>
            <p className="mt-1 max-w-3xl text-sm leading-relaxed text-ink-soft">
              Your card is created only after Stripe confirms the payment. Until then, the purchase stays a pending payment intent and cannot be spent.
            </p>
          </div>
        </div>
        <form onSubmit={submitPurchase} className="mt-6 grid gap-4 sm:grid-cols-2">
          <TextField
            label="Amount (₹)"
            type="number"
            value={amount}
            onChange={(event) => setAmount(event.target.value)}
            inputProps={{ min: 1, max: 100000, step: "0.01" }}
            required
            fullWidth
          />
          <TextField
            label="Receipt email"
            type="email"
            value={contactEmail}
            onChange={(event) => setContactEmail(event.target.value)}
            required
            fullWidth
          />
          <TextField
            label="Recipient email (optional)"
            type="email"
            value={recipientEmail}
            onChange={(event) => setRecipientEmail(event.target.value)}
            fullWidth
          />
          <TextField
            label="Expiry date"
            type="date"
            value={expiryDate}
            onChange={(event) => setExpiryDate(event.target.value)}
            InputLabelProps={{ shrink: true }}
            required
            fullWidth
          />
          <div className="sm:col-span-2 flex flex-wrap items-center justify-between gap-3">
            <p className="text-xs text-ink-muted">Payment method: Stripe cards and supported wallets</p>
            <button type="submit" className="primary-button" disabled={purchaseMutation.isLoading}>
              {purchaseMutation.isLoading ? "Preparing secure payment…" : "Continue to payment"}
            </button>
          </div>
        </form>
      </section>

      <section className="border-t border-ink">
        <div className="flex items-baseline justify-between gap-4 border-b border-line py-4">
          <h2 className="font-display text-3xl font-normal text-ink">Your cards</h2>
          {!isLoading && <span className="text-xs text-ink-muted">{cards.length} issued</span>}
        </div>

        {isLoading ? (
          <div className="grid gap-4 py-6 md:grid-cols-2">
            {[0, 1].map((item) => <Skeleton key={item} variant="rectangular" height={190} />)}
          </div>
        ) : cards.length === 0 ? (
          <EmptyState
            icon={<CardGiftcardOutlinedIcon fontSize="large" />}
            title="No gift cards yet"
            subtitle="Cards issued to this account will appear here. No balance can be created without an authorised issuance or confirmed payment."
          />
        ) : (
          <ul className="grid gap-px bg-line md:grid-cols-2">
            {cards.map((card) => {
              const active = card.status === GiftCardStatus.ACTIVE && card.balance > 0;
              return (
                <li key={card.id} className="bg-paper p-5 sm:p-6">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="eyebrow">Cartly gift card</p>
                      <p className="mt-2 font-display text-3xl text-ink">{formatPrice(card.balance)}</p>
                      <p className="mt-1 text-xs text-ink-muted">of {formatPrice(card.initialBalance)} issued</p>
                    </div>
                    <span className={active ? "badge-stock-in" : "badge-stock-out"}>{card.status}</span>
                  </div>
                  <button
                    type="button"
                    disabled={!active}
                    onClick={() => {
                      navigator.clipboard.writeText(card.code);
                      showSuccess("Gift card code copied");
                    }}
                    className="secondary-button mt-6 w-full justify-between font-mono disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <span className="truncate">{card.code}</span>
                    <ContentCopyIcon sx={{ fontSize: 15 }} />
                  </button>
                  <div className="mt-4 flex justify-between text-xs text-ink-muted">
                    <span>Expires</span><span className="font-semibold text-ink-soft">{card.expiryDate}</span>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}

export default GiftCards;
