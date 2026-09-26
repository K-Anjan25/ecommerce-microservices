import React from "react";
import { useQuery } from "react-query";

import { SubscriptionApi, SubscriptionForecastWeek } from "../../../api/subscriptionApi";
import { Subscription } from "../../../types/subscription";
import { formatPrice } from "../../../utils/cart";
import PageHeader from "../../../components/PageHeader";
import SkeletonRows from "../../../components/SkeletonRows";

/**
 * Admin subscriptions — Subscribe & Save ops + demand forecast
 * (upcoming auto-reorders grouped by ISO week).
 */
const AdminSubscriptions = () => {
  const { data: subs, isLoading } = useQuery("admin-subscriptions", SubscriptionApi.adminList);
  const { data: forecast, isLoading: forecastLoading } = useQuery<
    SubscriptionForecastWeek[]
  >("admin-subscription-forecast", () => SubscriptionApi.adminForecast(8));

  const describe = (s: Subscription) =>
    `${s.productName}${s.variantName ? ` (${s.variantName})` : ""}`;

  return (
    <div className="space-y-8">
      <PageHeader
        title="Subscriptions"
        subtitle="Active Subscribe & Save auto-reorders and upcoming delivery demand."
      />

      {/* ── Demand forecast ──────────────────────────────────────── */}
      <section className="rounded-2xl border border-line bg-paper p-5">
        <p className="font-heading text-base font-extrabold text-ink">Upcoming demand (8 weeks)</p>
        {forecastLoading ? (
          <SkeletonRows rows={4} />
        ) : !forecast?.length ? (
          <p className="mt-2 text-sm text-ink-muted">No auto-reorders scheduled in this window.</p>
        ) : (
          <table className="mt-3 w-full text-left text-sm">
            <thead>
              <tr className="border-b border-line text-xs uppercase tracking-wide text-ink-muted">
                <th className="py-2">Week of</th>
                <th className="py-2">Deliveries</th>
                <th className="py-2">Units</th>
                <th className="py-2">Est. list value</th>
              </tr>
            </thead>
            <tbody>
              {forecast.map((row) => (
                <tr key={row.weekStart} className="border-b border-line/60 text-ink">
                  <td className="py-2 font-semibold">{row.weekStart}</td>
                  <td className="py-2">{row.deliveries}</td>
                  <td className="py-2">{row.units}</td>
                  <td className="py-2">{formatPrice(Number(row.estValue))}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      {/* ── All active subscriptions ─────────────────────────────── */}
      <section className="rounded-2xl border border-line bg-paper p-5">
        <p className="font-heading text-base font-extrabold text-ink">Active subscriptions</p>
        {isLoading ? (
          <SkeletonRows rows={6} />
        ) : !subs?.length ? (
          <p className="mt-2 text-sm text-ink-muted">No active subscriptions.</p>
        ) : (
          <div className="mt-3 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-line text-xs uppercase tracking-wide text-ink-muted">
                  <th className="py-2">Product</th>
                  <th className="py-2">Customer</th>
                  <th className="py-2">Qty</th>
                  <th className="py-2">Every</th>
                  <th className="py-2">Discount</th>
                  <th className="py-2">Next delivery</th>
                  <th className="py-2">Status</th>
                  <th className="py-2">OOS policy</th>
                </tr>
              </thead>
              <tbody>
                {subs.map((s: Subscription) => (
                  <tr key={s.id} className="border-b border-line/60 text-ink">
                    <td className="py-2 font-semibold">{describe(s)}</td>
                    <td className="py-2 font-mono text-xs">{s.id.slice(0, 8)}…</td>
                    <td className="py-2">{s.quantity}</td>
                    <td className="py-2">{s.intervalDays}d</td>
                    <td className="py-2">−{s.discountPercent}%</td>
                    <td className="py-2">{s.nextRunAt.slice(0, 10)}</td>
                    <td className="py-2">
                      <span className={`chip !py-0.5 !text-[11px] ${s.status === "ACTIVE" ? "chip-ink" : ""}`}>
                        {s.status}
                      </span>
                    </td>
                    <td className="py-2">{s.oosPolicy}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
};

export default AdminSubscriptions;
