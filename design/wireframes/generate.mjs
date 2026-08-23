/**
 * Cartly 2.0 — wireframe generator.
 *
 * Emits one SVG per screen into ./  (this folder). Every SVG is a single
 * artboard sized to a real Figma frame width, so dragging the file into Figma
 * produces an editable frame with named layers (rects, labels, groups).
 *
 * Run:  node design/wireframes/generate.mjs
 */
import { writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const OUT = dirname(fileURLToPath(import.meta.url));
mkdirSync(OUT, { recursive: true });

/* ------------------------------------------------------------------ tokens */
const C = {
  paper: "#FFFFFF",
  canvas: "#F6F5F2",
  sunken: "#EFEEE9",
  line: "#D3D0C8",
  lineSoft: "#E5E3DD",
  ink: "#0B0B0F",
  ink500: "#5A5F6E",
  ink400: "#8A8F9E",
  brand: "#5B3DF5",
  brandSoft: "#EDE9FE",
  accent: "#D8F14B",
  danger: "#E0334B",
  success: "#0E9F6E",
  note: "#B0455A",
};
const F = `font-family="Inter, 'Helvetica Neue', Arial, sans-serif"`;

/* ------------------------------------------------------------- primitives */
const esc = (s) =>
  String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

const g = (name, children) =>
  `<g id="${esc(name)}" data-name="${esc(name)}">\n${children.filter(Boolean).join("\n")}\n</g>`;

const box = (x, y, w, h, o = {}) =>
  `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${o.r ?? 10}" ` +
  `fill="${o.fill ?? C.paper}" stroke="${o.stroke ?? C.line}" stroke-width="${o.sw ?? 1}"` +
  `${o.dash ? ` stroke-dasharray="${o.dash}"` : ""}${o.opacity ? ` opacity="${o.opacity}"` : ""}/>`;

const text = (x, y, s, o = {}) =>
  `<text x="${x}" y="${y}" ${F} font-size="${o.size ?? 13}" font-weight="${o.weight ?? 500}" ` +
  `fill="${o.fill ?? C.ink}" text-anchor="${o.anchor ?? "start"}"` +
  `${o.tracking ? ` letter-spacing="${o.tracking}"` : ""}>${esc(s)}</text>`;

/** grey placeholder text lines */
const lines = (x, y, w, n, o = {}) =>
  Array.from({ length: n }, (_, i) =>
    box(x, y + i * (o.gap ?? 12), i === n - 1 && n > 1 ? w * 0.6 : w, o.h ?? 7, {
      r: 4,
      fill: o.fill ?? C.lineSoft,
      stroke: "none",
    })
  ).join("\n");

/** labelled placeholder area (the classic wireframe crossed box) */
const imgBox = (x, y, w, h, label = "image", o = {}) =>
  [
    box(x, y, w, h, { r: o.r ?? 12, fill: C.sunken, stroke: C.line }),
    `<path d="M${x} ${y + h} L${x + w} ${y}" stroke="${C.line}" stroke-width="1"/>`,
    `<path d="M${x} ${y} L${x + w} ${y + h}" stroke="${C.line}" stroke-width="1"/>`,
    text(x + w / 2, y + h / 2 + 4, label, { anchor: "middle", size: 11, fill: C.ink400 }),
  ].join("\n");

const pill = (x, y, w, h, label, o = {}) =>
  [
    box(x, y, w, h, { r: h / 2, fill: o.fill ?? C.paper, stroke: o.stroke ?? C.line }),
    text(x + w / 2, y + h / 2 + 4, label, {
      anchor: "middle",
      size: o.size ?? 11,
      weight: o.weight ?? 600,
      fill: o.color ?? C.ink,
    }),
  ].join("\n");

const button = (x, y, w, h, label, kind = "primary") => {
  const s = {
    primary: { fill: C.brand, stroke: C.brand, color: C.paper },
    dark: { fill: C.ink, stroke: C.ink, color: C.paper },
    accent: { fill: C.accent, stroke: C.accent, color: C.ink },
    ghost: { fill: C.paper, stroke: C.line, color: C.ink },
  }[kind];
  return [
    box(x, y, w, h, { r: 10, fill: s.fill, stroke: s.stroke }),
    text(x + w / 2, y + h / 2 + 4, label, {
      anchor: "middle",
      size: 12,
      weight: 700,
      fill: s.color,
    }),
  ].join("\n");
};

const input = (x, y, w, h, placeholder) =>
  [
    box(x, y, w, h, { r: 10, fill: C.paper, stroke: C.line }),
    text(x + 14, y + h / 2 + 4, placeholder, { size: 12, weight: 400, fill: C.ink400 }),
  ].join("\n");

/** red annotation callout with leader dot — the "why" of the rearrangement */
const note = (x, y, n, msg) =>
  [
    `<circle cx="${x}" cy="${y}" r="9" fill="${C.note}"/>`,
    text(x, y + 4, String(n), { anchor: "middle", size: 11, weight: 700, fill: "#fff" }),
    text(x + 15, y + 4, msg, { size: 11, weight: 500, fill: C.note }),
  ].join("\n");

const sectionLabel = (x, y, s) =>
  text(x, y, s.toUpperCase(), { size: 10, weight: 700, fill: C.ink400, tracking: "0.16em" });

/* ------------------------------------------------------------------ frame */
function frame({ name, w, h, title, subtitle, body }) {
  const HEAD = 74;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h + HEAD}" viewBox="0 0 ${w} ${h + HEAD}">
<rect width="${w}" height="${h + HEAD}" fill="#FFFFFF"/>
${g("frame-label", [
  text(32, 32, title, { size: 18, weight: 700, fill: C.ink }),
  text(32, 52, subtitle, { size: 12, weight: 400, fill: C.ink500 }),
  text(w - 32, 32, `${w} × ${h}`, { anchor: "end", size: 11, weight: 600, fill: C.ink400 }),
  text(w - 32, 52, "Cartly 2.0 · wireframe", { anchor: "end", size: 11, weight: 400, fill: C.ink400 }),
])}
<g transform="translate(0 ${HEAD})">
<rect width="${w}" height="${h}" fill="${C.canvas}" stroke="${C.line}"/>
${body}
</g>
</svg>`;
  writeFileSync(join(OUT, `${name}.svg`), svg);
  console.log(`  ✓ ${name}.svg  (${w}×${h + HEAD})`);
}

/* =================================================================== 01 shell
   The global chrome: announcement · header · category rail · footer · mobile
   bottom nav. This is the "rearranged pieces" contract every page inherits. */
{
  const W = 1440,
    H = 900,
    M = 80,
    CW = W - M * 2;
  const b = [];
  // announcement
  b.push(
    g("announcement-bar", [
      box(0, 0, W, 36, { r: 0, fill: C.ink, stroke: C.ink }),
      text(W / 2, 23, "Free shipping over ₹999  ·  Flash sale ends in 04:12:56", {
        anchor: "middle",
        size: 11,
        weight: 600,
        fill: C.paper,
      }),
      text(W - M, 23, "✕", { anchor: "end", size: 11, fill: C.ink400 }),
    ])
  );
  // header
  const hy = 36;
  b.push(
    g("header", [
      box(0, hy, W, 68, { r: 0, fill: C.paper, stroke: C.lineSoft }),
      text(M, hy + 42, "CARTLY", { size: 18, weight: 700, tracking: "0.22em" }),
      // primary nav
      pill(M + 130, hy + 20, 66, 30, "Shop", { fill: C.ink, stroke: C.ink, color: C.paper }),
      pill(M + 202, hy + 20, 70, 30, "Deals"),
      pill(M + 278, hy + 20, 96, 30, "Gift Cards"),
      pill(M + 380, hy + 20, 88, 30, "Rewards"),
      // command search
      box(W / 2 - 150, hy + 18, 400, 34, { r: 17, fill: C.canvas, stroke: C.line }),
      text(W / 2 - 126, hy + 39, "Search 2,400 products...", { size: 12, weight: 400, fill: C.ink400 }),
      pill(W / 2 + 194, hy + 25, 44, 20, "K", { fill: C.paper, size: 10, color: C.ink400 }),
      // actions
      pill(W - M - 300, hy + 20, 76, 30, "Compare"),
      pill(W - M - 216, hy + 20, 70, 30, "Orders"),
      pill(W - M - 138, hy + 20, 62, 30, "Acct"),
      button(W - M - 68, hy + 18, 68, 34, "Cart 3", "primary"),
    ])
  );
  // category rail
  const ry = hy + 68;
  b.push(
    g("category-rail", [
      box(0, ry, W, 48, { r: 0, fill: C.paper, stroke: C.lineSoft }),
      ...["All", "Electronics", "Home", "Fashion", "Beauty", "Sports", "Grocery", "Toys"].map(
        (c, i) => pill(M + i * 104, ry + 10, 92, 28, c, i === 0 ? { fill: C.brandSoft, stroke: C.brandSoft, color: C.brand } : {})
      ),
      pill(W - M - 120, ry + 10, 120, 28, "Sort: Newest"),
    ])
  );
  // content slot
  const cy = ry + 48 + 32;
  b.push(
    g("page-content-slot", [
      box(M, cy, CW, 380, { r: 20, fill: C.paper, stroke: C.line, dash: "6 6" }),
      text(W / 2, cy + 190, "PAGE CONTENT SLOT  ·  max-width 1280 · 12-col grid · 32px gutters", {
        anchor: "middle",
        size: 13,
        weight: 600,
        fill: C.ink400,
      }),
      // 12 col overlay
      ...Array.from({ length: 12 }, (_, i) =>
        box(M + 24 + i * ((CW - 48) / 12), cy + 24, (CW - 48) / 12 - 24, 332, {
          r: 4,
          fill: C.brand,
          stroke: "none",
          opacity: "0.05",
        })
      ),
    ])
  );
  // footer
  const fy = cy + 380 + 32;
  b.push(
    g("footer", [
      box(0, fy, W, H - fy, { r: 0, fill: C.ink, stroke: C.ink }),
      text(M, fy + 44, "CARTLY", { size: 16, weight: 700, fill: C.paper, tracking: "0.22em" }),
      lines(M, fy + 60, 200, 2, { fill: "#2A2C36" }),
      ...["Shop", "Account", "Support", "Company"].map((h2, i) =>
        [
          text(M + 340 + i * 180, fy + 40, h2, { size: 12, weight: 700, fill: C.paper }),
          lines(M + 340 + i * 180, fy + 54, 96, 4, { fill: "#2A2C36", gap: 14 }),
        ].join("\n")
      ),
      text(M, H - 24, "© 2026 Cartly · Spring Boot microservices", { size: 11, weight: 400, fill: C.ink400 }),
      pill(W - M - 260, H - 40, 80, 24, "Visa", { fill: "#2A2C36", stroke: "#2A2C36", color: C.ink400 }),
      pill(W - M - 172, H - 40, 80, 24, "UPI", { fill: "#2A2C36", stroke: "#2A2C36", color: C.ink400 }),
      pill(W - M - 84, H - 40, 84, 24, "Razorpay", { fill: "#2A2C36", stroke: "#2A2C36", color: C.ink400 }),
    ])
  );
  b.push(
    g("annotations", [
      note(M + 470, hy + 8, 1, "Search is promoted to the header centre (was buried in the page body)"),
      note(M + 470, ry + 4, 2, "Categories become a persistent rail — one tap instead of a dropdown"),
      note(W - 470, fy - 16, 3, "Footer inverts to ink: clear end-of-page stop + trust badges"),
    ])
  );
  frame({
    name: "01-global-shell-desktop",
    w: W,
    h: H,
    title: "01 · Global shell (desktop)",
    subtitle: "Announcement · header w/ command search · category rail · content slot · inverse footer",
    body: b.join("\n"),
  });
}

/* ============================================================== 02 storefront */
{
  const W = 1440,
    H = 1700,
    M = 80,
    CW = W - M * 2;
  const b = [];
  b.push(box(0, 0, W, 152, { r: 0, fill: C.paper, stroke: C.lineSoft }));
  b.push(text(M, 60, "GLOBAL SHELL (see frame 01)", { size: 11, weight: 600, fill: C.ink400 }));
  b.push(box(M, 76, CW, 56, { r: 12, fill: C.canvas, stroke: C.line, dash: "5 5" }));
  b.push(text(W / 2, 110, "header + category rail", { anchor: "middle", size: 11, fill: C.ink400 }));

  // HERO — split editorial
  const hy = 184;
  b.push(
    g("hero", [
      box(M, hy, CW * 0.56, 340, { r: 24, fill: C.ink, stroke: C.ink }),
      sectionLabel(M + 40, hy + 48, "New season"),
      text(M + 40, hy + 108, "Everything you", { size: 40, weight: 700, fill: C.paper }),
      text(M + 40, hy + 154, "need, one cart.", { size: 40, weight: 400, fill: C.accent }),
      lines(M + 40, hy + 184, 300, 2, { fill: "#2A2C36" }),
      button(M + 40, hy + 232, 150, 44, "Shop the drop", "accent"),
      button(M + 202, hy + 232, 130, 44, "View deals", "ghost"),
      pill(M + 40, hy + 296, 210, 26, "★ 4.8 · 12,400 orders shipped", { fill: "#2A2C36", stroke: "#2A2C36", color: C.paper }),
      imgBox(M + CW * 0.58, hy, CW * 0.42, 340, "hero product shot", { r: 24 }),
      pill(M + CW * 0.58 + 20, hy + 20, 90, 26, "−32% off", { fill: C.danger, stroke: C.danger, color: "#fff" }),
    ])
  );

  // category tiles
  const ty = hy + 340 + 48;
  b.push(
    g("category-tiles", [
      text(M, ty, "Shop by category", { size: 21, weight: 700 }),
      text(W - M, ty, "See all →", { anchor: "end", size: 12, weight: 600, fill: C.brand }),
      ...Array.from({ length: 6 }, (_, i) => {
        const tw = (CW - 5 * 20) / 6;
        const x = M + i * (tw + 20);
        return [
          imgBox(x, ty + 20, tw, 132, "", { r: 16 }),
          text(x + tw / 2, ty + 176, ["Electronics", "Home", "Fashion", "Beauty", "Sports", "Toys"][i], {
            anchor: "middle",
            size: 12,
            weight: 600,
          }),
        ].join("\n");
      }),
    ])
  );

  // toolbar + results
  const ry = ty + 220;
  b.push(
    g("results-toolbar", [
      box(M, ry, CW, 56, { r: 14, fill: C.paper, stroke: C.line }),
      text(M + 20, ry + 34, "248 products", { size: 14, weight: 700 }),
      pill(M + 130, ry + 15, 108, 26, "Brand: Acme ✕", { fill: C.brandSoft, stroke: C.brandSoft, color: C.brand }),
      pill(M + 246, ry + 15, 118, 26, "₹500–₹5,000 ✕", { fill: C.brandSoft, stroke: C.brandSoft, color: C.brand }),
      text(M + 378, ry + 33, "Clear all", { size: 11, weight: 600, fill: C.ink500 }),
      pill(W - M - 320, ry + 13, 120, 30, "Filters · 2"),
      pill(W - M - 190, ry + 13, 160, 30, "Sort: Price low-high"),
      pill(W - M - 24, ry + 13, 0, 30, ""),
    ])
  );

  // sidebar facets + grid
  const gy = ry + 76;
  const SW = 264;
  b.push(
    g("facet-sidebar", [
      box(M, gy, SW, 520, { r: 16, fill: C.paper, stroke: C.line }),
      text(M + 20, gy + 34, "Filters", { size: 15, weight: 700 }),
      ...["Category", "Brand", "Price", "Rating", "Availability"].map((s, i) =>
        [
          text(M + 20, gy + 76 + i * 96, s, { size: 12, weight: 700 }),
          lines(M + 20, gy + 90 + i * 96, SW - 40, 3, { gap: 16, h: 9 }),
        ].join("\n")
      ),
    ])
  );
  const GX = M + SW + 28;
  const GW = CW - SW - 28;
  const cw = (GW - 3 * 24) / 4;
  b.push(
    g("product-grid", [
      ...Array.from({ length: 8 }, (_, i) => {
        const x = GX + (i % 4) * (cw + 24);
        const y = gy + Math.floor(i / 4) * 388;
        return g(`product-card-${i + 1}`, [
          box(x, y, cw, 360, { r: 16, fill: C.paper, stroke: C.line }),
          imgBox(x + 1, y + 1, cw - 2, 176, "product", { r: 15 }),
          i % 3 === 0 ? pill(x + 12, y + 12, 56, 22, "SALE", { fill: C.danger, stroke: C.danger, color: "#fff", size: 10 }) : "",
          `<circle cx="${x + cw - 24}" cy="${y + 24}" r="14" fill="${C.paper}" stroke="${C.line}"/>`,
          text(x + cw - 24, y + 28, "♡", { anchor: "middle", size: 12, fill: C.ink500 }),
          text(x + 14, y + 202, "BRAND", { size: 9, weight: 700, fill: C.ink400, tracking: "0.14em" }),
          lines(x + 14, y + 212, cw - 28, 2, { gap: 13 }),
          text(x + 14, y + 262, "★★★★☆  (128)", { size: 10, weight: 500, fill: C.ink500 }),
          text(x + 14, y + 288, "₹2,499", { size: 16, weight: 700 }),
          text(x + 86, y + 288, "₹3,699", { size: 11, weight: 400, fill: C.ink400 }),
          
          box(x + 1, y + 314, cw - 2, 45, { r: 15, fill: C.ink, stroke: C.ink }),
          text(x + cw / 2, y + 342, "+  Add to cart", { anchor: "middle", size: 12, weight: 700, fill: C.paper }),
        ]);
      }),
      button(GX + GW / 2 - 90, gy + 388 + 380, 180, 44, "Load more", "ghost"),
    ])
  );

  b.push(
    g("annotations", [
      note(M + CW * 0.58 + 30, hy + 320, 1, "Hero replaces the plain page title — one clear entry point"),
      note(M + 20, ty - 26, 2, "Category tiles surface the taxonomy above the fold"),
      note(W - 430, ry - 14, 3, "Sticky toolbar: active facets as removable chips + sort"),
      note(GX + 10, gy - 18, 4, "Card: hover reveals full-width Add to cart; wishlist ♡ top-right; badges top-left"),
    ])
  );

  frame({
    name: "02-storefront-desktop",
    w: W,
    h: H,
    title: "02 · Storefront / catalog (desktop)",
    subtitle: "Hero → category tiles → sticky results toolbar → facet sidebar + 4-up product grid",
    body: b.join("\n"),
  });
}

/* ======================================================== 03 product detail */
{
  const W = 1440,
    H = 1240,
    M = 80,
    CW = W - M * 2;
  const b = [];
  b.push(box(0, 0, W, 116, { r: 0, fill: C.paper, stroke: C.lineSoft }));
  b.push(text(M, 66, "GLOBAL SHELL (see frame 01)", { size: 11, weight: 600, fill: C.ink400 }));
  b.push(text(M, 152, "Home  >  Electronics  >  Headphones  >  Acme Studio Pro", { size: 11, weight: 500, fill: C.ink500 }));

  const gy = 176;
  const THUMB = 76;
  const GALX = M + THUMB + 16;
  const GALW = 520;
  b.push(
    g("gallery", [
      ...Array.from({ length: 4 }, (_, i) => imgBox(M, gy + i * (THUMB + 12), THUMB, THUMB, "", { r: 10 })),
      imgBox(GALX, gy, GALW, 390, "main image (4:3)", { r: 16 }),
      pill(GALX + 16, gy + 16, 70, 26, "-32%", { fill: C.danger, stroke: C.danger, color: "#fff" }),
    ])
  );

  /* buy box sits under the gallery-column x, to the right of it */
  const bx = GALX + GALW + 44;
  const RAILW = 280;
  const sx = W - M - RAILW;
  const bw = sx - bx - 36;

  b.push(
    g("buy-box", [
      text(bx, gy + 14, "ACME", { size: 10, weight: 700, fill: C.ink400, tracking: "0.16em" }),
      text(bx, gy + 46, "Acme Studio Pro", { size: 24, weight: 700 }),
      text(bx, gy + 74, "Headphones", { size: 24, weight: 700 }),
      text(bx, gy + 100, "4.6  ·  128 reviews", { size: 11, weight: 500, fill: C.ink500 }),

      text(bx, gy + 146, "Rs 2,499", { size: 30, weight: 700 }),
      text(bx + 152, gy + 146, "Rs 3,699", { size: 12, weight: 400, fill: C.ink400 }),
      pill(bx + 222, gy + 128, 78, 24, "Save 32%", { fill: C.accent, stroke: C.accent, color: C.ink, size: 10 }),
      text(bx, gy + 168, "Inclusive of all taxes", { size: 10, weight: 400, fill: C.ink400 }),

      sectionLabel(bx, gy + 206, "Variant"),
      ...["Black S", "Sand M", "Sage L"].map((c, i) =>
        pill(bx + i * 102, gy + 218, 94, 32, c, i === 1 ? { fill: C.ink, stroke: C.ink, color: C.paper, size: 10 } : { size: 10 })
      ),
      pill(bx, gy + 268, 150, 24, "In stock · 12 left", { fill: "#E3F7EF", stroke: "#E3F7EF", color: C.success, size: 10 }),

      /* CTA row */
      box(bx, gy + 312, 100, 48, { r: 10, fill: C.paper, stroke: C.line }),
      text(bx + 50, gy + 342, "-   1   +", { anchor: "middle", size: 13, weight: 700 }),
      button(bx + 112, gy + 312, 140, 48, "Add to cart", "primary"),
      pill(bx + 262, gy + 318, 44, 36, "Cmp", { size: 9 }),

      pill(bx, gy + 376, 208, 30, "Price-drop alert (email me)", { size: 10 }),

      /* delivery / trust panel */
      box(bx, gy + 424, bw, 168, { r: 14, fill: C.paper, stroke: C.line }),
      ...[
        ["Free delivery over Rs 999", "Standard 4-6 days · express at checkout"],
        ["7-day returns", "Request from order detail · refund to source"],
        ["Secure checkout", "UPI · cards · Razorpay · cash on delivery"],
        ["Gift wrap & gift cards", "Add a message at checkout"],
      ].map(([t, c], i) =>
        [
          `<circle cx="${bx + 26}" cy="${gy + 452 + i * 40}" r="12" fill="${C.brandSoft}"/>`,
          text(bx + 48, gy + 450 + i * 40, t, { size: 11, weight: 700 }),
          text(bx + 48, gy + 464 + i * 40, c, { size: 9, weight: 400, fill: C.ink500 }),
        ].join("\n")
      ),
    ])
  );

  b.push(
    g("sticky-rail", [
      box(sx, gy, RAILW, 250, { r: 16, fill: C.paper, stroke: C.line }),
      sectionLabel(sx + 18, gy + 30, "Your selection"),
      text(sx + 18, gy + 56, "Acme Studio Pro", { size: 13, weight: 700 }),
      pill(sx + 18, gy + 68, 74, 22, "Sand M", { size: 9 }),
      ...[
        ["Unit price", "Rs 2,499"],
        ["In cart", "1"],
        ["Line total", "Rs 2,499"],
      ].map(([k, v], i) =>
        [
          text(sx + 18, gy + 122 + i * 24, k, { size: 11, weight: i === 2 ? 700 : 500, fill: i === 2 ? C.ink : C.ink500 }),
          text(sx + RAILW - 18, gy + 122 + i * 24, v, { anchor: "end", size: 11, weight: 700 }),
        ].join("\n")
      ),
      button(sx + 18, gy + 186, RAILW - 36, 42, "Add to cart", "primary"),
      text(sx + 18, gy + 244, "Earn 24 loyalty points", { size: 10, weight: 700, fill: C.brand }),

      box(sx, gy + 274, RAILW, 224, { r: 16, fill: C.paper, stroke: C.line }),
      sectionLabel(sx + 18, gy + 304, "Frequently bought together"),
      ...Array.from({ length: 3 }, (_, i) =>
        [
          imgBox(sx + 18, gy + 320 + i * 60, 48, 48, "", { r: 10 }),
          lines(sx + 78, gy + 334 + i * 60, RAILW - 100, 2, { gap: 13 }),
        ].join("\n")
      ),
    ])
  );

  const ty2 = gy + 636;
  b.push(
    g("detail-tabs", [
      box(M, ty2, CW, 268, { r: 16, fill: C.paper, stroke: C.line }),
      ...["Description", "Specifications", "Reviews (128)", "Shipping & returns"].map((t, i) =>
        pill(M + 20 + i * 168, ty2 + 18, 156, 32, t, i === 0 ? { fill: C.ink, stroke: C.ink, color: C.paper, size: 10 } : { size: 10 })
      ),
      lines(M + 20, ty2 + 86, CW - 320, 6, { gap: 20, h: 9 }),
    ])
  );

  b.push(
    g("annotations", [
      note(M + 20, gy - 40, 1, "Variants are chips, not a dropdown; CTA row sits directly under the price"),
      note(sx - 4, gy - 18, 2, "Sticky rail: live line total + cross-sell stay in view"),
      note(M + 20, ty2 - 18, 3, "Long content moves into tabs (was one endless column)"),
    ])
  );

  frame({
    name: "03-product-detail-desktop",
    w: W,
    h: H,
    title: "03 · Product detail (desktop)",
    subtitle: "Thumb rail + gallery · buy box (variant chips) · sticky selection rail · tabs",
    body: b.join("\n"),
  });
}

/* ============================================================= 04 cart+checkout */
{
  const W = 1440,
    H = 1180,
    M = 80,
    CW = W - M * 2;
  const b = [];
  b.push(box(0, 0, W, 116, { r: 0, fill: C.paper, stroke: C.lineSoft }));
  b.push(text(M, 66, "GLOBAL SHELL (see frame 01)", { size: 11, weight: 600, fill: C.ink400 }));

  /* 3-step progress header — matches components/CheckoutSteps */
  b.push(
    g("checkout-stepper", [
      ...["Cart", "Address & payment", "Confirmation"].map((s, i) => {
        const x = M + i * 300;
        const done = i === 0;
        const active = i === 1;
        return [
          `<circle cx="${x + 14}" cy="162" r="14" fill="${done ? C.brand : active ? C.ink : C.paper}" stroke="${done ? C.brand : active ? C.ink : C.line}"/>`,
          text(x + 14, 167, done ? "v" : String(i + 1), {
            anchor: "middle", size: 11, weight: 700, fill: done || active ? "#fff" : C.ink400,
          }),
          text(x + 38, 167, s, { size: 13, weight: active ? 700 : 500, fill: active ? C.ink : done ? C.brand : C.ink400 }),
          i < 2 ? box(x + 190, 161, 90, 2, { r: 1, fill: i === 0 ? C.brand : C.line, stroke: "none" }) : "",
        ].join("\n");
      }),
    ])
  );

  b.push(text(M, 214, "STEP 2 OF 3", { size: 10, weight: 700, fill: C.ink400, tracking: "0.16em" }));
  b.push(text(M, 246, "Checkout", { size: 28, weight: 700 }));

  const cy = 274;
  const RAILW = 340;
  const sx = W - M - RAILW;
  const MAINW = sx - M - 28;

  /** numbered section header */
  const secHead = (y, n, title, sub) =>
    [
      `<circle cx="${M + 40}" cy="${y + 26}" r="15" fill="${C.ink}"/>`,
      text(M + 40, y + 31, String(n), { anchor: "middle", size: 11, weight: 700, fill: "#fff" }),
      text(M + 66, y + 24, title, { size: 14, weight: 700 }),
      sub ? text(M + 66, y + 40, sub, { size: 10, weight: 400, fill: C.ink400 }) : "",
    ].join("\n");

  /* 1 · delivery address */
  let y = cy;
  b.push(
    g("s1-address", [
      box(M, y, MAINW, 250, { r: 16, fill: C.paper, stroke: C.line }),
      secHead(y, 1, "Delivery address", "Guest checkout - no account needed"),
      box(M + 24, y + 72, MAINW - 48, 52, { r: 10, fill: C.canvas, stroke: C.line }),
      text(M + 40, y + 94, "Use saved address", { size: 11, weight: 700 }),
      text(M + 40, y + 110, "12 Rose Lane, Hyderabad, Telangana", { size: 10, weight: 400, fill: C.ink500 }),
      text(M + MAINW - 40, y + 102, "Apply", { anchor: "end", size: 10, weight: 700, fill: C.brand }),
      input(M + 24, y + 136, (MAINW - 60) / 2, 40, "State"),
      input(M + 36 + (MAINW - 60) / 2, y + 136, (MAINW - 60) / 2, 40, "District"),
      input(M + 24, y + 186, MAINW - 48, 40, "Delivery pincode"),
    ])
  );

  /* 2 · delivery method */
  y += 266;
  b.push(
    g("s2-delivery", [
      box(M, y, MAINW, 146, { r: 16, fill: C.paper, stroke: C.line }),
      secHead(y, 2, "Delivery method", "Rate quoted for your pincode"),
      ...[
        ["Standard", "3-5 working days", "Free"],
        ["Express", "1-2 working days", "Rs 100"],
      ].map(([t, c, p], i) => {
        const x = M + 24 + i * ((MAINW - 60) / 2 + 12);
        const w2 = (MAINW - 60) / 2;
        const active = i === 0;
        return [
          box(x, y + 72, w2, 56, { r: 10, fill: active ? C.brandSoft : C.paper, stroke: active ? C.brand : C.line }),
          `<circle cx="${x + 26}" cy="${y + 100}" r="13" fill="${active ? C.brand : C.sunken}"/>`,
          text(x + 48, y + 96, t, { size: 11, weight: 700 }),
          text(x + 48, y + 112, c, { size: 9, weight: 400, fill: C.ink500 }),
          text(x + w2 - 14, y + 100, p, { anchor: "end", size: 11, weight: 700 }),
        ].join("\n");
      }),
    ])
  );

  /* 3 · payment */
  y += 162;
  b.push(
    g("s3-payment", [
      box(M, y, MAINW, 146, { r: 16, fill: C.paper, stroke: C.line }),
      secHead(y, 3, "Payment", "Razorpay will open to complete your payment"),
      ...[
        ["Card / UPI", "Razorpay"],
        ["Cash on delivery", "Pay the courier on arrival"],
      ].map(([t, c], i) => {
        const x = M + 24 + i * ((MAINW - 60) / 2 + 12);
        const w2 = (MAINW - 60) / 2;
        const active = i === 0;
        return [
          box(x, y + 72, w2, 56, { r: 10, fill: active ? C.brandSoft : C.paper, stroke: active ? C.brand : C.line }),
          `<circle cx="${x + 26}" cy="${y + 100}" r="13" fill="${active ? C.brand : C.sunken}"/>`,
          text(x + 48, y + 96, t, { size: 11, weight: 700 }),
          text(x + 48, y + 112, c, { size: 9, weight: 400, fill: C.ink500 }),
        ].join("\n");
      }),
    ])
  );

  /* 4 · credits & extras */
  y += 162;
  b.push(
    g("s4-credits", [
      box(M, y, MAINW, 150, { r: 16, fill: C.paper, stroke: C.line }),
      secHead(y, 4, "Credits & extras", "Coupons, gift cards, loyalty and gift wrap in one row"),
      input(M + 24, y + 72, MAINW - 160, 42, "Coupon / gift card code"),
      button(M + MAINW - 128, y + 72, 104, 42, "Apply", "primary"),
      box(M + 24, y + 126, 14, 14, { r: 4, fill: C.brand, stroke: C.brand }),
      text(M + 46, y + 137, "Gift wrap this order (+Rs 50)", { size: 11, weight: 500, fill: C.ink500 }),
    ])
  );

  /* 5 · review (collapsed) */
  y += 166;
  b.push(
    g("s5-review", [
      box(M, y, MAINW, 78, { r: 16, fill: C.paper, stroke: C.line }),
      `<circle cx="${M + 40}" cy="${y + 39}" r="15" fill="${C.sunken}"/>`,
      text(M + 40, y + 44, "3", { anchor: "middle", size: 11, weight: 700, fill: C.ink }),
      text(M + 66, y + 34, "Review items", { size: 14, weight: 700 }),
      text(M + 66, y + 50, "Show what you're buying (collapsed by default)", { size: 10, weight: 400, fill: C.ink400 }),
      text(M + MAINW - 32, y + 45, "v", { anchor: "end", size: 14, weight: 700, fill: C.ink400 }),
    ])
  );

  /* sticky summary */
  b.push(
    g("order-summary-sticky", [
      box(sx, cy, RAILW, 430, { r: 16, fill: C.paper, stroke: C.line }),
      text(sx + 20, cy + 36, "Order summary", { size: 15, weight: 700 }),
      ...[
        ["Subtotal (3 items)", "Rs 7,497"],
        ["Coupon SAVE10", "-Rs 749"],
        ["Shipping", "FREE"],
        ["Tax (GST 18%)", "Rs 1,214"],
        ["Gift wrap", "Rs 49"],
      ].map(([k, v], i) =>
        [
          text(sx + 20, cy + 76 + i * 30, k, { size: 12, weight: 500, fill: i === 1 ? C.success : C.ink500 }),
          text(sx + RAILW - 20, cy + 76 + i * 30, v, { anchor: "end", size: 12, weight: 700, fill: i === 1 || i === 2 ? C.success : C.ink }),
        ].join("\n")
      ),
      box(sx + 20, cy + 244, RAILW - 40, 1, { r: 0, fill: C.line, stroke: "none" }),
      text(sx + 20, cy + 278, "Total", { size: 16, weight: 700 }),
      text(sx + RAILW - 20, cy + 280, "Rs 7,891", { anchor: "end", size: 22, weight: 700 }),
      button(sx + 20, cy + 300, RAILW - 40, 50, "Pay Rs 7,891", "primary"),
      text(sx + RAILW / 2, cy + 374, "256-bit secure · PCI compliant", { anchor: "middle", size: 10, weight: 500, fill: C.ink400 }),
      ...["Visa", "Mastercard", "UPI", "COD"].map((m, i) =>
        pill(sx + 22 + i * 78, cy + 388, 72, 22, m, { size: 9, color: C.ink500 })
      ),
    ])
  );

  b.push(
    g("annotations", [
      note(M + 20, 130, 1, "Cart and checkout are one flow behind a shared 3-step progress header"),
      note(sx, cy - 20, 2, "Summary is sticky - total always visible, CTA never off-screen"),
      note(M + 20, y + 100, 3, "Coupon / gift card / loyalty / gift wrap collapse into one credits section"),
    ])
  );

  frame({
    name: "04-cart-checkout-desktop",
    w: W,
    h: H,
    title: "04 · Cart -> checkout (desktop, single flow)",
    subtitle: "3-step header · numbered sections (address / delivery / payment / credits / review) · sticky summary",
    body: b.join("\n"),
  });
}

/* ============================================================ 05 admin console */
{
  const W = 1440,
    H = 960;
  const b = [];
  const RAIL = 248;
  b.push(
    g("admin-rail", [
      box(0, 0, RAIL, H, { r: 0, fill: C.ink, stroke: C.ink }),
      text(24, 44, "CARTLY", { size: 14, weight: 700, fill: C.paper, tracking: "0.22em" }),
      pill(24, 60, 84, 20, "ADMIN", { fill: C.brand, stroke: C.brand, color: "#fff", size: 9 }),
      ...["Dashboard", "Orders", "Products", "Categories", "Coupons", "Returns", "Customers", "Settings"].map((s, i) => {
        const y = 116 + i * 44;
        const active = i === 0;
        return [
          active ? box(12, y, RAIL - 24, 38, { r: 10, fill: "#221F3D", stroke: "#221F3D" }) : "",
          `<rect x="24" y="${y + 13}" width="12" height="12" rx="3" fill="${active ? C.accent : "#3A3D47"}"/>`,
          text(48, y + 24, s, { size: 13, weight: active ? 700 : 500, fill: active ? C.paper : "#8A8F9E" }),
        ].join("\n");
      }),
      box(12, H - 96, RAIL - 24, 72, { r: 12, fill: "#16171D", stroke: "#2A2C36" }),
      `<circle cx="42" cy="${H - 60}" r="16" fill="#2A2C36"/>`,
      text(68, H - 64, "Anjan K", { size: 12, weight: 700, fill: C.paper }),
      text(68, H - 48, "Super admin", { size: 10, weight: 400, fill: C.ink400 }),
    ])
  );

  const X = RAIL + 32;
  const CW = W - X - 32;
  b.push(
    g("admin-topbar", [
      box(RAIL, 0, W - RAIL, 68, { r: 0, fill: C.paper, stroke: C.lineSoft }),
      text(X, 34, "Dashboard", { size: 18, weight: 700 }),
      text(X, 52, "Overview · last 7 days", { size: 11, weight: 400, fill: C.ink400 }),
      box(W - 520, 18, 240, 32, { r: 16, fill: C.canvas, stroke: C.line }),
      text(W - 500, 39, "Search orders, products...", { size: 11, weight: 400, fill: C.ink400 }),
      pill(W - 268, 18, 110, 32, "Last 7 days ▾"),
      button(W - 148, 18, 116, 32, "+ New product", "primary"),
    ])
  );

  // KPI row
  const ky = 100;
  const kw = (CW - 3 * 20) / 4;
  b.push(
    g("kpi-cards", [
      ...[
        ["Revenue today", "₹48,210", "+12.4%"],
        ["Orders", "126", "+8"],
        ["Avg order value", "₹2,140", "−3.1%"],
        ["Returns pending", "7", "action"],
      ].map(([k, v, d], i) => {
        const x = X + i * (kw + 20);
        return [
          box(x, ky, kw, 116, { r: 16, fill: C.paper, stroke: C.line }),
          text(x + 20, ky + 32, k, { size: 11, weight: 600, fill: C.ink400 }),
          text(x + 20, ky + 72, v, { size: 26, weight: 700 }),
          pill(x + 20, ky + 84, 76, 22, d, {
            fill: i === 3 ? "#FDF1DC" : i === 2 ? C.sunken : "#E3F7EF",
            stroke: "none",
            size: 9,
            color: i === 3 ? "#B07A16" : i === 2 ? C.ink500 : C.success,
          }),
        ].join("\n");
      }),
    ])
  );

  // chart + status
  const chy = ky + 140;
  b.push(
    g("revenue-chart", [
      box(X, chy, CW * 0.62, 280, { r: 16, fill: C.paper, stroke: C.line }),
      text(X + 20, chy + 34, "Revenue · 7 days", { size: 14, weight: 700 }),
      ...Array.from({ length: 7 }, (_, i) => {
        const bw2 = 44;
        const gap = (CW * 0.62 - 40 - 7 * bw2) / 6;
        const h = [120, 88, 150, 104, 178, 140, 196][i];
        return box(X + 20 + i * (bw2 + gap), chy + 250 - h, bw2, h, {
          r: 8,
          fill: i === 6 ? C.brand : C.brandSoft,
          stroke: "none",
        });
      }),
    ])
  );
  b.push(
    g("orders-by-status", [
      box(X + CW * 0.64, chy, CW * 0.36, 280, { r: 16, fill: C.paper, stroke: C.line }),
      text(X + CW * 0.64 + 20, chy + 34, "Orders by status", { size: 14, weight: 700 }),
      ...["Pending 18", "Paid 64", "Shipped 31", "Delivered 12", "Refunded 3"].map((s, i) =>
        [
          text(X + CW * 0.64 + 20, chy + 74 + i * 40, s.split(" ")[0], { size: 12, weight: 600 }),
          box(X + CW * 0.64 + 100, chy + 62 + i * 40, [70, 220, 130, 54, 18][i], 16, {
            r: 8,
            fill: [C.accent, C.brand, "#7C5CFF", C.success, C.danger][i],
            stroke: "none",
          }),
          text(X + CW - 20, chy + 74 + i * 40, s.split(" ")[1], { anchor: "end", size: 11, weight: 700, fill: C.ink500 }),
        ].join("\n")
      ),
    ])
  );

  // table
  const ty3 = chy + 304;
  b.push(
    g("recent-orders-table", [
      box(X, ty3, CW, H - ty3 - 32, { r: 16, fill: C.paper, stroke: C.line }),
      text(X + 20, ty3 + 34, "Recent orders", { size: 14, weight: 700 }),
      text(X + CW - 20, ty3 + 34, "View all →", { anchor: "end", size: 11, weight: 600, fill: C.brand }),
      box(X + 1, ty3 + 50, CW - 2, 34, { r: 0, fill: C.canvas, stroke: "none" }),
      ...["Order", "Customer", "Items", "Total", "Status", "Placed"].map((h2, i) =>
        text(X + 20 + i * ((CW - 40) / 6), ty3 + 72, h2, { size: 10, weight: 700, fill: C.ink400, tracking: "0.1em" })
      ),
      ...Array.from({ length: 4 }, (_, r) =>
        Array.from({ length: 6 }, (_, c) =>
          c === 4
            ? pill(X + 20 + c * ((CW - 40) / 6), ty3 + 96 + r * 38, 78, 22, ["Paid", "Shipped", "Pending", "Paid"][r], {
                fill: C.sunken,
                stroke: "none",
                size: 9,
              })
            : lines(X + 20 + c * ((CW - 40) / 6), ty3 + 104 + r * 38, 92, 1)
        ).join("\n")
      ),
    ])
  );

  b.push(
    g("annotations", [
      note(RAIL + 12, H - 130, 1, "Ink rail replaces the light sidebar — admin reads instantly as a different mode"),
      note(X + 10, ky - 16, 2, "KPIs first, then trend, then work queue (orders) — decreasing abstraction"),
    ])
  );

  frame({
    name: "05-admin-console-desktop",
    w: W,
    h: H,
    title: "05 · Admin console (desktop)",
    subtitle: "Ink nav rail · topbar w/ scope + search · KPI row · revenue chart · status split · order table",
    body: b.join("\n"),
  });
}

