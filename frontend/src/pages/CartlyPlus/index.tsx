import React from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "react-query";
import { useSelector } from "react-redux";
import LocalShippingOutlinedIcon from "@mui/icons-material/LocalShippingOutlined";
import PercentIcon from "@mui/icons-material/Percent";
import SellOutlinedIcon from "@mui/icons-material/SellOutlined";
import AccessTimeOutlinedIcon from "@mui/icons-material/AccessTimeOutlined";
import SupportAgentOutlinedIcon from "@mui/icons-material/SupportAgentOutlined";
import WorkspacePremiumOutlinedIcon from "@mui/icons-material/WorkspacePremiumOutlined";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";

import { MembershipApi } from "../../api/membershipApi";
import { MembershipPlan } from "../../types/membership";
import { AppState } from "../../store";
import { showSuccess } from "../../utils/showSuccess";
import { showError } from "../../utils/showError";
import { formatPrice } from "../../utils/cart";

const BENEFITS = [
  {
    icon: <LocalShippingOutlinedIcon sx={{ fontSize: 26 }} />,
    title: "Free express delivery",
    body: "Express shipping is free on every order — no minimum basket, no delivery fees, anywhere we service.",
  },
  {
    icon: <PercentIcon sx={{ fontSize: 26 }} />,
    title: "Boosted Subscribe & Save",
    body: "10% off every Subscribe & Save delivery (instead of 5%), rising to 20% when 5+ deliveries batch in a month.",
  },
  {
    icon: <SellOutlinedIcon sx={{ fontSize: 26 }} />,
    title: "Member-only prices",
    body: "Exclusive Cartly Plus deals on select products across the store — applied automatically at checkout.",
  },
  {
    icon: <AccessTimeOutlinedIcon sx={{ fontSize: 26 }} />,
    title: "24h early access to sales",
    body: "Shop flash sales a full day before everyone else, at the same sale price.",
  },
  {
    icon: <SupportAgentOutlinedIcon sx={{ fontSize: 26 }} />,
    title: "Priority support",
    body: "Your support tickets enter the priority lane and are answered first.",
  },
];

const PLANS: { plan: MembershipPlan; price: number; label: string; note: string }[] = [
  { plan: "MONTHLY", price: 149, label: "Monthly", note: "Billed every month" },
  { plan: "ANNUAL", price: 1499, label: "Annual", note: "2 months free vs monthly" },
];

/**
 * Cartly Plus — our Prime-style membership: name it, join it, and the benefits
 * follow you across the store (server-side enforced).
 */
