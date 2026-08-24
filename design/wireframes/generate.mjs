/**
 * Cartly Editorial — current implementation wireframes.
 *
 * Source of truth for the seven SVG artboards in this directory. These frames
 * intentionally mirror the shipped React storefront (2026-08-24): no category
 * rail, no floating catalog toolbar, no violet/lime system, and no fake paid
 * payment state before provider confirmation.
 *
 * Run: node design/wireframes/generate.mjs
 */
import { writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const OUT = dirname(fileURLToPath(import.meta.url));
mkdirSync(OUT, { recursive: true });

const C = {
  paper: "#FBF9F4", canvas: "#F4F0E8", sunken: "#E9E2D7",
  line: "#DAD0C3", lineStrong: "#C2B5A5", ink: "#221A16",
  muted: "#6B5E56", soft: "#74675F", rust: "#A4472D",
  rustDark: "#8E3823", rustSoft: "#F3E2D9", brass: "#C8A96B",
  success: "#0E6F50", warning: "#9A5A0A", danger: "#B3263E",
};
const BODY = `font-family="Inter, 'Helvetica Neue', Arial, sans-serif"`;
const DISPLAY = `font-family="Instrument Serif, Georgia, serif"`;
const esc = (value) => String(value).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const group = (name, children) => `<g id="${esc(name)}" data-name="${esc(name)}">\n${children.filter(Boolean).join("\n")}\n</g>`;
const rect = (x, y, w, h, options = {}) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${options.r ?? 2}" fill="${options.fill ?? C.paper}" stroke="${options.stroke ?? C.line}" stroke-width="${options.sw ?? 1}"${options.dash ? ` stroke-dasharray="${options.dash}"` : ""}${options.opacity ? ` opacity="${options.opacity}"` : ""}/>`;
const text = (x, y, value, options = {}) => `<text x="${x}" y="${y}" ${options.display ? DISPLAY : BODY} font-size="${options.size ?? 13}" font-weight="${options.weight ?? 500}" fill="${options.fill ?? C.ink}" text-anchor="${options.anchor ?? "start"}"${options.tracking ? ` letter-spacing="${options.tracking}"` : ""}>${esc(value)}</text>`;
const rule = (x1, y1, x2, y2, color = C.line) => `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${color}"/>`;
const image = (x, y, w, h, label) => group(label, [rect(x, y, w, h, { fill: C.sunken, stroke: C.lineStrong }), rule(x, y, x + w, y + h, C.lineStrong), rule(x + w, y, x, y + h, C.lineStrong), text(x + w / 2, y + h / 2 + 4, label, { anchor: "middle", size: 11, fill: C.soft })]);
const button = (x, y, w, h, label, kind = "primary") => {
  const style = kind === "primary" ? { fill: C.rust, stroke: C.rust, color: C.paper }
    : kind === "dark" ? { fill: C.ink, stroke: C.ink, color: C.paper }
    : { fill: C.paper, stroke: C.lineStrong, color: C.ink };
  return group(`button-${label}`, [rect(x, y, w, h, { r: 2, fill: style.fill, stroke: style.stroke }), text(x + w / 2, y + h / 2 + 4, label, { anchor: "middle", size: 11, weight: 700, fill: style.color })]);
};
const input = (x, y, w, h, label) => group(`input-${label}`, [rect(x, y, w, h, { r: 2 }), text(x + 12, y + h / 2 + 4, label, { size: 11, fill: C.soft, weight: 400 })]);
const chip = (x, y, w, label, active = false) => group(`chip-${label}`, [rect(x, y, w, 28, { r: 14, fill: active ? C.ink : C.paper, stroke: active ? C.ink : C.lineStrong }), text(x + w / 2, y + 18, label, { anchor: "middle", size: 10, weight: 650, fill: active ? C.paper : C.ink })]);
const eyebrow = (x, y, value) => text(x, y, value.toUpperCase(), { size: 9, weight: 750, fill: C.rust, tracking: "0.18em" });
const note = (x, y, number, value) => group(`note-${number}`, [`<circle cx="${x}" cy="${y}" r="9" fill="${C.rust}"/>`, text(x, y + 4, number, { anchor: "middle", size: 10, weight: 750, fill: C.paper }), text(x + 15, y + 4, value, { size: 10, fill: C.rustDark })]);
const productCard = (x, y, w, index = 1) => group(`product-card-${index}`, [
  image(x, y, w, 190, "merchant product image"),
  eyebrow(x, y + 216, "Maker / category"),
  text(x, y + 242, "Considered everyday object", { size: 16, display: true }),
  text(x, y + 265, "★ 4.7  ·  86 reviews", { size: 10, fill: C.soft }),
  text(x, y + 291, "₹2,499", { size: 15, weight: 750 }),
  button(x, y + 306, w, 36, "Add to cart", index === 1 ? "primary" : "ghost"),
]);

function frame({ name, width, height, title, subtitle, body }) {
  const head = 76;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height + head}" viewBox="0 0 ${width} ${height + head}">
<rect width="${width}" height="${height + head}" fill="${C.paper}"/>
${text(28, 31, title, { size: 18, weight: 700 })}
${text(28, 53, subtitle, { size: 11, fill: C.muted, weight: 400 })}
${text(width - 28, 31, `${width} × ${height}`, { anchor: "end", size: 10, fill: C.soft })}
${text(width - 28, 53, "Cartly Editorial · implementation-aligned · 24 Aug 2026", { anchor: "end", size: 10, fill: C.soft })}
<g transform="translate(0 ${head})"><rect width="${width}" height="${height}" fill="${C.canvas}" stroke="${C.line}"/>${body}</g>
</svg>`;
  writeFileSync(join(OUT, `${name}.svg`), svg);
  console.log(`✓ ${name}.svg`);
}

function shellHeader(width, margin, options = {}) {
  const out = [];
  if (!options.checkout) {
    out.push(rect(0, 0, width, 34, { r: 0, fill: C.ink, stroke: C.ink }));
    out.push(text(width / 2, 22, "Free shipping over ₹999  ·  The seasonal edit", { anchor: "middle", size: 10, fill: C.paper }));
  }
  const y = options.checkout ? 0 : 34;
  out.push(rect(0, y, width, 72, { r: 0, fill: C.paper, stroke: C.line }));
  out.push(text(margin, y + 43, "Cartly", { size: 27, display: true }));
  if (options.checkout) {
    out.push(text(width - margin, y + 40, "Secure checkout  ·  Need help?", { anchor: "end", size: 10, fill: C.muted }));
  } else {
    out.push(text(margin + 135, y + 41, "SHOP     DEALS     GIFT CARDS     REWARDS", { size: 10, weight: 700, tracking: "0.08em" }));
    out.push(input(width - margin - 420, y + 17, 235, 38, "Search products, brands…  ⌘K"));
    out.push(text(width - margin - 164, y + 42, "हि   ◐   Account", { size: 11, fill: C.muted }));
    out.push(button(width - margin - 72, y + 18, 72, 36, "Bag · 3", "dark"));
  }
  return group(options.checkout ? "checkout-header" : "storefront-header", out);
}

// 01 — shell
{
  const W = 1440, H = 900, M = 80;
  const body = [shellHeader(W, M),
    group("page-content", [rect(M, 142, W - 2 * M, 390, { fill: C.paper, dash: "6 6" }), text(W / 2, 337, "PAGE CONTENT  ·  editorial sections on one continuous canvas", { anchor: "middle", size: 13, fill: C.soft })]),
    group("footer", [rect(0, 572, W, 328, { r: 0, fill: C.ink, stroke: C.ink }), text(M, 628, "Cartly", { size: 28, display: true, fill: C.paper }), text(M, 656, "A considered collection for home and life.", { size: 11, fill: C.lineStrong }), ...["Shop", "Account", "Support"].flatMap((label, i) => [text(460 + i * 210, 626, label, { size: 11, weight: 750, fill: C.paper }), text(460 + i * 210, 651, "Four concise destination links", { size: 10, fill: C.lineStrong })]), text(M, 850, "© 2026 Cartly  ·  Curated for everyday  ·  Hyderabad, India", { size: 10, fill: C.lineStrong })]),
    note(M + 40, 126, 1, "Typographic wordmark; no generic cart/app icon"),
    note(700, 548, 2, "No category rail below the header"),
  ].join("\n");
  frame({ name: "01-global-shell-desktop", width: W, height: H, title: "01 · Global shell (desktop)", subtitle: "Announcement · editorial wordmark · concise nav · compact visual search · inverse footer", body });
}

// 02 — storefront
{
  const W = 1440, H = 1870, M = 80, CW = W - 2 * M;
  const b = [shellHeader(W, M)];
  b.push(group("editorial-hero", [
    rect(M, 142, 560, 420, { fill: C.paper, stroke: "none" }), eyebrow(M + 34, 194, "The seasonal edit"),
    text(M + 34, 248, "Curated finds", { size: 48, display: true }), text(M + 34, 297, "for home & life.", { size: 48, display: true, fill: C.rust }),
    text(M + 34, 344, "Thoughtful objects, honest materials and everyday", { size: 12, fill: C.muted }), text(M + 34, 364, "essentials selected to last.", { size: 12, fill: C.muted }),
    button(M + 34, 405, 150, 42, "Shop the collection"), button(M + 196, 405, 130, 42, "Explore the edit", "ghost"),
    text(M + 34, 516, "THE CARTLY EDIT  ·  VOL. 01", { size: 9, tracking: "0.16em", fill: C.soft }),
    image(M + 560, 142, CW - 560, 420, "editorial campaign image"),
  ]));
  b.push(group("trust-strip", [rule(M, 604, W - M, 604, C.lineStrong), ...["Free shipping · over ₹999", "7-day returns", "Secure checkout", "Dispatch in 24h"].map((label, i) => text(M + i * 320, 642, label, { size: 11, weight: 650 })), rule(M, 665, W - M, 665, C.line)]));
  b.push(eyebrow(M, 720, "Browse the edit"), text(M, 758, "Shop by category", { size: 34, display: true }));
  b.push(group("editorial-category-tiles", Array.from({ length: 4 }, (_, i) => {
    const x = M + i * 320; return group(`category-tile-${i + 1}`, [image(x, 790, 292, i % 2 ? 205 : 250, "category photography"), text(x, i % 2 ? 1022 : 1067, ["Home", "Fashion", "Beauty", "Electronics"][i], { size: 19, display: true })]);
  })));
  b.push(eyebrow(M, 1142, "The collection"), text(M, 1180, "Objects worth keeping", { size: 34, display: true }));
  b.push(text(W - M, 1178, "84 products     Sort: Newest", { anchor: "end", size: 11, fill: C.muted }));
  b.push(group("catalog", [
    group("facet-sidebar", [rule(M, 1212, M + 246, 1212, C.ink), eyebrow(M, 1240, "Refine"), text(M, 1275, "Category", { size: 12, weight: 700 }), chip(M, 1290, 56, "All", true), chip(M + 64, 1290, 82, "Home"), text(M, 1352, "Brand", { size: 12, weight: 700 }), text(M, 1380, "□ Studio maker              18", { size: 10, fill: C.muted }), text(M, 1405, "□ Cartly edit                 12", { size: 10, fill: C.muted }), text(M, 1452, "Price", { size: 12, weight: 700 }), input(M, 1470, 108, 34, "Min ₹"), input(M + 116, 1470, 108, 34, "Max ₹"), text(M, 1537, "Rating", { size: 12, weight: 700 }), text(M, 1565, "○ 4★ & up", { size: 10, fill: C.muted })]),
    ...Array.from({ length: 3 }, (_, i) => productCard(M + 286 + i * 324, 1212, 292, i + 1)),
  ]));
  b.push(note(M + 650, 1116, 1, "No Browse rail and no floating/sticky search-filter toolbar"));
  b.push(note(M + 530, 1810, 2, "Filters remain a quiet left column; merchant imagery leads"));
  frame({ name: "02-storefront-desktop", width: W, height: H, title: "02 · Storefront / catalog (desktop)", subtitle: "Image-led editorial hero → trust → category stories → inline results header → facets + product grid", body: b.join("\n") });
}

// 03 — product detail
{
  const W = 1440, H = 1260, M = 80;
  const b = [shellHeader(W, M), text(M, 138, "Home  /  Collection  /  Considered everyday object", { size: 10, fill: C.soft })];
  b.push(group("gallery", [image(M, 170, 650, 630, "merchant product gallery"), ...Array.from({ length: 4 }, (_, i) => image(M + i * 104, 820, 88, 88, `view ${i + 1}`))]));
  b.push(group("buy-box", [eyebrow(790, 190, "Studio maker"), text(790, 238, "Considered everyday", { size: 40, display: true }), text(790, 278, "object", { size: 40, display: true }), text(790, 316, "★ 4.7  ·  86 reviews", { size: 11, fill: C.muted }), text(790, 362, "₹2,499", { size: 26, weight: 750 }), text(886, 360, "₹3,199", { size: 12, fill: C.soft }), rule(790, 388, 1280, 388), eyebrow(790, 426, "Choose a variation"), chip(790, 443, 76, "Natural", true), chip(875, 443, 64, "Black"), chip(948, 443, 72, "Walnut"), text(790, 510, "In stock  ·  dispatches within 24 hours", { size: 11, fill: C.success }), button(790, 540, 330, 48, "Add to bag"), button(1132, 540, 148, 48, "Compare", "ghost"), rule(790, 620, 1280, 620), text(790, 656, "Free delivery over ₹999", { size: 12, weight: 700 }), text(790, 678, "Standard and express rates shown before payment", { size: 10, fill: C.muted }), text(790, 718, "7-day returns", { size: 12, weight: 700 }), text(790, 740, "Refunded to original gift card and/or provider", { size: 10, fill: C.muted }), rule(790, 774, 1280, 774), eyebrow(790, 812, "Details"), text(790, 842, "Description     Materials & care     Reviews     Shipping", { size: 11, weight: 650 })]));
  b.push(group("recommendations", [rule(M, 960, W - M, 960, C.ink), eyebrow(M, 998, "Complete the edit"), text(M, 1036, "Often chosen together", { size: 31, display: true }), ...Array.from({ length: 3 }, (_, i) => image(M + 450 + i * 265, 990, 235, 190, "related product"))]));
  b.push(note(790, 162, 1, "Purchase facts stay beside the decision, not in hidden tabs"));
  frame({ name: "03-product-detail-desktop", width: W, height: H, title: "03 · Product detail (desktop)", subtitle: "Merchant gallery · editorial buy box · variations · delivery/returns · long-form detail · related products", body: b.join("\n") });
}

// 04 — enclosed checkout
{
  const W = 1440, H = 1240, M = 120;
  const b = [shellHeader(W, M, { checkout: true }), text(M, 112, "CART     DETAILS     CONFIRMATION", { size: 10, weight: 700, tracking: "0.12em" }), text(M, 164, "Checkout", { size: 40, display: true })];
  const section = (y, n, title, subtitle) => group(`checkout-section-${n}`, [rule(M, y, 890, y, n === 1 ? C.ink : C.line), rect(M, y + 24, 28, 28, { fill: C.paper, stroke: C.ink }), text(M + 14, y + 43, n, { anchor: "middle", size: 11, weight: 700 }), text(M + 44, y + 45, title, { size: 22, display: true }), text(M + 44, y + 65, subtitle, { size: 10, fill: C.muted })]);
  b.push(section(200, 1, "Delivery address", "Guest checkout supported; pincode required"), input(M + 44, 282, 310, 40, "State"), input(M + 366, 282, 310, 40, "District"), input(M + 44, 334, 632, 40, "Address"), input(M + 44, 386, 220, 40, "6-digit pincode"));
  b.push(section(466, 2, "Delivery method", "Server rate for the selected pincode"), rect(M + 44, 544, 296, 72, { fill: C.rustSoft, stroke: C.rust }), text(M + 62, 572, "Standard  ·  3–5 days", { size: 11, weight: 700 }), text(M + 62, 596, "Free over threshold", { size: 10, fill: C.muted }), rect(M + 352, 544, 296, 72), text(M + 370, 572, "Express  ·  1–2 days", { size: 11, weight: 700 }), text(M + 370, 596, "₹100", { size: 10, fill: C.muted }));
  b.push(section(648, 3, "Payment", "Provider initiation is not settlement"), rect(M + 44, 726, 296, 74, { fill: C.rustSoft, stroke: C.rust }), text(M + 62, 756, "Card / UPI", { size: 11, weight: 700 }), text(M + 62, 778, "Pending until signed provider confirmation", { size: 9, fill: C.muted }), rect(M + 352, 726, 296, 74), text(M + 370, 756, "Cash on delivery", { size: 11, weight: 700 }), text(M + 370, 778, "Pay the courier on arrival", { size: 9, fill: C.muted }));
  b.push(section(832, 4, "Credits & extras", "All amounts validated and applied by commerce"), input(M + 44, 910, 250, 40, "Coupon code"), input(M + 306, 910, 250, 40, "Gift card code"), input(M + 568, 910, 108, 40, "Points"), text(M + 44, 982, "□ Gift wrap this order (+₹50)", { size: 11 }));
  b.push(group("order-summary", [rule(970, 200, 1320, 200, C.ink), text(970, 238, "Order summary", { size: 27, display: true }), text(970, 282, "Subtotal (3 items)", { size: 11, fill: C.muted }), text(1320, 282, "₹3,420", { anchor: "end", size: 11, weight: 700 }), text(970, 318, "Coupon", { size: 11, fill: C.success }), text(1320, 318, "−₹200", { anchor: "end", size: 11, fill: C.success }), text(970, 354, "100 loyalty points", { size: 11, fill: C.success }), text(1320, 354, "−₹10", { anchor: "end", size: 11, fill: C.success }), text(970, 390, "Shipping", { size: 11, fill: C.muted }), text(1320, 390, "Free", { anchor: "end", size: 11 }), text(970, 426, "GST", { size: 11, fill: C.muted }), text(1320, 426, "₹577.80", { anchor: "end", size: 11 }), rule(970, 454, 1320, 454), text(970, 492, "Estimated total", { size: 12, weight: 700 }), text(1320, 492, "₹3,787.80", { anchor: "end", size: 23, display: true }), text(970, 530, "Gift-card balance is applied securely", { size: 9, fill: C.soft }), text(970, 548, "after tax; provider is charged only the remainder.", { size: 9, fill: C.soft }), button(970, 582, 350, 46, "Place order", "primary"), text(1145, 656, "Encrypted · authoritative server totals", { anchor: "middle", size: 9, fill: C.soft })]));
  b.push(note(970, 178, 1, "Enclosed checkout removes storefront navigation and promotions"), note(M + 44, 1048, 2, "Coupon → loyalty → tax → gift-card tender → provider remainder"));
  frame({ name: "04-cart-checkout-desktop", width: W, height: H, title: "04 · Cart → checkout (desktop)", subtitle: "Enclosed header · address · delivery · provider-confirmed payment · order-bound credits · summary", body: b.join("\n") });
}

// 05 — admin
{
  const W = 1440, H = 980, rail = 252;
  const b = [group("admin-rail", [rect(0, 0, rail, H, { r: 0, fill: C.ink, stroke: C.ink }), text(28, 48, "Cartly", { size: 27, display: true, fill: C.paper }), eyebrow(28, 70, "Studio administration"), ...["Dashboard", "Orders", "Products", "Categories", "Coupons", "Returns", "Storefront", "Audit log", "Customers"].map((label, i) => group(`nav-${label}`, [rect(16, 100 + i * 48, 220, 36, { fill: i === 0 ? "#3A302A" : C.ink, stroke: "none" }), text(34, 123 + i * 48, label, { size: 11, weight: 650, fill: i === 0 ? C.paper : C.lineStrong })])), rule(16, 868, 236, 868, "#453932"), text(28, 905, "AK   Anjan K", { size: 11, weight: 700, fill: C.paper }), text(28, 928, "Super admin", { size: 9, fill: C.lineStrong })])];
  b.push(group("admin-topbar", [rect(rail, 0, W - rail, 74, { r: 0, fill: C.paper, stroke: C.line }), text(rail + 32, 35, "Dashboard", { size: 24, display: true }), text(rail + 32, 55, "Admin console · 24 Aug 2026", { size: 9, fill: C.soft })]));
  const x = rail + 32, y = 112, cardW = 258;
  b.push(group("kpis", ["Revenue today|₹48,210", "Orders|126", "Average order|₹2,140", "Returns pending|7"].map((item, i) => { const [label, value] = item.split("|"); return group(`kpi-${i + 1}`, [rule(x + i * 276, y, x + i * 276 + cardW, y, C.ink), eyebrow(x + i * 276, y + 30, label), text(x + i * 276, y + 72, value, { size: 30, display: true })]); })));
  b.push(group("analytics", [rect(x, 238, 650, 280), eyebrow(x + 22, 270, "Revenue · 7 days"), `<polyline points="${x + 28},470 ${x + 115},430 ${x + 205},446 ${x + 300},360 ${x + 395},386 ${x + 500},300 ${x + 620},326" fill="none" stroke="${C.rust}" stroke-width="3"/>`, rect(x + 674, 238, 430, 280), eyebrow(x + 698, 270, "Orders by status"), ...["Pending  18", "Paid  62", "Approved  31", "Returns  7"].map((label, i) => text(x + 698, 316 + i * 42, label, { size: 12, weight: 650 }))]));
  b.push(group("operations-table", [rule(x, 570, W - 32, 570, C.ink), text(x, 610, "Recent orders", { size: 27, display: true }), text(W - 32, 607, "View all →", { anchor: "end", size: 10, fill: C.rust }), rect(x, 636, W - x - 32, 244), ...["ORDER", "CUSTOMER", "STATUS", "TOTAL", "PLACED"].map((label, i) => text(x + 18 + [0, 250, 520, 710, 880][i], 666, label, { size: 9, weight: 750, fill: C.soft })), ...Array.from({ length: 4 }, (_, row) => group(`order-row-${row + 1}`, [rule(x, 686 + row * 46, W - 32, 686 + row * 46), text(x + 18, 713 + row * 46, `#${["8A21F", "742BC", "19D0A", "55E81"][row]}`, { size: 10, weight: 700 }), text(x + 268, 713 + row * 46, ["Maya Rao", "Arun Shah", "Isha K", "Dev Patel"][row], { size: 10 }), text(x + 538, 713 + row * 46, ["PAID", "PENDING", "RETURN", "PAID"][row], { size: 9, fill: row === 2 ? C.warning : C.success }), text(x + 728, 713 + row * 46, ["₹3,420", "₹840", "₹1,299", "₹5,110"][row], { size: 10 })]))]));
  b.push(note(x + 720, 94, 1, "Managers see only Dashboard, Orders and Returns"), note(x + 760, 916, 2, "Audit log captures privileged mutations including gift-card issuance"));
  frame({ name: "05-admin-console-desktop", width: W, height: H, title: "05 · Admin console (desktop)", subtitle: "Separate ink shell · role-scoped nav · operational metrics · work queue · audit visibility", body: b.join("\n") });
}

