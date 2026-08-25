import { BRAND } from ".";

type BrandMarkProps = {
  compact?: boolean;
  inverse?: boolean;
};

/** Editorial wordmark. Deliberately typographic: product imagery carries the graphics. */
export default function BrandMark({ compact = false, inverse = false }: BrandMarkProps) {
  return (
    <span className="inline-flex items-center gap-2.5" aria-label={BRAND.name}>
      {compact && (
        <span
          aria-hidden="true"
          className={`font-display text-2xl leading-none ${
            inverse ? "text-oncontrast" : "text-ink"
          }`}
        >
          C
        </span>
      )}
      {!compact && (
        <span className="leading-none">
          <span
            className={`block font-display text-[1.7rem] tracking-[0.04em] ${
              inverse ? "text-oncontrast" : "text-ink"
            }`}
          >
            {BRAND.wordmark}
          </span>
          <span
            className={`mt-1 hidden text-[0.5rem] font-semibold uppercase tracking-[0.24em] xl:block ${
              inverse ? "text-white/55" : "text-ink-muted"
            }`}
          >
            Curated for everyday
          </span>
        </span>
      )}
    </span>
  );
}
