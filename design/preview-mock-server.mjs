/**
 * Cartly Editorial — design preview mock gateway (DEV ONLY).
 *
 * Serves just enough of the API-gateway surface (`:8889`) to review the new
 * frontend without booting Postgres/RabbitMQ/4 Spring Boot services. It is a
 * design tool, not part of the product.
 *
 *   node design/preview-mock-server.mjs        # then: cd frontend && npm start
 */
import { createServer } from "node:http";

const PORT = Number(process.env.MOCK_PORT ?? 8889);

const CATEGORIES = [
  "Electronics", "Home", "Fashion", "Beauty", "Kitchen", "Sports", "Grocery", "Toys & Games", "Books",
].map((name, i) => ({ id: i + 1, name, slug: name.toLowerCase(), parentId: null, sortOrder: i }));

const BRANDS = ["Acme", "Northwind", "Lumen", "Kite", "Orbit", "Cobalt"];

let STORE_SETTINGS = {
  announcementEnabled: true,
  announcementText: "*FLASH SALE! Up to 40% OFF Electronics & Home! Ends Midnight!*",
  announcementLinkText: "Flash sale live",
  announcementLinkUrl: "/flash-sales",
  heroEyebrow: "Fresh drops every week",
  heroTitle: "Explore. Shop.",
  heroEmphasis: "Everyday essentials, delivered fast.",
  heroDescription: "One modern multi-category marketplace for high quality tech, home & everyday essentials.",
  primaryCtaLabel: "Shop Now",
  secondaryCtaLabel: "See today's deals",
  freeShippingThreshold: 999,
};

/* Local Concept B product photography — keyword-matched per demo product. */
const STORE_IMAGES = {
  electronics: "/images/store/tile-electronics.jpg",
  beauty: "/images/store/tile-beauty.jpg",
  kitchen: "/images/store/tile-kitchen.jpg",
  fashion: "/images/store/tile-fashion.jpg",
  home: "/images/store/tile-home.jpg",
  sports: "/images/store/tile-sports.jpg",
  grocery: "/images/store/tile-grocery.jpg",
  toys: "/images/store/tile-toys.jpg",
  gadgets: "/images/store/hero-gadgets.jpg",
  speaker: "/images/store/demo-speaker.jpg",
  textile: "/images/store/demo-textile.jpg",
  productHeadphones: "/images/store/product-headphones.jpg",
  productEarbuds: "/images/store/product-earbuds.jpg",
  productKeyboard: "/images/store/product-keyboard.jpg",
  productWatch: "/images/store/product-watch.jpg",
  productSerum: "/images/store/product-serum.jpg",
  productSkillet: "/images/store/product-skillet.jpg",
  productSneaker: "/images/store/product-sneaker.jpg",
  productYogamat: "/images/store/product-yogamat.jpg",
  productDuffel: "/images/store/product-duffel.jpg",
  productLamp: "/images/store/product-lamp.jpg",
};

/* Priority exact-match rules first, then broad category rules. */
const IMAGE_KEYWORDS = [
  // dedicated product shots
  [/headphone/i, "productHeadphones"],
  [/earbud/i, "productEarbuds"],
  [/keyboard/i, "productKeyboard"],
  [/watch/i, "productWatch"],
  [/(serum|lip|spf|balm|skincare|cream|lotion|shampoo|makeup)/i, "productSerum"],
  [/(skillet|carafe|kettle|board|tamper|espresso|blender|storage|mug|pour|cook|knife|pan)/i, "productSkillet"],
  [/(runner|sneaker|shoe)/i, "productSneaker"],
  [/(yoga|mat\b|foam roller)/i, "productYogamat"],
  [/(duffel|backpack|bag\b|luggage)/i, "productDuffel"],
  [/(lamp\b|desk lamp)/i, "productLamp"],
  [/speaker/i, "speaker"],
  [/(blanket|linen|bedding|towel|textile|duvet)/i, "textile"],
  // category tiles as fallback
  [/(laptop|phone|camera|drone|console|electronics)/i, "electronics"],
  [/(sweater|shirt|jacket|denim|apparel|scarf|clothing|wear)/i, "fashion"],
  [/(lamp|table|vase|decor|candle|rug|curtain)/i, "home"],
  [/(band|bottle|gym|fitness|trail|bike|gear)/i, "sports"],
  [/(coffee|tea|snack|produce|organic|grocery|oil|spice)/i, "grocery"],
  [/(lego|brick|toy|puzzle|game|plush|play)/i, "toys"],
];

