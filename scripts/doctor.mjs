#!/usr/bin/env node
/**
 * Cartly dev doctor — pinpoints the local-environment issues that look like
 * app bugs (flicker, crashes between pages, getting logged out).
 *
 *   node scripts/doctor.mjs          (from the repo root)
 *
 * Every FAIL line prints the exact fix. Paste the full output when asking
 * for help.
 */
import { execSync, spawn } from "node:child_process";
import fs from "node:fs";
import http from "node:http";
import net from "node:net";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const fe = path.join(root, "frontend");
let failures = 0;

const ok = (msg) => console.log(`  ✅ ${msg}`);
const fail = (msg, fix) => {
  failures++;
  console.log(`  ❌ ${msg}`);
  if (fix) console.log(`     → FIX: ${fix}`);
};
const info = (msg) => console.log(`  ℹ️  ${msg}`);
const section = (t) => console.log(`\n── ${t} ${"─".repeat(Math.max(0, 58 - t.length))}`);

const probe = (host, port, timeoutMs = 2500) =>
  new Promise((resolve) => {
    const socket = net.connect({ host, port });
    const done = (r) => {
      socket.destroy();
      resolve(r);
    };
    socket.setTimeout(timeoutMs);
    socket.once("connect", () => done(true));
    socket.once("timeout", () => done(false));
    socket.once("error", () => done(false));
  });

const httpGet = (host, port, urlPath, timeoutMs = 4000) =>
  new Promise((resolve) => {
    const req = http.get({ host, port, path: urlPath, timeout: timeoutMs }, (res) => {
      res.resume();
      resolve(res.statusCode);
    });
    req.on("timeout", () => {
      req.destroy();
      resolve(0);
    });
    req.on("error", () => resolve(0));
  });

const main = async () => {
  console.log(`\nCartly dev doctor — ${new Date().toLocaleString()}`);

  section("1. Code");
  try {
    const commit = execSync("git rev-parse --short HEAD", { cwd: root }).toString().trim();
    const branch = execSync("git rev-parse --abbrev-ref HEAD", { cwd: root }).toString().trim();
    info(`repo: ${branch} @ ${commit}`);
    const dirty = execSync("git status --porcelain", { cwd: root }).toString().trim();
    if (dirty) info(`local edits present (${dirty.split("\n").length} files) — they override pulled fixes`);
    const expected = ["d4f674d", "ddf521e", "0a74186", "d0bd3d4"];
    if (expected.some((c) => commit.startsWith(c))) {
      ok("session-outage fixes are in this checkout");
    } else {
      fail(
        `commit ${commit} predates the flicker/logout fixes`,
        "git stash && git pull origin arena/01a0c18a-ecommerce-microservices && git stash pop"
      );
    }
  } catch {
    fail("not a git checkout?", "clone the repository");
  }

  section("2. Dependencies");
  const flagIcons = path.join(fe, "node_modules", "country-flag-icons", "package.json");
  if (fs.existsSync(flagIcons)) {
    ok("country-flag-icons installed");
  } else {
    fail(
      "country-flag-icons MISSING from node_modules — every page showing a flag (Login, Register, Checkout, Addresses, Orders) crashes Vite with 'Failed to resolve import'",
      "cd frontend && npm install"
    );
  }
  const viteBin = fs.existsSync(path.join(fe, "node_modules", ".bin", "vite"));
  if (viteBin) ok("vite installed");
  else fail("vite missing", "cd frontend && npm install");

  section("3. Port 8889 (mock API) — the #1 cause of your symptoms");
  const v4 = await probe("127.0.0.1", 8889);
  const v6 = await probe("::1", 8889);
  if (!v4 && !v6) {
    fail(
      "NOTHING is listening on :8889 — every API call dies, pages flicker through error states and the app logs you out",
      "run `npm start` from the repo root (or `cd frontend && npm start`) — it starts the mock + the storefront together"
    );
  } else {
    const code = await httpGet(v4 ? "127.0.0.1" : "::1", 8889, "/v1/categories");
    if (code === 200) {
      ok(`mock API answers on ${v4 ? "127.0.0.1" : "::1"}:8889 (HTTP ${code})`);
    } else if (code === 0) {
      fail(
        "something ACCEPTS connections on :8889 but never responds (socket hang up) — a zombie/stale process is squatting the port",
        "kill it: Windows → `netstat -ano | findstr :8889` then `taskkill /PID <pid> /F`; or reboot. Then start again with `npm start`"
      );
    } else {
      info(`:8889 answered HTTP ${code} — something non-mock may be squatting the port`);
    }
  }

  section("4. Port 3000 (storefront)");
  const feUp = await probe("127.0.0.1", 3000);
  if (feUp) {
    const code = await httpGet("127.0.0.1", 3000, "/v1/categories");
    if (code === 200) {
      ok("storefront is up AND its proxy reaches the mock API");
    } else {
      fail(
        `storefront is up but the proxy call returned ${code || "nothing"} — the vite dev server was started BEFORE the mock (restart it) or an old vite instance is still running`,
        "stop it (Ctrl+C / taskkill) and start again with `npm start` from the repo root"
      );
    }
  } else {
    info("storefront not running (start everything with `npm start`)");
  }

  section("5. Browser hygiene (do this once)");
  info("DevTools → Application → Service workers → Unregister (a PWA worker from an old prod build can serve stale code)");
  info("DevTools → Application → Local storage → clear cartly session keys if login loops persist");
  info("Hard refresh: Ctrl+Shift+R");

  section("Result");
  if (failures === 0) {
    console.log("  ✅ No environment problems found. If the UI still misbehaves, share the browser console output.");
  } else {
    console.log(`  ❌ ${failures} problem(s) above. Apply the FIX lines, then re-run: node scripts/doctor.mjs`);
  }
  process.exit(Math.min(failures, 1));
};

main();