const CartlyPlus = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: user } = useSelector((state: AppState) => state.user);
  const { data: membership, isLoading } = useQuery("my-membership", MembershipApi.status, {
    enabled: !!user?.isLogedIn,
  });

  const invalidate = () => queryClient.invalidateQueries("my-membership");

  const join = useMutation((plan: MembershipPlan) => MembershipApi.join(plan), {
    onSuccess: () => {
      showSuccess("Welcome to Cartly Plus — your benefits are live");
      invalidate();
    },
    onError: (err: any) => showError(err?.response?.data?.message ?? "Could not join Cartly Plus"),
  });
  const cancel = useMutation(MembershipApi.cancel, {
    onSuccess: () => {
      showSuccess("Auto-renew is off — benefits continue until your period ends");
      invalidate();
    },
    onError: () => showError("Could not update your membership"),
  });
  const autoRenew = useMutation((enabled: boolean) => MembershipApi.setAutoRenew(enabled), {
    onSuccess: () => invalidate(),
    onError: () => showError("Could not update auto-renew"),
  });

  const isActive = membership?.status === "ACTIVE";
  const until = membership?.currentPeriodEnd?.slice(0, 10);

  const handleJoin = (plan: MembershipPlan) => {
    if (!user?.isLogedIn) {
      navigate("/login", { state: { from: { pathname: "/cartly-plus" } } });
      return;
    }
    join.mutate(plan);
  };

  return (
    <div className="mx-auto max-w-5xl space-y-10 px-4 py-8">
      {/* hero */}
      <section className="panel overflow-hidden">
        <div className="bg-ink px-6 py-10 text-oncontrast sm:px-10">
          <p className="text-xs font-bold uppercase tracking-[0.3em] text-oncontrast/60">
            Membership
          </p>
          <h1 className="mt-2 font-heading text-4xl font-extrabold tracking-tight sm:text-5xl">
            <WorkspacePremiumOutlinedIcon sx={{ fontSize: 40, verticalAlign: "middle", mr: 1 }} />
            Cartly Plus
          </h1>
          <p className="mt-3 max-w-xl text-sm leading-relaxed text-oncontrast/80">
            Delivery, deals and support that move faster. One membership — free express delivery,
            bigger Subscribe &amp; Save savings, member-only prices, early sale access and priority
            support.
          </p>
        </div>

        {/* benefits */}
        <div className="grid gap-px bg-line sm:grid-cols-2 lg:grid-cols-3">
          {BENEFITS.map((b) => (
            <div key={b.title} className="bg-paper p-5">
              <div className="text-brand">{b.icon}</div>
              <p className="mt-2 font-heading text-base font-extrabold text-ink">{b.title}</p>
              <p className="mt-1 text-sm leading-relaxed text-ink-soft">{b.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* status / plans */}
      {!user?.isLogedIn ? (
        <section>
          <p className="font-heading text-2xl font-extrabold text-ink">Join Cartly Plus</p>
          <p className="mt-1 text-sm text-ink-soft">Sign in to start your membership.</p>
          <button onClick={() => handleJoin("MONTHLY")} className="primary-button mt-4">
            Sign in to join
          </button>
        </section>
      ) : isLoading ? (
        <p className="text-sm text-ink-muted">Loading your membership…</p>
      ) : isActive ? (
        <section className="panel p-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="eyebrow">Your membership</p>
              <p className="mt-1 flex items-center gap-2 font-heading text-xl font-extrabold text-ink">
                <CheckCircleOutlineIcon sx={{ color: "var(--tw-prose-links, #2e7d32)" }} />
                Cartly Plus {membership?.plan === "ANNUAL" ? "Annual" : "Monthly"}
              </p>
              <p className="mt-1 text-sm text-ink-soft">
                {membership?.autoRenew
                  ? `Renews ${until} · ${formatPrice(membership?.pricePaid ?? 0)}`
                  : `Active until ${until} · auto-renew off`}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <button
                onClick={() => autoRenew.mutate(!membership?.autoRenew)}
                className="chip !py-1.5"
              >
                {membership?.autoRenew ? "Turn off auto-renew" : "Turn on auto-renew"}
              </button>
              {membership?.autoRenew && (
                <button
                  onClick={() => cancel.mutate()}
                  className="chip !py-1.5 !text-state-danger"
                  title="Benefits continue until the period ends"
                >
                  Cancel membership
                </button>
              )}
            </div>
          </div>
          <p className="mt-4 text-xs text-ink-muted">
            Benefits apply automatically: free express delivery at checkout, boosted Subscribe &amp;
            Save rates, member-only prices and a priority support lane.
          </p>
        </section>
      ) : (
        <section>
          <p className="font-heading text-2xl font-extrabold text-ink">Choose your plan</p>
          <p className="mt-1 text-sm text-ink-soft">
            {membership?.status === "EXPIRED"
              ? "Your membership lapsed — rejoin to switch the benefits back on."
              : "Cancel anytime — benefits continue until your period ends."}
          </p>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            {PLANS.map((p) => (
              <div key={p.plan} className="panel flex flex-col p-6">
                <p className="eyebrow">{p.label}</p>
                <p className="mt-2 font-heading text-3xl font-extrabold text-ink">
                  {formatPrice(p.price)}
                  <span className="ml-1 text-sm font-semibold text-ink-muted">
                    /{p.plan === "ANNUAL" ? "year" : "month"}
                  </span>
                </p>
                <p className="mt-1 text-xs text-ink-soft">{p.note}</p>
                <ul className="mt-3 flex-1 space-y-1.5 text-sm text-ink-soft">
                  {BENEFITS.map((b) => (
                    <li key={b.title} className="flex gap-2">
                      <CheckCircleOutlineIcon sx={{ fontSize: 16, color: "#2e7d32", mt: 0.2 }} />
                      {b.title}
                    </li>
                  ))}
                </ul>
                <button
                  onClick={() => handleJoin(p.plan)}
                  disabled={join.isLoading}
                  className={`mt-5 ${p.plan === "ANNUAL" ? "primary-button" : "chip !py-2.5 !text-sm"}`}
                >
                  {join.isLoading ? "Joining…" : `Join — ${formatPrice(p.price)}`}
                </button>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};

export default CartlyPlus;
