import React, { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "react-query";
import AutorenewIcon from "@mui/icons-material/Autorenew";
import SkipNextIcon from "@mui/icons-material/SkipNext";
import EventRepeatIcon from "@mui/icons-material/EventRepeat";
import PauseCircleOutlineIcon from "@mui/icons-material/PauseCircleOutline";
import PlayCircleOutlineIcon from "@mui/icons-material/PlayCircleOutline";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import CreditCardOutlinedIcon from "@mui/icons-material/CreditCardOutlined";

import { SubscriptionApi } from "../../api/subscriptionApi";
import { PaymentMethodApi } from "../../api/paymentMethods";
import { Subscription } from "../../types/subscription";
import { showSuccess } from "../../utils/showSuccess";
import { showError } from "../../utils/showError";
import { toLocalDateTimePayload } from "../../utils/date";
import { formatPrice } from "../../utils/cart";
import { useI18n } from "../../features/i18n";
import PageHeader from "../../components/PageHeader";
import StyledSelect from "../../components/StyledSelect";

const INTERVALS = [14, 30, 60, 90, 180];

/** Naive business-local date input value (yyyy-mm-dd) → LocalDateTime payload. */
const dateInputToNaive = (value: string) => `${value}T09:00:00`;

/**
 * Your Subscriptions — Amazon "Manage Your Subscriptions" hub.
 * Deliveries (upcoming schedule grouped by date) · Items (per-subscription
 * controls: skip, reschedule, pause, cadence, OOS policy, cancel) · History.
 */
const Subscriptions = () => {
  const { t } = useI18n();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: subscriptions, isLoading } = useQuery(
    "my-subscriptions",
    SubscriptionApi.getMySubscriptions
  );
  const [rescheduleFor, setRescheduleFor] = useState<string | null>(null);
  const [newDate, setNewDate] = useState("");
  const [pmForm, setPmForm] = useState({
    provider: "RAZORPAY",
    token: "",
    brand: "",
    last4: "",
    isDefault: true,
  });

  const { data: methods } = useQuery("payment-methods", PaymentMethodApi.myMethods);
  const saveMethod = useMutation(PaymentMethodApi.save, {
    onSuccess: () => {
      showSuccess("Payment method saved — renewals will charge it automatically");
      setPmForm({ provider: "RAZORPAY", token: "", brand: "", last4: "", isDefault: true });
      queryClient.invalidateQueries("payment-methods");
    },
    onError: (err: any) =>
      showError(err?.response?.data?.message ?? "Could not save the payment method"),
  });
  const deleteMethod = useMutation(PaymentMethodApi.remove, {
    onSuccess: () => {
      showSuccess("Payment method removed");
      queryClient.invalidateQueries("payment-methods");
    },
    onError: () => showError("Could not remove the payment method"),
  });

  const invalidate = () => queryClient.invalidateQueries("my-subscriptions");

  const onError = (err: any) =>
    showError(err?.response?.data?.message ?? "Could not update the subscription");

  const skip = useMutation(SubscriptionApi.skipNext, {
    onSuccess: () => { showSuccess("Upcoming delivery skipped"); invalidate(); },
    onError,
  });
  const update = useMutation(
    (payload: { id: string; data: Parameters<typeof SubscriptionApi.updateSubscription>[1] }) =>
      SubscriptionApi.updateSubscription(payload.id, payload.data),
    {
      onSuccess: () => { showSuccess("Subscription updated"); invalidate(); },
      onError,
    }
  );
  const reschedule = useMutation(
    (payload: { id: string; nextDeliveryDate: string }) =>
      SubscriptionApi.reschedule(payload.id, payload.nextDeliveryDate),
    {
      onSuccess: () => { showSuccess("Delivery rescheduled"); setRescheduleFor(null); invalidate(); },
      onError,
    }
  );
  const cancel = useMutation(SubscriptionApi.cancelSubscription, {
    onSuccess: () => { showSuccess("Subscription canceled"); invalidate(); },
    onError,
  });

  const active = useMemo(
    () => (subscriptions ?? []).filter((s) => s.status !== "CANCELED"),
    [subscriptions]
  );
  const history = useMemo(
    () => (subscriptions ?? []).filter((s) => s.status === "CANCELED"),
    [subscriptions]
  );
  const upcoming = useMemo(
    () =>
      [...active]
        .filter((s) => s.status === "ACTIVE")
        .sort((a, b) => a.nextRunAt.localeCompare(b.nextRunAt)),
    [active]
  );
  const byDate = useMemo(() => {
    const map = new Map<string, Subscription[]>();
    for (const s of upcoming) {
      const day = s.nextRunAt.slice(0, 10);
      map.set(day, [...(map.get(day) ?? []), s]);
    }
    return Array.from(map.entries());
  }, [upcoming]);

  const describe = (s: Subscription) =>
    `${s.productName}${s.variantName ? ` (${s.variantName})` : ""}`;

  const rowCard = (s: Subscription) => (
    <div key={s.id} className="rounded-2xl border border-line bg-paper p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Link to={`/products/${s.productId}`} className="font-heading text-base font-extrabold text-ink hover:underline">
            {describe(s)}
          </Link>
          <p className="mt-0.5 text-xs text-ink-soft">
            {formatPrice(s.unitPrice)} × {s.quantity} · every {s.intervalDays} days ·{" "}
            <span className="font-bold text-brand">−{s.discountPercent}% Subscribe &amp; Save</span>
            {s.skipNext && " · skip armed"}
            {s.status === "PAUSED" && (
              <span className="text-ink-muted">
                {" "}· paused{s.pausedUntil ? ` until ${s.pausedUntil.slice(0, 10)}` : ""}
              </span>
            )}
          </p>
        </div>
        <div className="text-right">
          <p className="text-xs text-ink-muted">{t("subscription.nextDelivery")}</p>
          <p className="font-heading text-sm font-bold text-ink">{s.nextRunAt.slice(0, 10)}</p>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
        <button onClick={() => skip.mutate(s.id)} disabled={s.status !== "ACTIVE"}
          className="chip !py-1.5 disabled:opacity-40" title="Skip this delivery">
          <SkipNextIcon sx={{ fontSize: 14 }} /> {t("subscription.skip")}
        </button>
        <button onClick={() => { setRescheduleFor(rescheduleFor === s.id ? null : s.id); setNewDate(""); }}
          className="chip !py-1.5" title="Change the next delivery date">
          <EventRepeatIcon sx={{ fontSize: 14 }} /> {t("subscription.reschedule")}
        </button>
        {s.status === "ACTIVE" ? (
          <button onClick={() => update.mutate({ id: s.id, data: { active: false } })}
            className="chip !py-1.5" title="Pause deliveries">
            <PauseCircleOutlineIcon sx={{ fontSize: 14 }} /> {t("subscription.pause")}
          </button>
        ) : (
          <button onClick={() => update.mutate({ id: s.id, data: { active: true } })}
            className="chip !py-1.5" title="Resume deliveries">
            <PlayCircleOutlineIcon sx={{ fontSize: 14 }} /> {t("subscription.resume")}
          </button>
        )}
        <StyledSelect
          ariaLabel="Delivery frequency"
          value={String(s.intervalDays)}
          onChange={(v) => update.mutate({ id: s.id, data: { intervalDays: Number(v) } })}
          options={INTERVALS.map((d) => ({ value: String(d), label: `every ${d} days` }))}
        />
        <StyledSelect
          ariaLabel="Quantity per delivery"
          value={String(s.quantity)}
          onChange={(v) => update.mutate({ id: s.id, data: { quantity: Number(v) } })}
          options={Array.from({ length: 10 }, (_, i) => i + 1).map((q) => ({
            value: String(q),
            label: `qty ${q}`,
          }))}
        />
        <StyledSelect
          ariaLabel="Out-of-stock policy"
          value={s.oosPolicy}
          onChange={(v) => update.mutate({ id: s.id, data: { oosPolicy: v as any } })}
          options={[
            { value: "SKIP", label: "OOS: skip cycle" },
            { value: "WAIT", label: "OOS: wait & retry" },
            { value: "CANCEL", label: "OOS: cancel" },
          ]}
        />
        <button onClick={() => cancel.mutate(s.id)}
          className="chip !py-1.5 !text-state-danger" title="Cancel subscription (history kept)">
          <DeleteOutlineIcon sx={{ fontSize: 14 }} /> {t("subscription.cancel")}
        </button>
      </div>

      {rescheduleFor === s.id && (
        <div className="mt-3 flex items-center gap-2 rounded-xl bg-sunken p-3 text-xs">
          <input type="date" value={newDate} min={new Date().toISOString().slice(0, 10)}
            onChange={(e) => setNewDate(e.target.value)}
            className="h-8 rounded-lg border border-line bg-paper px-2 text-ink outline-none focus:border-brand" />
          <button
            disabled={!newDate}
            onClick={() => reschedule.mutate({ id: s.id, nextDeliveryDate: toLocalDateTimePayload(`${newDate}T09:00`) ?? `${newDate}T09:00:00` })}
            className="primary-button !h-8 !text-xs">
            {t("subscription.changeDate")}
          </button>
        </div>
      )}
    </div>
  );

  return (
    <div className="mx-auto max-w-5xl space-y-8 px-4 py-8">
      <PageHeader title={t("subscription.title")} subtitle={t("subscription.subtitle")} />

      {/* ── Deliveries ─────────────────────────────────────────── */}
      <section>
        <p className="font-heading text-2xl font-extrabold text-ink">{t("subscription.deliveries")}</p>
        {isLoading ? (
          <p className="mt-3 text-sm text-ink-muted">Loading…</p>
        ) : byDate.length === 0 ? (
          <p className="mt-3 text-sm text-ink-muted">
            No upcoming deliveries — start a subscription from any eligible product page with
            “Subscribe &amp; save”.
          </p>
        ) : (
          <div className="mt-3 space-y-5">
            {byDate.map(([day, subs]) => (
              <div key={day}>
                <p className="eyebrow mb-2">Arriving {day}</p>
                <div className="space-y-3">{subs.map(rowCard)}</div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ── Paused items ───────────────────────────────────────── */}
      {active.some((s) => s.status === "PAUSED") && (
        <section>
          <p className="font-heading text-2xl font-extrabold text-ink">{t("subscription.pausedItems")}</p>
          <div className="mt-3 space-y-3">
            {active.filter((s) => s.status === "PAUSED").map(rowCard)}
          </div>
        </section>
      )}

      {/* ── History ────────────────────────────────────────────── */}
      {history.length > 0 && (
        <section>
          <p className="font-heading text-2xl font-extrabold text-ink">{t("subscription.history")}</p>
          <div className="mt-3 space-y-3 opacity-80">
            {history.map((s) => (
              <div key={s.id} className="flex items-center justify-between rounded-2xl border border-line bg-paper p-4">
                <div>
                  <p className="font-heading text-sm font-bold text-ink">{describe(s)}</p>
                  <p className="text-xs text-ink-muted">
                    Canceled · started {s.createdAt ? s.createdAt.slice(0, 10) : "—"}
                    {s.lastOrderId ? " · " : ""}
                  </p>
                </div>
                {s.lastOrderId && (
                  <Link to={`/orders`} className="text-xs font-bold text-brand hover:underline">
                    <AutorenewIcon sx={{ fontSize: 14 }} /> Past orders
                  </Link>
                )}
              </div>
            ))}
          </div>
        </section>
      )}
      {/* ── Renewal payment (hybrid auto-charge) ─────────────────── */}
      <section>
        <p className="font-heading text-2xl font-extrabold text-ink">Renewal payment</p>
        <p className="mt-1 text-sm text-ink-soft">
          With a saved payment method, deliveries are charged automatically. Without one, each
          auto-order waits for payment from your Orders page.
        </p>
        <div className="mt-3 space-y-3">
          {(methods ?? []).map((m) => (
            <div
              key={m.id}
              className="flex items-center justify-between rounded-2xl border border-line bg-paper p-4"
            >
              <p className="flex items-center gap-2 text-sm font-bold text-ink">
                <CreditCardOutlinedIcon sx={{ fontSize: 18 }} />
                {m.brand ?? m.provider}
                {m.last4 ? ` ending ${m.last4}` : ""}
                {m.isDefault && (
                  <span className="rounded-full bg-accent px-2 py-0.5 text-[11px]">Default</span>
                )}
              </p>
              <button
                onClick={() => deleteMethod.mutate(m.id)}
                className="chip !py-1.5 !text-state-danger"
              >
                <DeleteOutlineIcon sx={{ fontSize: 14 }} /> Remove
              </button>
            </div>
          ))}
          <div className="rounded-2xl border border-dashed border-line bg-sunken/40 p-4">
            <p className="mb-2 text-xs font-bold text-ink-soft">Add a payment method (provider token)</p>
            <div className="flex flex-wrap items-end gap-2 text-xs">
              <StyledSelect
                ariaLabel="Provider"
                size="md"
                value={pmForm.provider}
                onChange={(v) => setPmForm({ ...pmForm, provider: v })}
                options={[
                  { value: "RAZORPAY", label: "Razorpay" },
                  { value: "STRIPE", label: "Stripe" },
                ]}
              />
              <input
                placeholder="Provider token (vault ref)"
                value={pmForm.token}
                onChange={(e) => setPmForm({ ...pmForm, token: e.target.value })}
                className="h-9 min-w-[12rem] rounded-lg border border-line bg-paper px-2 text-ink outline-none focus:border-brand"
              />
              <input
                placeholder="Brand (e.g. Visa)"
                value={pmForm.brand}
                onChange={(e) => setPmForm({ ...pmForm, brand: e.target.value })}
                className="h-9 w-28 rounded-lg border border-line bg-paper px-2 text-ink outline-none focus:border-brand"
              />
              <input
                placeholder="Last 4"
                value={pmForm.last4}
                maxLength={4}
                onChange={(e) => setPmForm({ ...pmForm, last4: e.target.value })}
                className="h-9 w-20 rounded-lg border border-line bg-paper px-2 text-ink outline-none focus:border-brand"
              />
              <button
                disabled={!pmForm.token || saveMethod.isLoading}
                onClick={() => saveMethod.mutate(pmForm as any)}
                className="primary-button !h-9 !text-xs"
              >
                Save method
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Subscriptions;
