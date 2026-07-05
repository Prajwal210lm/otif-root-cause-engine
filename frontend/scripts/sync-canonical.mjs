// Copies the repo's canonical run (and the multi-seed robustness summary) into
// the frontend bundle so the whole site derives its numbers from these files.
// Runs automatically before dev and build, so regenerating either file updates
// the site with zero manual edits.
import { copyFileSync, existsSync } from "node:fs";

const FILES = [
  { src: "../data/canonical_run.json", dest: "app/lib/canonicalRun.json" },
  { src: "../data/robustness/summary.json", dest: "app/lib/robustnessSummary.json" },
];

for (const { src, dest } of FILES) {
  if (existsSync(src)) {
    copyFileSync(src, dest);
    console.log(`synced ${src} -> ${dest}`);
  } else {
    // deploy environments that vendor only frontend/ keep the committed copy
    console.log(`${src} not found; keeping bundled ${dest}`);
  }
}
