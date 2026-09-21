import React, { useEffect, useMemo, useState, useRef } from "react";
import { useInfiniteQuery, useQuery } from "react-query";
import { useInView } from "react-intersection-observer";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { currentOrigin } from "../../utils/origin";
import { Drawer, Checkbox, FormControlLabel, Rating, FormControl, Select, MenuItem } from "@mui/material";
import Inventory2OutlinedIcon from "@mui/icons-material/Inventory2Outlined";
import CloseIcon from "@mui/icons-material/Close";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";

import { ProductApi } from "../../api/productApi";
import { CategoryApi } from "../../api/categoryApi";
import { PRODUCT_PARAM } from "../../constants/product";
import { Category } from "../../types/category";
import Card from "../../components/Card";
import NumberStepperInput from "../../components/NumberStepperInput";
import ProductViewPlaceholder from "../../components/ProductViewPlaceholder";
import EmptyState from "../../components/EmptyState";
import { useStoreSettings } from "../../features/storefront";
import { useI18n } from "../../features/i18n";
import usePageMetadata from "../../hooks/usePageMetadata";

const SORTS = [
  { value: "DATE_DESC", label: "Newest" },
  { value: "DATE_ASC", label: "Oldest" },
  { value: "PRICE_ASC", label: "Price: low → high" },
  { value: "PRICE_DESC", label: "Price: high → low" },
];

/** Concept B category tiles — names match real store categories so filters work. */
const CONCEPT_B_CATEGORIES = [
  {
    name: "Electronics",
    subtitle: "MacBook",
    image: "/images/store/tile-electronics.jpg",
  },
  {
    name: "Fashion",
    subtitle: "Apparel",
    image: "/images/store/tile-fashion.jpg",
  },
  {
    name: "Home",
    subtitle: "Decor",
    image: "/images/store/tile-home.jpg",
  },
  {
    name: "Electronics",
    subtitle: "Audio",
    image: "/images/store/demo-speaker.jpg",
  },
  {
    name: "Beauty",
    subtitle: "Skincare",
    image: "/images/store/tile-beauty.jpg",
  },
  {
    name: "Kitchen",
    subtitle: "Appliances",
    image: "/images/store/tile-kitchen.jpg",
  },
  {
    name: "Toys & Games",
    subtitle: "Bricks & play",
    image: "/images/store/tile-toys.jpg",
  },
  {
    name: "Sports",
    subtitle: "Gear",
    image: "/images/store/tile-sports.jpg",
  },
  {
    name: "Grocery",
    subtitle: "Fresh produce",
    image: "/images/store/tile-grocery.jpg",
  },
];

