import { COMPANY } from "../lib/company";
import { METRICS, fmtAEDm } from "../lib/otif";

// One honest line: fictional company, synthetic data. Use at the first mention
// of Mawarid on each page.
export function FictionalLabel({ className = "" }) {
  return (
    <p className={`flex flex-wrap items-center gap-x-2 gap-y-1 font-mono text-[11px] leading-relaxed tracking-wide text-muted ${className}`}>
      <span className="rounded-sm border border-hairline px-1.5 py-0.5 text-[9px] uppercase tracking-[0.14em]">
        Illustrative
      </span>
      <span className="normal-case">{COMPANY.disclaimer}</span>
    </p>
  );
}

// Full company profile (used where the money figures live).
export function CompanyProfile() {
  return (
    <div className="rounded-xl border border-hairline bg-canvas p-6 md:p-8">
      <p className="eyebrow">About the company</p>
      <p className="mt-4 max-w-[760px] text-[15px] leading-relaxed text-ink">{COMPANY.profile}</p>
      <div className="mt-5 border-t border-hairline pt-4">
        <FictionalLabel />
      </div>
    </div>
  );
}

// Sample-data explainer. `short` = one-line version (Results); full version
// (Run It Live) also explains what a fresh analysis does.
export function SampleData({ short = false }) {
  if (short) {
    return (
      <div className="rounded-lg border border-hairline bg-canvas p-4 md:px-5">
        <p className="text-sm leading-relaxed text-muted">
          <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink">About the data · </span>
          a synthetic batch of <span className="font-semibold text-ink">{METRICS.orders} failed orders</span>{" "}
          (<span className="tnum">{fmtAEDm(METRICS.totalValue)}</span> at risk), built to mirror real GCC
          FMCG patterns, with the true cause of each planted in advance so the engine can be scored
          against an answer key it never sees.
        </p>
      </div>
    );
  }
  return (
    <div className="rounded-xl border border-hairline bg-canvas p-6 md:p-8">
      <p className="eyebrow">About the data</p>
      <p className="mt-4 max-w-[840px] text-[15px] leading-relaxed text-ink">
        One batch of {METRICS.orders} orders that failed OTIF, carrying {fmtAEDm(METRICS.totalValue)}{" "}
        of order value at risk. Real distributor data is confidential, so this batch is synthetic,
        built to mirror real GCC FMCG patterns, with one deliberate property: the true cause of every
        failure is planted when the data is generated, so the engine can be scored against a known
        answer key. The engine never sees those answers.
      </p>
      <p className="mt-4 max-w-[840px] text-[15px] leading-relaxed text-muted">
        <span className="font-semibold text-ink">What &ldquo;Run a fresh analysis&rdquo; does:</span> it
        generates a brand-new batch on a different random seed, new orders, new planted causes, and
        runs the four agents and the coordinator live on data they have never seen, so you can confirm
        the accuracy holds. What you see by default is the saved result from the standard batch
        (seed {METRICS.seed}).
      </p>
    </div>
  );
}
