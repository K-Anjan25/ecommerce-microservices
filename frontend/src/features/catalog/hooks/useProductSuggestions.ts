import { useEffect, useState } from "react";
import { ProductApi } from "../../../api/productApi";
import { ProductSearchSuggestion } from "../../../types/product";

/** Debounced suggestions with stale-response protection for every catalog search surface. */
export function useProductSuggestions(query: string) {
  const [suggestions, setSuggestions] = useState<ProductSearchSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const term = query.trim();
    if (term.length < 2) {
      setSuggestions([]);
      setIsLoading(false);
      return;
    }

    let live = true;
    setIsLoading(true);
    const timer = window.setTimeout(() => {
      ProductApi.suggestProducts(term)
        .then((items) => live && setSuggestions(items.slice(0, 6)))
        .catch(() => live && setSuggestions([]))
        .finally(() => live && setIsLoading(false));
    }, 180);

    return () => {
      live = false;
      window.clearTimeout(timer);
    };
  }, [query]);

  return { suggestions, isLoading, clear: () => setSuggestions([]) };
}
