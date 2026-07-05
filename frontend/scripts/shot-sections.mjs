// Per-section element screenshots at desktop width for detailed critique.
import { chromium } from "playwright";
import { mkdirSync } from "node:fs";

const URL = process.env.SHOT_URL || "http://localhost:3000";
const OUT = process.env.SHOT_DIR || "./.shots";
mkdirSync(OUT, { recursive: true });

const IDS = ["problem", "method", "value", "trust", "console", "scope"];

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 });
const page = await ctx.newPage();
await page.goto(URL, { waitUntil: "networkidle" });
// scroll through to trigger reveals
await page.evaluate(async () => {
  await new Promise((r) => {
    let y = 0; const t = setInterval(() => { window.scrollBy(0, 400); y += 400; if (y > document.body.scrollHeight + 1200) { clearInterval(t); r(); } }, 90);
  });
});
await page.evaluate(() => window.scrollTo(0, 0));
await page.waitForTimeout(1200);

for (const id of IDS) {
  const el = page.locator(`#${id}`);
  if ((await el.count()) > 0) {
    await el.scrollIntoViewIfNeeded();
    await page.waitForTimeout(400);
    await el.screenshot({ path: `${OUT}/sec-${id}.png` });
    console.log("saved", `sec-${id}.png`);
  }
}
const footer = page.locator("footer");
await footer.scrollIntoViewIfNeeded();
await page.waitForTimeout(300);
await footer.screenshot({ path: `${OUT}/sec-footer.png` });
console.log("saved sec-footer.png");

await ctx.close();
await browser.close();
