import React from "react";

export type ArtVariant =
  | "hero"
  | "electronics"
  | "fashion"
  | "home"
  | "beauty"
  | "kitchen"
  | "toys"
  | "sports"
  | "grocery";

/**
 * Category line-art — the Concept B collage redrawn as pure outline
 * illustrations. Strokes use `currentColor` so the art adapts to light and
 * dark themes automatically; accents are the brand orange. No backgrounds —
 * the object outlines ARE the content, per the storefront design direction.
 */
const ACCENT = "#FF5722";

const SHAPES: Record<ArtVariant, React.ReactNode> = {
  hero: (
    <>
      {/* headphones */}
      <path d="M46 74 A34 34 0 0 1 114 74" />
      <rect x="38" y="74" width="20" height="28" rx="7" />
      <rect x="102" y="74" width="20" height="28" rx="7" />
      {/* speaker */}
      <rect x="152" y="72" width="48" height="42" rx="10" />
      <circle cx="176" cy="85" r="7" stroke={ACCENT} />
      {/* blender */}
      <path d="M232 42 L224 94 H286 L278 42 Z" />
      <path d="M230 30 H280" />
      <path d="M224 94 V106 Q255 116 286 106 V94" />
      <circle cx="255" cy="100" r="5" fill={ACCENT} stroke="none" />
    </>
  ),
  electronics: (
    <>
      <rect x="38" y="28" width="112" height="72" rx="5" />
      <circle cx="94" cy="36" r="2.5" fill={ACCENT} stroke="none" />
      <path d="M26 104 H162 L176 120 H12 Z" />
      <circle cx="200" cy="98" r="17" />
      <circle cx="200" cy="105" r="3" fill={ACCENT} stroke="none" />
    </>
  ),
  fashion: (
    <>
      <path d="M18 34 H222" />
      <path d="M30 34 V58 M210 34 V58" />
      <path d="M18 58 H44 M196 58 H222" />
      {/* garment 1 */}
      <path d="M78 34 V46" />
      <path d="M60 46 H96 L104 118 H52 Z" />
      <path d="M72 46 Q78 53 84 46" />
      <path d="M58 82 H98" stroke={ACCENT} />
      {/* garment 2 */}
      <path d="M158 34 V46" />
      <path d="M140 46 H176 L184 118 H132 Z" />
      <path d="M152 46 Q158 53 164 46" />
    </>
  ),
  home: (
    <>
      {/* lamp */}
      <path d="M62 34 H110 L122 72 H50 Z" />
      <circle cx="86" cy="55" r="7" fill={ACCENT} stroke="none" />
      <path d="M86 72 V102" />
      <path d="M70 112 H102 L110 120 H62 Z" />
      {/* vase with sprigs */}
      <path d="M158 78 C154 90 152 100 154 110 Q158 122 168 122 Q178 122 182 110 C184 100 182 90 178 78" />
      <path d="M158 78 H178" />
      <path d="M162 78 C158 60 150 52 142 46 M172 78 C172 56 176 48 182 42 M167 78 C167 62 166 54 168 46" strokeWidth={3} />
      <circle cx="142" cy="46" r="3" fill={ACCENT} stroke="none" />
      <circle cx="182" cy="42" r="3" fill={ACCENT} stroke="none" />
      <circle cx="168" cy="46" r="3" fill={ACCENT} stroke="none" />
    </>
  ),
  beauty: (
    <>
      {/* dropper bottle */}
      <rect x="44" y="78" width="34" height="52" rx="5" />
      <rect x="54" y="60" width="14" height="18" rx="2" />
      <circle cx="61" cy="53" r="6" />
      {/* pump bottle */}
      <rect x="104" y="66" width="36" height="64" rx="5" />
      <rect x="112" y="40" width="24" height="10" rx="2" />
      <path d="M122 50 V66 M134 45 H146" strokeWidth={3} />
      <path d="M104 94 H140" stroke={ACCENT} />
      {/* tube */}
      <path d="M166 66 H194 L196 74 L190 128 H170 L164 74 Z" />
      <path d="M170 80 H190" strokeWidth={3} />
    </>
  ),
  kitchen: (
    <>
      {/* kettle */}
      <path d="M42 68 H112 L118 80 Q122 116 92 120 H60 Q30 116 36 80 Z" />
      <circle cx="66" cy="60" r="4" />
      <path d="M38 84 Q16 82 22 64" />
      <path d="M118 88 L136 74 L132 94" />
      {/* blender */}
      <path d="M158 40 L150 92 H210 L202 40 Z" />
      <path d="M156 30 H204" />
      <path d="M150 92 V104 Q180 114 210 104 V92" />
      <circle cx="180" cy="99" r="5" fill={ACCENT} stroke="none" />
    </>
  ),
  toys: (
    <>
      <rect x="58" y="92" width="76" height="32" rx="3" />
      <circle cx="78" cy="92" r="6" />
      <circle cx="98" cy="92" r="6" />
      <rect x="72" y="56" width="76" height="32" rx="3" />
      <circle cx="92" cy="56" r="6" />
      <circle cx="112" cy="56" r="6" />
      <circle cx="112" cy="56" r="6" fill={ACCENT} stroke="none" />
    </>
  ),
  sports: (
    <>
      <circle cx="120" cy="84" r="50" />
      <path d="M120 34 V44 M120 124 V134 M70 84 H80 M160 84 H170 M155 49 L148 56 M85 49 L92 56 M85 119 L92 112 M155 119 L148 112" strokeWidth={3} />
      <circle cx="120" cy="84" r="30" />
      <circle cx="120" cy="84" r="14" />
      <circle cx="120" cy="84" r="5" fill={ACCENT} stroke="none" />
    </>
  ),
  grocery: (
    <>
      {/* bag */}
      <path d="M64 68 H176 L170 134 H70 Z" />
      <path d="M64 68 L72 82 H168 L176 68" />
      {/* greens */}
      <path d="M92 66 C84 50 90 40 102 36 C104 48 100 60 92 66 Z" />
      <path d="M96 40 L92 64" strokeWidth={3} />
      <path d="M112 64 C108 52 114 44 124 42 C125 52 120 60 112 64 Z" strokeWidth={3} />
      {/* banana */}
      <path d="M126 52 Q140 70 164 60" strokeWidth={6} />
      {/* orange */}
      <circle cx="184" cy="58" r="12" fill={ACCENT} stroke="none" />
    </>
  ),
};

type CategoryArtProps = {
  variant: ArtVariant;
  className?: string;
};

export default function CategoryArt({ variant, className }: CategoryArtProps) {
  return (
    <svg
      viewBox={variant === "hero" ? "0 0 320 160" : "0 0 240 160"}
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth={4}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      {SHAPES[variant]}
    </svg>
  );
}
