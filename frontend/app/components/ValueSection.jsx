import Reveal from "./Reveal";
import GrowBar from "./GrowBar";
import SectionHeader from "./SectionHeader";
import { DRIVER_ORDER, DRIVERS, METRICS, fmtAED, fmtAEDm, fmtAEDk1 } from "../lib/otif";

export default function ValueSection() {
  return (
    <section id="value" className="border-b border-hairline">
      <div className="mx-auto max-w-[1200px] px-5 py-20 md:px-8 md:py-28">
        <SectionHeader
          kicker="Value at stake"
          title={`Where the ${fmtAEDm(METRICS.totalValue)} actually went.`}
          intro="Once every order has a cause, the cost rolls up by team. The picture is lopsided: supplier lateness alone carries the single largest share of the value at risk, which makes it the first and cheapest thing to fix."
        />

        <div className="mt-12 overflow-hidden rounded-xl border border-hairline bg-surface">
          {DRIVER_ORDER.map((k, i) => {
            const d = DRIVERS[k];
            return (
              <Reveal key={k} delay={i * 0.06}>
                <div className={`px-6 py-7 md:px-8 ${i > 0 ? "border-t border-hairline" : ""}`}>
                  <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
                    <div className="flex items-center gap-3">
                      <span aria-hidden className="h-3 w-3 rounded-[3px]" style={{ backgroundColor: d.color }} />
                      <h3 className="text-lg font-semibold text-ink">{d.label}</h3>
                    </div>
                    <div className="flex items-baseline gap-3">
                      <span className="tnum text-xl font-bold text-ink">{fmtAED(d.value)}</span>
                      <span className="tnum w-14 text-right text-sm text-muted">{(d.share * 100).toFixed(1)}%</span>
                    </div>
                  </div>
                  <p className="mt-2 max-w-[620px] text-sm leading-relaxed text-muted">{d.headline}</p>
                  <div className="mt-4">
                    <GrowBar pct={d.share * 100} color={d.color} />
                  </div>
                  <div className="mt-3 flex flex-wrap items-center justify-between gap-x-6 gap-y-1">
                    <p className="text-sm text-muted">
                      <span className="font-mono text-[11px] uppercase tracking-[0.12em] text-faint">Fix ▸ </span>
                      <span className="text-ink">{d.action}</span>
                    </p>
                    <span className="tnum text-xs text-faint">{d.orders} orders</span>
                  </div>
                </div>
              </Reveal>
            );
          })}
        </div>

        <Reveal delay={0.1}>
          <div className="mt-6 grid gap-6 rounded-xl border border-hairline bg-raised p-6 md:grid-cols-[1fr_auto] md:items-center md:p-8">
            <div>
              <h3 className="text-base font-semibold text-ink">Not every failure costs the same.</h3>
              <p className="mt-2 max-w-[560px] text-sm leading-relaxed text-muted">
                A supplier failure runs about{" "}
                <span className="tnum font-semibold text-ink">{fmtAEDk1(DRIVERS.supplier.perFailure)}</span>,
                nearly double a logistics one at{" "}
                <span className="tnum font-semibold text-ink">{fmtAEDk1(DRIVERS.logistics.perFailure)}</span>.
                Ranking by count would have hidden this. Ranking by cash puts the most expensive team first.
              </p>
            </div>
            <div className="flex items-end gap-6">
              <CostBar label="Supplier" value={fmtAEDk1(DRIVERS.supplier.perFailure)} px={72} color={DRIVERS.supplier.color} />
              <CostBar
                label="Logistics"
                value={fmtAEDk1(DRIVERS.logistics.perFailure)}
                px={Math.round(72 * (DRIVERS.logistics.perFailure / DRIVERS.supplier.perFailure))}
                color={DRIVERS.logistics.color}
              />
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

function CostBar({ label, value, px, color }) {
  return (
    <div className="flex flex-col items-center gap-2">
      <span className="tnum text-xs font-semibold text-ink">{value}</span>
      <div aria-hidden="true" className="w-11 rounded-t-[3px]" style={{ height: `${px}px`, backgroundColor: color }} />
      <span className="font-mono text-[9px] uppercase tracking-[0.1em] text-faint">{label}</span>
    </div>
  );
}
