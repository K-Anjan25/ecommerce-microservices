type BrandMarkProps = {
  compact?: boolean;
  inverse?: boolean;
};

/** Cartly's owned mark: a C-shaped shopping route ending in a checkout spark. */
export default function BrandMark({ compact = false, inverse = false }: BrandMarkProps) {
  return (
    <span className="inline-flex items-center gap-2.5" aria-label="Cartly">
      <svg
        viewBox="0 0 40 40"
        aria-hidden="true"
        className="h-9 w-9 shrink-0"
      >
        <rect width="40" height="40" rx="12" className={inverse ? "fill-accent" : "fill-contrast"} />
        <path
          d="M27.5 12.7a10 10 0 1 0 .1 14.5"
          fill="none"
          strokeWidth="3.4"
          strokeLinecap="round"
          className={inverse ? "stroke-ink" : "stroke-accent"}
        />
        <path
          d="m25.2 10.8 2.8 1.6 2.8-1.6-1.6 2.8 1.6 2.8-2.8-1.6-2.8 1.6 1.6-2.8-1.6-2.8Z"
          className={inverse ? "fill-ink" : "fill-oncontrast"}
        />
        <circle cx="17" cy="29" r="1.45" className={inverse ? "fill-ink" : "fill-oncontrast"} />
        <circle cx="24" cy="29" r="1.45" className={inverse ? "fill-ink" : "fill-oncontrast"} />
      </svg>
      {!compact && (
        <span className="leading-none">
          <span className={`block font-heading text-[1.18rem] font-extrabold tracking-[0.14em] ${inverse ? "text-oncontrast" : "text-ink"}`}>
            CARTLY
          </span>
          <span className={`mt-1 hidden text-[0.55rem] font-bold uppercase tracking-[0.2em] xl:block ${inverse ? "text-white/55" : "text-ink-muted"}`}>
            find it · love it
          </span>
        </span>
      )}
    </span>
  );
}
