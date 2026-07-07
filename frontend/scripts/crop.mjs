// throwaway crop helper for close inspection during the design loop
import { chromium } from "playwright";
const OUT = process.env.SHOT_DIR || "./.shots";
const URL = process.env.SHOT_URL || "http://localhost:3000";
const SEL = process.env.CROP_SEL || ".reg";
const TAG = process.env.CROP_TAG || "crop";
const CLICK = process.env.CROP_CLICK || "";
const b = await chromium.launch();
const ctx = await b.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 });
const pg = await ctx.newPage();
await pg.goto(URL, { waitUntil: "networkidle" });
await pg.waitForTimeout(1200);
if (CLICK) {
  await pg.getByRole("button", { name: new RegExp(CLICK, "i") }).first().click();
  await pg.waitForTimeout(700);
}
await pg.locator(SEL).first().screenshot({ path: `${OUT}/${TAG}.png` });
await b.close();
console.log("cropped", TAG);
