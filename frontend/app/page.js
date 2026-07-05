import Link from "next/link";
import PipelineConsole from "./components/PipelineConsole";
import StatStrip from "./components/StatStrip";
import ExplainerSection from "./components/ExplainerSection";
import RouteCards from "./components/RouteCards";
import { CompanyProfile } from "./components/DataNote";
import { COMPANY } from "./lib/company";
import { DRIVER_ORDER, DRIVERS, METRICS, fmtAED, fmtAEDk, fmtAEDm } from "./lib/otif";

export const metadata = {
  title: "OTIF Root-Cause Engine · when a delivery fails, this finds who's right",
  description: `Four AI agents investigate every failed delivery in parallel and name the cause, ranked by cash. ${METRICS.overallPct}% accurate on ${METRICS.orders} orders. A portfolio case study for GCC distribution.`,
};

function Chip({ children }) {
  return (
    <span className="rounded-full border border-hairline bg-surface px-3 py-1.5 font-mono text-[11px] uppercase tracking-[0.1em] text-ink">
      {children}
    </span>
  );
}

function DriverRail() {
  return (
    <div className="rounded-lg border border-hairline bg-surface p-5 shadow-[0_24px_50px_-36px_rgba(20,24,31,0.55)]">
      <div className="flex items-baseline justify-between">
        <p className="eyebrow">Value at risk by team</p>
        <span className="tnum text-xs font-semibold text-ink">{fmtAEDm(METRICS.totalValue)}</span>
      </div>
      <ul className="mt-5 space-y-4">
        {DRIVER_ORDER.map((k) => {
          const d = DRIVERS[k];
          return (
            <li key={k}>
              <div className="flex items-baseline justify-between text-sm">
                <span className="font-medium text-ink">{d.label}</span>
                <span className="tnum text-ink">{fmtAEDk(d.value)}</span>
              </div>
              <div className="mt-1.5 flex items-center gap-2.5">
                <div aria-hidden="true" className="h-1.5 flex-1 overflow-hidden rounded-full bg-hairline">
                  <div className="h-full rounded-full" style={{ width: `${d.share * 100}%`, backgroundColor: d.color }} />
                </div>
                <span className="tnum w-11 text-right text-xs text-muted">{(d.share * 100).toFixed(1)}%</span>
              </div>
            </li>
          );
        })}
      </ul>
      <p className="mt-5 border-t border-hairline pt-3 font-mono text-[10.5px] uppercase tracking-[0.14em] text-muted">
        Supplier failures cost ~{Math.round(DRIVERS.supplier.perFailure / DRIVERS.logistics.perFailure)}× logistics
      </p>
    </div>
  );
}

export default function Home() {
  return (
    <>
      {/* hero: the complete 20-second story */}
      <section className="field-grid border-b border-hairline">
        <div className="mx-auto w-full max-w-[1200px] px-5 md:px-8">
          <div className="flex items-center justify-between border-b border-hairline py-3 font-mono text-[10.5px] uppercase tracking-[0.16em] text-muted">
            <span>Case file · {COMPANY.caseId}</span>
            <span>Fictional company · synthetic data</span>
          </div>

          <div className="grid items-center gap-12 pt-12 pb-10 md:grid-cols-12 md:pt-16 md:pb-14">
            <div className="md:col-span-7">
              <p className="eyebrow">{COMPANY.name} · {COMPANY.kind} · {COMPANY.region}</p>
              <h1 className="mt-5 text-balance text-[2rem] font-bold leading-[1.06] tracking-tight sm:text-[2.5rem] md:text-[3.1rem]">
                When a delivery fails, four teams blame each other.{" "}
                <span className="text-accent">This finds who&rsquo;s right.</span>
              </h1>
              <p className="mt-6 max-w-[580px] text-[1.12rem] leading-relaxed text-muted">
                The engine reads every failed delivery and names the team that actually caused it,
                ranked by how much money each cause is costing, in seconds, with the evidence attached.
              </p>
              <div className="mt-7 flex flex-wrap gap-2">
                <Chip>{METRICS.overallPct}% accuracy</Chip>
                <Chip>{fmtAEDm(METRICS.totalValue)} attributed</Chip>
                <Chip>+{METRICS.liftPct} pts vs a simple rule</Chip>
                <Chip>Evidence attached</Chip>
              </div>
              <div className="mt-8 flex flex-wrap items-center gap-3">
                <Link href="/live" className="rounded-md bg-accent px-5 py-3 text-sm font-semibold text-white transition hover:brightness-110">
                  Run it live
                </Link>
                <Link href="/how-it-works" className="rounded-md border border-hairline bg-surface px-5 py-3 text-sm font-semibold text-ink transition hover:border-ink/30">
                  See how it works
                </Link>
              </div>
            </div>

            <div className="md:col-span-5">
              <DriverRail />
            </div>
          </div>

          <div className="pb-16 md:pb-20">
            <p className="eyebrow mb-3">The live attribution pipeline</p>
            <PipelineConsole />
          </div>
        </div>
      </section>

      {/* plain-language explainer */}
      <ExplainerSection />

      {/* proof band */}
      <section className="mx-auto w-full max-w-[1200px] px-5 py-16 md:px-8 md:py-20">
        <p className="eyebrow mb-3">Measured, not asserted</p>
        <p className="mb-8 max-w-[720px] text-lg leading-relaxed text-muted">
          {COMPANY.short}&rsquo;s <span className="font-semibold text-ink">{METRICS.orders} failed orders</span> in one
          period carried <span className="tnum font-semibold text-ink">{fmtAED(METRICS.totalValue)}</span> at risk. The
          engine attributed every one, scored against a known answer, not asserted.
        </p>
        <StatStrip />
        <p className="mt-5 text-center font-mono text-xs text-muted">
          Every figure is computed by deterministic, tested code. None is written by the model.
        </p>
      </section>

      {/* about the company (fictional + synthetic, full profile) */}
      <section className="border-t border-hairline bg-surface">
        <div className="mx-auto w-full max-w-[1200px] px-5 py-16 md:px-8 md:py-20">
          <CompanyProfile />
        </div>
      </section>

      <RouteCards />
    </>
  );
}