const imageForName = (name, index) => {
  const hit = IMAGE_KEYWORDS.find(([re]) => re.test(name));
  if (hit) return STORE_IMAGES[hit[1]];
  const pool = Object.values(STORE_IMAGES);
  return pool[index % pool.length];
};

const NAMES = [
  "Studio Pro Headphones", "Linen Throw Blanket", "Trail Runner 3", "Ceramic Pour-Over",
  "Merino Crew Sweater", "Desk Lamp Arc", "Vitamin C Serum", "Cast Iron Skillet",
  "Weekender Duffel", "Mechanical Keyboard", "Cold Brew Carafe", "Yoga Mat Pro",
  "Espresso Tamper", "Wool Runners", "Noise-Free Earbuds", "Walnut Side Table",
  "Matte Lip Balm", "Resistance Band Set", "Bamboo Cutting Board", "Analog Watch 38",
  "Canvas Backpack", "Glass Storage Set", "Sun Shield SPF50", "Foam Roller",
  "Smart Speaker Mini",
];

const PRODUCTS = NAMES.map((name, i) => {
  const unitPrice = 499 + ((i * 733) % 6500);
  const onSale = i % 3 === 0;
  const stock = i % 7 === 0 ? 0 : i % 5 === 0 ? 3 : 12 + (i % 40);
  const category = CATEGORIES[i % CATEGORIES.length];
  return {
    id: `p-${i + 1}`,
    name,
    unitPrice,
    originalPrice: onSale ? Math.round(unitPrice * 1.45) : undefined,
    description:
      "Top-quality build, honest pricing and a warranty that means something. Ships in protective packaging within 24 hours.",
    imageUrl: imageForName(name, i),
    images: [imageForName(name, i)],
    brand: BRANDS[i % BRANDS.length],
    badge: i % 8 === 0 ? "NEW" : undefined,
    featured: i < 4,
    avgRating: 3.4 + ((i * 37) % 16) / 10,
    ratingCount: 12 + ((i * 53) % 240),
    quantityInStock: stock,
    categoryName: category.name,
    category,
    comments: [],
    variants: [],
    createdDate: new Date(Date.now() - i * 86400000).toISOString(),
  };
});

/* ── orders (so the order screens can be reviewed too) ──────────────────── */
const ORDER_STATUSES = ["APPROVED", "PAID", "PENDING"];
const ORDERS = ORDER_STATUSES.map((status, i) => {
  const items = PRODUCTS.slice(i * 2, i * 2 + 2 + i).map((p) => ({
    productId: p.id,
    quantity: 1 + (i % 3),
    variantId: undefined,
  }));
  const subtotal = items.reduce((a, it) => {
    const p = PRODUCTS.find((x) => x.id === it.productId);
    return a + p.unitPrice * it.quantity;
  }, 0);
  const shipping = subtotal >= 999 ? 0 : 50;
  const discount = i === 0 ? Math.round(subtotal * 0.1) : 0;
  const tax = Math.round((subtotal + shipping - discount) * 0.18);
  return {
    id: `ord-${1000 + i}-a4f2c9d1`,
    customerId: "user-1",
    address: {
      state: "Telangana",
      district: "Hyderabad",
      addressDetail: "12 Rose Lane, Uppal",
    },
    items,
    orderStatus: status,
    createdDate: new Date(Date.now() - i * 4 * 86400000).toISOString(),
    totalAmount: subtotal + shipping - discount + tax,
    discountAmount: discount,
    shippingAmount: shipping,
    taxAmount: tax,
    shippingMethod: i === 1 ? "EXPRESS" : "STANDARD",
    giftWrap: i === 0,
    giftWrapFee: i === 0 ? 50 : 0,
  };
});

