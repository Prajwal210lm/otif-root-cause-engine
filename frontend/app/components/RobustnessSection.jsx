import { ROBUSTNESS_SEEDS, ROBUSTNESS_METRICS } from "../lib/otif";

export default function RobustnessSection() {
  const r = ROBUSTNESS_METRICS;
  return (
    <section id="robustness" className="border-t border-hairline bg-canvas">
      <div className="mx-auto max-w-[1120px] px-6 py-20 md:py-28">
        <p className="eyebrow">Is this one lucky seed?</p>
        <h2 className="mt-4 text-balance text-[1.9rem] font-bold leading-[1.08] tracking-tight md:text-[2.6rem]">
          {r.meanAmbiguousPct}% mean on the hard orders (range {r.minAmbiguousPct}&ndash;{r.maxAmbiguousPct}%)
          across six independent batches.
        </h2>
        <p className="mt-5 max-w-[720px] text-lg leading-relaxed text-muted">
          Each batch is generated fresh with different planted causes. The engine has never seen any of
          them. The accuracy holds.
        </p>

        <div className="mt-10 overflow-x-auto rounded-xl border border-hairline bg-surface">
          <table className="w-full min-w-[560px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-hairline text-left text-muted">
                <th className="px-5 py-3 font-medium">Seed</th>
                <th className="px-5 py-3 font-medium">Overall</th>
                <th className="px-5 py-3 font-medium">Hard orders</th>
                <th className="px-5 py-3 font-medium">Simple rule</th>
                <th className="px-5 py-3 font-medium">Lift</th>
              </tr>
            </thead>
            <tbody>
              {ROBUSTNESS_SEEDS.map((s) => (
                <tr key={s.seed} className={`border-b border-hairline/60 last:border-b-0 ${s.isCanonical ? "bg-accent/5" : ""}`}>
                  <td className="tnum px-5 py-3 font-semibold text-ink">
                    {s.seed}
                    {s.isCanonical && (
                      <span className="ml-2 rounded-full border border-accent/30 px-2 py-0.5 font-mono text-[9px] uppercase tracking-[0.1em] text-accent">
                        shown above
                      </span>
                    )}
                  </td>
                  <td className="tnum px-5 py-3 text-ink">{s.overallPct}%</td>
                  <td className="tnum px-5 py-3 font-semibold text-ink">{s.ambiguousPct}%</td>
                  <td className="tnum px-5 py-3 text-muted">{s.naivePct}%</td>
                  <td className="tnum px-5 py-3 font-semibold text-ink">
                    {s.liftPct >= 0 ? "+" : ""}
                    {s.liftPct}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-4 text-xs leading-relaxed text-muted">
          One canonical batch (seed {ROBUSTNESS_SEEDS.find((s) => s.isCanonical)?.seed}) is featured
          throughout the rest of this site, chosen as the run closest to the six-seed mean. Lift is the
          coordinator&rsquo;s accuracy minus the simple rule&rsquo;s, on that seed&rsquo;s hard orders only; a negative
          number means the simple rule happened to win on that particular batch.
        </p>
      </div>
    </section>
  );
}
