import { useEffect, useId, useRef, useState } from "react";
import SearchIcon from "@mui/icons-material/Search";
import NorthWestIcon from "@mui/icons-material/NorthWest";
import { ProductApi } from "../../api/productApi";
import { ProductSearchSuggestion } from "../../types/product";
import { formatPrice } from "../../utils/cart";

type Props = {
  value: string;
  onChange: (value: string) => void;
  onSubmit: (value: string) => void;
  onProductSelect?: (suggestion: ProductSearchSuggestion) => void;
  placeholder?: string;
  autoFocusRef?: React.RefObject<HTMLInputElement>;
  className?: string;
  prominent?: boolean;
};

/** Shared, accessible product-finding control used by both shell and catalog. */
export default function CommerceSearch({
  value,
  onChange,
  onSubmit,
  onProductSelect,
  placeholder = "Search products, brands and categories",
  autoFocusRef,
  className = "",
  prominent = false,
}: Props) {
  const listId = useId();
  const localRef = useRef<HTMLInputElement>(null);
  const [suggestions, setSuggestions] = useState<ProductSearchSuggestion[]>([]);
  const [active, setActive] = useState(-1);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const term = value.trim();
    if (term.length < 2) {
      setSuggestions([]);
      setOpen(false);
      return;
    }
    let live = true;
    const timer = window.setTimeout(() => {
      ProductApi.suggestProducts(term)
        .then((items) => {
          if (!live) return;
          setSuggestions(items.slice(0, 6));
          setOpen(items.length > 0);
          setActive(-1);
        })
        .catch(() => live && setSuggestions([]));
    }, 180);
    return () => {
      live = false;
      window.clearTimeout(timer);
    };
  }, [value]);

  const inputRef = (node: HTMLInputElement | null) => {
    (localRef as React.MutableRefObject<HTMLInputElement | null>).current = node;
    if (autoFocusRef) (autoFocusRef as React.MutableRefObject<HTMLInputElement | null>).current = node;
  };

  const chooseQuery = (term: string) => {
    if (!term) return;
    onChange(term);
    setOpen(false);
    setActive(-1);
    onSubmit(term);
  };

  const chooseProduct = (suggestion: ProductSearchSuggestion) => {
    onChange(suggestion.name);
    setOpen(false);
    setActive(-1);
    if (onProductSelect) onProductSelect(suggestion);
    else onSubmit(suggestion.name);
  };

  return (
    <form
      role="search"
      className={`relative ${className}`}
      onSubmit={(event) => {
        event.preventDefault();
        if (active >= 0) chooseProduct(suggestions[active]);
        else chooseQuery(value.trim());
      }}
    >
      <SearchIcon
        className="pointer-events-none absolute left-4 top-1/2 z-10 -translate-y-1/2 text-ink-muted"
        sx={{ fontSize: prominent ? 21 : 19 }}
      />
      <input
        ref={inputRef}
        type="search"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onFocus={() => suggestions.length && setOpen(true)}
        onBlur={() => window.setTimeout(() => setOpen(false), 120)}
        onKeyDown={(event) => {
          if (!open || suggestions.length === 0) return;
          if (event.key === "ArrowDown") {
            event.preventDefault();
            setActive((i) => (i + 1) % suggestions.length);
          } else if (event.key === "ArrowUp") {
            event.preventDefault();
            setActive((i) => (i <= 0 ? suggestions.length - 1 : i - 1));
          } else if (event.key === "Escape") {
            setOpen(false);
            setActive(-1);
          }
        }}
        placeholder={placeholder}
        aria-label="Search Cartly catalog"
        aria-autocomplete="list"
        aria-controls={open ? listId : undefined}
        aria-expanded={open}
        aria-activedescendant={active >= 0 ? `${listId}-${active}` : undefined}
        className={`w-full border bg-canvas pl-12 pr-24 text-ink outline-none transition placeholder:text-ink-muted hover:border-ink-faint focus:border-brand focus:bg-paper focus:ring-4 focus:ring-brand/10 ${
          prominent ? "h-12 rounded-lg border-line text-[0.9375rem] shadow-xs" : "h-10 rounded-full border-line text-sm"
        }`}
      />
      <button
        type="submit"
        disabled={!value.trim()}
        className={`absolute right-1.5 top-1/2 -translate-y-1/2 rounded-full bg-contrast font-bold text-oncontrast transition hover:bg-brand disabled:opacity-40 ${
          prominent ? "h-9 px-4 text-xs" : "h-7 px-3 text-[0.6875rem]"
        }`}
      >
        Search
      </button>

      {open && suggestions.length > 0 && (
        <ul
          id={listId}
          role="listbox"
          className="absolute inset-x-0 top-[calc(100%+0.5rem)] z-[70] overflow-hidden rounded-lg border border-line bg-paper p-2 shadow-pop"
        >
          <li className="px-3 pb-2 pt-1 text-eyebrow font-bold uppercase text-ink-muted">
            Suggested searches
          </li>
          {suggestions.map((suggestion, index) => (
            <li key={suggestion.id} id={`${listId}-${index}`} role="option" aria-selected={active === index}>
              <button
                type="button"
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => chooseProduct(suggestion)}
                onMouseEnter={() => setActive(index)}
                className={`flex min-h-[3.75rem] w-full items-center gap-3 rounded-sm px-3 py-2 text-left transition ${
                  active === index ? "bg-brand-soft" : "hover:bg-sunken"
                }`}
              >
                <span className="flex h-11 w-14 shrink-0 items-center justify-center overflow-hidden rounded-xs bg-sunken">
                  {suggestion.imageUrl ? (
                    <img src={suggestion.imageUrl} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <SearchIcon sx={{ fontSize: 17 }} className="text-ink-muted" />
                  )}
                </span>
                <span className="min-w-0 flex-1">
                  <span className={`block truncate text-sm font-semibold ${active === index ? "text-brand" : "text-ink"}`}>
                    {suggestion.name}
                  </span>
                  <span className="mt-0.5 block truncate text-[0.6875rem] text-ink-muted">
                    {suggestion.brand || "Cartly"} · <span className="text-brand">in {suggestion.category}</span>
                  </span>
                </span>
                <span className="shrink-0 text-right">
                  <span className="block font-heading text-sm font-bold text-ink">
                    {formatPrice(suggestion.unitPrice)}
                  </span>
                  <NorthWestIcon sx={{ fontSize: 13 }} className="mt-1 text-ink-muted" />
                </span>
              </button>
            </li>
          ))}
          <li className="border-t border-line px-3 pb-1 pt-2 text-[0.6875rem] text-ink-muted">
            Use ↑ ↓ to browse · Enter to search · Esc to close
          </li>
        </ul>
      )}
    </form>
  );
}
