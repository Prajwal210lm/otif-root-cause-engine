import { chromium } from "playwright";
import { mkdirSync } from "node:fs";

const BASE = process.env.SHOT_BASE || "http://localhost:3000";
const OUT = process.env.SHOT_DIR || "./.shots";
mkdirSync(OUT, { recursive: true });

const ROUTES = [
  ["home", "/"],
  ["problem", "/problem"],
  ["how", "/how-it-works"],
  ["results", "/results"],
  ["live", "/live"],
];
const WIDTHS = [["d", 1440], ["m", 390]];

async function autoScroll(page) {
  await page.evaluate(async () => {
    await new Promise((r) => {
      let y = 0;
      const t = setInterval(() => { window.scrollBy(0, 320); y += 320; if (y > document.body.scrollHeight + 1500) { clearInterval(t); r(); } }, 80);
    });
  });
  await page.waitForTimeout(1200); // dwell at the bottom so the last section's reveal latches
  await page.evaluate(() => window.scrollTo(0, 0));
}

const browser = await chromium.launch();
for (const [rname, path] of ROUTES) {
  for (const [wname, width] of WIDTHS) {
    const ctx = await browser.newContext({ viewport: { width, height: 900 }, deviceScaleFactor: 2 });
    const page = await ctx.newPage();
    await page.goto(BASE + path, { waitUntil: "networkidle" });
    await page.waitForTimeout(700);
    await autoScroll(page);
    await page.waitForTimeout(3000);
    await page.screenshot({ path: `${OUT}/${rname}-${wname}.png`, fullPage: true });
    console.log("saved", `${rname}-${wname}.png`);
    await ctx.close();
  }
}
await browser.close();
