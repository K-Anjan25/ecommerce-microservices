/**
 * Cartly — palette explorer.
 *
 * Renders the SAME storefront fragment (header · hero · two product cards ·
 * controls · swatches) once per candidate palette, so the choice is made on how
 * the UI actually looks rather than on hex codes.
 *
 * Run:  node design/palettes/generate.mjs
 * Out:  design/palettes/comparison.svg   (all six, 3 × 2)
 *       design/palettes/0N-<slug>.svg    (one panel each, for closer looks)
 */
import { writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const OUT = dirname(fileURLToPath(import.meta.url));
mkdirSync(OUT, { recursive: true });

/* ─────────────────────────────────────────────────────────── candidates ── */
export const PALETTES = [
  {
    slug: "00-ink-violet",
    name: "0 · Ink & Violet",
    tag: "ARCHIVED — rejected direction",
    mood: "Modern, techy, confident. Lime does the shouting; violet does the acting.",
    brand: "#5B3DF5",
    brandHover: "#4A2ED6",
    brandSoft: "#EDE9FE",
    brandTint: "#F5F3FF",
    accent: "#D8F14B",
    accentInk: "#0B0B0F",
    ink: "#0B0B0F",
    inkSoft: "#5A5F6E",
    inkMuted: "#8A8F9E",
    canvas: "#F6F5F2",
    paper: "#FFFFFF",
    sunken: "#EFEEE9",
    line: "#E5E3DD",
    danger: "#E0334B",
    success: "#0E9F6E",
  },
  {
    slug: "00d-ink-violet-dark",
    name: "0 · Ink & Violet — dark",
    tag: "ARCHIVED — rejected dark variant",
    mood: "Same tokens, dark values. Brand lifts to #7C5CFF because #5B3DF5 goes muddy on near-black.",
    brand: "#7C5CFF",
    brandHover: "#9B84FF",
    brandSoft: "#221E3D",
    brandTint: "#191828",
    accent: "#D8F14B",
    accentInk: "#0B0B0F",
    ink: "#F2F3F6",
    inkSoft: "#A2A8B8",
    inkMuted: "#767D8E",
    canvas: "#0B0C10",
    paper: "#14161C",
    sunken: "#1B1E26",
    line: "#2A2E39",
    danger: "#FB7185",
    success: "#34D399",
    contrast: "#1E212A",
  },
  {
    slug: "01-terracotta-ochre",
    name: "1 · Terracotta & Ochre",
    tag: "Warm · artisanal",
    mood: "Handmade-goods warmth. Reads premium at low saturation; great with lifestyle photography.",
    brand: "#B4441F",
    brandHover: "#933517",
    brandSoft: "#FBEAE1",
    brandTint: "#FDF5F1",
    accent: "#E8B84B",
    accentInk: "#2A1A0F",
    ink: "#221712",
    inkSoft: "#6B5A52",
    inkMuted: "#9C8B82",
    canvas: "#FAF5EF",
    paper: "#FFFFFF",
    sunken: "#F2E9E0",
    line: "#E7DACE",
    danger: "#C0392B",
    success: "#4A7C59",
  },
  {
    slug: "02-teal-coral",
    name: "2 · Deep Teal & Coral",
    tag: "Fresh · marketplace",
    mood: "Calm, trustworthy base with a coral that makes deals pop. Very easy on long browsing sessions.",
    brand: "#0D6E6E",
    brandHover: "#09585A",
    brandSoft: "#DCF2F0",
    brandTint: "#F0FAF9",
    accent: "#FF7A5A",
    accentInk: "#1A1212",
    ink: "#10201F",
    inkSoft: "#54666A",
    inkMuted: "#8AA0A2",
    canvas: "#F4F8F7",
    paper: "#FFFFFF",
    sunken: "#E8F0EF",
    line: "#DCE7E5",
    danger: "#D64545",
    success: "#0E9F6E",
  },
  {
    slug: "03-cobalt-amber",
    name: "3 · Cobalt & Amber",
    tag: "Classic commerce · high trust",
    mood: "The palette shoppers already read as 'safe checkout'. Highest familiarity, lowest risk.",
    brand: "#1A56DB",
    brandHover: "#1442AE",
    brandSoft: "#E1EAFB",
    brandTint: "#F2F6FE",
    accent: "#F5A524",
    accentInk: "#1A1608",
    ink: "#0E1524",
    inkSoft: "#55607A",
    inkMuted: "#8993A8",
    canvas: "#F5F7FA",
    paper: "#FFFFFF",
    sunken: "#EBEFF5",
    line: "#E1E6EE",
    danger: "#DC2626",
    success: "#059669",
  },
  {
    slug: "04-mono-signal",
    name: "4 · Mono & Signal Red",
    tag: "Editorial · luxury",
    mood: "Almost no colour, so product photography carries everything. One red = one meaning: buy / urgent.",
    brand: "#141414",
    brandHover: "#000000",
    brandSoft: "#EDEDED",
    brandTint: "#F7F7F7",
    accent: "#FF2D20",
    accentInk: "#FFFFFF",
    ink: "#0A0A0A",
    inkSoft: "#5C5C5C",
    inkMuted: "#909090",
    canvas: "#FAFAFA",
    paper: "#FFFFFF",
    sunken: "#F0F0F0",
    line: "#E3E3E3",
    danger: "#FF2D20",
    success: "#1F7A46",
  },
  {
    slug: "05-forest-gold",
    name: "5 · Forest & Gold",
    tag: "Cartly 1.x, evolved",
    mood: "Keeps the original green identity but drops the tinted cream, so surfaces finally have hierarchy.",
    brand: "#14603F",
    brandHover: "#0E4830",
    brandSoft: "#DDEDE4",
    brandTint: "#F1F8F4",
    accent: "#D9A521",
    accentInk: "#1A1405",
    ink: "#10201A",
    inkSoft: "#526158",
    inkMuted: "#889489",
    canvas: "#F6F6F1",
    paper: "#FFFFFF",
    sunken: "#EAEBE3",
    line: "#E0E1D8",
    danger: "#B4462F",
    success: "#14603F",
  },
];

/* ─────────────────────────────────────────────────────────── primitives ── */
const F = `font-family="Inter, 'Helvetica Neue', Arial, sans-serif"`;
const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

const rect = (x, y, w, h, o = {}) =>
  `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${o.r ?? 0}" fill="${o.fill}"${
    o.stroke ? ` stroke="${o.stroke}"` : ""
  }${o.opacity ? ` opacity="${o.opacity}"` : ""}/>`;

const txt = (x, y, s, o = {}) =>
  `<text x="${x}" y="${y}" ${F} font-size="${o.size ?? 12}" font-weight="${o.weight ?? 500}" fill="${
    o.fill
  }" text-anchor="${o.anchor ?? "start"}"${o.tracking ? ` letter-spacing="${o.tracking}"` : ""}${
    o.italic ? ` font-style="italic"` : ""
  }>${esc(s)}</text>`;

const pill = (x, y, w, h, label, fill, stroke, color, size = 10) =>
  rect(x, y, w, h, { r: h / 2, fill, stroke }) +
  txt(x + w / 2, y + h / 2 + size * 0.36, label, { anchor: "middle", size, weight: 700, fill: color });

const photo = (x, y, w, h, p, r = 10) =>
  rect(x, y, w, h, { r, fill: p.sunken }) +
  `<path d="M${x} ${y + h} L${x + w} ${y}" stroke="${p.line}" stroke-width="1"/>` +
  `<path d="M${x} ${y} L${x + w} ${y + h}" stroke="${p.line}" stroke-width="1"/>`;

const bars = (x, y, w, n, p, gap = 11) =>
  Array.from({ length: n }, (_, i) =>
    rect(x, y + i * gap, i === n - 1 ? w * 0.62 : w, 6, { r: 3, fill: p.line })
  ).join("");

/* ─────────────────────────────────────────────────────────────── panel ── */
const PW = 640;
const PH = 780;

function panel(p) {
  const o = [];
  const M = 20;

  // canvas
  o.push(rect(0, 0, PW, PH, { fill: p.canvas }));

  /* ── label ── */
  o.push(txt(M, 30, p.name, { size: 17, weight: 700, fill: p.ink }));
  o.push(txt(PW - M, 30, p.tag.toUpperCase(), { anchor: "end", size: 9, weight: 700, fill: p.inkMuted, tracking: "0.12em" }));
  o.push(txt(M, 50, p.mood, { size: 10.5, weight: 400, fill: p.inkSoft }));

  /* ── header ── */
  const hy = 68;
  o.push(rect(M, hy, PW - M * 2, 46, { r: 10, fill: p.paper, stroke: p.line }));
  o.push(rect(M + 14, hy + 13, 20, 20, { r: 5, fill: p.contrast ?? p.ink }));
  o.push(txt(M + 42, hy + 28, "CARTLY", { size: 12, weight: 700, fill: p.ink, tracking: "0.18em" }));
  o.push(pill(M + 116, hy + 12, 48, 22, "Shop", p.contrast ?? p.ink, p.contrast ?? p.ink, "#FFFFFF", 9));
  o.push(pill(M + 170, hy + 12, 50, 22, "Deals", p.paper, p.line, p.inkSoft, 9));
  o.push(rect(M + 232, hy + 12, 190, 22, { r: 11, fill: p.canvas, stroke: p.line }));
  o.push(txt(M + 246, hy + 27, "Search products…", { size: 9, weight: 400, fill: p.inkMuted }));
  o.push(pill(PW - M - 82, hy + 11, 68, 24, "Cart · 3", p.brand, p.brand, "#FFFFFF", 9));

  /* ── hero ── */
  const ey = hy + 58;
  const EH = 168;
  o.push(rect(M, ey, PW - M * 2, EH, { r: 14, fill: p.contrast ?? p.ink }));
  o.push(txt(M + 26, ey + 34, "NEW SEASON", { size: 8.5, weight: 700, fill: p.accent, tracking: "0.16em" }));
  o.push(txt(M + 26, ey + 70, "Everything you", { size: 26, weight: 700, fill: "#FFFFFF" }));
  o.push(txt(M + 26, ey + 100, "need, one cart.", { size: 26, weight: 400, fill: p.accent, italic: true }));
  o.push(pill(M + 26, ey + 118, 116, 32, "Shop the drop", p.accent, p.accent, p.accentInk, 11));
  o.push(rect(M + 152, ey + 118, 96, 32, { r: 8, fill: "none", stroke: "#FFFFFF44" }));
  o.push(txt(M + 200, ey + 138, "View deals", { anchor: "middle", size: 11, weight: 700, fill: "#FFFFFF" }));
  o.push(photo(PW - M - 190, ey + 16, 174, EH - 32, p, 10));
  o.push(pill(PW - M - 176, ey + 30, 60, 20, "−32%", p.danger, p.danger, "#FFFFFF", 9));

  /* ── product cards ── */
  const cy = ey + EH + 22;
  const CW = (PW - M * 2 - 16) / 2;
  const CH = 246;
  [0, 1].forEach((i) => {
    const x = M + i * (CW + 16);
    o.push(rect(x, cy, CW, CH, { r: 12, fill: p.paper, stroke: p.line }));
    o.push(photo(x + 1, cy + 1, CW - 2, 118, p, 11));
    if (i === 0) o.push(pill(x + 10, cy + 10, 46, 18, "SALE", p.danger, p.danger, "#FFFFFF", 8));
    o.push(rect(x + CW - 34, cy + 9, 24, 24, { r: 12, fill: p.paper, stroke: p.line }));
    o.push(txt(x + CW - 22, cy + 25, "⇄", { anchor: "middle", size: 10, fill: p.inkSoft }));
    o.push(txt(x + 12, cy + 138, "BRAND", { size: 7.5, weight: 700, fill: p.inkMuted, tracking: "0.14em" }));
    o.push(bars(x + 12, cy + 146, CW - 24, 2, p));
    o.push(txt(x + 12, cy + 188, "★★★★☆ (128)", { size: 8.5, weight: 500, fill: p.inkSoft }));
    o.push(txt(x + 12, cy + 210, "₹2,499", { size: 15, weight: 700, fill: p.ink }));
    if (i === 0) o.push(txt(x + 76, cy + 210, "₹3,699", { size: 8.5, weight: 400, fill: p.inkMuted }));
    o.push(rect(x + 1, cy + CH - 37, CW - 2, 36, { r: 11, fill: p.contrast ?? p.ink }));
    o.push(txt(x + CW / 2, cy + CH - 14, "+  Add to cart", { anchor: "middle", size: 10.5, weight: 700, fill: p.contrast ? "#FFFFFF" : p.paper }));
  });

  /* ── control row ── */
  const ry = cy + CH + 20;
  o.push(rect(M, ry, PW - M * 2, 60, { r: 12, fill: p.paper, stroke: p.line }));
  o.push(pill(M + 14, ry + 16, 82, 28, "Primary", p.brand, p.brand, "#FFFFFF", 10));
  o.push(pill(M + 104, ry + 16, 72, 28, "Ghost", p.paper, p.line, p.ink, 10));
  o.push(pill(M + 184, ry + 16, 84, 28, "Accent", p.accent, p.accent, p.accentInk, 10));
  o.push(pill(M + 276, ry + 18, 76, 24, "Filter ✕", p.brandSoft, p.brandSoft, p.brand, 9));
  o.push(pill(M + 360, ry + 18, 72, 24, "In stock", "#00000008", p.line, p.success, 9));
  o.push(pill(M + 440, ry + 18, 76, 24, "Low · 3", "#00000008", p.line, p.accentInk === "#FFFFFF" ? p.inkSoft : p.inkSoft, 9));
  o.push(rect(M + 526, ry + 16, PW - M * 2 - 540, 28, { r: 8, fill: p.canvas, stroke: p.line }));
  o.push(txt(M + 538, ry + 34, "Input", { size: 9, weight: 400, fill: p.inkMuted }));

  /* ── swatches ── */
  const sy = ry + 76;
  const SW = [
    ["brand", p.brand],
    ["accent", p.accent],
    ["ink", p.ink],
    ["canvas", p.canvas],
    ["paper", p.paper],
    ["line", p.line],
  ];
  SW.forEach(([n, c], i) => {
    const w = (PW - M * 2 - 5 * 8) / 6;
    const x = M + i * (w + 8);
    o.push(rect(x, sy, w, 40, { r: 8, fill: c, stroke: p.line }));
    o.push(txt(x, sy + 54, n, { size: 8.5, weight: 700, fill: p.ink }));
    o.push(txt(x, sy + 65, c, { size: 8, weight: 400, fill: p.inkMuted }));
  });

  return o.join("\n");
}

/* ───────────────────────────────────────────────────────────── outputs ── */
const wrap = (inner, w, h) =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">${inner}</svg>`;

PALETTES.forEach((p) => {
  writeFileSync(join(OUT, `${p.slug}.svg`), wrap(panel(p), PW, PH));
});

/* comparison sheet: 3 across × 2 down */
const COLS = 3;
const GAP = 14;
const HEAD = 70;
const SW2 = PW * COLS + GAP * (COLS + 1);
const SH2 = HEAD + (PH + GAP) * Math.ceil(PALETTES.length / COLS) + GAP;

const sheet = [
  rect(0, 0, SW2, SH2, { fill: "#FFFFFF" }),
  txt(GAP + 20, 34, "Cartly — archived palette exploration", { size: 22, weight: 700, fill: "#0B0B0F" }),
  txt(
    GAP + 20,
    54,
    "Historical comparisons only. Every option on this sheet is archived; Editorial Warmth is canonical elsewhere.",
    { size: 12, weight: 400, fill: "#5A5F6E" }
  ),
  ...PALETTES.map((p, i) => {
    const x = GAP + (i % COLS) * (PW + GAP);
    const y = HEAD + Math.floor(i / COLS) * (PH + GAP);
    return `<g transform="translate(${x} ${y})">${rect(-1, -1, PW + 2, PH + 2, {
      r: 12,
      fill: "none",
      stroke: p.slug.startsWith("00") ? "#0B0B0F" : "#E5E3DD",
    })}<clipPath id="c${i}"><rect width="${PW}" height="${PH}" rx="11"/></clipPath><g clip-path="url(#c${i})">${panel(
      p
    )}</g></g>`;
  }),
];

writeFileSync(join(OUT, "comparison.svg"), wrap(sheet.join("\n"), SW2, SH2));

console.log(`✓ comparison.svg (${SW2}×${SH2}) + ${PALETTES.length} panels → design/palettes/`);
