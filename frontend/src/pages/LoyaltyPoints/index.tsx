import { useQuery } from "react-query";
import { useNavigate } from "react-router-dom";
import { Skeleton } from "@mui/material";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import RedeemOutlinedIcon from "@mui/icons-material/RedeemOutlined";
import StarsOutlinedIcon from "@mui/icons-material/StarsOutlined";

import { LoyaltyPointApi } from "../../api/loyaltyPointApi";
import FeatureHero, { HowItWorks } from "../../components/FeatureHero";
import EmptyState from "../../components/EmptyState";
import { LoyaltyPointType } from "../../types/loyaltyPoint";
import { formatDate } from "../../utils/date";

/** Points needed for the next redeemable tier. */
const TIER = 500;

function LoyaltyPoints() {
  const navigate = useNavigate();
  const { data: balance, isLoading: balanceLoading } = useQuery(
    "loyaltyBalance",
    LoyaltyPointApi.getBalance
  );
  const { data: history, isLoading: historyLoading } = useQuery(
    "loyaltyHistory",
    LoyaltyPointApi.getHistory
  );

  const points = balance ?? 0;
  const toNextTier = Math.max(0, TIER - (points % TIER));
  const progress = ((points % TIER) / TIER) * 100;

  const earned = (history ?? [])
    .filter((h) => h.type === LoyaltyPointType.EARNED)
    .reduce((a, h) => a + h.points, 0);
  const redeemed = (history ?? [])
    .filter((h) => h.type !== LoyaltyPointType.EARNED)
    .reduce((a, h) => a + Math.abs(h.points), 0);

  return (
    <div className="page-shell space-y-6">
      <FeatureHero
        eyebrow="Rewards"
        title="Every order earns you points."
        description="Collect 1 point for every ₹10 you spend. Redeem them as a straight discount at checkout — no minimum order, no expiry games."
        metric={{
          value: balanceLoading ? "—" : points.toLocaleString("en-IN"),
          label: "Points available",
          sub: `≈ ${(points / 10).toFixed(0)} off your next order`,
        }}
        actions={
          <button onClick={() => navigate("/")} className="accent-button">
            Shop and earn
          </button>
        }
      >
        <div>
          <div className="flex items-baseline justify-between text-xs">
            <span className="font-semibold text-ink">Next reward tier</span>
            <span className="text-ink-muted">{toNextTier} points to go</span>
          </div>
          <div className="mt-2 h-1.5 max-w-md overflow-hidden bg-sunken">
            <div
              className="h-full bg-action transition-all duration-700"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </FeatureHero>

      <div className="grid border-y border-line sm:grid-cols-3">
        {[
          { icon: StarsOutlinedIcon, label: "Current balance", value: points },
          { icon: TrendingUpIcon, label: "Lifetime earned", value: earned },
          { icon: RedeemOutlinedIcon, label: "Lifetime redeemed", value: redeemed },
        ].map(({ icon: Icon, label, value }) => (
          <div key={label} className="flex items-center gap-4 border-b border-line py-5 sm:border-b-0 sm:border-r sm:px-5 sm:first:pl-0 sm:last:border-r-0">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center text-brand">
              <Icon sx={{ fontSize: 19 }} />
            </span>
            <div className="min-w-0">
              <p className="text-eyebrow font-bold uppercase text-ink-muted">{label}</p>
              <p className="font-display text-2xl text-ink">
                {value.toLocaleString("en-IN")}
              </p>
            </div>
          </div>
        ))}
      </div>

      <HowItWorks
        steps={[
          { title: "Spend", copy: "Every ₹10 on a paid order becomes 1 point, credited when payment clears." },
          { title: "Collect", copy: "Points stack across orders. Your balance and full history live on this page." },
          { title: "Redeem", copy: "Apply points at checkout in the credits section — they come straight off the total." },
        ]}
      />

      <section className="border-t border-ink">
        <div className="flex items-center justify-between gap-3 border-b border-line py-4">
          <h2 className="font-display text-2xl font-normal">Points history</h2>
          {!!history?.length && (
            <span className="text-xs text-ink-muted">{history.length} entries</span>
          )}
        </div>

        {historyLoading ? (
          <div className="space-y-3 p-5">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} variant="text" height={28} />
            ))}
          </div>
        ) : !history?.length ? (
          <EmptyState
            icon={<StarsOutlinedIcon fontSize="large" />}
            title="No points yet"
            subtitle="Place your first order and points will land here as soon as payment clears."
            action={
              <button className="primary-button" onClick={() => navigate("/")}>
                Browse products
              </button>
            }
          />
        ) : (
          <ul className="divide-y divide-line">
            {history.map((entry) => {
              const isEarned = entry.type === LoyaltyPointType.EARNED;
              return (
                <li key={entry.id} className="flex items-center gap-4 py-3.5">
                  <span
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                      isEarned ? "bg-state-success-soft text-state-success-on" : "bg-sunken text-ink-soft"
                    }`}
                  >
                    {isEarned ? (
                      <TrendingUpIcon sx={{ fontSize: 16 }} />
                    ) : (
                      <RedeemOutlinedIcon sx={{ fontSize: 16 }} />
                    )}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-ink">{entry.description}</p>
                    <p className="text-xs text-ink-muted">{formatDate(entry.createdDate)}</p>
                  </div>
                  <span
                    className={`shrink-0 font-heading text-sm font-extrabold ${
                      isEarned ? "text-state-success" : "text-ink-soft"
                    }`}
                  >
                    {isEarned ? "+" : "−"}
                    {Math.abs(entry.points)}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}

export default LoyaltyPoints;
