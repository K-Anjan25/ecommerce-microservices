/**
 * Cartly optional SSR server.
 *
 * Modes:
 *   NODE_ENV=development node server/ssr-server.mjs
 *     Vite dev middlewares (HMR) + on-the-fly SSR via ssrLoadModule.
 *   NODE_ENV=production (after `npm run build:ssr`)
 *     Serves dist/client assets and renders via the prebuilt
 *     dist/server/entry-server.js bundle.
 *
 * Everything else behaves like the plain SPA setup: same-origin API proxies
 * to the gateway (/v1, /user, /file, /api), index.html as the fallback for
 * unknown routes, and the static fallback markup stays in place whenever SSR
 * fails so the client app can take over.
 *
 * Env:
 *   PORT           listen port (default 3001)
 *   GATEWAY_URL    api-gateway base for the same-origin proxy (default
 *                  http://localhost:8889)
 *   SSR_SITE_ORIGIN absolute origin used for canonical/og tags in SSR HTML
 *                  (default http://localhost:3001)
 */
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const DIST = path.join(ROOT, "dist");
const PUBLIC_DIR = path.join(DIST, "client");

const IS_DEV = process.env.NODE_ENV !== "production";
const PORT = Number(process.env.PORT || 3001);
const GATEWAY = process.env.GATEWAY_URL || "http://localhost:8889";
const SITE_ORIGIN = process.env.SSR_SITE_ORIGIN || `http://localhost:${PORT}`;
const API_PREFIXES = ["/v1", "/user", "/file", "/api"];

const MIME = {
  ".js": "text/javascript",
  ".mjs": "text/javascript",
  ".css": "text/css",
  ".json": "application/json",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".avif": "image/avif",
  ".gif": "image/gif",
  ".ico": "image/x-icon",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".ttf": "font/ttf",
  ".map": "application/json",
  ".txt": "text/plain",
  ".html": "text/html",
  ".webmanifest": "application/manifest+json",
  ".xml": "application/xml",
};

const ROUTE_META = {
  "/": {
    title: "Cartly — Curated for everyday",
    description:
      "Cartly — a considered collection across home and life, with secure checkout, orders, returns and rewards.",
  },
  "/products": {
    title: "Shop the collection — Cartly",
    description:
      "Browse the full Cartly collection: thoughtful objects, honest materials and everyday essentials selected to last.",
  },
  "/login": {
    title: "Sign in — Cartly",
    description: "Sign in to your Cartly account to shop, track orders and manage your details.",
  },
  "/register": {
    title: "Create account — Cartly",
    description: "Create a Cartly account for faster checkout, order history and rewards.",
  },
};

const escapeHtml = (value) =>
  String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

let viteServer = null;
let render = null;
let prodTemplate = null;

function loadServerEntry() {
  const candidates = ["entry-server.js", "entry-server.mjs"]
    .map((file) => path.join(DIST, "server", file))
    .filter((file) => fs.existsSync(file));
  if (candidates.length === 0) return null;
  return import(candidates[0]).then((module) => module.render);
}

async function initProd() {
  prodTemplate = fs.readFileSync(path.join(PUBLIC_DIR, "index.html"), "utf8");
  render = await loadServerEntry();
  if (!render) {
    throw new Error("dist/server/entry-server.[m]js not found — run `npm run build:ssr` first");
  }
  console.log("[ssr] production mode — rendering via dist/server bundle");
}

/**
 * Dev mode: vite dev middlewares serve client assets with HMR, but SSR goes
 * through the same prebuilt server bundle as production (run `npm run
 * build:ssr` — or its watch variant — after changing SSR-relevant code).
 * Rendering through vite's dev module runner is deliberately avoided: it
 * cannot interop the CJS default exports several dependencies (MUI icons,
 * redux-thunk) ship, which breaks server rendering.
 */
async function initDev() {
  const { createServer } = await import("vite");
  viteServer = await createServer({
    root: ROOT,
    logLevel: "info",
    server: { middlewareMode: true, allowedHosts: [".e2b.app", ".localhost", "localhost"] },
    appType: "custom",
  });
  render = await loadServerEntry();
  console.log(
    render
      ? "[ssr] development mode — vite client HMR, SSR via dist/server bundle"
      : "[ssr] development mode — no dist/server bundle found; serving SPA fallback (run `npm run build:ssr`)"
  );
}

/** Build per-route meta, preferring real product data for PDPs. */
function metaFor(pathname, dehydratedState) {
  const base = ROUTE_META[pathname] || ROUTE_META["/"];
  let meta = { ...base };

  if (dehydratedState) {
    const entry = dehydratedState.queries?.find(
      (candidate) => Array.isArray(candidate.queryKey) && candidate.queryKey[0] === "products:product"
    );
    const product = entry?.state?.data;
    if (product?.name) {
      meta = {
        title: `${product.name} — Cartly`,
        description:
          (product.description || base.description).slice(0, 160),
        image: product.images?.[0] || product.imageUrl,
        type: "product",
      };
    }
  }
  return meta;
}

