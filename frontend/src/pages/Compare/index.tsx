import { useEffect, useState } from "react";
import { useQuery } from "react-query";
import { useNavigate } from "react-router-dom";
import { Rating, Skeleton } from "@mui/material";
import CompareArrowsOutlinedIcon from "@mui/icons-material/CompareArrowsOutlined";
import CloseIcon from "@mui/icons-material/Close";
import CheckIcon from "@mui/icons-material/Check";
import ImageOutlinedIcon from "@mui/icons-material/ImageOutlined";

import { ProductApi } from "../../api/productApi";
import EmptyState from "../../components/EmptyState";
import PageHeader from "../../components/PageHeader";
import { getCompareIds, removeFromCompare, clearCompare } from "../../utils/compare";
import { ProductAdmin } from "../../types/product";
import { formatPrice } from "../../utils/cart";

type Attr = {
  label: string;
  /** Cell content. */
  render: (p: ProductAdmin) => React.ReactNode;
  /** Raw value used to work out which product "wins" this row. */
  score?: (p: ProductAdmin) => number;
  /** Higher is better? */
  higherWins?: boolean;
};

function Compare() {
  const navigate = useNavigate();
  const [compareIds, setCompareIds] = useState<string[]>([]);

  useEffect(() => {
    setCompareIds(getCompareIds());
  }, []);

  const { data: products, isLoading } = useQuery(
    ["compare:products", compareIds],
    () => ProductApi.getProductsByIds(compareIds),
    { enabled: compareIds.length > 0 }
  );

  const handleRemove = (productId: string) => {
    removeFromCompare(productId);
    setCompareIds(getCompareIds());
  };

  if (compareIds.length === 0) {
    return (
      <div className="page-shell">
        <PageHeader
          eyebrow="Decide"
          title="Compare products"
          subtitle="Put two to four products side by side and see exactly where they differ."
        />
        <div className="panel">
          <EmptyState
            icon={<CompareArrowsOutlinedIcon fontSize="large" />}
            title="Nothing to compare yet"
            subtitle="Hit the compare icon on any product card or detail page, then come back here."
            action={
              <button className="primary-button" onClick={() => navigate("/")}>
                Browse products
              </button>
            }
          />
        </div>
      </div>
    );
  }

  const list = products ?? [];

  const attrs: Attr[] = [
    {
      label: "Price",
      render: (p) => (
        <span className="font-heading text-base font-extrabold text-ink">
          {formatPrice(p.unitPrice)}
        </span>
      ),
      score: (p) => p.unitPrice,
      higherWins: false,
    },
    {
      label: "Rating",
      render: (p) =>
        p.ratingCount ? (
          <span className="flex flex-col items-center gap-1">
            <Rating value={p.avgRating ?? 0} precision={0.1} size="small" readOnly />
            <span className="text-xs text-ink-muted">{p.ratingCount} reviews</span>
          </span>
        ) : (
          <span className="text-ink-muted">—</span>
        ),
      score: (p) => p.avgRating ?? 0,
      higherWins: true,
    },
    { label: "Brand", render: (p) => p.brand || <span className="text-ink-muted">—</span> },
    {
      label: "Category",
      render: (p) => p.category?.name || <span className="text-ink-muted">—</span>,
    },
    {
      label: "Availability",
      render: (p) =>
        (p.quantityInStock ?? 0) <= 0 ? (
          <span className="badge-stock-out">Out of stock</span>
        ) : (p.quantityInStock ?? 0) <= 5 ? (
          <span className="badge-stock-low">Only {p.quantityInStock} left</span>
        ) : (
          <span className="badge-stock-in">{p.quantityInStock} in stock</span>
        ),
      score: (p) => p.quantityInStock ?? 0,
      higherWins: true,
    },
    {
      label: "Variants",
      render: (p) =>
        p.variants?.length ? `${p.variants.length} options` : <span className="text-ink-muted">—</span>,
    },
    {
      label: "Description",
      render: (p) => (
        <span className="block text-left text-xs leading-relaxed text-ink-soft">
          {p.description || "—"}
        </span>
      ),
    },
  ];

  /** Which product ids win a given row (ties all win). */
  const winners = (attr: Attr): Set<string> => {
    if (!attr.score || list.length < 2) return new Set();
    const scores = list.map((p) => attr.score!(p));
    const best = attr.higherWins ? Math.max(...scores) : Math.min(...scores);
    if (scores.every((s) => s === best)) return new Set();
    return new Set(list.filter((p) => attr.score!(p) === best).map((p) => p.id));
  };

  return (
    <div className="page-shell space-y-6">
      <PageHeader
        eyebrow="Decide"
        title="Compare products"
        subtitle={`${list.length} product${list.length === 1 ? "" : "s"} side by side — the best value in each row is marked.`}
        actions={
          <button
            className="secondary-button !py-2"
            onClick={() => {
              clearCompare();
              setCompareIds([]);
            }}
          >
            Clear all
          </button>
        }
      />

      {isLoading ? (
        <Skeleton variant="rectangular" height={420} className="!rounded-lg" />
      ) : (
        <div className="panel overflow-x-auto">
          <table className="w-full min-w-[40rem] border-collapse text-sm">
            <thead>
              <tr>
                <th
                  scope="col"
                  className="sticky left-0 z-10 w-40 border-b border-line bg-paper px-4 py-4 text-left text-eyebrow font-bold uppercase text-ink-muted"
                >
                  Attribute
                </th>
                {list.map((p) => (
                  <th
                    key={p.id}
                    scope="col"
                    className="min-w-[12rem] border-b border-l border-line px-4 py-4 align-top"
                  >
                    <div className="flex flex-col items-center gap-3">
                      <div className="relative w-full">
                        <button
                          onClick={() => navigate(`/products/${p.id}`)}
                          className="block aspect-[4/3] w-full overflow-hidden rounded-sm border border-line bg-sunken"
                          aria-label={`View ${p.name}`}
                        >
                          {p.images?.[0] || p.imageUrl ? (
                            <img
                              src={p.images?.[0] || p.imageUrl}
                              alt=""
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <span className="flex h-full items-center justify-center text-ink-faint">
                              <ImageOutlinedIcon />
                            </span>
                          )}
                        </button>
                        <button
                          onClick={() => handleRemove(p.id)}
                          aria-label={`Remove ${p.name} from compare`}
                          title="Remove"
                          className="absolute -right-2 -top-2 flex h-7 w-7 items-center justify-center rounded-full border border-line bg-paper text-ink-soft shadow-card transition hover:border-state-danger hover:text-state-danger"
                        >
                          <CloseIcon sx={{ fontSize: 14 }} />
                        </button>
                      </div>
                      <p className="line-clamp-2 text-center font-heading text-sm font-bold text-ink">
                        {p.name}
                      </p>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {attrs.map((attr) => {
                const win = winners(attr);
                return (
                  <tr key={attr.label} className="border-b border-line/70 last:border-0">
                    <th
                      scope="row"
                      className="sticky left-0 z-10 bg-paper px-4 py-3.5 text-left text-xs font-bold uppercase tracking-wide text-ink-muted"
                    >
                      {attr.label}
                    </th>
                    {list.map((p) => (
                      <td
                        key={p.id}
                        className={`border-l border-line px-4 py-3.5 text-center align-middle ${
                          win.has(p.id) ? "bg-brand-tint" : ""
                        }`}
                      >
                        <span className="inline-flex items-center gap-1.5">
                          {win.has(p.id) && (
                            <CheckIcon sx={{ fontSize: 14 }} className="text-brand" />
                          )}
                          {attr.render(p)}
                        </span>
                      </td>
                    ))}
                  </tr>
                );
              })}
              <tr>
                <th scope="row" className="sticky left-0 z-10 bg-paper px-4 py-4" />
                {list.map((p) => (
                  <td key={p.id} className="border-l border-line px-4 py-4 text-center">
                    <button
                      onClick={() => navigate(`/products/${p.id}`)}
                      className="primary-button w-full !py-2"
                    >
                      View product
                    </button>
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default Compare;
