/**
 * Payment brand marks for the footer, drawn as inline SVG card chips so they
 * stay crisp on every screen (matching the card artwork in the Bold Market
 * concept: Visa, Mastercard and Discover on white mini-cards).
 */

const base =
  "inline-flex h-6 w-9 shrink-0 items-center justify-center overflow-hidden rounded border border-line bg-white shadow-xs transition hover:shadow-sm";

function VisaMark() {
  return (
    <span className={base} title="Visa" role="img" aria-label="Visa">
      <svg viewBox="0 0 36 24" width="34" height="22" aria-hidden="true">
        <rect width="36" height="24" fill="#FFFFFF" />
        <text
          x="18"
          y="16.5"
          textAnchor="middle"
          fontFamily="Inter, Arial, sans-serif"
          fontSize="9.5"
          fontWeight="800"
          fontStyle="italic"
          letterSpacing="0.5"
          fill="#1A1F71"
        >
          VISA
        </text>
      </svg>
    </span>
  );
}

function MastercardMark() {
  return (
    <span className={base} title="Mastercard" role="img" aria-label="Mastercard">
      <svg viewBox="0 0 36 24" width="34" height="22" aria-hidden="true">
        <rect width="36" height="24" fill="#FFFFFF" />
        <circle cx="14.5" cy="12" r="7" fill="#EB001B" />
        <circle cx="21.5" cy="12" r="7" fill="#F79E1B" />
        <path
          d="M18 6.26a7 7 0 0 1 0 11.48 7 7 0 0 1 0-11.48z"
          fill="#FF5F00"
        />
      </svg>
    </span>
  );
}

function DiscoverMark() {
  return (
    <span className={base} title="Discover" role="img" aria-label="Discover">
      <svg viewBox="0 0 36 24" width="34" height="22" aria-hidden="true">
        <rect width="36" height="24" fill="#FFFFFF" />
        <circle cx="27.5" cy="14.5" r="5.5" fill="#F76E20" />
        <text
          x="4"
          y="13"
          fontFamily="Inter, Arial, sans-serif"
          fontSize="4.6"
          fontWeight="800"
          letterSpacing="0.2"
          fill="#0F172A"
        >
          DISC
        </text>
        <text
          x="4"
          y="18.5"
          fontFamily="Inter, Arial, sans-serif"
          fontSize="4.6"
          fontWeight="800"
          letterSpacing="0.2"
          fill="#0F172A"
        >
          OVER
        </text>
      </svg>
    </span>
  );
}

export default function PaymentMarks() {
  return (
    <div className="flex items-center gap-1.5" aria-label="Accepted payment methods">
      <VisaMark />
      <MastercardMark />
      <DiscoverMark />
    </div>
  );
}