/* ================================================================ 06 mobile */
{
  const SW2 = 390,
    SH = 844,
    GAP = 46;
  const screens = 3;
  const W = SW2 * screens + GAP * (screens + 1),
    H = SH + 96;
  const parts = [];

  const shell = (ox, label) => {
    const oy = 48;
    return { ox, oy, chrome: [
      box(ox, oy, SW2, SH, { r: 28, fill: C.canvas, stroke: C.line }),
      text(ox + SW2 / 2, oy - 14, label, { anchor: "middle", size: 12, weight: 700, fill: C.ink500 }),
      // status bar
      text(ox + 22, oy + 26, "9:41", { size: 11, weight: 700 }),
      text(ox + SW2 - 22, oy + 26, "5G  100%", { anchor: "end", size: 10, fill: C.ink500 }),
    ]};
  };

  /* --- A: storefront --- */
  {
    const { ox, oy, chrome } = shell(GAP, "A · Storefront");
    const p = [...chrome];
    p.push(box(ox, oy + 40, SW2, 56, { r: 0, fill: C.paper, stroke: C.lineSoft }));
    p.push(text(ox + 18, oy + 74, "CARTLY", { size: 14, weight: 700, tracking: "0.2em" }));
    p.push(text(ox + SW2 - 66, oy + 76, "♡", { size: 16, fill: C.ink500 }));
    p.push(text(ox + SW2 - 32, oy + 76, "☰", { size: 16, fill: C.ink500 }));
    p.push(box(ox + 16, oy + 108, SW2 - 32, 42, { r: 21, fill: C.paper, stroke: C.line }));
    p.push(text(ox + 40, oy + 134, "Search products...", { size: 12, weight: 400, fill: C.ink400 }));
    p.push(
      ...["All", "Electronics", "Home", "Fashion"].map((c, i) =>
        pill(ox + 16 + i * 88, oy + 162, 80, 30, c, i === 0 ? { fill: C.ink, stroke: C.ink, color: C.paper, size: 10 } : { size: 10 })
      )
    );
    p.push(box(ox + 16, oy + 206, SW2 - 32, 132, { r: 18, fill: C.ink, stroke: C.ink }));
    p.push(text(ox + 34, oy + 254, "Everything you", { size: 20, weight: 700, fill: C.paper }));
    p.push(text(ox + 34, oy + 278, "need, one cart.", { size: 20, weight: 400, fill: C.accent }));
    p.push(button(ox + 34, oy + 294, 120, 32, "Shop now", "accent"));
    // 2-up grid
    for (let i = 0; i < 4; i++) {
      const cw2 = (SW2 - 48) / 2;
      const x = ox + 16 + (i % 2) * (cw2 + 16);
      const y = oy + 356 + Math.floor(i / 2) * 220;
      p.push(box(x, y, cw2, 204, { r: 14, fill: C.paper, stroke: C.line }));
      p.push(imgBox(x + 1, y + 1, cw2 - 2, 116, "", { r: 13 }));
      p.push(lines(x + 10, y + 130, cw2 - 20, 2, { gap: 12 }));
      p.push(text(x + 10, y + 178, "₹2,499", { size: 13, weight: 700 }));
      p.push(`<circle cx="${x + cw2 - 22}" cy="${y + 172}" r="14" fill="${C.brand}"/>`);
      p.push(text(x + cw2 - 22, y + 177, "+", { anchor: "middle", size: 13, weight: 700, fill: "#fff" }));
    }
    // bottom nav
    p.push(box(ox, oy + SH - 74, SW2, 74, { r: 0, fill: C.paper, stroke: C.lineSoft }));
    ["Shop", "Search", "Cart", "Orders", "You"].forEach((s, i) => {
      const x = ox + 20 + i * ((SW2 - 40) / 5);
      const w2 = (SW2 - 40) / 5;
      p.push(`<rect x="${x + w2 / 2 - 11}" y="${oy + SH - 58}" width="22" height="22" rx="6" fill="${i === 0 ? C.brand : C.ink200 ?? "#C9CCD5"}"/>`);
      p.push(text(x + w2 / 2, oy + SH - 22, s, { anchor: "middle", size: 10, weight: i === 0 ? 700 : 500, fill: i === 0 ? C.brand : C.ink400 }));
      if (i === 2) {
        p.push(`<circle cx="${x + w2 / 2 + 12}" cy="${oy + SH - 58}" r="8" fill="${C.danger}"/>`);
        p.push(text(x + w2 / 2 + 12, oy + SH - 54, "3", { anchor: "middle", size: 9, weight: 700, fill: "#fff" }));
      }
    });
    parts.push(g("mobile-storefront", p));
  }

  /* --- B: product detail --- */
  {
    const { ox, oy, chrome } = shell(GAP * 2 + SW2, "B · Product detail");
    const p = [...chrome];
    p.push(text(ox + 20, oy + 74, "←", { size: 18, weight: 700 }));
    p.push(text(ox + SW2 - 60, oy + 76, "♡", { size: 16, fill: C.ink500 }));
    p.push(text(ox + SW2 - 28, oy + 76, "Share", { size: 15, fill: C.ink500 }));
    p.push(imgBox(ox, oy + 92, SW2, 300, "gallery · swipe", { r: 0 }));
    p.push(pill(ox + SW2 / 2 - 30, oy + 368, 60, 14, "o  .  .  .", { fill: "#FFFFFFCC", stroke: "none", size: 8 }));
    p.push(box(ox, oy + 380, SW2, SH - 380 - 96, { r: 24, fill: C.paper, stroke: C.line }));
    p.push(text(ox + 20, oy + 414, "ACME", { size: 9, weight: 700, fill: C.ink400, tracking: "0.16em" }));
    p.push(text(ox + 20, oy + 440, "Acme Studio Pro", { size: 19, weight: 700 }));
    p.push(text(ox + 20, oy + 462, "★★★★☆ 4.6 · 128 reviews", { size: 11, weight: 500, fill: C.ink500 }));
    p.push(text(ox + 20, oy + 498, "₹2,499", { size: 24, weight: 700 }));
    p.push(text(ox + 108, oy + 498, "₹3,699", { size: 12, weight: 400, fill: C.ink400 }));
    p.push(pill(ox + 168, oy + 482, 64, 22, "−32%", { fill: C.accent, stroke: C.accent, size: 10 }));
    p.push(sectionLabel(ox + 20, oy + 532, "Variant"));
    p.push(...["S", "M", "L"].map((s, i) => pill(ox + 20 + i * 62, oy + 544, 54, 32, s, i === 1 ? { fill: C.ink, stroke: C.ink, color: C.paper } : {})));
    p.push(pill(ox + 20, oy + 592, 140, 24, "In stock · 12 left", { fill: "#E3F7EF", stroke: "none", color: C.success, size: 10 }));
    p.push(lines(ox + 20, oy + 632, SW2 - 40, 4, { gap: 16, h: 8 }));
    // sticky buy bar
    p.push(box(ox, oy + SH - 96, SW2, 96, { r: 0, fill: C.paper, stroke: C.line }));
    p.push(text(ox + 20, oy + SH - 56, "₹2,499", { size: 18, weight: 700 }));
    p.push(text(ox + 20, oy + SH - 38, "Free delivery Fri", { size: 10, weight: 400, fill: C.ink500 }));
    p.push(button(ox + 130, oy + SH - 74, 110, 44, "Add", "ghost"));
    p.push(button(ox + 250, oy + SH - 74, 120, 44, "Buy now", "primary"));
    parts.push(g("mobile-pdp", p));
  }

  /* --- C: cart / checkout --- */
  {
    const { ox, oy, chrome } = shell(GAP * 3 + SW2 * 2, "C · Cart → checkout");
    const p = [...chrome];
    p.push(text(ox + 20, oy + 74, "←", { size: 18, weight: 700 }));
    p.push(text(ox + SW2 / 2, oy + 76, "Checkout", { anchor: "middle", size: 14, weight: 700 }));
    // stepper
    ["Cart", "Details", "Done"].forEach((s, i) => {
      const x = ox + 24 + i * 118;
      const active = i <= 1;
      p.push(`<circle cx="${x + 10}" cy="${oy + 116}" r="10" fill="${active ? C.brand : C.paper}" stroke="${active ? C.brand : C.line}"/>`);
      p.push(text(x + 10, oy + 120, String(i + 1), { anchor: "middle", size: 9, weight: 700, fill: active ? "#fff" : C.ink400 }));
      p.push(text(x + 26, oy + 120, s, { size: 11, weight: active ? 700 : 500, fill: active ? C.ink : C.ink400 }));
      if (i < 2) p.push(box(x + 68, oy + 115, 42, 2, { r: 1, fill: C.line, stroke: "none" }));
    });
    // items
    p.push(box(ox + 16, oy + 142, SW2 - 32, 172, { r: 16, fill: C.paper, stroke: C.line }));
    p.push(text(ox + 32, oy + 172, "3 items", { size: 12, weight: 700 }));
    p.push(text(ox + SW2 - 32, oy + 172, "Edit", { anchor: "end", size: 11, weight: 600, fill: C.brand }));
    for (let i = 0; i < 2; i++) {
      const y = oy + 188 + i * 60;
      p.push(imgBox(ox + 32, y, 48, 48, "", { r: 10 }));
      p.push(lines(ox + 92, y + 12, 150, 2, { gap: 13 }));
      p.push(text(ox + SW2 - 32, y + 30, "₹2,499", { anchor: "end", size: 12, weight: 700 }));
    }
    // address
    p.push(box(ox + 16, oy + 328, SW2 - 32, 104, { r: 16, fill: C.paper, stroke: C.line }));
    p.push(text(ox + 32, oy + 358, "Deliver to · Home", { size: 12, weight: 700 }));
    p.push(text(ox + SW2 - 32, oy + 358, "Change", { anchor: "end", size: 11, weight: 600, fill: C.brand }));
    p.push(lines(ox + 32, oy + 374, 220, 3, { gap: 15 }));
    // credits
    p.push(box(ox + 16, oy + 446, SW2 - 32, 84, { r: 16, fill: C.paper, stroke: C.line }));
    p.push(text(ox + 32, oy + 476, "Coupon · gift card · points", { size: 12, weight: 700 }));
    p.push(input(ox + 32, oy + 488, SW2 - 150, 34, "Enter code"));
    p.push(button(ox + SW2 - 108, oy + 488, 76, 34, "Apply", "ghost"));
    // summary
    p.push(box(ox + 16, oy + 544, SW2 - 32, 150, { r: 16, fill: C.paper, stroke: C.line }));
    [["Subtotal", "₹7,497"], ["Discount", "−₹749"], ["Shipping", "Free"], ["Tax", "₹1,214"]].forEach(([k, v], i) => {
      p.push(text(ox + 32, oy + 578 + i * 24, k, { size: 11, weight: 500, fill: C.ink500 }));
      p.push(text(ox + SW2 - 32, oy + 578 + i * 24, v, { anchor: "end", size: 11, weight: 600 }));
    });
    p.push(text(ox + 32, oy + 678, "Total", { size: 13, weight: 700 }));
    p.push(text(ox + SW2 - 32, oy + 678, "₹7,891", { anchor: "end", size: 15, weight: 700 }));
    // sticky pay bar
    p.push(box(ox, oy + SH - 90, SW2, 90, { r: 0, fill: C.paper, stroke: C.line }));
    p.push(button(ox + 16, oy + SH - 72, SW2 - 32, 50, "Pay ₹7,891", "primary"));
    p.push(text(ox + SW2 / 2, oy + SH - 12, "Secure · guest checkout supported", { anchor: "middle", size: 9, fill: C.ink400 }));
    parts.push(g("mobile-checkout", p));
  }

  parts.push(
    g("annotations", [
      note(GAP + 12, SH + 74, 1, "Persistent bottom tab bar replaces the hamburger for the 5 core jobs"),
      note(GAP * 2 + SW2 + 12, SH + 74, 2, "Sticky buy bar keeps price + CTA docked"),
      note(GAP * 3 + SW2 * 2 + 12, SH + 74, 3, "One-screen checkout, sticky pay bar"),
    ])
  );

  frame({
    name: "06-mobile-flows",
    w: W,
    h: H,
    title: "06 · Mobile (390 × 844)",
    subtitle: "Storefront · product detail · cart→checkout — bottom tab bar + sticky action bars",
    body: parts.join("\n"),
  });
}

