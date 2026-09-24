import {
  AE, AU, BE, BH, CA, CH, DE, ES, FR, GB, IN, JP, KR, KW, LK, MU, MV, MY,
  NL, NP, NZ, OM, QA, SE, SG, TH, US, ZA,
} from "country-flag-icons/react/1x1";
import type { ComponentType } from "react";

/**
 * Circular flag icons backed by the country-flag-icons artwork (lipis-quality
 * vectors, rendered as React components). Emoji flags render as two-letter
 * codes on Windows, so the UI draws flags as SVGs instead — identical on
 * every OS. Square flags are cropped to a circle with the ring style.
 */

// Exactly the destination countries the storefront offers — keeps the bundle lean.
const FLAGS: Record<string, ComponentType<{ width?: number; height?: number; style?: React.CSSProperties; title?: string }>> = {
  IN, US, GB, CA, AU, NZ, JP, KR, SG, AE, DE, FR, NL, BE, ES, SE, CH,
  BH, KW, QA, OM, MV, MY, TH, LK, NP, MU, ZA,
};

interface FlagProps {
  /** ISO-3166 alpha-2 country code, e.g. "DE". */
  code?: string;
  /** Rendered size in px (square). */
  size?: number;
  className?: string;
}

/** Circular flag icon — works on every OS. */
export function Flag({ code, size = 20, className = "" }: FlagProps) {
  const upper = (code ?? "IN").toUpperCase();
  const Icon = FLAGS[upper];
  return (
    <span
      aria-hidden="true"
      className={`inline-block shrink-0 overflow-hidden rounded-full ring-1 ring-black/15 ${className}`}
      style={{ width: size, height: size }}
    >
      {Icon ? (
        <Icon width={size} height={size} style={{ display: "block" }} title={undefined} />
      ) : (
        // Neutral fallback for a code without artwork.
        <svg viewBox="0 0 512 512" width={size} height={size} style={{ display: "block" }}>
          <circle cx={256} cy={256} r={256} fill="#E5E7EB" />
          <circle cx={256} cy={256} r={120} fill="none" stroke="#9CA3AF" strokeWidth={28} />
          <line x1={136} y1={256} x2={376} y2={256} stroke="#9CA3AF" strokeWidth={24} />
          <ellipse cx={256} cy={256} rx={110} ry={225} fill="none" stroke="#9CA3AF" strokeWidth={22} />
        </svg>
      )}
    </span>
  );
}

export default Flag;
