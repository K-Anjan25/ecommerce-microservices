import { useEffect, useId, useRef, useState } from "react";
import SearchIcon from "@mui/icons-material/Search";
import NorthWestIcon from "@mui/icons-material/NorthWest";
import { ProductSearchSuggestion } from "../../../types/product";
import { formatPrice } from "../../../utils/cart";
import { useProductSuggestions } from "../hooks/useProductSuggestions";
import { useI18n } from "../../i18n";

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

/** Shared Concept B search bar: rounded-xl field with inset blue search button. */
export default function CommerceSearch({
  value,
  onChange,
  onSubmit,
  onProductSelect,
  placeholder,
  autoFocusRef,
  className = "",
  prominent = false,
}: Props) {
  const { t } = useI18n();
  const listId = useId();
  const localRef = useRef<HTMLInputElement>(null);
  const { suggestions, isLoading, clear } = useProductSuggestions(value);
  const [active, setActive] = useState(-1);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (suggestions.length > 0 && document.activeElement === localRef.current) {
      setOpen(true);
      setActive(-1);
    }
  }, [suggestions]);

  const inputRef = (node: HTMLInputElement | null) => {
    (localRef as React.MutableRefObject<HTMLInputElement | null>).current = node;
    if (autoFocusRef) (autoFocusRef as React.MutableRefObject<HTMLInputElement | null>).current = node;
  };

  const chooseQuery = (term: string) => {
    if (!term) return;
    onChange(term);
    setOpen(false);
    clear();
    setActive(-1);
    onSubmit(term);
  };

  const chooseProduct = (suggestion: ProductSearchSuggestion) => {
    onChange(suggestion.name);
    setOpen(false);
    clear();
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
      <div className="relative flex items-center">
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
          placeholder={placeholder ?? "Search for products, brands & more..."}
          aria-label="Search Cartly catalog"
          aria-autocomplete="list"
          aria-controls={open ? listId : undefined}
          aria-expanded={open}
          aria-activedescendant={active >= 0 ? `${listId}-${active}` : undefined}
          className={`w-full rounded-xl border border-line bg-paper px-4 pr-14 text-sm text-ink outline-none transition placeholder:text-ink-muted hover:border-brand/40 focus:border-brand focus:ring-2 focus:ring-brand/20 ${
            prominent ? "h-11 text-base" : "h-10 text-sm"
          }`}
        />
        <button
          type="submit"
          aria-label="Search"
          className="absolute right-1 top-1 bottom-1 flex w-10 items-center justify-center rounded-lg bg-brand text-white transition hover:bg-brand-dark"
        >
          <SearchIcon sx={{ fontSize: 20 }} />
        </button>
      </div>

      {open && suggestions.length > 0 && (
        <ul
          id={listId}
          role="listbox"
          className="absolute inset-x-0 top-[calc(100%+0.5rem)] z-[70] overflow-hidden rounded-xl border border-line bg-paper p-2 shadow-pop"
        >
          <li className="px-3 pb-2 pt-1 text-eyebrow font-bold uppercase text-ink-muted">
            {isLoading ? t("common.loading") : t("search.products")}
          </li>
          {suggestions.map((suggestion, index) => (
            <li key={suggestion.id} id={`${listId}-${index}`} role="option" aria-selected={active === index}>
              <button
                type="button"
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => chooseProduct(suggestion)}
                onMouseEnter={() => setActive(index)}
                className={`flex min-h-[3.75rem] w-full items-center gap-3 rounded-lg px-3 py-2 text-left transition ${
                  active === index ? "bg-brand-soft" : "hover:bg-sunken"
                }`}
              >
                <span className="flex h-11 w-14 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-sunken">
                  {suggestion.imageUrl ? (
                    <img src={suggestion.imageUrl} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <SearchIcon sx={{ fontSize: 17 }} className="text-ink-muted" />
                  )}
                </span>
                <span className="min-w-0 flex-1">
                  <span className={`block truncate text-sm font-bold ${active === index ? "text-brand" : "text-ink"}`}>
                    {suggestion.name}
                  </span>
                  <span className="mt-0.5 block truncate text-[0.6875rem] text-ink-muted">
                    {suggestion.brand || "Cartly"} · <span className="text-brand font-medium">in {suggestion.category}</span>
                  </span>
                </span>
                <span className="shrink-0 text-right">
                  <span className="block font-heading text-sm font-extrabold text-ink">
                    {formatPrice(suggestion.unitPrice)}
                  </span>
                  <NorthWestIcon sx={{ fontSize: 13 }} className="mt-1 text-ink-muted" />
                </span>
              </button>
            </li>
          ))}
          <li className="border-t border-line px-3 pb-1 pt-2 text-[0.6875rem] text-ink-muted">
            {t("search.hint")}
          </li>
        </ul>
      )}
    </form>
  );
}
