import { QueryClient } from "react-query";
import { ProductApi } from "../api/productApi";
import { PRODUCT_PARAM } from "../constants/product";

/** Backend hiccups must cap TTFB, not eliminate the response. */
const PREFETCH_TIMEOUT_MS = 1500;

/**
 * Fetch the public payload for a URL into the query cache before SSR render.
 *
 * Keys mirror the ones the pages use, so the client hydrates the same cache
 * entries instead of refetching with an empty skeleton (react-query still
 * refetches in the background per its staleTime policy).
 */
export async function prefetchForPath(url: string, queryClient: QueryClient): Promise<void> {
  const { pathname, searchParams } = new URL(url, "http://ssr.local");
  const jobs: Promise<unknown>[] = [];
  const q = (searchParams.get("q") ?? "").trim();
  const category = searchParams.get("category") ?? "";

  if (pathname === "/" || pathname === "/products") {
    jobs.push(queryClient.prefetchQuery("bestsellers", ProductApi.getBestsellers));
    if (!q && !category) {
      // Default catalog grid (page 0) — same key/fetch as the Products page.
      jobs.push(
        queryClient.fetchInfiniteQuery(
          ["projects", "", "DATE_DESC", "", [] as string[], "", "", ""],
          ({ pageParam = 0 }) =>
            ProductApi.getProducts({
              ...PRODUCT_PARAM,
              page: pageParam,
              searchTerm: "",
              sort: "DATE_DESC",
              filter: "",
              brand: "",
              minPrice: 0,
              maxPrice: 0,
              minRating: 0,
            })
        )
      );
    }
  }

  const match = pathname.match(/^\/products\/([^/]+)\/?$/);
  if (match) {
    const id = decodeURIComponent(match[1]);
    jobs.push(
      queryClient.prefetchQuery(["products:product", id], () => ProductApi.getProductById(id))
    );
  }

  if (jobs.length === 0) return;
  await Promise.race([
    Promise.allSettled(jobs),
    new Promise((resolve) => setTimeout(resolve, PREFETCH_TIMEOUT_MS)),
  ]);
}
