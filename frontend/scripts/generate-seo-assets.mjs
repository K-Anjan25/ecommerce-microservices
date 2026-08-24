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

await prerenderProducts(indexHtml);
console.log(`Generated sitemap for ${urls.length} public route(s) and static public entry points at ${origin}`);

async function prerenderProducts(baseHtml) {
  const apiUrl = (process.env.VITE_PRERENDER_API_URL || "").trim().replace(/\/$/, "");
  if (!apiUrl || configuredProductPaths.length === 0) return;

  const required = process.env.VITE_PRERENDER_REQUIRED === "true";
  for (const path of configuredProductPaths) {
    const id = path.split("/").pop();
    try {
      const response = await fetch(`${apiUrl}/v1/products/${encodeURIComponent(id)}`, {
        headers: { Accept: "application/json" },
      });
      if (!response.ok) throw new Error(`catalog returned HTTP ${response.status}`);
      const product = await response.json();
      const productHtml = renderProductHtml(baseHtml, product);
      const productDir = resolve(outputDir, ...path.split("/").filter(Boolean));
      await mkdir(productDir, { recursive: true });
      await writeFile(resolve(productDir, "index.html"), productHtml, "utf8");
    } catch (error) {
      const message = `Could not pre-render ${path}: ${error.message}`;
      if (required) throw new Error(message);
      console.warn(`Warning: ${message}`);
    }
  }
}

function renderProductHtml(baseHtml, product) {
  const name = String(product.name || "Cartly product");
  const description = String(product.description || "A considered Cartly find for home and life.");
  const image = product.imageUrl || product.images?.[0] || "";
  const productUrl = `${origin}/products/${encodeURIComponent(String(product.id || ""))}`;
  const metadata = `
    <meta property="og:title" content="${escapeHtml(name)} · Cartly" />
    <meta property="og:description" content="${escapeHtml(description)}" />
    <meta property="og:type" content="product" />
    ${image ? `<meta property="og:image" content="${escapeHtml(new URL(image, origin).href)}" />` : ""}
    <link rel="canonical" href="${escapeHtml(productUrl)}" />`;
  const jsonLd = JSON.stringify({
    "@context": "https://schema.org",
    "@type": "Product",
    name,
    description,
    url: productUrl,
    image: image ? [new URL(image, origin).href] : undefined,
    brand: product.brand ? { "@type": "Brand", name: product.brand } : undefined,
    offers: product.unitPrice != null ? {
      "@type": "Offer",
      priceCurrency: "INR",
      price: Number(product.flashPrice ?? product.unitPrice).toFixed(2),
      availability: Number(product.quantityInStock ?? 0) > 0
        ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
    } : undefined,
  }, (_key, value) => value === undefined ? undefined : value).replace(/</g, "\\u003c");
  const fallback = `<main aria-label="${escapeHtml(name)}" style="max-width: 72rem; margin: 0 auto; padding: 4rem 1.5rem;">${image ? `<img src="${escapeHtml(new URL(image, origin).href)}" alt="${escapeHtml(name)}" style="max-width: 24rem; width: 100%;" />` : ""}<p style="font-size: 0.75rem; font-weight: 700; letter-spacing: 0.16em; text-transform: uppercase;">Cartly · Product</p><h1 style="font-family: Georgia, serif; font-size: clamp(2.75rem, 8vw, 6rem); font-weight: 400; line-height: 0.95; max-width: 12ch;">${escapeHtml(name)}</h1><p style="max-width: 34rem; line-height: 1.7;">${escapeHtml(description)}</p>${product.unitPrice != null ? `<p><strong>₹ ${Number(product.flashPrice ?? product.unitPrice).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong></p>` : ""}<p><a href="/products">Continue browsing</a></p></main>`;
  return baseHtml
    .replace(/<title>[\s\S]*?<\/title>/, `<title>${escapeHtml(name)} · Cartly</title>`)
    .replace(/<meta\s+name="description"\s+content="[^"]*"\s*\/>/, `<meta name="description" content="${escapeHtml(description)}" />`)
    .replace("</head>", `${metadata}<script type="application/ld+json">${jsonLd}</script>\n  </head>`)
    .replace(/<div id="root">[\s\S]*?<\/div>\s*<script type="module"/, `<div id="root">${fallback}</div>\n    <script type="module"`);
}

function escapeXml(value) {
  return value.replace(/[<>&'\"]/g, (character) => ({
    "<": "&lt;",
    ">": "&gt;",
    "&": "&amp;",
    "'": "&apos;",
    '"': "&quot;",
  })[character]);
}

function escapeHtml(value) {
  return value.replace(/[&<>'"]/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "'": "&#39;",
    '"': "&quot;",
  })[character]);
}
