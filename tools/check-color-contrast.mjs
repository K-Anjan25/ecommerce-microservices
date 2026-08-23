#!/usr/bin/env node
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const tokens = JSON.parse(readFileSync(join(root, "design/tokens.json"), "utf8"));

const luminance = (hex) => {
  const rgb = hex.slice(1).match(/.{2}/g).map((x) => parseInt(x, 16) / 255);
  const linear = rgb.map((x) => (x <= 0.04045 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4));
  return 0.2126 * linear[0] + 0.7152 * linear[1] + 0.0722 * linear[2];
};
const ratio = (a, b) => {
  const [light, dark] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (light + 0.05) / (dark + 0.05);
};
const value = (mode, path) => path.reduce((node, key) => node[key], tokens[mode]).value;

const checks = [
  ["light action / white", value("color", ["action", "DEFAULT"]), "#FFFFFF", 4.5],
  ["dark action / white", value("colorDark", ["action", "DEFAULT"]), "#FFFFFF", 4.5],
  ["light brand / paper", value("color", ["brand", "600"]), value("color", ["surface", "paper"]), 4.5],
  ["dark brand / paper", value("colorDark", ["brand", "500"]), value("colorDark", ["surface", "paper"]), 4.5],
  ["light muted text / paper", value("color", ["ink", "400"]), value("color", ["surface", "paper"]), 4.5],
  ["dark muted text / paper", value("colorDark", ["ink", "400"]), value("colorDark", ["surface", "paper"]), 4.5],
  ["accent / ink", value("color", ["accent", "500"]), value("color", ["ink", "900"]), 4.5],
];

let failed = false;
for (const [name, foreground, background, minimum] of checks) {
  const actual = ratio(foreground, background);
  const pass = actual >= minimum;
  failed ||= !pass;
  console.log(`${pass ? "✓" : "✗"} ${name}: ${actual.toFixed(2)}:1 (minimum ${minimum}:1)`);
}
if (failed) process.exit(1);
