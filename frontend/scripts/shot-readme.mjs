// Captures the two README screenshots into docs/screenshots/ at the repo root.
// Usage: dev server running on :3000, then `node scripts/shot-readme.mjs`.
import { chromium } from "playwright";
import { mkdirSync } from "node:fs";

const BASE = process.env.SHOT_URL || "http://localhost:3000";
const OUT = "../docs/screenshots";
mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 });
const page = await ctx.newPage();

// 1. Home hero (headline + pipeline console)
await page.goto(BASE + "/", { waitUntil: "networkidle" });
await page.waitForTimeout(4000); // let the pipeline reveal finish
await page.screenshot({ path: `${OUT}/home.png` });
console.log("saved docs/screenshots/home.png");

// 2. The live console card on /live
await page.goto(BASE + "/live", { waitUntil: "networkidle" });
await page.waitForTimeout(1500);
const el = page.locator("#console");
await el.scrollIntoViewIfNeeded();
await page.waitForTimeout(600);
await el.screenshot({ path: `${OUT}/console.png` });
console.log("saved docs/screenshots/console.png");

await ctx.close();
await browser.close();
