import React, { useEffect, useState, useMemo, useRef } from "react";
import { useInfiniteQuery, useQuery } from "react-query";
import { useInView } from "react-intersection-observer";
import { useLocation, useNavigate } from "react-router-dom";
import { Drawer, Checkbox, FormControlLabel, TextField, Rating } from "@mui/material";
import Inventory2OutlinedIcon from "@mui/icons-material/Inventory2Outlined";
import TuneIcon from "@mui/icons-material/Tune";
import CloseIcon from "@mui/icons-material/Close";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import LocalShippingOutlinedIcon from "@mui/icons-material/LocalShippingOutlined";
import ReplayOutlinedIcon from "@mui/icons-material/ReplayOutlined";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import BoltOutlinedIcon from "@mui/icons-material/BoltOutlined";

import { ProductApi } from "../../api/productApi";
import { CategoryApi } from "../../api/categoryApi";
import { PRODUCT_PARAM } from "../../constants/product";
import { Category } from "../../types/category";
import Card from "../../components/Card";
import ProductViewPlaceholder from "../../components/ProductViewPlaceholder";
import EmptyState from "../../components/EmptyState";
import CommerceSearch from "../../components/CommerceSearch";

const SORTS = [
  { value: "DATE_DESC", label: "Newest" },
  { value: "DATE_ASC", label: "Oldest" },
  { value: "PRICE_ASC", label: "Price: low → high" },
  { value: "PRICE_DESC", label: "Price: high → low" },
];

const TRUST = [
  { icon: LocalShippingOutlinedIcon, title: "Free shipping", copy: "On orders over ₹999" },
  { icon: ReplayOutlinedIcon, title: "7-day returns", copy: "No-questions refunds" },
  { icon: LockOutlinedIcon, title: "Secure checkout", copy: "UPI · Cards · COD" },
  { icon: BoltOutlinedIcon, title: "Fast dispatch", copy: "Ships within 24h" },
];

