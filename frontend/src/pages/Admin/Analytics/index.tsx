import { useQuery } from "react-query";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip as ChartTooltip,
  XAxis,
  YAxis,
} from "recharts";
import Button from "@mui/material/Button";
import PageHeader from "../../../components/PageHeader";
import SkeletonRows from "../../../components/SkeletonRows";
import EmptyState from "../../../components/EmptyState";
import { AnalyticsApi, AnalyticsSummary } from "../../../api/analyticsApi";
import { useState } from "react";

const RANGES = [
  { days: 7, label: "7 days" },
  { days: 30, label: "30 days" },
  { days: 90, label: "90 days" },
];

const FUNNEL_STEPS = (summary: AnalyticsSummary) => [
  { label: "Viewed products", value: summary.funnel.viewedProducts, hint: "distinct sessions" },
  { label: "Added to cart", value: summary.funnel.addToCart, hint: "distinct sessions" },
  { label: "Checkout started", value: summary.funnel.checkoutStarted, hint: "distinct sessions" },
  {
    label: "Orders",
    value: summary.funnel.realOrders,
    hint: "real orders (source of truth: orders table)",
  },
];

function AdminAnalytics() {
  const [days, setDays] = useState(30);

  const { data: summary, isLoading } = useQuery(["admin-analytics", days], () =>
    AnalyticsApi.getSummary(days)
  );

  const maxWidth = summary ? Math.max(...FUNNEL_STEPS(summary).map((s) => s.value), 1) : 1;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Analytics"
        subtitle="Session funnel and traffic — views, carts, checkouts and real orders."
      />

      <div className="flex gap-2">
        {RANGES.map((range) => (
          <Button
            key={range.days}
            size="small"
            variant={days === range.days ? "contained" : "outlined"}
            onClick={() => setDays(range.days)}
          >
            {range.label}
          </Button>
        ))}
      </div>

      {isLoading ? (
        <SkeletonRows rows={4} columns={4} />
      ) : !summary ? (
        <div className="panel">
          <EmptyState title="No analytics data" subtitle="Events will appear as customers browse." />
        </div>
      ) : (
        <>
          {/* Funnel */}
          <div className="panel">
            <h3 className="mb-4 font-heading text-lg font-bold text-ink">Conversion funnel</h3>
            <div className="space-y-3">
              {FUNNEL_STEPS(summary).map((step, index) => {
                const share = (step.value / maxWidth) * 100;
                const previous = index > 0 ? FUNNEL_STEPS(summary)[index - 1].value : null;
                const dropoff = previous && previous > 0 ? Math.round((step.value / previous) * 100) : null;
                return (
                  <div key={step.label}>
                    <div className="mb-1 flex items-baseline justify-between text-xs">
                      <span className="font-bold text-ink">{step.label}</span>
                      <span className="text-ink-muted">
                        {step.value.toLocaleString()} {step.hint}
                        {dropoff !== null && (
                          <span className="ml-2 font-bold text-brand">{dropoff}% of previous</span>
                        )}
                      </span>
                    </div>
                    <div className="h-7 overflow-hidden rounded-lg bg-brand-soft/40">
                      <div
                        className="flex h-full items-center rounded-lg bg-brand px-3 text-[0.625rem] font-black text-white"
                        style={{ width: `${Math.max(share, step.value > 0 ? 6 : 0.5)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
            <p className="mt-3 text-xs text-ink-muted">
              View → cart conversion {summary.funnel.viewToCartPercent}% · cart → order conversion{" "}
              {summary.funnel.cartToOrderPercent}% (real orders)
            </p>
          </div>

          {/* Daily traffic */}
          <div className="panel">
            <h3 className="mb-4 font-heading text-lg font-bold text-ink">Daily traffic</h3>
            {summary.daily.length === 0 ? (
              <EmptyState title="No events yet" subtitle="Traffic shows up as customers browse." />
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={summary.daily} margin={{ top: 4, right: 16, bottom: 0, left: -16 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--c-line)" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} tickFormatter={(d: string) => d.slice(5)} />
                  <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                  <ChartTooltip />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Line type="monotone" dataKey="views" name="Views" stroke="#0052CC" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="addToCarts" name="Add to cart" stroke="#FF5722" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="checkouts" name="Checkouts" stroke="#7C3AED" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="orders" name="Orders" stroke="#059669" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Top viewed */}
          <div className="panel">
            <h3 className="mb-4 font-heading text-lg font-bold text-ink">Most viewed products</h3>
            {summary.topProducts.length === 0 ? (
              <EmptyState title="No product views yet" />
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart
                  data={summary.topProducts.map((p) => ({
                    name: `${p.productId.slice(0, 8)}…`,
                    views: p.views,
                  }))}
                  margin={{ top: 4, right: 16, bottom: 0, left: -16 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--c-line)" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                  <ChartTooltip />
                  <Bar dataKey="views" name="Views" fill="#0052CC" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </>
      )}
    </div>
  );
}

export default AdminAnalytics;