function Products() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const { t } = useI18n();
  const { ref, inView } = useInView();
  const resultsRef = useRef<HTMLDivElement>(null);

  const [sortBy, setSortByState] = useState(() => {
    const sp =
      typeof window !== "undefined"
        ? new URLSearchParams(window.location.search).get("sort")
        : null;
    return SORTS.some((s) => s.value === sp) ? (sp as string) : "DATE_DESC";
  });
  const setSortBy = (value: string) => {
    setSortByState(value);
    const next = new URLSearchParams(searchParams);
    if (value === "DATE_DESC") next.delete("sort");
    else next.set("sort", value);
    setSearchParams(next, { replace: true });
  };
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

  useEffect(() => {
    const state = location.state as
      | { search?: string; category?: string; focusSearch?: boolean }
      | null;
    const q = searchParams.get("q");
    const categoryParam = searchParams.get("category");

    const nextSort = searchParams.get("sort");
    if (nextSort && SORTS.some((s) => s.value === nextSort)) {
      setSortByState(nextSort);
    }

    const nextSearch = q && q.trim() ? q : state?.search;
    if (typeof nextSearch === "string" && nextSearch.trim()) {
      setSearchTerm(nextSearch.trim());
      resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
    const nextCategory = categoryParam ?? state?.category;
    if (typeof nextCategory === "string" && nextCategory.trim()) {
      setFilter(nextCategory);
      resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [location.key, searchParams]);

  const applyCategory = (name: string) => {
    setFilter(name);
    const next = new URLSearchParams(searchParams);
    if (name) next.set("category", name);
    else next.delete("category");
    setSearchParams(next, { replace: true });
  };

  const applySearchTerm = (term: string) => {
    setSearchTerm(term);
    const next = new URLSearchParams(searchParams);
    if (term) next.set("q", term);
    else next.delete("q");
    setSearchParams(next, { replace: true });
  };

  useEffect(() => {
    CategoryApi.getCategories().then(setCategories).catch(() => setCategories([]));
  }, []);

  const { settings: storeSettings } = useStoreSettings();
  const homeMetadata = useMemo(
    () => ({
      title: "Cartly — One modern multi-category marketplace",
      description: "High quality products across electronics, fashion, home, and more.",
      canonicalPath: "/",
      image: "/images/store/hero-gadgets.jpg",
      jsonLd: {
        "@context": "https://schema.org",
        "@type": "WebSite",
        name: "Cartly",
        url: currentOrigin(),
        description: "One modern multi-category marketplace",
      },
    }),
    []
  );
  usePageMetadata(homeMetadata);

  const { data: bestsellers } = useQuery("bestsellers", ProductApi.getBestsellers);

  const activeFilters = [
    filter && { key: "category", label: filter, clear: () => applyCategory("") },
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
      clear: () => applySearchTerm(""),
    },
  ].filter(Boolean) as { key: string; label: string; clear: () => void }[];

  const hasActiveSearch = activeFilters.length > 0;

  const clearAll = () => {
    setSelectedBrands([]);
    setMinPrice("");
    setMaxPrice("");
    setMinRating("");
    applyCategory("");
    applySearchTerm("");
  };

  const toggleBrand = (brand: string) =>
    setSelectedBrands((prev) =>
      prev.includes(brand) ? prev.filter((b) => b !== brand) : [...prev, brand]
    );

  const FacetPanel = (
    <div className="space-y-6">
      <section>
        <p className="eyebrow mb-2">Sort by</p>
        <FormControl fullWidth size="small" variant="outlined">
          <Select
            value={sortBy}
            onChange={(event) => setSortBy(event.target.value as string)}
            aria-label="Sort products"
            displayEmpty
            size="small"
          >
            {SORTS.map((option) => (
              <MenuItem key={option.value} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </section>

      <section>
        <p className="eyebrow mb-3">Category</p>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => applyCategory("")}
            className={`chip ${!filter ? "chip-active" : ""}`}
          >
            All
          </button>
          {categories.map((c) => (
            <button
              key={c.id}
              onClick={() => applyCategory(c.name)}
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
          <div className="max-h-52 space-y-0.5 overflow-y-auto pr-1">
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
        <div className="mb-3 flex items-center justify-between">
          <p className="eyebrow !mb-0">Price</p>
          {(minPrice || maxPrice) && (
            <button
              type="button"
              onClick={() => {
                setMinPrice("");
                setMaxPrice("");
              }}
              className="text-xs font-semibold text-brand hover:underline"
            >
              Reset
            </button>
          )}
        </div>
        <div className="grid grid-cols-2 gap-2">
          <NumberStepperInput
            label="Min"
            value={minPrice}
            onChange={setMinPrice}
            step={100}
            min={0}
            placeholder="0"
          />
          <NumberStepperInput
            label="Max"
            value={maxPrice}
            onChange={setMaxPrice}
            step={100}
            min={0}
            placeholder="Any"
          />
        </div>
      </section>

      <section>
        <p className="eyebrow mb-2">Rating</p>
        <div className="space-y-1">
          {["", "3", "4"].map((r) => (
            <button
              key={r || "any"}
              onClick={() => setMinRating(r)}
              className={`flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-sm transition ${
                minRating === r ? "bg-brand-soft text-brand font-bold" : "text-ink-soft hover:bg-sunken"
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

  return (
    <div className="space-y-10 pb-12">
      {/* ═══ CONCEPT B HERO & SHOWCASE GRID ════════════════════════════════ */}
      <section className="page-shell">
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-5">
          {/* Main Hero Card (span 2 cols) — headline left, product cluster right */}
          <div className="relative overflow-hidden rounded-2xl bg-paper p-7 sm:p-10 shadow-sm border border-line lg:col-span-2 xl:col-span-2">
            <div className="grid h-full items-center gap-6 sm:grid-cols-[1.1fr_0.9fr]">
              <div>
                {storeSettings.heroEyebrow && (
                  <p className="eyebrow !text-accent mb-2">{storeSettings.heroEyebrow}</p>
                )}
                <h1 className="font-heading text-3xl sm:text-5xl font-black tracking-tight text-ink leading-tight">
                  {storeSettings.heroTitle || "EXPLORE. SHOP."}
                </h1>
                <p className="mt-3 max-w-sm text-xs sm:text-sm font-medium text-ink-soft leading-relaxed">
                  {storeSettings.heroDescription ||
                    "One modern multi-category marketplace for high quality tech, home & everyday essentials."}
                </p>
                <div className="mt-6">
                  <button
                    onClick={() => resultsRef.current?.scrollIntoView({ behavior: "smooth" })}
                    className="rounded-full bg-brand px-6 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-brand-dark"
                  >
                    {storeSettings.primaryCtaLabel || "Shop Now"}
                  </button>
                </div>
              </div>
              <img
                src="/images/store/hero-gadgets.jpg"
                alt="Headphones, smart speaker and blender"
                className="hidden w-full self-center rounded-xl object-contain sm:block"
                loading="eager"
              />
            </div>
          </div>

          {/* Feature tiles: Electronics · Fashion · Home */}
          {[
            { name: "Electronics", subtitle: "MacBook", image: "/images/store/tile-electronics.jpg", alt: "Laptop with headphones" },
            { name: "Fashion", subtitle: "Apparel", image: "/images/store/tile-fashion.jpg", alt: "Rack of apparel" },
            { name: "Home", subtitle: "Decor", image: "/images/store/tile-home.jpg", alt: "Lamp and vase" },
          ].map((tile) => (
            <div
              key={tile.name}
              className="relative flex flex-col justify-between overflow-hidden rounded-2xl bg-paper p-6 shadow-sm border border-line"
            >
              <div>
                <h3 className="font-heading text-base font-bold text-ink">{tile.name}</h3>
                <p className="text-xs text-ink-muted">{tile.subtitle}</p>
              </div>
              <div className="my-4 flex h-28 items-center justify-center overflow-hidden rounded-lg">
                <img
                  src={tile.image}
                  alt={tile.alt}
                  loading="lazy"
                  className="h-full w-full object-cover"
                />
              </div>
              <button
                onClick={() => {
                  applyCategory(tile.name);
                  resultsRef.current?.scrollIntoView({ behavior: "smooth" });
                }}
                className="text-xs font-bold text-ink underline underline-offset-2 transition hover:text-brand text-left"
              >
                Shop →
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* ═══ CONCEPT B CATEGORY TILES — second row of six, per the concept ═══ */}
      <section className="page-shell">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-5">
          {CONCEPT_B_CATEGORIES.slice(3, 9).map((cat) => (
            <div
              key={`${cat.name}-${cat.subtitle}`}
              className="flex flex-col justify-between rounded-2xl bg-paper p-5 border border-line shadow-sm hover:shadow-md transition"
            >
              <div>
                <h4 className="font-heading text-sm font-bold text-ink">{cat.name}</h4>
                <p className="text-[11px] text-ink-muted">{cat.subtitle}</p>
              </div>
              <div className="my-4 flex h-24 items-center justify-center overflow-hidden rounded-lg">
                <img
                  src={cat.image}
                  alt={cat.name}
                  loading="lazy"
                  className="h-full w-full object-cover"
                />
              </div>
              <button
                onClick={() => {
                  applyCategory(cat.name);
                  resultsRef.current?.scrollIntoView({ behavior: "smooth" });
                }}
                className="text-xs font-bold text-ink underline underline-offset-2 transition hover:text-brand text-left"
              >
                Shop →
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* ═══ TRENDING THIS WEEK (Concept B Product Grid) ═══════════════════ */}
      <section className="page-shell">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="font-heading text-xl sm:text-2xl font-black tracking-tight text-ink">
            Trending This Week
          </h2>
          <button
            onClick={() => resultsRef.current?.scrollIntoView({ behavior: "smooth" })}
            className="text-xs font-bold text-brand hover:underline"
          >
            See all →
          </button>
        </div>

        {/* Carousel / horizontal cards or 5-col grid */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-5 sm:gap-6">
          {(bestsellers && bestsellers.length > 0 ? bestsellers.slice(0, 5) : products.slice(0, 5)).map(
            (product) => (
              <Card
                key={`trending-${product.id}`}
                product={product}
                onClick={() => navigate(`/products/${product.id}`)}
              />
            )
          )}
        </div>
      </section>

      {/* ═══ MAIN CATALOG / RESULTS ═══════════════════════════════════════ */}
      <section ref={resultsRef} className="page-shell pt-4 scroll-mt-24">
        <div className="mb-6 flex items-center justify-between border-b border-line pb-4">
          <div>
            <h2 className="font-heading text-xl sm:text-2xl font-bold tracking-tight text-ink">
              {filter ? filter : searchTerm ? `Results for “${searchTerm}”` : "All Products"}
            </h2>
            <p className="text-xs text-ink-muted mt-0.5">
              Showing {products.length} item{products.length === 1 ? "" : "s"}
            </p>
          </div>
          <button
            onClick={() => setFiltersOpen(true)}
            className="rounded-full border border-line bg-paper px-4 py-1.5 text-xs font-bold text-ink lg:hidden"
          >
            Filters {activeFilters.length ? `(${activeFilters.length})` : ""}
          </button>
        </div>

        {activeFilters.length > 0 && (
          <div className="mb-6 flex flex-wrap items-center gap-2">
            {activeFilters.map((item) => (
              <button key={item.key} onClick={item.clear} className="chip chip-active">
                {item.label} <CloseIcon sx={{ fontSize: 13 }} />
              </button>
            ))}
            <button onClick={clearAll} className="text-xs text-ink-muted underline font-medium">
              Clear all
            </button>
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-[16rem_1fr]">
          {/* Facets desktop */}
          <aside className="hidden lg:block">
            <div className="sticky top-28 rounded-2xl border border-line bg-paper p-5 shadow-sm">
              <div className="mb-6 flex items-center justify-between border-b border-line pb-3">
                <h3 className="font-heading text-base font-bold text-ink">Filters</h3>
                {hasActiveSearch && (
                  <button onClick={clearAll} className="text-xs font-bold text-brand hover:underline">
                    Clear
                  </button>
                )}
              </div>
              {FacetPanel}
            </div>
          </aside>

          {/* Results grid */}
          <div className="min-w-0">
            {showInitialSkeleton ? (
              <div className="product-grid">
                {Array.from({ length: 8 }).map((_, i) => (
                  <ProductViewPlaceholder key={i} />
                ))}
              </div>
            ) : products.length === 0 ? (
              <div className="panel p-8">
                <EmptyState
                  icon={<Inventory2OutlinedIcon fontSize="large" />}
                  title={hasActiveSearch ? "No products found" : "No products yet"}
                  subtitle={
                    hasActiveSearch
                      ? "Try searching for another term or clearing the active filters."
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
              <div className="product-grid">
                {products.map((product) => (
                  <Card
                    key={product.id}
                    product={product}
                    onClick={() => navigate(`/products/${product.id}`)}
                  />
                ))}
              </div>
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
                  className={
                    hasNextPage
                      ? "primary-button min-w-[12rem]"
                      : "secondary-button min-w-[12rem]"
                  }
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

      {/* Mobile filter drawer */}
      <Drawer
        anchor="bottom"
        open={filtersOpen}
        onClose={() => setFiltersOpen(false)}
        PaperProps={{ className: "!rounded-t-2xl max-h-[85vh] p-5 !bg-paper" }}
      >
        <div className="mb-6 flex items-center justify-between border-b border-line pb-3">
          <h3 className="font-heading text-lg font-bold">Filters</h3>
          <button onClick={() => setFiltersOpen(false)} className="icon-button">
            <CloseIcon />
          </button>
        </div>
        <div className="overflow-y-auto pb-6">{FacetPanel}</div>
        <div className="pt-3 border-t border-line">
          <button onClick={() => setFiltersOpen(false)} className="primary-button w-full">
            Show results
          </button>
        </div>
      </Drawer>
    </div>
  );
}

export default Products;
