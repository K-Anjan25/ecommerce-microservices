import { useEffect, useId, useRef, useState } from "react";
import SearchIcon from "@mui/icons-material/Search";
import NorthWestIcon from "@mui/icons-material/NorthWest";
import { ProductApi } from "../../api/productApi";

type Props = {
  value: string;
  onChange: (value: string) => void;
  onSubmit: (value: string) => void;
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
  placeholder = "Search products, brands and categories",
  autoFocusRef,
  className = "",
  prominent = false,
}: Props) {
  const listId = useId();
  const localRef = useRef<HTMLInputElement>(null);
  const [suggestions, setSuggestions] = useState<string[]>([]);
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

  const choose = (term: string) => {
    onChange(term);
    setOpen(false);
    setActive(-1);
    onSubmit(term);
  };

  return (
    <form
      role="search"
      className={`relative ${className}`}
      onSubmit={(event) => {
        event.preventDefault();
        choose(active >= 0 ? suggestions[active] : value.trim());
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
            <li key={suggestion} id={`${listId}-${index}`} role="option" aria-selected={active === index}>
              <button
                type="button"
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => choose(suggestion)}
                onMouseEnter={() => setActive(index)}
                className={`flex min-h-11 w-full items-center justify-between rounded-sm px-3 text-left text-sm transition ${
                  active === index ? "bg-brand-soft text-brand" : "text-ink hover:bg-sunken"
                }`}
              >
                <span className="flex items-center gap-3">
                  <SearchIcon sx={{ fontSize: 16 }} className="text-ink-muted" />
                  {suggestion}
                </span>
                <NorthWestIcon sx={{ fontSize: 14 }} className="text-ink-muted" />
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
