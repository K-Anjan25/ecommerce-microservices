import { ReactNode } from "react";

/**
 * Inline SVG flag icons.
 *
 * Emoji flags render as two-letter codes on Windows, so the UI draws the
 * flags as vectors instead — crisp at any size and independent of the
 * platform's emoji font. Each flag is drawn in a 40×40 canvas with the
 * artwork filling a centered 40×26.67 band; the square viewport crops it to
 * a circle via `slice` and the CSS border-radius.
 *
 * Simplified but faithful artwork: exact band geometry and colours, with
 * busy emblems (lions, eagles) reduced to their recognisable silhouettes.
 */

const Y = 6.6667;
const H = 26.6667;

/** Union Jack used standalone and as the AU/NZ canton. */
const UK = (
  <>
    <rect x={0} y={Y} width={40} height={H} fill="#012169" />
    <path d={`M0 ${Y} L40 ${Y + H} M40 ${Y} L0 ${Y + H}`} stroke="#fff" strokeWidth={5} />
    <path d={`M0 ${Y} L40 ${Y + H} M40 ${Y} L0 ${Y + H}`} stroke="#C8102E" strokeWidth={2} />
    <path d={`M20 ${Y} V${Y + H} M0 20 H40`} stroke="#fff" strokeWidth={7.5} />
    <path d={`M20 ${Y} V${Y + H} M0 20 H40`} stroke="#C8102E" strokeWidth={4.5} />
  </>
);