// 06 — mobile flows
{
  const W = 1354, H = 940, phoneW = 390, phoneH = 844, gap = 52, top = 54;
  const phone = (x, title, content) => group(title, [text(x, 30, title, { size: 13, weight: 700 }), rect(x, top, phoneW, phoneH, { r: 24, fill: C.paper, stroke: C.lineStrong }), ...content(x, top)]);
  const status = (x, y) => [text(x + 18, y + 24, "9:41", { size: 9, weight: 700 }), text(x + 350, y + 24, "5G  100%", { anchor: "end", size: 8 })];
  const b = [];
  b.push(phone(28, "A · Storefront", (x, y) => [...status(x, y), text(x + 20, y + 66, "Cartly", { size: 25, display: true }), text(x + 352, y + 64, "हि   Bag", { anchor: "end", size: 10 }), input(x + 20, y + 84, 350, 38, "Search products…"), image(x + 20, y + 142, 350, 250, "seasonal editorial image"), eyebrow(x + 38, y + 180, "The seasonal edit"), text(x + 38, y + 225, "Curated finds", { size: 31, display: true }), text(x + 38, y + 258, "for home & life.", { size: 31, display: true, fill: C.rust }), button(x + 38, y + 286, 126, 38, "Shop collection"), text(x + 20, y + 438, "Objects worth keeping", { size: 24, display: true }), image(x + 20, y + 460, 168, 150, "product"), image(x + 202, y + 460, 168, 150, "product"), text(x + 20, y + 638, "Shop      Search      Bag      Orders      You", { size: 9, weight: 650 }), rect(x, y + 784, phoneW, 60, { r: 0, fill: C.paper, stroke: C.line })]));
  b.push(phone(28 + phoneW + gap, "B · Product", (x, y) => [...status(x, y), text(x + 20, y + 66, "‹  Product", { size: 12, weight: 700 }), image(x + 20, y + 88, 350, 310, "merchant gallery"), eyebrow(x + 20, y + 430, "Studio maker"), text(x + 20, y + 470, "Considered object", { size: 31, display: true }), text(x + 20, y + 505, "₹2,499     ★ 4.7", { size: 15, weight: 700 }), chip(x + 20, y + 532, 72, "Natural", true), chip(x + 100, y + 532, 62, "Black"), text(x + 20, y + 592, "Free delivery over ₹999", { size: 10, weight: 700 }), text(x + 20, y + 620, "7-day returns · refund to original tender", { size: 10, fill: C.muted }), rect(x, y + 766, phoneW, 78, { r: 0, fill: C.paper, stroke: C.line }), button(x + 20, y + 786, 350, 42, "Add to bag") ]));
  b.push(phone(28 + 2 * (phoneW + gap), "C · Enclosed checkout", (x, y) => [...status(x, y), text(x + 20, y + 68, "Cartly", { size: 24, display: true }), text(x + 370, y + 65, "Secure", { anchor: "end", size: 9, fill: C.muted }), rule(x + 20, y + 88, x + 370, y + 88), text(x + 20, y + 126, "Checkout", { size: 31, display: true }), text(x + 20, y + 172, "1   Delivery address", { size: 13, weight: 700 }), input(x + 20, y + 190, 350, 38, "Address and pincode"), text(x + 20, y + 266, "2   Delivery method", { size: 13, weight: 700 }), rect(x + 20, y + 284, 350, 54, { fill: C.rustSoft, stroke: C.rust }), text(x + 34, y + 315, "Standard · Free", { size: 10, weight: 700 }), text(x + 20, y + 382, "3   Payment", { size: 13, weight: 700 }), rect(x + 20, y + 400, 350, 58), text(x + 34, y + 426, "Card / UPI", { size: 10, weight: 700 }), text(x + 34, y + 445, "Pending until provider confirms", { size: 8, fill: C.muted }), text(x + 20, y + 502, "4   Credits & extras", { size: 13, weight: 700 }), input(x + 20, y + 520, 350, 38, "Coupon · gift card · loyalty"), rect(x, y + 744, phoneW, 100, { r: 0, fill: C.paper, stroke: C.line }), text(x + 20, y + 776, "Total", { size: 10, fill: C.muted }), text(x + 370, y + 777, "₹3,787.80", { anchor: "end", size: 17, display: true }), button(x + 20, y + 792, 350, 38, "Place order") ]));
  frame({ name: "06-mobile-flows", width: W, height: H, title: "06 · Mobile flows (390 × 844)", subtitle: "Editorial storefront with bottom nav · product decision · enclosed checkout with docked total", body: b.join("\n") });
}

