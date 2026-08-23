/**
 * Cartly 2.0 — design preview mock gateway (DEV ONLY).
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
  "Electronics", "Home", "Fashion", "Beauty", "Sports", "Grocery", "Toys", "Books",
].map((name, i) => ({ id: i + 1, name, slug: name.toLowerCase(), parentId: null, sortOrder: i }));

const BRANDS = ["Acme", "Northwind", "Lumen", "Kite", "Orbit", "Cobalt"];

const NAMES = [
  "Studio Pro Headphones", "Linen Throw Blanket", "Trail Runner 3", "Ceramic Pour-Over",
  "Merino Crew Sweater", "Desk Lamp Arc", "Vitamin C Serum", "Cast Iron Skillet",
  "Weekender Duffel", "Mechanical Keyboard", "Cold Brew Carafe", "Yoga Mat Pro",
  "Espresso Tamper", "Wool Runners", "Noise-Free Earbuds", "Walnut Side Table",
  "Matte Lip Balm", "Resistance Band Set", "Bamboo Cutting Board", "Analog Watch 38",
  "Canvas Backpack", "Glass Storage Set", "Sun Shield SPF50", "Foam Roller",
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
      "Considered materials, honest pricing and a warranty that means something. Ships in recyclable packaging within 24 hours.",
    imageUrl: `https://picsum.photos/seed/cartly${i + 7}/800/600`,
    images: [`https://picsum.photos/seed/cartly${i + 7}/800/600`],
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

const json = (res, body, status = 200) => {
  res.writeHead(status, {
    "content-type": "application/json",
    "access-control-allow-origin": "*",
    "access-control-allow-headers": "*",
    "access-control-allow-methods": "*",
  });
  res.end(JSON.stringify(body));
};

createServer((req, res) => {
  const url = new URL(req.url, "http://x");
  const p = url.pathname;
  const q = url.searchParams;

  if (req.method === "OPTIONS") return json(res, {});

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
      PRODUCTS.filter((x) => x.name.toLowerCase().includes(t)).slice(0, 8).map((x) => x.name)
    );
  }

  if (p === "/v1/products/brands") return json(res, BRANDS);
  if (p === "/v1/flash-sales") return json(res, PRODUCTS.filter((_, i) => i % 4 === 0));
  if (p === "/v1/orders/stats/bestsellers")
    return json(res, Object.fromEntries(PRODUCTS.slice(0, 6).map((x, i) => [x.id, 90 - i * 11])));

  if (p.startsWith("/v1/products/findByIds/")) {
    const ids = decodeURIComponent(p.split("/findByIds/")[1]).split(",");
    return json(res, PRODUCTS.filter((x) => ids.includes(x.id)));
  }
  if (/^\/v1\/products\/[^/]+\/comments$/.test(p)) return json(res, []);
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

  if (p === "/v1/orders" || p === "/v1/orders/my") return json(res, []);
  if (p === "/v1/coupons" || p === "/v1/returns/all") return json(res, []);

  return json(res, { message: `mock: no handler for ${req.method} ${p}` }, 404);
}).listen(PORT, "0.0.0.0", () =>
  console.log(`mock gateway listening on http://0.0.0.0:${PORT}`)
);
