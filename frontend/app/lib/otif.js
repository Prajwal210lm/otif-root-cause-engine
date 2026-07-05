// Single source of truth for every displayed business number: the coordinator's
// canonical run (data/canonical_run.json, synced into the bundle by
// scripts/sync-canonical.mjs). Values, shares, order counts, accuracies and the
// total are DERIVED here; only colors, labels and copy are hand-written.
// Regenerating the canonical run updates the whole site with zero manual edits.
import canonical from "./canonicalRun.json";
import robustness from "./robustnessSummary.json";

export const CANONICAL = canonical;
export const ROBUSTNESS = robustness;

const round1 = (x) => Math.round(x * 10) / 10;
const pctOf = (frac) => round1(frac * 100);

// ---- presentation-only metadata (never numbers) -----------------------------
const META = {
  supplier: {
    label: "Supplier",
    color: "#C0552F",
    headline: "Stock arrived late from vendors, so there was nothing to pick in time.",
    action: "Qualify a second source for the worst-offending vendors",
  },
  demand: {
    label: "Demand",
    color: "#2F6D9E",
    headline: "Forecasts were too low, so stock ran out before the order came in.",
    action: "Recalibrate the forecast on the SKUs that consistently under-call",
  },
  warehouse: {
    label: "Warehouse",
    color: "#6E5B96",
    headline: "Picking and dispatch delays, plus some genuine pick errors.",
    action: "Clear the dispatch bottleneck with a hard release cut-off",
  },
  logistics: {
    label: "Logistics",
    color: "#B08738",
    headline: "The order left on time, but the carrier took too long in transit.",
    action: "Review and re-bond the chronically overrun lanes",
  },
};

// ---- drivers, ranked by cash exactly as the rollup ranks them ---------------
export const DRIVER_ORDER = canonical.rollup.by_driver.map((d) => d.driver);

export const DRIVERS = Object.fromEntries(
  canonical.rollup.by_driver.map((d) => [
    d.driver,
    {
      key: d.driver,
      ...META[d.driver],
      value: d.cash,
      share: d.cash_share,
      orders: d.order_count,
      perFailure: d.cash / d.order_count,
    },
  ])
);

// ---- headline metrics --------------------------------------------------------
const sc = canonical.scorecard;
const nv = canonical.naive;

export const METRICS = {
  // raw fractions (for anything that computes)
  overall: sc.overall_accuracy,
  clean: sc.clean_accuracy,
  ambiguous: sc.ambiguous_accuracy,
  naiveAmbiguous: nv.ambiguous_accuracy,
  liftAmbiguous: canonical.lift.ambiguous,
  // display-rounded percentages (single rounding point for the whole site)
  overallPct: pctOf(sc.overall_accuracy),
  cleanPct: pctOf(sc.clean_accuracy),
  ambiguousPct: pctOf(sc.ambiguous_accuracy),
  naivePct: pctOf(nv.ambiguous_accuracy),
  liftPct: pctOf(canonical.lift.ambiguous),
  // counts
  orders: canonical.n,
  cleanOrders: sc.n_clean,
  ambiguousOrders: sc.n_ambiguous,
  overallCorrect: sc.overall_correct,
  ambiguousCorrect: sc.ambiguous_correct,
  naiveAmbiguousCorrect: nv.ambiguous_correct,
  misses: sc.n_total - sc.overall_correct,
  // net wins over the naive rule on the ambiguous slice
  winsOverNaive: sc.ambiguous_correct - nv.ambiguous_correct,
  // money
  totalValue: canonical.rollup.total_cash,
  // provenance atoms not present in the cache (the only manual numbers left)
  tests: 181,
  model: "Sonnet 4.6",
  seed: canonical.seed,
};

// ---- robustness: accuracy across six independently generated batches --------
export const ROBUSTNESS_SEEDS = robustness.seeds.map((r) => ({
  seed: r.seed,
  isCanonical: r.seed === robustness.canonical_seed,
  overallPct: pctOf(r.overall_accuracy),
  ambiguousPct: pctOf(r.ambiguous_accuracy),
  naivePct: pctOf(r.naive_ambiguous_accuracy),
  liftPct: pctOf(r.lift_ambiguous),
}));

export const ROBUSTNESS_METRICS = {
  meanAmbiguousPct: pctOf(robustness.aggregate.mean_ambiguous_accuracy),
  minAmbiguousPct: pctOf(robustness.aggregate.min_ambiguous_accuracy),
  maxAmbiguousPct: pctOf(robustness.aggregate.max_ambiguous_accuracy),
  meanLiftPct: pctOf(robustness.aggregate.mean_lift_ambiguous),
  seedCount: robustness.seeds.length,
};

// ---- formatters ----------------------------------------------------------------
export const fmtAED = (n) => "AED " + Math.round(n).toLocaleString("en-US");
export const fmtAEDk = (n) => "AED " + Math.round(n / 1000) + "K";
export const fmtAEDk1 = (n) => "AED " + (n / 1000).toFixed(1) + "K";
export const fmtAEDm = (n) => "AED " + (n / 1_000_000).toFixed(2) + "M";
export const pct1 = (frac) => (frac * 100).toFixed(1) + "%";