// 07 — components
{
  const W = 1440, H = 1100, M = 64;
  const b = [eyebrow(M, 48, "Foundations"), text(M, 86, "Editorial Warmth", { size: 34, display: true }), text(M, 114, "Cream canvas · espresso type · rust actions · muted brass detail", { size: 11, fill: C.muted })];
  const swatches = [["canvas", C.canvas], ["paper", C.paper], ["espresso", C.ink], ["rust action", C.rust], ["rust hover", C.rustDark], ["muted brass", C.brass], ["line", C.line], ["success", C.success]];
  b.push(group("color-tokens", swatches.map(([label, color], i) => { const x = M + i * 158; return group(`token-${label}`, [rect(x, 150, 134, 64, { fill: color, stroke: C.lineStrong }), text(x, 236, label, { size: 9, weight: 700 }), text(x, 252, color, { size: 8, fill: C.soft })]); })));
  b.push(group("type", [eyebrow(M, 314, "Type"), text(M, 362, "Beautiful things for everyday life", { size: 39, display: true }), text(M, 402, "Instrument Serif · editorial display and wordmark", { size: 10, fill: C.muted }), text(M, 442, "Inter supports operational UI, prices, forms and navigation.", { size: 14 }), text(M, 470, "Noto Sans Devanagari supports हिन्दी without changing hierarchy.", { size: 13, fill: C.muted })]));
  b.push(group("actions-and-inputs", [eyebrow(760, 314, "Actions & fields"), button(760, 340, 150, 42, "Primary action"), button(924, 340, 150, 42, "Secondary", "ghost"), button(1088, 340, 150, 42, "Dark action", "dark"), input(760, 404, 478, 42, "Field label / value"), chip(760, 466, 72, "Active", true), chip(842, 466, 88, "Category"), chip(940, 466, 96, "Low stock") ]));
  b.push(rule(M, 540, W - M, 540, C.ink));
  b.push(group("product-card-anatomy", [eyebrow(M, 578, "Product card"), productCard(M, 606, 260, 1), note(M + 290, 640, 1, "Merchant image, not editorial placeholder"), note(M + 290, 708, 2, "Minimal metadata and one full-width action"), note(M + 290, 782, 3, "No resting shadow, no stacked badge clutter") ]));
  b.push(group("commerce-states", [eyebrow(650, 578, "Truthful commerce states"), rect(650, 606, 310, 88, { fill: "#E3F7EF", stroke: C.success }), text(670, 635, "Payment confirmed", { size: 12, weight: 700, fill: C.success }), text(670, 660, "Provider reports captured / succeeded", { size: 9, fill: C.muted }), rect(974, 606, 310, 88, { fill: "#FDF1DC", stroke: C.warning }), text(994, 635, "Confirmation pending", { size: 12, weight: 700, fill: C.warning }), text(994, 660, "Initiated is not settled", { size: 9, fill: C.muted }), rect(650, 714, 310, 88, { fill: C.rustSoft, stroke: C.rust }), text(670, 743, "Gift-card wallet", { size: 12, weight: 700 }), text(670, 768, "Purchases disabled until capture exists", { size: 9, fill: C.muted }), rect(974, 714, 310, 88), text(994, 743, "Mixed-tender refund", { size: 12, weight: 700 }), text(994, 768, "Gift card first · provider remainder", { size: 9, fill: C.muted })]));
  b.push(group("rules", [rule(650, 850, 1284, 850, C.ink), eyebrow(650, 884, "Layout rules"), text(650, 918, "• Image-led hierarchy; typography creates rhythm", { size: 11 }), text(650, 946, "• Small corner radii; pills only for compact choices/status", { size: 11 }), text(650, 974, "• No Browse rail or floating catalog toolbar", { size: 11 }), text(650, 1002, "• Checkout is enclosed; server owns every monetary amount", { size: 11 }), text(650, 1030, "• Focus, reduced motion, dark mode and en/hi are first-class", { size: 11 })]));
  frame({ name: "07-component-sheet", width: W, height: H, title: "07 · Components & semantic foundations", subtitle: "Editorial typography · restrained controls · product anatomy · truthful payment/credit states", body: b.join("\n") });
}
