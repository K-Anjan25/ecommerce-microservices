import { Skeleton } from "@mui/material";
import CardGiftcardOutlinedIcon from "@mui/icons-material/CardGiftcardOutlined";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import { useQuery } from "react-query";

import { GiftCardApi } from "../../api/giftCardApi";
import EmptyState from "../../components/EmptyState";
import FeatureHero from "../../components/FeatureHero";
import { GiftCardStatus } from "../../types/giftCard";
import { formatPrice } from "../../utils/cart";
import { showSuccess } from "../../utils/showSuccess";

function GiftCards() {
  const { data: cards = [], isLoading } = useQuery("myGiftCards", GiftCardApi.getMyGiftCards, {
    retry: false,
  });

  return (
    <div className="page-shell space-y-8">
      <FeatureHero
        eyebrow="Gift card wallet"
        title="Your Cartly credit, kept in one place."
        description="Review cards already issued to your account, copy an active code, and apply it securely during checkout."
      />

      <section className="grid gap-4 border-y border-line py-5 sm:grid-cols-[auto_1fr] sm:items-center sm:gap-6">
        <span className="flex h-11 w-11 items-center justify-center bg-sunken text-ink-soft">
          <LockOutlinedIcon sx={{ fontSize: 20 }} />
        </span>
        <div>
          <h2 className="font-heading text-sm font-bold text-ink">Customer purchases are temporarily unavailable</h2>
          <p className="mt-1 max-w-3xl text-sm leading-relaxed text-ink-soft">
            Cartly will not create stored value before a payment provider confirms capture. Existing cards remain valid; a provider-backed purchase and webhook flow will restore new purchases later.
          </p>
        </div>
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