function Products() {
  const navigate = useNavigate();
  const location = useLocation();
  const { ref, inView } = useInView();
  const searchInputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  const [searchValue, setSearchValue] = useState("");
  const [sortBy, setSortBy] = useState("DATE_DESC");
  const [filter, setFilter] = useState("");
  const [categories, setCategories] = useState<Category[]>([]);

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [minPrice, setMinPrice] = useState<string>("");
  const [maxPrice, setMaxPrice] = useState<string>("");
  const [minRating, setMinRating] = useState<string>("");

  const [filtersOpen, setFiltersOpen] = useState(false);

  const { data, isFetching, isFetchingNextPage, fetchNextPage, hasNextPage } =
    useInfiniteQuery(
      ["projects", searchTerm, sortBy, filter, selectedBrands, minPrice, maxPrice, minRating],
      ({ pageParam = 0 }) =>
        ProductApi.getProducts({
          ...PRODUCT_PARAM,
          page: pageParam,
          searchTerm: searchTerm,
          sort: sortBy,
          filter: filter,
          brand: selectedBrands.join(","),
          minPrice: minPrice ? Number(minPrice) : 0,
          maxPrice: maxPrice ? Number(maxPrice) : 0,
          minRating: minRating ? Number(minRating) : 0,
        }),
      {
        getNextPageParam: (lastGroup, allGroups) => {
          const morePageExist = lastGroup?.content?.length === PRODUCT_PARAM.size;
          if (!morePageExist) return;
          return allGroups?.length;
        },
      }
    );

  const products = data?.pages.flatMap((page) => page.content) ?? [];
  const facets = data?.pages[0]?.facets;
  const showInitialSkeleton = isFetching && !isFetchingNextPage && products.length === 0;

  useEffect(() => {
    if (inView) fetchNextPage();
  }, [inView, fetchNextPage]);

  /* Navbar hand-offs: global search, category rail, mobile "Search" tab. */
  useEffect(() => {
    const state = location.state as
      | { search?: string; category?: string; focusSearch?: boolean }
      | null;
    if (typeof state?.search === "string" && state.search.trim()) {
      setSearchValue(state.search);
      setSearchTerm(state.search);
      resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
    if (typeof state?.category === "string") {
      setFilter(state.category);
      resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
    if (state?.focusSearch) {
      searchInputRef.current?.focus();
      searchInputRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.key]);

  useEffect(() => {
    CategoryApi.getCategories().then(setCategories).catch(() => setCategories([]));
  }, []);

  const delayedSearchTerm = useMemo(() => {
    let timer: number | undefined;
    return (query: string) => {
      window.clearTimeout(timer);
      timer = window.setTimeout(() => setSearchTerm(query), 420);
    };
  }, []);

  const handleChangeSearchValue = (value: string) => {
    setSearchValue(value);
    delayedSearchTerm(value);
  };

  const { data: bestsellers } = useQuery("bestsellers", ProductApi.getBestsellers, {
    enabled:
      !searchTerm && !filter && selectedBrands.length === 0 && !minPrice && !maxPrice && !minRating,
  });

  const activeFilters = [
    filter && { key: "category", label: filter, clear: () => setFilter("") },
    ...selectedBrands.map((b) => ({
      key: `brand-${b}`,
      label: b,
      clear: () => setSelectedBrands((prev) => prev.filter((x) => x !== b)),
    })),
    (minPrice || maxPrice) && {
      key: "price",
      label: `₹${minPrice || 0} – ₹${maxPrice || "∞"}`,
      clear: () => {
        setMinPrice("");
        setMaxPrice("");
      },
    },
    minRating && {
      key: "rating",
      label: `${minRating}★ & up`,
      clear: () => setMinRating(""),
    },
    searchTerm && {
      key: "term",
      label: `“${searchTerm}”`,
      clear: () => {
        setSearchTerm("");
        setSearchValue("");
      },
    },
  ].filter(Boolean) as { key: string; label: string; clear: () => void }[];

  const hasActiveSearch = activeFilters.length > 0;

  const clearAll = () => {
    setSelectedBrands([]);
    setMinPrice("");
    setMaxPrice("");
    setMinRating("");
    setFilter("");
    setSearchTerm("");
    setSearchValue("");
  };

  const toggleBrand = (brand: string) =>
    setSelectedBrands((prev) =>
      prev.includes(brand) ? prev.filter((b) => b !== brand) : [...prev, brand]
    );

  /* ── facet panel (shared by sidebar + mobile drawer) ────────────────── */
  const FacetPanel = (
    <div className="space-y-7">
      <section>
        <p className="eyebrow mb-3">Category</p>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setFilter("")}
            className={`chip ${!filter ? "chip-active" : ""}`}
          >
            All
          </button>
          {categories.map((c) => (
            <button
              key={c.id}
              onClick={() => setFilter(c.name)}
              className={`chip ${filter === c.name ? "chip-active" : ""}`}
            >
              {c.name}
            </button>
          ))}
        </div>
      </section>

      <section>
        <p className="eyebrow mb-2">Brand</p>
        {facets?.brands?.length ? (
          <div className="max-h-56 space-y-0.5 overflow-y-auto pr-1">
            {facets.brands.map((b) => (
              <FormControlLabel
                key={b.value}
                className="!ml-0 flex w-full !justify-between"
                labelPlacement="start"
                control={
                  <Checkbox
                    size="small"
                    checked={selectedBrands.includes(b.value)}
                    onChange={() => toggleBrand(b.value)}
                  />
                }
                label={
                  <span className="text-sm text-ink-soft">
                    {b.value} <span className="text-ink-muted">({b.count})</span>
                  </span>
                }
              />
            ))}
          </div>
        ) : (
          <p className="text-sm text-ink-muted">No brands yet</p>
        )}
      </section>

      <section>
        <p className="eyebrow mb-3">Price</p>
        <div className="flex items-center gap-2">
          <TextField
            label="Min"
            type="number"
            size="small"
            fullWidth
            value={minPrice}
            onChange={(e) => setMinPrice(e.target.value)}
          />
          <span className="text-ink-muted">–</span>
          <TextField
            label="Max"
            type="number"
            size="small"
            fullWidth
            value={maxPrice}
            onChange={(e) => setMaxPrice(e.target.value)}
          />
        </div>
        {facets?.priceMin != null && (
          <p className="mt-2 text-xs text-ink-muted">
            Catalog range: ₹{facets.priceMin} – ₹{facets.priceMax}
          </p>
        )}
      </section>

      <section>
        <p className="eyebrow mb-3">Rating</p>
        <div className="space-y-1">
          {["", "3", "4"].map((r) => (
            <button
              key={r || "any"}
              onClick={() => setMinRating(r)}
              className={`flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm transition ${
                minRating === r ? "bg-brand-soft text-brand" : "text-ink-soft hover:bg-sunken"
              }`}
            >
              {r ? (
                <>
                  <Rating value={Number(r)} max={5} size="small" readOnly /> &amp; up
                </>
              ) : (
                "Any rating"
              )}
            </button>
          ))}
        </div>
      </section>
    </div>
  );

  const grid = (items: typeof products) => (
    <div className="product-grid">
      {items.map((product) => (
        <Card
          key={product.id}
          product={product}
          onClick={() => navigate(`products/${product.id}`)}
        />
      ))}
    </div>
  );

  return (
    <div className="pb-4">
      {/* ═══ HERO ═════════════════════════════════════════════════════ */}
      <section className="page-shell">
        <div className="grid gap-4 lg:grid-cols-[1.25fr_1fr]">
          <div className="grain relative overflow-hidden rounded-xl2 bg-contrast px-7 py-10 text-oncontrast sm:px-12 sm:py-16">
            <p className="eyebrow !text-accent">New season · 2026</p>
            <h1 className="mt-4 font-heading text-4xl font-extrabold leading-[1.05] tracking-tight sm:text-5xl lg:text-6xl">
              Everything you
              <br />
              <span className="font-display font-normal italic text-accent">
                need, one cart.
              </span>
            </h1>
            <p className="mt-5 max-w-md text-sm leading-relaxed text-ink-muted sm:text-base">
              A catalog you can actually search, a checkout that doesn&apos;t fight you, and
              rewards that stack. Browse {products.length ? `${products.length}+` : "the"} products below.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <button
                onClick={() => resultsRef.current?.scrollIntoView({ behavior: "smooth" })}
                className="accent-button"
              >
                Shop the catalog <ArrowForwardIcon sx={{ fontSize: 17 }} />
              </button>
              <button
                onClick={() => navigate("/flash-sales")}
                className="inline-flex items-center justify-center gap-2 rounded-sm border border-white/25 px-4 py-2.5 text-sm font-semibold text-oncontrast transition hover:bg-white/10"
              >
                View flash sales
              </button>
            </div>
            <div className="mt-9 flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-ink-muted">
              <span>★ 4.8 average rating</span>
              <span>12,400+ orders shipped</span>
              <span>Free returns for 7 days</span>
            </div>
          </div>

          {/* featured slot — bestseller cover, falls back to a quiet panel */}
          <div className="relative hidden overflow-hidden rounded-xl2 border border-line bg-paper lg:block">
            {bestsellers?.[0]?.imageUrl || bestsellers?.[0]?.images?.[0] ? (
              <button
                onClick={() => navigate(`products/${bestsellers[0].id}`)}
                className="group block h-full w-full text-left"
              >
                <img
                  src={bestsellers[0].images?.[0] || bestsellers[0].imageUrl}
                  alt={bestsellers[0].name}
                  className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-contrast/90 to-transparent p-6 pt-16 text-oncontrast">
                  <span className="badge-sale !bg-accent !text-ink">Bestseller</span>
                  <p className="mt-2 font-heading text-xl font-bold">{bestsellers[0].name}</p>
                </div>
              </button>
            ) : (
              <div className="flex h-full flex-col justify-center gap-4 p-10">
                <p className="eyebrow">Featured</p>
                <p className="font-heading text-2xl font-bold leading-snug text-ink">
                  Fresh stock lands every week.
                </p>
                <p className="text-sm text-ink-soft">
                  Filter by brand, price or rating — the facets update as you go.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* trust strip */}
        <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
          {TRUST.map(({ icon: Icon, title, copy }) => (
            <div key={title} className="panel flex items-center gap-3 px-4 py-3.5">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-soft text-brand">
                <Icon sx={{ fontSize: 18 }} />
              </span>
              <div className="min-w-0">
                <p className="truncate text-sm font-bold text-ink">{title}</p>
                <p className="truncate text-xs text-ink-muted">{copy}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ═══ CATEGORY TILES ═══════════════════════════════════════════ */}
      {categories.length > 0 && (
        <section className="page-shell mt-12">
          <div className="mb-5 flex items-end justify-between gap-4">
            <div>
              <p className="eyebrow">Browse</p>
              <h2 className="section-title mt-1">Shop by category</h2>
            </div>
            <button
              onClick={() => setFilter("")}
              className="text-sm font-semibold text-brand hover:underline"
            >
              See all →
            </button>
          </div>
          <div className="no-scrollbar -mx-4 flex gap-3 overflow-x-auto px-4 sm:mx-0 sm:grid sm:grid-cols-3 sm:overflow-visible sm:px-0 lg:grid-cols-6">
            {categories.slice(0, 6).map((c) => {
              const active = filter === c.name;
              return (
                <button
                  key={c.id}
                  onClick={() => {
                    setFilter(c.name);
                    resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
                  }}
                  className={`group w-36 shrink-0 overflow-hidden rounded-lg border p-5 text-left transition sm:w-auto ${
                    active
                      ? "border-brand bg-brand-soft"
                      : "border-line bg-paper hover:-translate-y-1 hover:border-ink-faint hover:shadow-lift"
                  }`}
                >
                  <span
                    className={`flex h-10 w-10 items-center justify-center rounded-full font-heading text-base font-extrabold ${
                      active ? "bg-brand text-oncontrast" : "bg-sunken text-ink"
                    }`}
                  >
                    {c.name.charAt(0).toUpperCase()}
                  </span>
                  <p className="mt-4 truncate text-sm font-bold text-ink">{c.name}</p>
                  <p className="mt-0.5 text-xs text-ink-muted">Explore →</p>
                </button>
              );
            })}
          </div>
        </section>
      )}

      {/* ═══ BESTSELLERS ══════════════════════════════════════════════ */}
      {bestsellers && bestsellers.length > 0 && !hasActiveSearch && (
        <section className="page-shell mt-12">
          <div className="mb-5 flex items-end justify-between gap-4">
            <div>
              <p className="eyebrow">Popular right now</p>
              <h2 className="section-title mt-1">Bestsellers</h2>
            </div>
          </div>
          {grid(bestsellers.slice(0, 4))}
        </section>
      )}

      {/* ═══ RESULTS ══════════════════════════════════════════════════ */}
      <section ref={resultsRef} className="page-shell mt-12 scroll-mt-[8rem]">
        <div className="mb-5">
          <p className="eyebrow">Catalog</p>
          <h2 className="section-title mt-1">
            {filter ? filter : searchTerm ? `Results for “${searchTerm}”` : "All products"}
          </h2>
        </div>

        {/* sticky toolbar */}
        <div className="sticky top-[8rem] z-30 mb-6 rounded-lg border border-line bg-paper/95 p-3 backdrop-blur-md">
          <div className="flex flex-wrap items-center gap-2">
            <CommerceSearch
              value={searchValue}
              onChange={handleChangeSearchValue}
              onSubmit={(term) => {
                setSearchValue(term);
                setSearchTerm(term);
              }}
              autoFocusRef={searchInputRef}
              placeholder="Search within the catalog"
              className="min-w-[12rem] flex-1"
            />

            <button onClick={() => setFiltersOpen(true)} className="secondary-button !py-2 lg:hidden">
              <TuneIcon sx={{ fontSize: 17 }} />
              Filters{activeFilters.length ? ` · ${activeFilters.length}` : ""}
            </button>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              aria-label="Sort products"
              className="input-control !h-10 !w-auto min-w-[10rem] cursor-pointer pr-8 font-semibold"
            >
              {SORTS.map((s) => (
                <option key={s.value} value={s.value}>
                  Sort: {s.label}
                </option>
              ))}
            </select>
          </div>

          {activeFilters.length > 0 && (
            <div className="mt-2.5 flex flex-wrap items-center gap-2 border-t border-line pt-2.5">
              <span className="text-xs font-semibold text-ink-muted">
                {products.length} result{products.length === 1 ? "" : "s"}
              </span>
              {activeFilters.map((f) => (
                <button key={f.key} onClick={f.clear} className="chip chip-active">
                  {f.label}
                  <CloseIcon sx={{ fontSize: 13 }} />
                </button>
              ))}
              <button
                onClick={clearAll}
                className="text-xs font-semibold text-ink-soft underline-offset-2 hover:underline"
              >
                Clear all
              </button>
            </div>
          )}
        </div>

        <div className="grid gap-6 lg:grid-cols-[16rem_1fr]">
          <aside className="hidden lg:block">
            <div className="panel sticky top-[14.5rem] max-h-[calc(100vh-16rem)] overflow-y-auto p-5">
              <div className="mb-5 flex items-center justify-between">
                <h3 className="font-heading text-base font-bold">Filters</h3>
                {hasActiveSearch && (
                  <button
                    onClick={clearAll}
                    className="text-xs font-semibold text-brand hover:underline"
                  >
                    Clear
                  </button>
                )}
              </div>
              {FacetPanel}
            </div>
          </aside>

          <div className="min-w-0">
            {showInitialSkeleton ? (
              <div className="product-grid">
                {Array.from({ length: 8 }).map((_, i) => (
                  <ProductViewPlaceholder key={i} />
                ))}
              </div>
            ) : products.length === 0 ? (
              <div className="panel">
                <EmptyState
                  icon={<Inventory2OutlinedIcon fontSize="large" />}
                  title={hasActiveSearch ? "No products found" : "No products yet"}
                  subtitle={
                    hasActiveSearch
                      ? "Try a different search term or loosen the filters."
                      : "Check back soon — the catalog is being stocked."
                  }
                  action={
                    hasActiveSearch ? (
                      <button onClick={clearAll} className="primary-button">
                        Clear filters
                      </button>
                    ) : undefined
                  }
                />
              </div>
            ) : (
              grid(products)
            )}

            {isFetchingNextPage && (
              <div className="product-grid mt-5">
                {Array.from({ length: 4 }).map((_, i) => (
                  <ProductViewPlaceholder key={i} />
                ))}
              </div>
            )}

            {products.length > 0 && (
              <div className="mt-10 flex flex-col items-center gap-2">
                <button
                  ref={ref}
                  onClick={() => fetchNextPage()}
                  disabled={!hasNextPage || isFetchingNextPage}
                  className={hasNextPage ? "dark-button min-w-[12rem]" : "secondary-button min-w-[12rem]"}
                >
                  {isFetchingNextPage
                    ? "Loading more…"
                    : hasNextPage
                    ? "Load more"
                    : "You're all caught up"}
                </button>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* mobile filter drawer */}
      <Drawer
        anchor="bottom"
        open={filtersOpen}
        onClose={() => setFiltersOpen(false)}
        PaperProps={{ className: "!rounded-t-xl2 max-h-[85vh]" }}
      >
        <div className="flex items-center justify-between border-b border-line px-5 py-4">
          <h3 className="font-heading text-base font-bold">Filters</h3>
          <div className="flex items-center gap-3">
            <button onClick={clearAll} className="text-xs font-semibold text-brand">
              Clear all
            </button>
            <button aria-label="Close filters" className="icon-button" onClick={() => setFiltersOpen(false)}>
              <CloseIcon />
            </button>
          </div>
        </div>
        <div className="overflow-y-auto p-5">{FacetPanel}</div>
        <div className="border-t border-line p-4">
          <button onClick={() => setFiltersOpen(false)} className="primary-button w-full">
            Show {products.length} result{products.length === 1 ? "" : "s"}
          </button>
        </div>
      </Drawer>
    </div>
  );
}

export default Products;
