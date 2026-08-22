import React, { useEffect, useState, useMemo } from "react";
import { useInfiniteQuery, useQuery } from "react-query";
import { useInView } from "react-intersection-observer";
import { useLocation, useNavigate } from "react-router-dom";
import { ProductApi } from "../../api/productApi";
import { PRODUCT_PARAM } from "../../constants/product";
import Card from "../../components/Card";
import SearchBar from "../../components/SearchBar";
import { CategoryApi } from "../../api/categoryApi";
import { Category } from "../../types/category";
import ProductViewPlaceholder from "../../components/ProductViewPlaceholder";
import EmptyState from "../../components/EmptyState";
import Inventory2OutlinedIcon from "@mui/icons-material/Inventory2Outlined";
import debounce from "lodash.debounce";
import { Button, Typography, Checkbox, FormControlLabel, TextField, Divider } from "@mui/material";

function Products() {
  const navigate = useNavigate();
  const location = useLocation();
  const { ref, inView } = useInView();
  const [searchValue, setSearchValue] = useState("");
  const [sortBy, setSortBy] = useState("DATE_DESC");
  const [filter, setFilter] = useState("");
  const [categories, setCategories] = useState<Category[]>([]);

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [minPrice, setMinPrice] = useState<string>("");
  const [maxPrice, setMaxPrice] = useState<string>("");
  const [minRating, setMinRating] = useState<string>("");

  const [searchSuggestions, setSearchSuggestions] = useState<string[]>([]);

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
    if (inView) {
      fetchNextPage();
    }
  }, [inView, fetchNextPage]);

  // Global navbar search: navigating home with { state: { search } } seeds the
  // catalog search (each navigation creates a new location entry).
  useEffect(() => {
    const navSearch = (location.state as { search?: string } | null)?.search;
    if (typeof navSearch === "string" && navSearch.trim()) {
      setSearchValue(navSearch);
      setSearchTerm(navSearch);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.key]);

  useEffect(() => {
    getAllCategories();
  }, []);

  const delayedSearchTerm = useMemo(
    () => debounce((q) => setSearchTerm(q), 500),
    [setSearchTerm]
  );

  const handleChangeSearchValue = (value: string) => {
    setSearchValue(value);
    delayedSearchTerm(value);
  };

  const getAllCategories = async () => {
    const categories = await CategoryApi.getCategories();
    setCategories(categories);
  };

  const { data: bestsellers } = useQuery(
    "bestsellers",
    ProductApi.getBestsellers,
    {
      enabled: !searchTerm && !filter && selectedBrands.length === 0 && !minPrice && !maxPrice && !minRating,
    }
  );

  const hasActiveSearch = Boolean(
    searchTerm || filter || selectedBrands.length || minPrice || maxPrice || minRating
  );

  const clearFacets = () => {
    setSelectedBrands([]);
    setMinPrice("");
    setMaxPrice("");
    setMinRating("");
  };

  const toggleBrand = (brand: string) => {
    setSelectedBrands((prev) =>
      prev.includes(brand) ? prev.filter((b) => b !== brand) : [...prev, brand]
    );
  };

  return (
    <div className="space-y-8">
      <div className="page-header">
        <Typography variant="h3" component="h1" className="page-title">
          Shop products
        </Typography>
        <Typography className="page-subtitle">
          Browse the catalog, filter by brand or price, and add to your cart.
        </Typography>
      </div>

      <div className="panel p-4 sm:p-6">
        <SearchBar
          onChangeSearchValue={handleChangeSearchValue}
          searchValue={searchValue}
          filter={filter}
          onChangeFilter={setFilter}
          sortBy={sortBy}
          onChangeSortBy={setSortBy}
          categories={categories}
          onSuggest={(term) => {
            if (!term) {
              setSearchSuggestions([]);
              return;
            }
            ProductApi.suggestProducts(term).then(setSearchSuggestions).catch(() => setSearchSuggestions([]));
          }}
          suggestions={searchSuggestions}
          onPickSuggestion={(s) => {
            setSearchValue(s);
            setSearchTerm(s);
            setSearchSuggestions([]);
          }}
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[260px_1fr]">
        <aside className="panel h-fit space-y-6 p-4 sm:p-6">
          <div className="flex items-center justify-between">
            <Typography variant="h6" className="font-bold">
              Filters
            </Typography>
            {hasActiveSearch && (
              <Button size="small" onClick={clearFacets}>
                Clear
              </Button>
            )}
          </div>

          <div>
            <Typography variant="subtitle2" className="mb-2 font-semibold">
              Brand
            </Typography>
            <div className="space-y-1">
              {facets?.brands?.length ? (
                facets.brands.map((b) => (
                  <FormControlLabel
                    key={b.value}
                    control={
                      <Checkbox
                        size="small"
                        checked={selectedBrands.includes(b.value)}
                        onChange={() => toggleBrand(b.value)}
                      />
                    }
                    label={`${b.value} (${b.count})`}
                  />
                ))
              ) : (
                <Typography variant="body2" className="text-ink-soft">
                  No brands yet
                </Typography>
              )}
            </div>
          </div>

          <div>
            <Typography variant="subtitle2" className="mb-2 font-semibold">
              Price range
            </Typography>
            <div className="flex items-center gap-2">
              <TextField
                label="Min"
                type="number"
                size="small"
                value={minPrice}
                onChange={(e) => setMinPrice(e.target.value)}
              />
              <TextField
                label="Max"
                type="number"
                size="small"
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
              />
            </div>
            {facets?.priceMin != null && (
              <Typography variant="caption" className="text-ink-soft">
                {`Catalog range: ${facets.priceMin} – ${facets.priceMax}`}
              </Typography>
            )}
          </div>

          <div>
            <Typography variant="subtitle2" className="mb-2 font-semibold">
              Customer rating
            </Typography>
            <select
              className="input-control"
              value={minRating}
              onChange={(e) => setMinRating(e.target.value)}
            >
              <option value="">Any rating</option>
              <option value="3">3★ &amp; up</option>
              <option value="4">4★ &amp; up</option>
            </select>
          </div>
        </aside>

        <div>
          {showInitialSkeleton ? (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <ProductViewPlaceholder key={i} />
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="panel">
              <EmptyState
                icon={<Inventory2OutlinedIcon fontSize="large" />}
                title={
                  hasActiveSearch ? "No products found" : "No products yet"
                }
                subtitle={
                  hasActiveSearch
                    ? "Try a different search term or clear the filters."
                    : "Check back soon — the catalog is being stocked."
                }
              />
            </div>
          ) : (
            <>
              {bestsellers && bestsellers.length > 0 && !hasActiveSearch && (
                <div className="mb-8">
                  <Typography variant="h5" className="mb-4 font-bold">
                    Bestsellers
                  </Typography>
                  <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                    {bestsellers.map((product) => (
                      <Card
                        key={product.id}
                        product={product}
                        onClick={() => navigate(`products/${product.id}`)}
                      />
                    ))}
                  </div>
                  <Divider className="my-8" />
                </div>
              )}
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                {products.map((product) => (
                  <Card
                    key={product.id}
                    product={product}
                    onClick={() => navigate(`products/${product.id}`)}
                  />
                ))}
              </div>
            </>
          )}

          {isFetchingNextPage && (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <ProductViewPlaceholder key={i} />
              ))}
            </div>
          )}

          {products.length > 0 && (
            <div className="mt-8 flex justify-center pb-4">
              <Button
                ref={ref}
                onClick={() => fetchNextPage()}
                disabled={!hasNextPage || isFetchingNextPage}
                variant={hasNextPage ? "contained" : "outlined"}
                className="min-w-[200px] !bg-brand !text-paper hover:!bg-brand-main"
              >
                {isFetchingNextPage
                  ? "Loading more..."
                  : hasNextPage
                  ? "Load more"
                  : "You're all caught up"}
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Products;