const COMMENTS = [
  {
    id: "cmt-1",
    productId: "p-1",
    creator: "Aarav M.",
    createdDate: new Date(Date.now() - 3 * 86400000).toISOString(),
    text: "Beautifully made and it arrived exactly as pictured. The materials feel far better than the price suggests.",
    rating: 5,
  },
  {
    id: "cmt-2",
    productId: "p-1",
    creator: "Sana K.",
    createdDate: new Date(Date.now() - 9 * 86400000).toISOString(),
    text: "Lovely finish and quick dispatch. Would happily buy from this collection again.",
    rating: 4,
  },
];

const RETURNS = [
  {
    id: "ret-501",
    orderId: ORDERS[0].id,
    customerId: "user-1",
    productId: ORDERS[0].items[0].productId,
    quantity: 1,
    reason: "Arrived with a scratch on the lid",
    status: "REQUESTED",
    createdDate: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    id: "ret-502",
    orderId: ORDERS[1].id,
    customerId: "user-1",
    productId: ORDERS[1].items[0].productId,
    quantity: 1,
    reason: "Wrong size",
    status: "REFUNDED",
    refundAmount: 1499,
    refundTransactionId: "rfnd_9Kd21Xa",
    createdDate: new Date(Date.now() - 5 * 86400000).toISOString(),
  },
];

const json = (res, body, status = 200) => {
  res.writeHead(status, {
    "content-type": "application/json",
    "access-control-allow-origin": "*",
    "access-control-allow-headers": "*",
    "access-control-allow-methods": "*",
  });
  res.end(JSON.stringify(body));
};

/* Support tickets raised from the contact form during this preview session. */
const SUPPORT_TICKETS = [];

/* In-memory phone OTP state for the preview session. */
const PHONE_OTPS = new Map(); // phone → { code, expiresAt }
const REGISTERED_PHONES = new Set(["+919876543210"]);

/* Mirrors commerce-service ShippingZoneSeeder (Zone 1). */
const INTERNATIONAL_ZONE = {
  name: "International — Zone 1",
  countries: ["US", "CA", "GB", "DE", "FR", "NL", "BE", "ES", "SE", "CH", "AE", "SG", "AU", "NZ", "JP", "KR"],
  cost: 2499,
  freeAbove: 25000,
  daysMin: 7,
  daysMax: 14,
  carrier: "DHL Express",
  dutyRate: 0.15,
  dutyName: "Import duty & VAT",
};

/* Collect and parse a JSON request body. */
const readBody = (req, cb) => {
  let raw = "";
  req.on("data", (chunk) => { raw += chunk; });
  req.on("end", () => {
    let body = {};
    try { body = JSON.parse(raw); } catch { /* empty object */ }
    cb(body);
  });
};

