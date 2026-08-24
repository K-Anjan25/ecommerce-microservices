import { mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const origin = (process.env.VITE_PUBLIC_STOREFRONT_URL || "http://localhost:3000")
  .trim()
  .replace(/\/$/, "");

let originUrl;
try {
  originUrl = new URL(origin);
} catch {
  throw new Error("VITE_PUBLIC_STOREFRONT_URL must be a valid absolute URL");
}

if (!/^https?:$/.test(originUrl.protocol)) {
  throw new Error("VITE_PUBLIC_STOREFRONT_URL must use http or https");
}

const publicRoutes = ["/", "/products", "/flash-sales"];
const configuredProductPaths = (process.env.VITE_SITEMAP_PRODUCT_URLS || "")
  .split(",")
  .map((path) => path.trim())
  .filter(Boolean)
  .map((path) => path.startsWith("/") ? path : `/products/${path}`)
  .filter((path) => /^\/products\/[A-Za-z0-9_-]+$/.test(path));

const urls = [...new Set([...publicRoutes, ...configuredProductPaths])]
  .map((path) => `${origin}${path}`);
const lastmod = new Date().toISOString().slice(0, 10);
const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((url) => `  <url><loc>${escapeXml(url)}</loc><lastmod>${lastmod}</lastmod></url>`).join("\n")}
</urlset>
`;
const robots = `# Generated public storefront crawler policy.
User-agent: *
Allow: /
Disallow: /admin
Disallow: /login
Disallow: /register
Disallow: /forgetPassword
Disallow: /reset-password
Disallow: /cart
Disallow: /checkout
Disallow: /stripe-payment
Disallow: /stripe-payment-return
Disallow: /order-confirmation
Disallow: /guest-order
Disallow: /orders
Disallow: /orderDetail
Disallow: /account
Disallow: /profile
Disallow: /addresses
Disallow: /returns
Disallow: /loyalty
Disallow: /referral
Disallow: /gift-cards
Disallow: /compare
Sitemap: ${origin}/sitemap.xml
`;

const outputDir = resolve("dist");
await mkdir(outputDir, { recursive: true });
await writeFile(resolve(outputDir, "sitemap.xml"), sitemap, "utf8");
await writeFile(resolve(outputDir, "robots.txt"), robots, "utf8");

// Static hosts can serve these public route entry points without an SPA
// fallback. The React client replaces the content after it boots; crawlers
// still receive the safe public storefront shell immediately.
const indexHtml = await readFile(resolve(outputDir, "index.html"), "utf8");
for (const route of ["products", "flash-sales"]) {
  const routeDir = resolve(outputDir, route);
  await mkdir(routeDir, { recursive: true });
  await writeFile(resolve(routeDir, "index.html"), indexHtml, "utf8");
}

console.log(`Generated sitemap for ${urls.length} public route(s) and static public entry points at ${origin}`);

function escapeXml(value) {
  return value.replace(/[<>&'\"]/g, (character) => ({
    "<": "&lt;",
    ">": "&gt;",
    "&": "&amp;",
    "'": "&apos;",
    '"': "&quot;",
  })[character]);
}