function composePage(template, url, result) {
  const { pathname } = new URL(url, SITE_ORIGIN);
  const meta = metaFor(pathname, result?.dehydratedState);

  let html = template;
  if (result) {
    // SSR succeeded: the static fallback has served its purpose.
    html = html.replace(/<!--fallback-start-->[\s\S]*?<!--fallback-end-->/, "");
    // Function replacers are mandatory: string replacements interpret `$`
    // sequences, and app HTML/product data may legitimately contain them.
    html = html.replace("<!--ssr-outlet-->", () => result.html);
  }

  html = html.replace(/<title>[\s\S]*?<\/title>/, () => `<title>${escapeHtml(meta.title)}</title>`);
  html = html.replace(
    /(<meta\s+name="description"\s+content=")[^"]*(")/,
    (_match, prefix, suffix) => `${prefix}${escapeHtml(meta.description)}${suffix}`
  );

  const ogTags = [
    `<meta property="og:title" content="${escapeHtml(meta.title)}" />`,
    `<meta property="og:description" content="${escapeHtml(meta.description)}" />`,
    `<meta property="og:type" content="${escapeHtml(meta.type || "website")}" />`,
    `<meta property="og:url" content="${escapeHtml(`${SITE_ORIGIN}${pathname}`)}" />`,
    meta.image ? `<meta property="og:image" content="${escapeHtml(new URL(meta.image, SITE_ORIGIN).href)}" />` : "",
  ].join("\n    ");

  const emotionStyle = result?.css
    ? `<style data-emotion="mui ${(result.emotionIds || []).join(" ")}">${result.css}</style>`
    : "";

  // CSP-safe: data block, never an executable script.
  const stateTag = result
    ? `<script type="application/json" id="__SSR_STATE__">${JSON.stringify(
        result.dehydratedState
      ).replace(/</g, "\\u003c")}</script>`
    : "";

  const head = `    ${ogTags}\n    ${emotionStyle}${stateTag}</head>`;
  html = html.replace("</head>", () => head);
  return html;
}

function sendHtml(res, html, status = 200) {
  res.writeHead(status, { "content-type": "text/html; charset=utf-8" });
  res.end(html);
}

const MAX_PROXY_BODY = 25 * 1024 * 1024;

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let size = 0;
    req.on("data", (chunk) => {
      size += chunk.length;
      if (size > MAX_PROXY_BODY) {
        reject(new Error("Request body too large"));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on("end", () => resolve(Buffer.concat(chunks)));
    req.on("error", reject);
  });
}

/** Same-origin API proxy to the gateway (mirrors the vite dev proxy). */
async function proxyApi(req, res) {
  const body = ["GET", "HEAD"].includes(req.method) ? undefined : await readBody(req);
  const headers = {};
  for (const [key, value] of Object.entries(req.headers)) {
    if (["host", "connection", "content-length", "accept-encoding"].includes(key)) continue;
    headers[key] = Array.isArray(value) ? value.join(", ") : value;
  }
  const upstream = await fetch(new URL(req.url, GATEWAY), {
    method: req.method,
    headers,
    body,
  });
  const resBody = Buffer.from(await upstream.arrayBuffer());
  const resHeaders = { "content-type": upstream.headers.get("content-type") || "application/json" };
  for (const header of ["cache-control", "content-disposition"]) {
    const value = upstream.headers.get(header);
    if (value) resHeaders[header] = value;
  }
  res.writeHead(upstream.status, resHeaders);
  res.end(resBody);
}

function serveStatic(req, res, pathname) {
  const resolved = path.normalize(path.join(PUBLIC_DIR, pathname));
  if (!resolved.startsWith(PUBLIC_DIR)) return false;
  let filePath = resolved;
  if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) return false;
  const ext = path.extname(filePath).toLowerCase();
  const isHashedAsset = pathname.startsWith("/assets/");
  res.writeHead(200, {
    "content-type": MIME[ext] || "application/octet-stream",
    "cache-control": isHashedAsset ? "public, max-age=31536000, immutable" : "no-cache",
  });
  fs.createReadStream(filePath).pipe(res);
  return true;
}

async function handle(req, res) {
  const url = req.url || "/";
  const { pathname } = new URL(url, SITE_ORIGIN);

  if (API_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`))) {
    await proxyApi(req, res);
    return;
  }

  if (!IS_DEV && pathname !== "/" && serveStatic(req, res, pathname)) return;

  // Dev: framework assets (/@vite, /src, /node_modules) and public/ files are
  // served by vite's own middlewares; page-like paths go through SSR.
  if (IS_DEV) {
    const looksLikePage =
      !pathname.startsWith("/@") &&
      !pathname.startsWith("/src/") &&
      !pathname.startsWith("/node_modules/") &&
      !path.extname(pathname);
    if (!looksLikePage) {
      viteServer.middlewares(req, res);
      return;
    }
  }

  try {
    let template;
    if (IS_DEV) {
      template = await viteServer.transformIndexHtml(url, fs.readFileSync(path.join(ROOT, "index.html"), "utf8"));
    } else {
      template = prodTemplate;
    }

    const result = render ? await render(pathname + (new URL(url, SITE_ORIGIN).search || "")) : null;
    sendHtml(res, composePage(template, url, result));
  } catch (error) {
    console.warn(`[ssr] render failed for ${pathname} — serving SPA fallback:`, error?.stack || error?.message || error);
    const template = IS_DEV
      ? await viteServer.transformIndexHtml(url, fs.readFileSync(path.join(ROOT, "index.html"), "utf8"))
      : prodTemplate;
    sendHtml(res, template);
  }
}

const server = http.createServer((req, res) => {
  handle(req, res).catch((error) => {
    console.error("[ssr] request failed:", error);
    if (!res.headersSent) {
      res.writeHead(500, { "content-type": "text/plain" });
    }
    res.end("Internal server error");
  });
});

async function main() {
  // Tailwind/postcss and vite resolve their configs from the process cwd;
  // the server is frequently launched from the repo root.
  process.chdir(ROOT);
  if (IS_DEV) await initDev();
  else await initProd();
  server.listen(PORT, "0.0.0.0", () => {
    console.log(`[ssr] listening on http://0.0.0.0:${PORT} (${IS_DEV ? "development" : "production"})`);
  });
}

main().catch((error) => {
  console.error("[ssr] fatal:", error);
  process.exit(1);
});
