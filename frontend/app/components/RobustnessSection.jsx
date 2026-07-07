import SectionHeader from "./SectionHeader";
import Reveal from "./Reveal";
import { ROBUSTNESS_SEEDS, ROBUSTNESS_METRICS } from "../lib/otif";

export default function RobustnessSection() {
  const r = ROBUSTNESS_METRICS;
  const canonicalSeed = ROBUSTNESS_SEEDS.find((s) => s.isCanonical)?.seed;
  const anomaly = ROBUSTNESS_SEEDS.find((s) => s.liftPct < 0);

  return (
    <section id="robustness" className="border-b border-hairline bg-surface">
      <div className="mx-auto max-w-[1200px] px-5 py-20 md:px-8 md:py-28">
        <SectionHeader
          kicker="Is this one lucky seed?"
          title={
            <>
              {r.meanAmbiguousPct}% mean on the hard orders, range {r.minAmbiguousPct}&ndash;
              {r.maxAmbiguousPct}%, across {r.seedCount} independent batches.
            </>
          }
          intro="Each batch is generated fresh with different planted causes. The engine has never seen any of them. The accuracy holds, and the one batch where it did not is left in the table, not hidden."
        />

        <Reveal delay={0.08}>
          <div className="mt-10 overflow-x-auto rounded-xl border border-hairline bg-surface">
            <table className="w-full min-w-[560px] border-collapse text-sm">
              <thead>
                <tr className="border-b border-hairline text-left">
                  {["Seed", "Overall", "Hard orders", "Simple rule", "Lift"].map((h) => (
                    <th key={h} className="px-5 py-3 font-mono text-[0.7rem] font-medium uppercase tracking-[0.12em] text-faint">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {ROBUSTNESS_SEEDS.map((s) => (
                  <tr
                    key={s.seed}
                    className={`border-b border-hairline/60 last:border-b-0 ${
                      s.isCanonical ? "bg-accent-tint/60" : s.liftPct < 0 ? "bg-supplier/[0.05]" : ""
                    }`}
                  >
                    <td className="tnum px-5 py-3.5 font-semibold text-ink">
                      {s.seed}
                      {s.isCanonical && (
                        <span className="ml-2 rounded-full border border-accent/30 px-2 py-0.5 font-mono text-[9px] uppercase tracking-[0.1em] text-accent">
                          canonical
                        </span>
                      )}
                    </td>
                    <td className="tnum px-5 py-3.5 text-ink">{s.overallPct}%</td>
                    <td className="tnum px-5 py-3.5 font-semibold text-ink">{s.ambiguousPct}%</td>
                    <td className="tnum px-5 py-3.5 text-muted">{s.naivePct}%</td>
                    <td className={`tnum px-5 py-3.5 font-semibold ${s.liftPct < 0 ? "text-supplier" : "text-ink"}`}>
                      {s.liftPct >= 0 ? "+" : ""}
                      {s.liftPct}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Reveal>

        {anomaly && (
          <Reveal delay={0.12}>
            <div className="mt-6 rounded-xl border border-supplier/25 bg-supplier/[0.05] p-6 md:p-7">
              <p className="font-mono text-[0.7rem] uppercase tracking-[0.14em]" style={{ color: "var(--supplier)" }}>
                The honest anomaly · seed {anomaly.seed}
              </p>
              <p className="mt-3 max-w-[820px] text-sm leading-relaxed text-ink">
                On seed {anomaly.seed} the simple rule actually won: {anomaly.naivePct}% against the
                coordinator&rsquo;s {anomaly.ambiguousPct}% on the hard orders (the negative lift in the
                table above). It stays in. A tool you can trust tells you when it lost, and averaged
                across all {r.seedCount} batches the coordinator still leads by {r.meanLiftPct} points.
              </p>
            </div>
          </Reveal>
        )}

        <p className="mt-5 max-w-[820px] text-xs leading-relaxed text-faint">
          The canonical batch (seed {canonicalSeed}) is featured throughout the rest of this site,
          chosen as the run whose hard-order accuracy sits closest to the six-seed mean. Lift is the
          coordinator&rsquo;s accuracy minus the simple rule&rsquo;s, on each seed&rsquo;s hard orders only.
        </p>
      </div>
    </section>
  );
}
