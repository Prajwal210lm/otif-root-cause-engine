import { chromium } from "playwright";
import { mkdirSync } from "node:fs";

const OUT = process.env.SHOT_DIR || "./.shots";
mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1200, height: 900 }, deviceScaleFactor: 2 });
const page = await ctx.newPage();

// 1. Problem page PageNav (only "Next" -> back-to-home fallback on the left)
await page.goto("http://localhost:3000/problem", { waitUntil: "networkidle" });
await page.locator("footer").scrollIntoViewIfNeeded();
await page.mouse.wheel(0, -260);
await page.waitForTimeout(400);
await page.screenshot({ path: `${OUT}/pagenav-problem.png` });
console.log("saved pagenav-problem.png");

// Live page PageNav too (only "Previous" -> back-to-home fallback on the right)
await page.goto("http://localhost:3000/live", { waitUntil: "networkidle" });
await page.locator("footer").scrollIntoViewIfNeeded();
await page.mouse.wheel(0, -260);
await page.waitForTimeout(400);
await page.screenshot({ path: `${OUT}/pagenav-live.png` });
console.log("saved pagenav-live.png");

// 2. Results page ScopeSection (new 5th item, full width)
await page.goto("http://localhost:3000/results", { waitUntil: "networkidle" });
const scope = page.locator("#scope");
await scope.scrollIntoViewIfNeeded();
await page.waitForTimeout(400);
await scope.screenshot({ path: `${OUT}/scope-section.png` });
console.log("saved scope-section.png");

// 3. Live console: intercept the network so we can watch the progress ticks
// mid-run and the handoff to a real result, with zero backend / credits.
await page.route("**/api/health", (route) =>
  route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ status: "ok" }) })
);
await page.route("**/api/analyze**", async (route) => {
  await new Promise((r) => setTimeout(r, 10_000));
  route.fulfill({
    status: 200,
    contentType: "application/json",
    body: JSON.stringify({
      seed: 4242,
      n: 12,
      render_ok: true,
      attribution_violations: [],
      rendered_brief: "MOCK BRIEF FOR SCREENSHOT.\n\nWHAT COULD NOT BE ESTABLISHED\nThis is a mocked fresh-run response used only to verify the progress UI, not a real model output.",
      scorecard: { overall_accuracy: 1.0, clean_accuracy: 1.0, ambiguous_accuracy: null, n_ambiguous: 0, ambiguous_correct: 0 },
      naive: { ambiguous_accuracy: null },
      lift: { ambiguous: null },
      rollup: {
        total_cash: 84210,
        by_driver: [
          { driver: "supplier", cash: 40000, cash_share: 0.475, order_count: 5 },
          { driver: "demand", cash: 24210, cash_share: 0.288, order_count: 3 },
          { driver: "warehouse", cash: 14000, cash_share: 0.166, order_count: 2 },
          { driver: "logistics", cash: 6000, cash_share: 0.071, order_count: 2 },
        ],
      },
    }),
  });
});

await page.goto("http://localhost:3000/live", { waitUntil: "networkidle" });
await page.waitForTimeout(1000); // let the (mocked) health check resolve
const btn = page.getByRole("button", { name: /run a fresh analysis/i });
await btn.waitFor({ state: "visible", timeout: 5000 });
await btn.click();

await page.waitForTimeout(8500); // land inside the "Supplier agent investigating…" stage
const consoleEl = page.locator("#console");
await consoleEl.scrollIntoViewIfNeeded();
await page.screenshot({ path: `${OUT}/fresh-run-progress.png` });
console.log("saved fresh-run-progress.png (mid-run)");

await page.waitForTimeout(3500); // past the 10s mocked network delay: real result should have replaced the ticks
await consoleEl.scrollIntoViewIfNeeded();
await page.screenshot({ path: `${OUT}/fresh-run-complete.png` });
console.log("saved fresh-run-complete.png (post-run, real result)");

await ctx.close();
await browser.close();
