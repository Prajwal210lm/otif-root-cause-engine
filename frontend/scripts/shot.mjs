// Screenshot critique tool: loads the dev server at desktop + mobile widths,
// triggers scroll-reveal animations, and saves full-page PNGs.
// Usage: SHOT_DIR=<dir> node scripts/shot.mjs   (dev server must be running)
import { chromium } from "playwright";
import { mkdirSync } from "node:fs";

const URL = process.env.SHOT_URL || "http://localhost:3000";
const OUT = process.env.SHOT_DIR || "./.shots";
const TAG = process.env.SHOT_TAG || "";
mkdirSync(OUT, { recursive: true });

const VIEWPORTS = [
  ["desktop", 1440],
  ["mobile", 390],
];

async function autoScroll(page) {
  // step down the page so IntersectionObserver-driven reveals all fire, then return to top
  await page.evaluate(async () => {
    await new Promise((resolve) => {
      let y = 0;
      const step = 380;
      const timer = setInterval(() => {
        window.scrollBy(0, step);
        y += step;
        if (y >= document.body.scrollHeight + 1200) {
          clearInterval(timer);
          resolve();
        }
      }, 110);
    });
  });
  await page.evaluate(() => window.scrollTo(0, 0));
}

const browser = await chromium.launch();
for (const [name, width] of VIEWPORTS) {
  const ctx = await browser.newContext({
    viewport: { width, height: 900 },
    deviceScaleFactor: 2,
    reducedMotion: process.env.SHOT_REDUCED === "1" ? "reduce" : "no-preference",
  });
  const page = await ctx.newPage();
  await page.goto(URL, { waitUntil: "networkidle" });
  await page.waitForTimeout(800);
  await autoScroll(page);
  await page.waitForTimeout(1600); // let entrance + count-ups settle
  const file = `${OUT}/${name}${TAG ? "-" + TAG : ""}.png`;
  await page.screenshot({ path: file, fullPage: true });
  console.log("saved", file);
  await ctx.close();
}
await browser.close();
