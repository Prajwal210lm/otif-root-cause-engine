// mobile-specific crop helper for the audit verification
import { chromium } from "playwright";
const OUT = process.env.SHOT_DIR || "./.shots";
const URL = process.env.SHOT_URL || "http://localhost:3000";
const SEL = process.env.CROP_SEL || "body";
const TAG = process.env.CROP_TAG || "mobile-crop";
const b = await chromium.launch();
const ctx = await b.newContext({ viewport: { width: 390, height: 700 }, deviceScaleFactor: 2 });
const pg = await ctx.newPage();
await pg.goto(URL, { waitUntil: "networkidle" });
await pg.waitForTimeout(800);
await pg.locator(SEL).first().screenshot({ path: `${OUT}/${TAG}.png` });
await b.close();
console.log("cropped", TAG);
