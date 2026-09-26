import React from "react";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import CheckIcon from "@mui/icons-material/Check";

export interface StyledSelectOption {
  value: string;
  label: string;
}

interface StyledSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: StyledSelectOption[];
  ariaLabel: string;
  className?: string;
  /** Compact chip look (subscription rows) vs fuller form control. */
  size?: "sm" | "md";
}

/**
 * Design-system dropdown — replaces raw <select> elements whose option lists
 * render as unstyled OS menus. Button + listbox popover with the same chip /
 * panel tokens as the rest of the storefront; closes on outside click or Esc.
 */
function StyledSelect({
  value,
  onChange,
  options,
  ariaLabel,
  className = "",
  size = "sm",
}: StyledSelectProps) {
  const [open, setOpen] = React.useState(false);
  const rootRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!open) return;
    const onDown = (event: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const selected = options.find((o) => o.value === value) ?? options[0];

  return (
    <div ref={rootRef} className={`relative inline-block ${className}`}>
      <button
        type="button"
        aria-label={ariaLabel}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={(e) => {
          e.stopPropagation();
          setOpen((o) => !o);
        }}
        className={`chip !inline-flex !items-center !gap-1.5 ${
          size === "sm" ? "!py-1.5 !text-xs" : "!px-4 !py-2 !text-sm"
        }`}
      >
        <span className="max-w-[14rem] truncate">{selected?.label ?? "—"}</span>
        <ExpandMoreIcon
          sx={{ fontSize: 15 }}
          className={`transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>
      {open && (
        <ul
          role="listbox"
          className="absolute left-0 top-full z-40 mt-1.5 max-h-64 min-w-full overflow-y-auto rounded-xl border border-line bg-paper py-1 shadow-xl shadow-black/10"
        >
          {options.map((option) => {
            const active = option.value === value;
            return (
              <li key={option.value}>
                <button
                  type="button"
                  role="option"
                  aria-selected={active}
                  onClick={(e) => {
                    e.stopPropagation();
                    onChange(option.value);
                    setOpen(false);
                  }}
                  className={`flex w-full items-center justify-between gap-3 whitespace-nowrap px-3 py-2 text-left text-xs font-semibold transition hover:bg-sunken ${
                    active ? "text-brand" : "text-ink"
                  }`}
                >
                  {option.label}
                  {active && <CheckIcon sx={{ fontSize: 14 }} />}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

export default StyledSelect;
