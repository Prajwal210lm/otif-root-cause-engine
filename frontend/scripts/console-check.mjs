import { chromium } from "playwright";

const URL = process.env.SHOT_URL || "http://localhost:3000";
const reduced = process.env.SHOT_REDUCED === "1";

const browser = await chromium.launch();
const ctx = await browser.newContext({
  viewport: { width: 1440, height: 900 },
  reducedMotion: reduced ? "reduce" : "no-preference",
});
const page = await ctx.newPage();
const msgs = [];
page.on("console", (m) => {
  if (m.type() === "error" || m.type() === "warning") msgs.push(`[${m.type()}] ${m.text()}`);
});
page.on("pageerror", (e) => msgs.push(`[pageerror] ${e.message}`));
await page.goto(URL, { waitUntil: "networkidle" });
await page.waitForTimeout(2500);
console.log("reduced:", reduced, "| messages:", msgs.length);
for (const m of msgs.slice(0, 25)) console.log(m);
await ctx.close();
await browser.close();
