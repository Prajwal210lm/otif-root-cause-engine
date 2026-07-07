// Generates public/og-image.png (1200x630) from scripts/og.html, and
// app/icon.png (512px) from app/icon.svg. Run: node scripts/make-assets.mjs
import { chromium } from "playwright";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const browser = await chromium.launch();

// 1. OG image — inject the current canonical numbers so it can never go stale
const canonical = JSON.parse(readFileSync(resolve("app/lib/canonicalRun.json"), "utf8"));
const overallPct = (Math.round(canonical.scorecard.overall_accuracy * 1000) / 10).toFixed(1);
const n = canonical.n;
const og = await browser.newPage({ viewport: { width: 1200, height: 630 } });
await og.goto("file://" + resolve("scripts/og.html"));
await og.evaluate(() => document.fonts.ready);
await og.evaluate(
  ({ overallPct, n }) => {
    document.getElementById("ogstat").textContent = `${overallPct}%`;
    document.getElementById("oglabel").textContent = `accurate across ${n} failed orders`;
  },
  { overallPct, n }
);
await og.waitForTimeout(400);
await og.screenshot({ path: "public/og-image.png" });
console.log(`saved public/og-image.png (${overallPct}%, n=${n})`);

// 2. PNG favicon fallback from the SVG mark
const svg = readFileSync("app/icon.svg", "utf8");
const icon = await browser.newPage({ viewport: { width: 512, height: 512 } });
await icon.setContent(
  `<body style="margin:0;background:transparent">${svg.replace("<svg ", '<svg width="512" height="512" ')}</body>`
);
await icon.screenshot({ path: "app/icon.png", omitBackground: true });
console.log("saved app/icon.png");

await browser.close();
