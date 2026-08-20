import React, { useEffect, useState, useMemo } from "react";
import { useInfiniteQuery } from "react-query";
import { useInView } from "react-intersection-observer";
import { ProductApi } from "../../api/productApi";
import { PRODUCT_PARAM } from "../../constants/product";
import Card from "../../components/Card";
import SearchBar from "../../components/SearchBar";
import { CategoryApi } from "../../api/categoryApi";
import { Category } from "../../types/category";
import ProductViewPlaceholder from "../../components/ProductViewPlaceholder";
import EmptyState from "../../components/EmptyState";
import Inventory2OutlinedIcon from "@mui/icons-material/Inventory2Outlined";
import { useNavigate } from "react-router-dom";
import debounce from "lodash.debounce";
import { Button, Typography } from "@mui/material";

function Products() {
  const navigate = useNavigate();
  const { ref, inView } = useInView();
  const [searchValue, setSearchValue] = useState("");
  const [sortBy, setSortBy] = useState("DATE_DESC");
  const [filter, setFilter] = useState("");
  const [categories, setCategories] = useState<Category[]>([]);

  const [searchTerm, setSearchTerm] = useState("");

  const { data, isFetching, isFetchingNextPage, fetchNextPage, hasNextPage } =
    useInfiniteQuery(
      ["projects", searchTerm, sortBy, filter],
      ({ pageParam = 0 }) =>
        ProductApi.getProducts({
          ...PRODUCT_PARAM,
          page: pageParam,
          searchTerm: searchTerm,
          sort: sortBy,
          filter: filter,
        }),
      {
        getNextPageParam: (lastGroup, allGroups) => {
          const morePageExist = lastGroup?.length === PRODUCT_PARAM.size;
          if (!morePageExist) return;
          return allGroups?.length;
        },
      }
    );

  const products = data?.pages.flatMap((page) => page) ?? [];
  const showInitialSkeleton = isFetching && !isFetchingNextPage && products.length === 0;

  useEffect(() => {
    if (inView) {
      fetchNextPage();
    }
  }, [inView, fetchNextPage]);

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

  const hasActiveSearch = Boolean(searchTerm || filter);

  return (
    <div className="space-y-8">
      <div className="page-header">
        <Typography variant="h3" component="h1" className="page-title">
          Shop products
        </Typography>
        <Typography className="page-subtitle">
          Browse the catalog, search with fuzzy matching, and add to your cart.
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
        />
      </div>

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
                ? "Try a different search term or clear the category filter."
                : "Check back soon — the catalog is being stocked."
            }
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {products.map((product) => (
            <Card
              key={product.id}
              product={product}
              onClick={() => navigate(`products/${product.id}`)}
            />
          ))}
        </div>
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
  );
}

export default Products;
