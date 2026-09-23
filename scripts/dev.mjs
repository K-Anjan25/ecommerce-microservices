#!/usr/bin/env node
/**
 * One-command local dev: starts the preview mock API (:8889) and the Vite
 * storefront (:3000) together, so the frontend's /v1, /user, /file proxy
 * targets are always up. Ctrl+C stops both.
 *
 *   npm run dev          (from the repo root)
 *
 * Real backends instead? Use `docker-compose up` — the vite proxy targets
 * stay the same through the gateway port mapping.
 */
import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const isWindows = process.platform === "win32";
const npm = isWindows ? "npm.cmd" : "npm";

const children = [];

const run = (name, args, cwd) => {
  const child = spawn(isWindows ? args[0] : args[0], args.slice(1), {
    cwd,
    stdio: ["ignore", "inherit", "inherit"],
    shell: isWindows,
    env: process.env,
  });
  child.on("exit", (code) => {
    if (code !== 0 && code !== null) {
      console.error(`[${name}] exited with code ${code}`);
    }
  });
  children.push({ name, child });
  return child;
};

console.log("› starting mock API  → http://localhost:8889");
run("mock-api", ["node", path.join("design", "preview-mock-server.mjs")], root);

console.log("› starting storefront → http://localhost:3000");
run("storefront", [npm, "start"], path.join(root, "frontend"));

const stopAll = () => {
  for (const { name, child } of children) {
    if (!child.killed) {
      try {
        child.kill(isWindows ? undefined : "SIGTERM");
      } catch {
        /* already gone */
      }
    }
  }
  process.exit(0);
};

process.on("SIGINT", stopAll);
process.on("SIGTERM", stopAll);
process.on("exit", stopAll);
