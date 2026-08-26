// Minimal mock of the api-gateway public product endpoints for SSR verification (not shipped).
const product = (id, name) => ({
  id,
  name,
  brand: "TestBrand",
  badge: "",
  category: { id: "c1", name: "Home" },
  categoryId: "c1",
  categoryName: "Home",
  description: `Description of ${name} — considered materials, honest build.`,
  unitPrice: 1299,
  originalPrice: 1599,
  featured: true,
  quantityInStock: 5,
  avgRating: 4.5,
  ratingCount: 12,
  imageUrl: "/logo192.png",
  images: ["/logo192.png"],
  variants: [],
});

const list = [
  product("p1", "Terra Ceramic Vase"),
  product("p2", "Linen Throw Blanket"),
  product("p3", "Oak Serving Board"),
  product("p4", "Brass Table Lamp"),
];

const facets = {
  categories: [{ name: "Home", count: 4 }],
  brands: [{ name: "TestBrand", count: 4 }],
};
const page = (content) => ({
  content,
  facets,
  totalPages: 1,
  totalElements: content.length,
  size: 8,
  number: 0,
});

const routes = [
  ["/v1/products/bestsellers", () => list.slice(0, 4)],
  ["/v1/products/brands", () => ["TestBrand"]],
  [/^\/v1\/products\/[^/?]+$/, (url) => {
    const id = new URL(url, "http://x").pathname.split("/")[3];
    const found = list.find((p) => p.id === id);
    if (!found) return { status: 404, body: { message: "Product not found" } };
    return found;
  }],
  ["/v1/products", () => page(list)],
];

require("http")
  .createServer(async (req, res) => {
    const url = req.url;
    for (const [match, handler] of routes) {
      const hit = match instanceof RegExp ? match.test(url) : url.startsWith(match);
      if (hit) {
        const body = handler(url);
        const status = body?.status === 404 ? 404 : 200;
        res.writeHead(status, { "content-type": "application/json" });
        res.end(JSON.stringify(body?.body ?? body));
        return;
      }
    }
    res.writeHead(200, { "content-type": "application/json" });
    res.end(JSON.stringify({ ok: true, path: url }));
  })
  .listen(8889, "0.0.0.0", () => console.log("mock gateway :8889"));