const FLAGS: Record<string, ReactNode> = {
  IN: (
    <>
      <rect x={0} y={Y} width={40} height={H / 3} fill="#FF9933" />
      <rect x={0} y={Y + H / 3} width={40} height={H / 3} fill="#fff" />
      <rect x={0} y={Y + (2 * H) / 3} width={40} height={H / 3} fill="#138808" />
      <circle cx={20} cy={20} r={3.1} fill="none" stroke="#000080" strokeWidth={0.55} />
      <circle cx={20} cy={20} r={0.7} fill="#000080" />
      {Array.from({ length: 12 }).map((_, i) => (
        <line
          key={i}
          x1={20}
          y1={16.9}
          x2={20}
          y2={23.1}
          stroke="#000080"
          strokeWidth={0.4}
          transform={`rotate(${i * 15} 20 20)`}
        />
      ))}
    </>
  ),
  US: (
    <>
      <rect x={0} y={Y} width={40} height={H} fill="#fff" />
      {[0, 2, 4, 6, 8, 10, 12].map((i) => (
        <rect key={i} x={0} y={Y + (i * H) / 13} width={40} height={H / 13} fill="#B22234" />
      ))}
      <rect x={0} y={Y} width={16.1} height={(7 * H) / 13} fill="#3C3B6E" />
      {[0, 1, 2, 3].map((row) =>
        [0, 1, 2, 3, 4].map((col) => (
          <circle
            key={`${row}-${col}`}
            cx={2.6 + col * 2.85}
            cy={8.4 + row * 2.7}
            r={0.6}
            fill="#fff"
          />
        ))
      )}
    </>
  ),
  GB: UK,
  CA: (
    <>
      <rect x={0} y={Y} width={40} height={H} fill="#fff" />
      <rect x={0} y={Y} width={9.5} height={H} fill="#D80621" />
      <rect x={30.5} y={Y} width={9.5} height={H} fill="#D80621" />
      <path
        d="M20 13.2 l1.5 2.9 2.3 -0.9 -0.7 3.1 2.9 -0.5 -1.4 2.4 2.7 1.3 -2.7 1.3 1.4 2.4 -2.9 -0.5 0.7 3.1 -2.3 -0.9 -1.5 2.9 -1.5 -2.9 -2.3 0.9 0.7 -3.1 -2.9 0.5 1.4 -2.4 -2.7 -1.3 2.7 -1.3 -1.4 -2.4 2.9 0.5 -0.7 -3.1 2.3 0.9 z"
        fill="#D80621"
      />
    </>
  ),
  AU: (
    <>
      <rect x={0} y={Y} width={40} height={H} fill="#012169" />
      <g transform="scale(0.5)">{UK}</g>
      <circle cx={10} cy={26.7} r={1.5} fill="#fff" />
      <circle cx={28.5} cy={10.5} r={1.1} fill="#fff" />
      <circle cx={33} cy={15.5} r={1.1} fill="#fff" />
      <circle cx={26.5} cy={21.5} r={1.1} fill="#fff" />
      <circle cx={31.5} cy={26.5} r={1.1} fill="#fff" />
      <circle cx={30} cy={18.5} r={0.7} fill="#fff" />
    </>
  ),
  NZ: (
    <>
      <rect x={0} y={Y} width={40} height={H} fill="#012169" />
      <g transform="scale(0.5)">{UK}</g>
      <circle cx={28.5} cy={11} r={1.1} fill="#C8102E" stroke="#fff" strokeWidth={0.5} />
      <circle cx={32.5} cy={17} r={1.1} fill="#C8102E" stroke="#fff" strokeWidth={0.5} />
      <circle cx={27} cy={22.5} r={1.1} fill="#C8102E" stroke="#fff" strokeWidth={0.5} />
      <circle cx={31} cy={27} r={1.1} fill="#C8102E" stroke="#fff" strokeWidth={0.5} />
    </>
  ),
  JP: (
    <>
      <rect x={0} y={Y} width={40} height={H} fill="#fff" />
      <circle cx={20} cy={20} r={5.2} fill="#BC002D" />
    </>
  ),
  KR: (
    <>
      <rect x={0} y={Y} width={40} height={H} fill="#fff" />
      <circle cx={20} cy={20} r={4.6} fill="#CD2E3A" />
      <path d={`M15.4 20 a4.6 4.6 0 0 0 9.2 0 Z`} fill="#0047A0" />
      <circle cx={17.7} cy={20} r={2.3} fill="#CD2E3A" />
      <circle cx={22.3} cy={20} r={2.3} fill="#0047A0" />
      <g stroke="#000" strokeWidth={0.8}>
        {[[-34, 11.5, 11.5], [-34, 28.5, 28.5], [34, 28.5, 11.5], [34, 11.5, 28.5]].map(
          ([rot, cx, cy], g) => (
            <g key={g} transform={`rotate(${rot} ${cx} ${cy})`}>
              <line x1={cx - 2} y1={cy - 1.1} x2={cx + 2} y2={cy - 1.1} />
              <line x1={cx - 2} y1={cy} x2={cx + 2} y2={cy} />
              <line x1={cx - 2} y1={cy + 1.1} x2={cx + 2} y2={cy + 1.1} />
            </g>
          )
        )}
      </g>
    </>
  ),
  DE: (
    <>
      <rect x={0} y={Y} width={40} height={H / 3} fill="#000" />
      <rect x={0} y={Y + H / 3} width={40} height={H / 3} fill="#DD0000" />
      <rect x={0} y={Y + (2 * H) / 3} width={40} height={H / 3} fill="#FFCE00" />
    </>
  ),
  FR: (
    <>
      <rect x={0} y={Y} width={40 / 3} height={H} fill="#0055A4" />
      <rect x={40 / 3} y={Y} width={40 / 3} height={H} fill="#fff" />
      <rect x={(2 * 40) / 3} y={Y} width={40 / 3} height={H} fill="#EF4135" />
    </>
  ),
  NL: (
    <>
      <rect x={0} y={Y} width={40} height={H / 3} fill="#AE1C28" />
      <rect x={0} y={Y + H / 3} width={40} height={H / 3} fill="#fff" />
      <rect x={0} y={Y + (2 * H) / 3} width={40} height={H / 3} fill="#21468B" />
    </>
  ),
  BE: (
    <>
      <rect x={0} y={Y} width={40 / 3} height={H} fill="#000" />
      <rect x={40 / 3} y={Y} width={40 / 3} height={H} fill="#FDDA24" />
      <rect x={(2 * 40) / 3} y={Y} width={40 / 3} height={H} fill="#EF3340" />
    </>
  ),
  ES: (
    <>
      <rect x={0} y={Y} width={40} height={H} fill="#AA151B" />
      <rect x={0} y={Y + H / 4} width={40} height={H / 2} fill="#F1BF00" />
    </>
  ),
  SE: (
    <>
      <rect x={0} y={Y} width={40} height={H} fill="#006AA7" />
      <rect x={12} y={Y} width={4.4} height={H} fill="#FECC02" />
      <rect x={0} y={17.8} width={40} height={4.4} fill="#FECC02" />
    </>
  ),
  CH: (
    <>
      <rect x={0} y={Y} width={40} height={H} fill="#DA291C" />
      <rect x={17.8} y={13} width={4.4} height={14} fill="#fff" />
      <rect x={13} y={17.8} width={14} height={4.4} fill="#fff" />
    </>
  ),
  AE: (
    <>
      <rect x={0} y={Y} width={40} height={H} fill="#fff" />
      <rect x={0} y={Y} width={40} height={H / 3} fill="#009639" />
      <rect x={0} y={Y + (2 * H) / 3} width={40} height={H / 3} fill="#000" />
      <rect x={0} y={Y} width={10.8} height={H} fill="#EF3340" />
    </>
  ),
  SG: (
    <>
      <rect x={0} y={Y} width={40} height={H} fill="#fff" />
      <rect x={0} y={Y} width={40} height={H / 2} fill="#EF3340" />
      <circle cx={9.5} cy={13.333} r={3.4} fill="#fff" />
      <circle cx={10.9} cy={13.333} r={2.9} fill="#EF3340" />
      {Array.from({ length: 5 }).map((_, i) => {
        const angle = (90 + i * 72) * (Math.PI / 180);
        return (
          <circle
            key={i}
            cx={15.5 + 2.2 * Math.cos(angle)}
            cy={13.333 - 2.2 * Math.sin(angle)}
            r={0.5}
            fill="#fff"
          />
        );
      })}
    </>
  ),
  MY: (
    <>
      <rect x={0} y={Y} width={40} height={H} fill="#fff" />
      {[0, 2, 4, 6, 8, 10, 12].map((i) => (
        <rect key={i} x={0} y={Y + (i * H) / 14} width={40} height={H / 14} fill="#CC0001" />
      ))}
      <rect x={0} y={Y} width={20} height={H / 2} fill="#010066" />
      <circle cx={8} cy={13.333} r={3.6} fill="#FFCC00" />
      <circle cx={9.4} cy={13.333} r={3.1} fill="#010066" />
      <circle cx={14} cy={13.333} r={1.9} fill="#FFCC00" />
    </>
  ),
  TH: (
    <>
      <rect x={0} y={Y} width={40} height={H} fill="#A51931" />
      <rect x={0} y={Y + H / 6} width={40} height={(2 * H) / 6} fill="#F4F5F8" />
      <rect x={0} y={Y + H / 2} width={40} height={(2 * H) / 6} fill="#2D2A4A" />
      <rect x={0} y={Y + (5 * H) / 6} width={40} height={H / 6} fill="#A51931" />
    </>
  ),
  LK: (
    <>
      <rect x={0} y={Y} width={40} height={H} fill="#FFB700" />
      <rect x={2} y={Y + 1.6} width={36} height={H - 3.2} fill="#fff" />
      <rect x={3.6} y={Y + 2.6} width={7} height={H - 5.2} fill="#00534E" />
      <rect x={11.2} y={Y + 2.6} width={7} height={H - 5.2} fill="#FF7420" />
      <rect x={18.8} y={Y + 2.6} width={17.6} height={H - 5.2} fill="#8D153A" />
    </>
  ),
  NP: (
    <>
      <rect x={0} y={Y} width={40} height={H} fill="#fff" />
      <path
        d="M0 6.667 L26 6.667 L10 19 L26 33.333 L0 33.333 Z"
        fill="#DC143C"
        stroke="#003893"
        strokeWidth={1.6}
      />
      <circle cx={9} cy={13} r={1.9} fill="#fff" />
      <circle cx={11} cy={27} r={2.2} fill="#fff" />
    </>
  ),
  MV: (
    <>
      <rect x={0} y={Y} width={40} height={H} fill="#D21034" />
      <rect x={8.5} y={13.333} width={23} height={13.333} fill="#007E3A" />
      <circle cx={20.5} cy={20} r={4.2} fill="#fff" />
      <circle cx={22} cy={20} r={3.6} fill="#007E3A" />
    </>
  ),
  BH: (
    <>
      <rect x={0} y={Y} width={40} height={H} fill="#CE1126" />
      <path
        d="M0 6.667 L14 6.667 L18.5 9.333 L14 12 L18.5 14.667 L14 17.333 L18.5 20 L14 22.667 L18.5 25.333 L14 28 L18.5 30.667 L14 33.333 L0 33.333 Z"
        fill="#fff"
      />
    </>
  ),
  QA: (
    <>
      <rect x={0} y={Y} width={40} height={H} fill="#8A1538" />
      <path
        d="M0 6.667 L15.5 6.667 L17.6 8.148 L15.5 9.63 L17.6 11.111 L15.5 12.593 L17.6 14.074 L15.5 15.556 L17.6 17.037 L15.5 18.519 L17.6 20 L15.5 21.481 L17.6 22.963 L15.5 24.444 L17.6 25.926 L15.5 27.407 L17.6 28.889 L15.5 30.37 L17.6 31.852 L15.5 33.333 L0 33.333 Z"
        fill="#fff"
      />
    </>
  ),
  KW: (
    <>
      <rect x={0} y={Y} width={40} height={H / 3} fill="#007A3D" />
      <rect x={0} y={Y + H / 3} width={40} height={H / 3} fill="#fff" />
      <rect x={0} y={Y + (2 * H) / 3} width={40} height={H / 3} fill="#CE1126" />
      <path d="M0 6.667 L10.7 14.35 L10.7 25.65 L0 33.333 Z" fill="#000" />
    </>
  ),
  OM: (
    <>
      <rect x={0} y={Y} width={40} height={H} fill="#DB161B" />
      <rect x={10.7} y={Y} width={29.3} height={H / 3} fill="#fff" />
      <rect x={10.7} y={Y + (2 * H) / 3} width={29.3} height={H / 3} fill="#008000" />
    </>
  ),
  ZA: (
    <>
      <rect x={0} y={Y} width={40} height={H / 2} fill="#DE3831" />
      <rect x={0} y={20} width={40} height={H / 2} fill="#002395" />
      <path
        d="M0 8 L14 20 L40 20 M0 32 L14 20"
        stroke="#fff"
        strokeWidth={9}
        fill="none"
      />
      <path
        d="M0 8 L14 20 L40 20 M0 32 L14 20"
        stroke="#007A4D"
        strokeWidth={5.5}
        fill="none"
      />
      <path d="M0 12.5 L9 20 L0 27.5 Z" fill="#FFB612" />
      <path d="M0 14.5 L6.5 20 L0 25.5 Z" fill="#000" />
    </>
  ),
  MU: (
    <>
      <rect x={0} y={Y} width={40} height={H / 4} fill="#EA2839" />
      <rect x={0} y={Y + H / 4} width={40} height={H / 4} fill="#1A206D" />
      <rect x={0} y={Y + H / 2} width={40} height={H / 4} fill="#FFD500" />
      <rect x={0} y={Y + (3 * H) / 4} width={40} height={H / 4} fill="#00A551" />
    </>
  ),
};

const FALLBACK = (
  <rect x={0} y={Y} width={40} height={H} fill="#D1D5DB" />
);

interface FlagProps {
  /** ISO-3166 alpha-2 country code, e.g. "DE". */
  code?: string;
  /** Rendered size in px (square). */
  size?: number;
  className?: string;
}

/** Circular flag icon drawn as inline SVG — works on every OS. */
export function Flag({ code, size = 20, className = "" }: FlagProps) {
  const upper = (code ?? "IN").toUpperCase();
  const artwork = FLAGS[upper] ?? FALLBACK;
  return (
    <span
      aria-hidden="true"
      className={`inline-block shrink-0 overflow-hidden rounded-full ring-1 ring-black/15 ${className}`}
      style={{ width: size, height: size }}
    >
      <svg
        viewBox="0 0 40 40"
        width="100%"
        height="100%"
        preserveAspectRatio="xMidYMid slice"
        style={{ display: "block" }}
      >
        {artwork}
      </svg>
    </span>
  );
}

export default Flag;
