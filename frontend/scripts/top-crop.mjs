// crop a fixed top pixel region of the viewport (for checking header/strip text)
import { chromium } from "playwright";
const OUT = process.env.SHOT_DIR || "./.shots";
const URL = process.env.SHOT_URL || "http://localhost:3000";
const TAG = process.env.CROP_TAG || "top-crop";
const W = Number(process.env.CROP_W || 390);
const H = Number(process.env.CROP_H || 160);
const b = await chromium.launch();
const ctx = await b.newContext({ viewport: { width: W, height: H + 60 }, deviceScaleFactor: 3 });
const pg = await ctx.newPage();
await pg.goto(URL, { waitUntil: "networkidle" });
await pg.waitForTimeout(800);
await pg.screenshot({ path: `${OUT}/${TAG}.png`, clip: { x: 0, y: 0, width: W, height: H } });
await b.close();
console.log("cropped", TAG);