/* ========================================================= 07 component sheet */
{
  const W = 1440,
    H = 1080,
    M = 64;
  const b = [];
  const panel = (x, y, w, h, title) =>
    [box(x, y, w, h, { r: 16, fill: C.paper, stroke: C.line }), sectionLabel(x + 20, y + 28, title)].join("\n");

  // colours
  b.push(panel(M, 32, W - M * 2, 150, "Colour"));
  const swatches = [
    ["brand/600", C.brand], ["brand/100", C.brandSoft], ["accent/500", C.accent],
    ["ink/900", C.ink], ["ink/500", C.ink500], ["ink/400", C.ink400],
    ["canvas", C.canvas], ["paper", C.paper], ["line", C.line],
    ["success", C.success], ["warning", "#F0A020"], ["danger", C.danger],
  ];
  swatches.forEach(([n, c], i) => {
    const x = M + 20 + i * 108;
    b.push(box(x, 52, 92, 62, { r: 12, fill: c, stroke: C.line }));
    b.push(text(x, 132, n, { size: 10, weight: 700 }));
    b.push(text(x, 146, c, { size: 9, weight: 400, fill: C.ink400 }));
  });

  // type
  b.push(panel(M, 200, (W - M * 2) * 0.48, 300, "Type scale"));
  [
    ["Display 56 / Instrument Serif", 30],
    ["H1 36 / Inter Tight 700", 24],
    ["H2 28 / Inter Tight 700", 20],
    ["H3 21 / Inter Tight 600", 17],
    ["Body 15 / Inter 400", 14],
    ["Small 13 / Inter 500", 12],
    ["EYEBROW 11 / 700 · 0.16em", 10],
  ].forEach(([s, sz], i) => b.push(text(M + 20, 250 + i * 34, s, { size: sz, weight: i < 4 ? 700 : 500 })));

  // buttons/inputs
  const px = M + (W - M * 2) * 0.5;
  const pw = (W - M * 2) * 0.5;
  b.push(panel(px, 200, pw, 300, "Actions & inputs"));
  b.push(button(px + 20, 232, 130, 44, "Primary", "primary"));
  b.push(button(px + 162, 232, 130, 44, "Dark", "dark"));
  b.push(button(px + 304, 232, 130, 44, "Accent", "accent"));
  b.push(button(px + 446, 232, 130, 44, "Ghost", "ghost"));
  b.push(input(px + 20, 292, 260, 44, "Text input"));
  b.push(input(px + 296, 292, 280, 44, "Search with icon"));
  b.push(pill(px + 20, 352, 92, 28, "Chip"));
  b.push(pill(px + 122, 352, 110, 28, "Chip · active", { fill: C.brandSoft, stroke: C.brandSoft, color: C.brand }));
  b.push(pill(px + 242, 352, 84, 28, "SALE", { fill: C.danger, stroke: C.danger, color: "#fff" }));
  b.push(pill(px + 336, 352, 100, 28, "In stock", { fill: "#E3F7EF", stroke: "#E3F7EF", color: C.success }));
  b.push(pill(px + 446, 352, 110, 28, "Low stock 3", { fill: "#FDF1DC", stroke: "#FDF1DC", color: "#B07A16" }));
  b.push(text(px + 20, 410, "Radius: xs 6 · sm 10 · md 14 · lg 20 · xl 28 · pill", { size: 11, weight: 500, fill: C.ink500 }));
  b.push(text(px + 20, 432, "Shadow: xs / sm / md / lg / brand", { size: 11, weight: 500, fill: C.ink500 }));
  b.push(text(px + 20, 454, "Motion: 150ms ease-out (hover) · 240ms cubic-bezier(.21,1.02,.73,1) (enter)", { size: 11, weight: 500, fill: C.ink500 }));
  b.push(text(px + 20, 476, "Focus: 2px brand/55 ring, 2px offset · respects prefers-reduced-motion", { size: 11, weight: 500, fill: C.ink500 }));

  // product card anatomy
  b.push(panel(M, 520, (W - M * 2) * 0.32, 520, "Product card — anatomy"));
  const cx2 = M + 40,
    cy2 = 566,
    cw3 = (W - M * 2) * 0.32 - 80;
  b.push(box(cx2, cy2, cw3, 380, { r: 16, fill: C.paper, stroke: C.line }));
  b.push(imgBox(cx2 + 1, cy2 + 1, cw3 - 2, 200, "4:3 cover", { r: 15 }));
  b.push(pill(cx2 + 12, cy2 + 12, 60, 22, "SALE", { fill: C.danger, stroke: C.danger, color: "#fff", size: 9 }));
  b.push(`<circle cx="${cx2 + cw3 - 26}" cy="${cy2 + 26}" r="15" fill="${C.paper}" stroke="${C.line}"/>`);
  b.push(text(cx2 + cw3 - 26, cy2 + 31, "♡", { anchor: "middle", size: 13, fill: C.ink500 }));
  b.push(text(cx2 + 16, cy2 + 230, "BRAND", { size: 9, weight: 700, fill: C.ink400, tracking: "0.14em" }));
  b.push(text(cx2 + 16, cy2 + 254, "Product name, two lines max", { size: 13, weight: 600 }));
  b.push(text(cx2 + 16, cy2 + 280, "★★★★☆  4.6 (128)", { size: 11, weight: 500, fill: C.ink500 }));
  b.push(text(cx2 + 16, cy2 + 314, "₹2,499", { size: 18, weight: 700 }));
  b.push(text(cx2 + 96, cy2 + 314, "₹3,699", { size: 11, weight: 400, fill: C.ink400 }));
  b.push(box(cx2 + 1, cy2 + 332, cw3 - 2, 47, { r: 15, fill: C.ink, stroke: C.ink }));
  b.push(text(cx2 + cw3 / 2, cy2 + 361, "+  Add to cart   (hover / always on touch)", { anchor: "middle", size: 11, weight: 700, fill: C.paper }));

  // states
  b.push(panel(M + (W - M * 2) * 0.34, 520, (W - M * 2) * 0.32, 520, "States & feedback"));
  const sx2 = M + (W - M * 2) * 0.34 + 20;
  b.push(box(sx2, 566, (W - M * 2) * 0.32 - 40, 120, { r: 14, fill: C.paper, stroke: C.lineSoft, dash: "5 5" }));
  b.push(text(sx2 + 20, 610, "Empty state", { size: 13, weight: 700 }));
  b.push(text(sx2 + 20, 630, "Icon + one-line reason + one action", { size: 11, weight: 400, fill: C.ink500 }));
  b.push(button(sx2 + 20, 644, 120, 32, "Browse shop", "ghost"));
  b.push(box(sx2, 702, (W - M * 2) * 0.32 - 40, 110, { r: 14, fill: C.paper, stroke: C.line }));
  b.push(text(sx2 + 20, 730, "Skeleton", { size: 12, weight: 700 }));
  b.push(imgBox(sx2 + 20, 742, 56, 56, "", { r: 10 }));
  b.push(lines(sx2 + 88, 754, 180, 3, { gap: 16 }));
  b.push(box(sx2, 828, (W - M * 2) * 0.32 - 40, 56, { r: 12, fill: "#FCE8EB", stroke: "#F5C2CA" }));
  b.push(text(sx2 + 20, 862, "Error - inline, never a blocking modal", { size: 12, weight: 600, fill: C.danger }));
  b.push(box(sx2, 900, (W - M * 2) * 0.32 - 40, 56, { r: 12, fill: C.ink, stroke: C.ink }));
  b.push(text(sx2 + 20, 934, "Toast - bottom-right, 3s, single line", { size: 12, weight: 600, fill: C.paper }));

  // grid + spacing
  b.push(panel(M + (W - M * 2) * 0.68, 520, (W - M * 2) * 0.32, 520, "Layout rules"));
  const lx = M + (W - M * 2) * 0.68 + 20;
  [
    "Container 1280 · gutters 16 / 32",
    "Grid 12 col desktop · 8 tablet · 4 mobile",
    "Card grid 4-up ≥1280 · 3-up ≥1024 · 2-up ≥640 · 1-up",
    "Vertical rhythm: 8pt · sections 48/64",
    "Sticky: header 68 · toolbar 56 · summary top-24",
    "Mobile bottom nav 62 + safe-area inset",
    "Max line length 68ch for body copy",
    "Touch target ≥ 44 × 44",
  ].forEach((s, i) => b.push(text(lx, 570 + i * 30, "· " + s, { size: 12, weight: 500, fill: C.ink500 })));
  b.push(text(lx, 830, "Accessibility", { size: 12, weight: 700 }));
  [
    "Contrast ≥ 4.5:1 body / 3:1 large",
    "Every icon-only button has aria-label",
    "Focus ring visible on keyboard only",
    "Reduced-motion disables enter animations",
  ].forEach((s, i) => b.push(text(lx, 856 + i * 24, "· " + s, { size: 11, weight: 500, fill: C.ink500 })));

  frame({
    name: "07-component-sheet",
    w: W,
    h: H,
    title: "07 · Component sheet & design tokens",
    subtitle: "Colour · type · actions · card anatomy · states · layout rules — the Figma library page",
    body: b.join("\n"),
  });
}

console.log("\nWireframes written to design/wireframes/");
