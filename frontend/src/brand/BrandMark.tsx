import { BRAND } from ".";

type BrandMarkProps = {
  compact?: boolean;
  inverse?: boolean;
};

/** Bold geometric CARTLY logo mark matching Concept B. */
export default function BrandMark({ compact = false, inverse = false }: BrandMarkProps) {
  return (
    <span className="inline-flex items-center" aria-label={BRAND.name}>
      {compact ? (
        <span
          aria-hidden="true"
          className={`font-heading text-2xl font-black tracking-tight ${
            inverse ? "text-oncontrast" : "text-brand"
          }`}
        >
          C
        </span>
      ) : (
        <span
          className={`font-heading text-2xl sm:text-[1.85rem] font-black tracking-tight leading-none ${
            inverse ? "text-oncontrast" : "text-brand"
          }`}
        >
          {BRAND.wordmark}
        </span>
      )}
    </span>
  );
}
