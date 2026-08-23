import { useQuery } from "react-query";
import { useNavigate } from "react-router-dom";
import BoltOutlinedIcon from "@mui/icons-material/BoltOutlined";

import { ProductApi } from "../../api/productApi";
import Card from "../../components/Card";
import FeatureHero from "../../components/FeatureHero";
import EmptyState from "../../components/EmptyState";
import ProductViewPlaceholder from "../../components/ProductViewPlaceholder";
import useCountdown from "../../hooks/useCountdown";

function FlashSales() {
  const navigate = useNavigate();
  const { data: flashSales = [], isLoading } = useQuery(
    "flashSales",
    ProductApi.getFlashSales
  );

  /** Soonest ending sale drives the hero countdown. */
  const nextEnding = [...flashSales]
    .filter((p) => p.flashSaleEndsAt)
    .sort(
      (a, b) =>
        new Date(a.flashSaleEndsAt!).getTime() - new Date(b.flashSaleEndsAt!).getTime()
    )[0];
  const countdown = useCountdown(nextEnding?.flashSaleEndsAt);

  const deepestCut = flashSales.reduce((best, p) => {
    const base = p.originalPrice ?? p.unitPrice;
    const now = p.flashPrice && p.flashPrice > 0 ? p.flashPrice : p.unitPrice;
    const pct = base > 0 ? Math.round(((base - now) / base) * 100) : 0;
    return Math.max(best, pct);
  }, 0);

  return (
    <div className="page-shell space-y-6">
      <FeatureHero
        eyebrow="Limited time"
        title="Flash sales, while they last."
        description="Time-boxed prices on a rotating handful of products. When the clock runs out the price snaps back — no extensions."
        metric={
          flashSales.length
            ? {
                value: `−${deepestCut}%`,
                label: "Deepest cut",
                sub: `${flashSales.length} product${flashSales.length === 1 ? "" : "s"} on sale`,
              }
            : undefined
        }
      >
        {countdown && countdown !== "Expired" && (
          <div className="inline-flex items-center gap-3 border border-line bg-sunken px-5 py-2.5">
            <BoltOutlinedIcon sx={{ fontSize: 17 }} className="text-brand" />
            <span className="text-xs font-semibold text-ink-muted">Next sale ends in</span>
            <span className="font-mono text-sm font-bold text-brand">{countdown}</span>
          </div>
        )}
      </FeatureHero>

      {isLoading ? (
        <div className="product-grid">
          {Array.from({ length: 4 }).map((_, i) => (
            <ProductViewPlaceholder key={i} />
          ))}
        </div>
      ) : flashSales.length === 0 ? (
        <div className="panel">
          <EmptyState
            icon={<BoltOutlinedIcon fontSize="large" />}
            title="No flash sales running"
            subtitle="Nothing is discounted right now. Deals drop regularly — check back, or browse the full catalog."
            action={
              <button className="primary-button" onClick={() => navigate("/")}>
                Browse the catalog
              </button>
            }
          />
        </div>
      ) : (
        <>
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="eyebrow">On sale now</p>
              <h2 className="section-title mt-1">
                {flashSales.length} deal{flashSales.length === 1 ? "" : "s"} live
              </h2>
            </div>
          </div>
          <div className="product-grid">
            {flashSales.map((product) => (
              <Card
                key={product.id}
                product={product}
                onClick={() => navigate(`/products/${product.id}`)}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export default FlashSales;
