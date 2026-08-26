import { useQuery, useQueryClient } from "react-query";
import { ProductApi } from "../../../api/productApi";
import { ProductSearchSuggestion } from "../../../types/product";

const MIN_QUERY_LENGTH = 2;

/**
 * Debounced suggestions shared through the react-query cache.
 *
 * Several CommerceSearch instances are mounted at once (desktop header +
 * mobile drawer share the navbar value), so requests are deduplicated and
 * cached per term instead of every keystroke firing one request per input.
 */
export function useProductSuggestions(query: string) {
  const queryClient = useQueryClient();
  const term = query.trim();
  const enabled = term.length >= MIN_QUERY_LENGTH;

  const { data, isFetching } = useQuery<ProductSearchSuggestion[]>(
    ["product-suggestions", term],
    () => ProductApi.suggestProducts(term),
    { enabled, staleTime: 30_000, retry: false }
  );

  return {
    suggestions: enabled ? data ?? [] : [],
    isLoading: enabled && isFetching,
    clear: () => queryClient.removeQueries(["product-suggestions", term], { exact: true }),
  };
}