createServer((req, res) => {
  const url = new URL(req.url, "http://x");
  const p = url.pathname;
  const q = url.searchParams;

  if (req.method === "OPTIONS") return json(res, {});

  if (["/user/password-reset/request", "/user/password-reset/confirm"].includes(p) && req.method === "POST") {
    return json(res, { message: "Mock password reset accepted" });
  }

  /* ── phone sign-in / sign-up (OTP flows) ─────────────────────────────── */

  if (p === "/user/otp/request" && req.method === "POST") {
    return readBody(req, (body) => {
      const phone = String(body.phone ?? "").trim();
      if (!/^\+\d{7,15}$/.test(phone)) {
        return json(res, { message: "Phone must include the country code, e.g. +919876543210" }, 400);
      }
      const code = String(Math.floor(100000 + Math.random() * 900000));
      PHONE_OTPS.set(phone, { code, expiresAt: Date.now() + 5 * 60 * 1000 });
      // No SMS provider in preview: the code is echoed back and logged.
      console.log(`[mock] OTP for ${phone}: ${code}`);
      json(res, { expiresInSeconds: 300, devCode: code });
    });
  }

  if (p === "/user/otp/verify" && req.method === "POST") {
    return readBody(req, (body) => {
      const phone = String(body.phone ?? "").trim();
      const code = String(body.code ?? "").trim();
      const record = PHONE_OTPS.get(phone);
      if (!record) return json(res, { message: "Request a code first" }, 400);
      if (record.expiresAt < Date.now()) return json(res, { message: "This code has expired — request a new one" }, 400);
      if (record.code !== code) return json(res, { message: "Incorrect code — please try again" }, 400);
      if (!REGISTERED_PHONES.has(phone)) {
        return json(res, { message: "NO_ACCOUNT" }, 400);
      }
      PHONE_OTPS.delete(phone);
      json(res, {
        accessToken: "mock-access-token",
        refreshToken: "mock-refresh-token",
        userId: "user-1",
        email: "admin@cartly.com",
        firstName: "Admin",
        lastName: "User",
        roles: ["ROLE_ADMIN"],
      });
    });
  }

  if (p === "/user/phone/register" && req.method === "POST") {
    return readBody(req, (body) => {
      const phone = String(body.phone ?? "").trim();
      const code = String(body.code ?? "").trim();
      const record = PHONE_OTPS.get(phone);
      if (!record || record.code !== code || record.expiresAt < Date.now()) {
        return json(res, { message: "Verify the code sent to this phone before creating the account" }, 400);
      }
      const first = String(body.firstName ?? "").trim();
      const last = String(body.lastName ?? "").trim();
      if (!first || !last) return json(res, { message: "Enter your first and last name" }, 400);
      REGISTERED_PHONES.add(phone);
      PHONE_OTPS.delete(phone);
      json(res, {
        accessToken: "mock-access-token",
        refreshToken: "mock-refresh-token",
        userId: "user-1",
        email: body.email ?? null,
        firstName: first,
        lastName: last,
        roles: ["ROLE_USER"],
      });
    });
  }

  if (p === "/user/login" && req.method === "POST") {
    return json(res, {
      accessToken: "mock-access-token",
      refreshToken: "mock-refresh-token",
      userId: "user-1",
      email: "admin@cartly.com",
      firstName: "Admin",
      lastName: "User",
      roles: ["ROLE_ADMIN"],
    });
  }

  if (p === "/user/me" && req.method === "GET") {
    return json(res, {
      id: "user-1",
      userId: "user-1",
      email: "admin@cartly.com",
      firstName: "Admin",
      lastName: "User",
      roles: ["ROLE_ADMIN"],
    });
  }

  if (p === "/user/token/refresh" && req.method === "GET") {
    return json(res, {
      accessToken: "mock-access-token",
      refreshToken: "mock-refresh-token",
    });
  }

  if (p === "/v1/shipping/calculate" && req.method === "POST") {
    return json(res, { active: true, cost: 50 });
  }

  /* ── international shipping zones ─────────────────────────────────────── */

  if (p === "/v1/shipping/zones" && req.method === "GET") {
    return json(res, [INTERNATIONAL_ZONE]);
  }

  if (p === "/v1/shipping/zones/quote" && req.method === "POST") {
    return readBody(req, (body) => {
      const country = String(body.country ?? "").trim().toUpperCase();
      const subtotal = Number(body.subtotal ?? 0);
      const inZone = INTERNATIONAL_ZONE.countries.includes(country);
      if (!inZone) {
        return json(res, { available: false, cost: 0, estimatedDaysMin: 0, estimatedDaysMax: 0, carrier: "N/A", dutyRate: 0, dutyName: "Import duty & VAT" });
      }
      const freeShipping = subtotal >= INTERNATIONAL_ZONE.freeAbove;
      json(res, {
        available: true,
        zoneName: INTERNATIONAL_ZONE.name,
        cost: freeShipping ? 0 : INTERNATIONAL_ZONE.cost,
        freeAbove: INTERNATIONAL_ZONE.freeAbove,
        estimatedDaysMin: INTERNATIONAL_ZONE.daysMin,
        estimatedDaysMax: INTERNATIONAL_ZONE.daysMax,
        carrier: INTERNATIONAL_ZONE.carrier,
        dutyRate: INTERNATIONAL_ZONE.dutyRate,
        dutyName: INTERNATIONAL_ZONE.dutyName,
      });
    });
  }

  if (p.startsWith("/v1/tax/rule")) {
    return json(res, { taxName: "GST", rate: 0.18 });
  }

  /* ── support tickets (Help/Contact surface) ─────────────────────────── */
  if (p === "/v1/support/tickets" && req.method === "POST") {
    let raw = "";
    req.on("data", (chunk) => { raw += chunk; });
    req.on("end", () => {
      let body = {};
      try { body = JSON.parse(raw); } catch { /* handled below */ }
      const fieldErrors = {};
      if (!body.name || !String(body.name).trim()) fieldErrors.name = "Name is required";
      if (!body.email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(body.email)) fieldErrors.email = "Enter a valid email address";
      if (!body.topic) fieldErrors.topic = "Choose a topic";
      if (!body.message || String(body.message).trim().length < 20) fieldErrors.message = "Please describe the issue in at least 20 characters";
      if (Object.keys(fieldErrors).length) return json(res, fieldErrors, 400);

      const ticket = {
        ticketRef: `SUP-${Date.now().toString(36).toUpperCase().slice(-6)}`,
        name: String(body.name).trim(),
        email: String(body.email).trim().toLowerCase(),
        topic: body.topic,
        orderNumber: body.orderNumber || null,
        message: String(body.message).trim(),
        status: "OPEN",
        createdAt: new Date().toISOString(),
      };
      SUPPORT_TICKETS.unshift(ticket);
      json(res, ticket, 201);
    });
    return;
  }

  if (p === "/v1/support/tickets" && req.method === "GET") return json(res, SUPPORT_TICKETS);

  const statusMatch = p.match(/^\/v1\/support\/tickets\/([^/]+)\/status$/);
  if (statusMatch && req.method === "POST") {
    let raw = "";
    req.on("data", (chunk) => { raw += chunk; });
    req.on("end", () => {
      const ticket = SUPPORT_TICKETS.find((t) => t.ticketRef === decodeURIComponent(statusMatch[1]).toUpperCase());
      if (!ticket) return json(res, { message: "Ticket not found" }, 404);
      const next = String(JSON.parse(raw || "{}").status || "").toUpperCase();
      if (!["OPEN", "IN_PROGRESS", "RESOLVED"].includes(next)) {
        return json(res, { message: "Invalid status" }, 400);
      }
      ticket.status = next;
      ticket.updatedAt = new Date().toISOString();
      json(res, ticket);
    });
    return;
  }

  /* ── newsletter signup (footer form) — public and idempotent ────────── */
  const NEWSLETTER = new Set();
  if (p === "/v1/newsletter/subscribe" && req.method === "POST") {
    let raw = "";
    req.on("data", (chunk) => { raw += chunk; });
    req.on("end", () => {
      let body = {};
      try { body = JSON.parse(raw); } catch { /* handled below */ }
      const email = String(body.email ?? "").trim().toLowerCase();
      if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
        return json(res, { email: "Enter a valid email address" }, 400);
      }
      const already = NEWSLETTER.has(email);
      NEWSLETTER.add(email);
      json(res, { status: already ? "ALREADY_SUBSCRIBED" : "SUBSCRIBED", email }, already ? 200 : 201);
    });
    return;
  }

  if (p === "/v1/store-settings" && req.method === "GET") return json(res, STORE_SETTINGS);  if (p === "/v1/store-settings" && req.method === "PUT") {
    let raw = "";
    req.on("data", (chunk) => { raw += chunk; });
    req.on("end", () => {
      try {
        STORE_SETTINGS = { ...STORE_SETTINGS, ...JSON.parse(raw) };
        json(res, STORE_SETTINGS);
      } catch {
        json(res, { message: "Invalid settings payload" }, 400);
      }
    });
    return;
  }

  if (["/v1/product-audit", "/v1/commerce-audit", "/user/audit-logs"].includes(p)) return json(res, []);

  if (p === "/v1/categories") return json(res, CATEGORIES);

  if (p === "/v1/products") {
    const term = (q.get("searchTerm") ?? "").toLowerCase();
    const cat = q.get("filter") ?? "";
    const brands = (q.get("brand") ?? "").split(",").filter(Boolean);
    const min = Number(q.get("minPrice") ?? 0);
    const max = Number(q.get("maxPrice") ?? 0);
    const minRating = Number(q.get("minRating") ?? 0);
    const size = Number(q.get("size") ?? 8);
    const page = Number(q.get("page") ?? 0);
    const sort = q.get("sort") ?? "DATE_DESC";

    let list = PRODUCTS.filter(
      (x) =>
        (!term || x.name.toLowerCase().includes(term)) &&
        (!cat || x.categoryName === cat) &&
        (!brands.length || brands.includes(x.brand)) &&
        (!min || x.unitPrice >= min) &&
        (!max || x.unitPrice <= max) &&
        (!minRating || x.avgRating >= minRating)
    );

    const sorters = {
      PRICE_ASC: (a, b) => a.unitPrice - b.unitPrice,
      PRICE_DESC: (a, b) => b.unitPrice - a.unitPrice,
      DATE_ASC: (a, b) => a.createdDate.localeCompare(b.createdDate),
      DATE_DESC: (a, b) => b.createdDate.localeCompare(a.createdDate),
    };
    list = [...list].sort(sorters[sort] ?? sorters.DATE_DESC);

    const counts = (key) =>
      Object.entries(
        list.reduce((acc, x) => ({ ...acc, [x[key]]: (acc[x[key]] ?? 0) + 1 }), {})
      ).map(([value, count]) => ({ value, count }));

    return json(res, {
      content: list.slice(page * size, page * size + size),
      facets: {
        brands: counts("brand"),
        categories: counts("categoryName"),
        priceMin: Math.min(...PRODUCTS.map((x) => x.unitPrice)),
        priceMax: Math.max(...PRODUCTS.map((x) => x.unitPrice)),
      },
    });
  }

  if (p === "/v1/products/suggest") {
    const t = (q.get("term") ?? "").toLowerCase();
    return json(
      res,
      PRODUCTS.filter(
        (x) =>
          x.name.toLowerCase().includes(t) ||
          x.brand.toLowerCase().includes(t) ||
          x.categoryName.toLowerCase().includes(t)
      )
        .slice(0, 6)
        .map(({ id, name, brand, categoryName: category, unitPrice, imageUrl }) => ({
          id, name, brand, category, unitPrice, imageUrl,
        }))
    );
  }

  if (p === "/v1/comments" && req.method === "POST") {
    let raw = "";
    req.on("data", (chunk) => { raw += chunk; });
    req.on("end", () => {
      try {
        const body = JSON.parse(raw);
        const comment = {
          id: `cmt-${Date.now()}`,
          productId: body.productId,
          creator: "You (preview)",
          createdDate: new Date().toISOString(),
          text: body.text,
          rating: body.rating ?? undefined,
        };
        COMMENTS.unshift(comment);
        json(res, comment, 201);
      } catch { json(res, { message: "Invalid comment" }, 400); }
    });
    return;
  }

  if (p === "/v1/products/brands") return json(res, BRANDS);
  if (p === "/v1/flash-sales") return json(res, PRODUCTS.filter((_, i) => i % 4 === 0));
  if (p === "/v1/orders/stats/bestsellers")
    return json(res, Object.fromEntries(PRODUCTS.slice(0, 6).map((x, i) => [x.id, 90 - i * 11])));

  if (p.startsWith("/v1/products/findByIds/")) {
    const ids = decodeURIComponent(p.split("/findByIds/")[1]).split(",");
    return json(res, PRODUCTS.filter((x) => ids.includes(x.id)));
  }
  if (/^\/v1\/products\/[^/]+\/comments$/.test(p)) {
    const productId = p.split("/")[3];
    return json(res, COMMENTS.filter((c) => c.productId === productId));
  }
  if (/^\/v1\/products\/[^/]+\/related$/.test(p)) return json(res, PRODUCTS.slice(4, 8));
  if (/^\/v1\/products\/[^/]+\/watch$/.test(p)) return json(res, { watching: false });
  if (/^\/v1\/products\/[^/]+$/.test(p)) {
    const found = PRODUCTS.find((x) => x.id === p.split("/").pop());
    return found ? json(res, found) : json(res, { message: "not found" }, 404);
  }

  if (p === "/v1/orders/stats/dashboard")
    return json(res, {
      revenueToday: 48210,
      revenueLast7Days: 291400,
      avgOrderValue: 2140,
      totalOrders: 1264,
      ordersToday: 126,
      ordersByStatus: { PENDING: 18, PAID: 64, SHIPPED: 31, DELIVERED: 12, REFUNDED: 3 },
      dailyRevenue: [
        { date: "2026-08-17", revenue: 32100 },
        { date: "2026-08-18", revenue: 24800 },
        { date: "2026-08-19", revenue: 41300 },
        { date: "2026-08-20", revenue: 29900 },
        { date: "2026-08-21", revenue: 52100 },
        { date: "2026-08-22", revenue: 39400 },
        { date: "2026-08-23", revenue: 48210 },
      ],
      topProducts: PRODUCTS.slice(0, 5).map((x, i) => ({
        productId: x.id,
        revenue: 40000 - i * 6200,
        quantity: 120 - i * 17,
      })),
    });

  if (p === "/v1/orders" && req.method === "POST") {
    let raw = "";
    req.on("data", (chunk) => { raw += chunk; });
    req.on("end", () => {
      try {
        const request = JSON.parse(raw);
        const totalAmount = (request.items ?? []).reduce((sum, item) => {
          const product = PRODUCTS.find((candidate) => candidate.id === item.productId);
          return sum + (product?.unitPrice ?? 0) * item.quantity;
        }, 0);
        json(res, {
          id: `ord-preview-${Date.now()}`,
          ...request,
          totalAmount,
          orderStatus: "PENDING",
          createdDate: new Date().toISOString(),
          checkoutToken: "preview-checkout-token",
        }, 201);
      } catch { json(res, { message: "Invalid order" }, 400); }
    });
    return;
  }
  if (p === "/v1/payments" && req.method === "POST") {
    let raw = "";
    req.on("data", (chunk) => { raw += chunk; });
    req.on("end", () => {
      try {
        const request = JSON.parse(raw || "{}");
        const foundOrder = ORDERS.find((o) => o.id === request.orderId);
        const amount = foundOrder ? foundOrder.totalAmount : 1499;
        json(res, {
          orderId: request.orderId,
          amount: amount,
          currency: "INR",
          provider: request.provider || "RAZORPAY",
          status: "PENDING",
          transactionId: "order_mock_" + Date.now().toString(36),
          checkoutToken: request.checkoutToken,
          message: request.provider === "CASH" ? "Cash on delivery confirmed" : "Razorpay order created",
        }, 201);
      } catch {
        json(res, { message: "Invalid payment request" }, 400);
      }
    });
    return;
  }
  if (p === "/v1/payments/webhooks/razorpay" && req.method === "POST") {
    let raw = "";
    req.on("data", (chunk) => { raw += chunk; });
    req.on("end", () => {
      try {
        const body = JSON.parse(raw);
        const entity = body?.payload?.payment?.entity;
        const orderId = entity?.order_id;
        const event = body?.event;
        const found = ORDERS.find((o) => o.id === orderId || o.id.includes(orderId));
        if (found) {
          if (event === "payment.captured") {
            found.orderStatus = "PAID";
          } else if (event === "payment.failed") {
            found.orderStatus = "CANCELLED";
          }
        }
        json(res, { status: "ok", reconciled: true, orderId, event });
      } catch {
        json(res, { message: "Webhook received" });
      }
    });
    return;
  }
  if (p === "/v1/payments/webhooks/stripe" && req.method === "POST") {
    let raw = "";
    req.on("data", (chunk) => { raw += chunk; });
    req.on("end", () => {
      try {
        const body = JSON.parse(raw);
        const intent = body?.data?.object;
        const orderId = intent?.id;
        const type = body?.type;
        const found = ORDERS.find((o) => o.id === orderId);
        if (found && type === "payment_intent.succeeded") {
          found.orderStatus = "PAID";
        }
        json(res, { status: "ok", reconciled: true });
      } catch {
        json(res, { message: "Webhook received" });
      }
    });
    return;
  }
  if (p === "/v1/orders/my") return json(res, ORDERS);
  if (p === "/v1/orders")
    return json(res, { data: ORDERS, totalSize: ORDERS.length, totalPage: 1 });
  if (/^\/v1\/orders\/[^/]+\/status$/.test(p) && req.method === "PUT") {
    const oid = p.split("/")[3];
    const status = q.get("status");
    const found = ORDERS.find((o) => o.id === oid);
    if (found && status) {
      found.orderStatus = status;
      return json(res, found);
    }
    return json(res, { message: "not found" }, 404);
  }
  if (/^\/v1\/orders\/[^/]+\/track$/.test(p) && req.method === "GET") {
    const oid = p.split("/")[3];
    const found = ORDERS.find((o) => o.id === oid);
    return json(res, [
      { id: "trk-1", orderId: oid, status: "PENDING", note: "Order placed", changedAt: found?.createdDate ?? new Date().toISOString() },
      ...(found?.orderStatus !== "PENDING" ? [{ id: "trk-2", orderId: oid, status: found?.orderStatus ?? "PAID", note: `Order ${found?.orderStatus?.toLowerCase()}`, changedAt: new Date().toISOString() }] : []),
    ]);
  }
  if (/^\/v1\/orders\/[^/]+\/invoice$/.test(p))
    return json(res, { message: "mock: invoices are not generated in the preview" }, 501);
  if (/^\/v1\/orders\/[^/]+$/.test(p)) {
    const found = ORDERS.find((o) => o.id === p.split("/").pop());
    return found ? json(res, found) : json(res, { message: "not found" }, 404);
  }

  if (p === "/v1/returns/my") return json(res, RETURNS);
  if (p === "/v1/returns/all") return json(res, RETURNS);
  if (/^\/v1\/returns\/order\/[^/]+$/.test(p)) {
    const oid = p.split("/").pop();
    return json(res, RETURNS.filter((r) => r.orderId === oid));
  }

  if (p === "/v1/loyalty/balance") return json(res, 1240);
  if (p === "/v1/loyalty/history")
    return json(
      res,
      [
        ["Order ord-1000 — points earned", 240, "EARNED"],
        ["Redeemed at checkout", -150, "REDEEMED"],
        ["Order ord-1001 — points earned", 310, "EARNED"],
        ["Signup bonus", 100, "EARNED"],
      ].map(([description, points, type], i) => ({
        id: `lp-${i + 1}`,
        description,
        points,
        type,
        createdDate: new Date(Date.now() - i * 3 * 86400000).toISOString(),
      }))
    );

  if (p === "/user/referral/code") return json(res, "CARTLY7X4K2");
  if (p.startsWith("/user/referral/validate/"))
    return json(res, p.split("/").pop() === "CARTLY7X4K2");

  if (p === "/v1/addresses")
    return json(res, [
      {
        id: "addr-1",
        state: "Telangana",
        district: "Hyderabad",
        addressDetail: "12 Rose Lane, Uppal",
        country: "IN",
        pincode: "500039",
        phoneNumber: "9876543210",
        defaultAddress: true,
      },
      {
        id: "addr-2",
        state: "Karnataka",
        district: "Bengaluru Urban",
        addressDetail: "8 Curie Road, Indiranagar",
        country: "IN",
        pincode: "560038",
        defaultAddress: false,
      },
      {
        id: "addr-3",
        state: "California",
        district: "San Jose",
        addressDetail: "221 Bounty St, Apt 5",
        country: "US",
        pincode: "95014",
        defaultAddress: false,
      },
    ]);
  if (p === "/v1/addresses/default")
    return json(res, {
      id: "addr-1",
      state: "Telangana",
      district: "Hyderabad",
      addressDetail: "12 Rose Lane, Uppal",
      country: "IN",
      pincode: "500039",
      phoneNumber: "9876543210",
      defaultAddress: true,
    });

  if (p === "/v1/coupons") return json(res, []);

  return json(res, { message: `mock: no handler for ${req.method} ${p}` }, 404);
}).listen(PORT, "0.0.0.0", () =>
  console.log(`mock gateway listening on http://0.0.0.0:${PORT}`)
);
