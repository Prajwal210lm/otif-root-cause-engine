import PipelineConsole from "./components/PipelineConsole";
import RouteCards from "./components/RouteCards";
import Kicker from "./components/Kicker";
import Button from "./components/Button";
import Stat from "./components/Stat";
import Reveal from "./components/Reveal";
import SectionHeader from "./components/SectionHeader";
import DriverLegend from "./components/DriverLegend";
import { COMPANY } from "./lib/company";
import { METRICS, ROBUSTNESS_METRICS, fmtAEDm } from "./lib/otif";

export const metadata = {
  title: "OTIF Root-Cause Engine · when a delivery fails, this finds who's right",
  description: `Four specialist AI agents investigate every failed delivery in parallel; a coordinator names the dominant cause, ranked by cash. ${METRICS.overallPct}% accurate across ${METRICS.orders} orders, every figure traced to tested code.`,
};

const HERO_STATS = [
  {
    value: METRICS.overallPct,
    decimals: 1,
    suffix: "%",
    label: "Overall attribution accuracy",
    sub: `Seed ${METRICS.seed} canonical · ${METRICS.orders} orders scored`,
    accent: true,
  },
  {
    value: ROBUSTNESS_METRICS.meanAmbiguousPct,
    decimals: 1,
    suffix: "%",
    label: "Mean on hard, two-cause orders",
    sub: `${ROBUSTNESS_METRICS.seedCount} batches · range ${ROBUSTNESS_METRICS.minAmbiguousPct}–${ROBUSTNESS_METRICS.maxAmbiguousPct}%`,
  },
  {
    value: +(METRICS.totalValue / 1_000_000).toFixed(2),
    decimals: 2,
    prefix: "AED ",
    suffix: "M",
    label: "Failure value attributed",
    sub: `To the dirham, across all ${METRICS.orders} failed orders`,
  },
];

const ONE_BREATH = [
  {
    label: "The company",
    body: (
      <>
        {COMPANY.name} moves about 9,000 products through two UAE warehouses to roughly 3,200
        delivery points. Fictional company, synthetic data.
      </>
    ),
  },
  {
    label: "The problem",
    body: "When an order lands late or short, four teams each have a reason it was not them. Usually more than one thing went wrong at once.",
  },
  {
    label: "The tool",
    body: "Four specialist agents investigate every failure in parallel. A coordinator weighs their claims and names the deciding cause, ranked by cash.",
  },
];

// coordinate the two range bars in the result section on a shared 0–100 scale
function RangeBar({ label, min, max, mean, color, muted = false }) {
  return (
    <div>
      <div className="flex items-baseline justify-between">
        <span className="text-sm font-medium text-ink">{label}</span>
        <span className="tnum text-sm text-muted">
          {min}–{max}%
        </span>
      </div>
      <div className="relative mt-2 h-2.5 w-full rounded-full bg-hairline" aria-hidden>
        <div
          className="absolute inset-y-0 rounded-full"
          style={{
            left: `${min}%`,
            width: `${max - min}%`,
            backgroundColor: color,
            opacity: muted ? 0.35 : 0.85,
          }}
        />
        {mean != null && (
          <div
            className="absolute inset-y-[-3px] w-[2px] rounded-full"
            style={{ left: `${mean}%`, backgroundColor: "var(--ink)" }}
            title={`mean ${mean}%`}
          />
        )}
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <>
      {/* ===== HERO: the complete 20-second story ===== */}
      <section className="relative overflow-hidden border-b border-hairline">
        <div aria-hidden className="field-grid field-grid-fade absolute inset-0" />
        <div className="relative mx-auto w-full max-w-[1200px] px-5 md:px-8">
          {/* telemetry strip */}
          <div className="flex items-center justify-between border-b border-hairline py-3 font-mono text-[10.5px] uppercase tracking-[0.16em] text-faint">
            <span>Case {COMPANY.caseId} · {COMPANY.short} Distribution</span>
            <span className="hidden sm:inline">Fictional company · synthetic data</span>
          </div>

          <div className="max-w-4xl pt-14 md:pt-20">
            <Reveal>
              <Kicker>Multi-agent failure attribution</Kicker>
              <h1 className="mt-5 text-balance text-[2.1rem] font-bold leading-[1.04] tracking-[-0.02em] sm:text-[2.7rem] md:text-[3.35rem]">
                When a delivery fails, four teams blame each other.{" "}
                <span className="text-accent">This names who&rsquo;s right, ranked by cash.</span>
              </h1>
              <p className="mt-6 max-w-[620px] text-lg leading-relaxed text-muted">
                Four specialist agents investigate every failed order in parallel. A coordinator weighs
                their competing claims and names the deciding cause, in seconds, with the evidence attached.
              </p>
              <div className="mt-8 flex flex-wrap items-center gap-3">
                <Button href="/live">Run it live</Button>
                <Button href="/how-it-works" variant="ghost">
                  See how it works
                </Button>
              </div>
            </Reveal>
          </div>

          {/* three hero numbers */}
          <Reveal delay={0.1}>
            <div className="reg mt-14 grid gap-px overflow-hidden rounded-xl border border-hairline bg-hairline md:mt-16 md:grid-cols-3">
              {HERO_STATS.map((s) => (
                <div key={s.label} className="bg-surface px-6 py-8 md:px-8 md:py-9">
                  <Stat
                    value={s.value}
                    decimals={s.decimals}
                    prefix={s.prefix}
                    suffix={s.suffix}
                    label={s.label}
                    sub={s.sub}
                    accent={s.accent}
                    size="lg"
                  />
                </div>
              ))}
            </div>
          </Reveal>

          {/* signature: the live attribution pipeline */}
          <div className="py-16 md:py-24">
            <Reveal className="mb-4">
              <Kicker>The live attribution pipeline</Kicker>
            </Reveal>
            <Reveal delay={0.05}>
              <PipelineConsole />
            </Reveal>
          </div>
        </div>
      </section>

      {/* ===== WHO / WHAT, in one breath ===== */}
      <section className="border-b border-hairline bg-surface">
        <div className="mx-auto max-w-[1200px] px-5 py-16 md:px-8 md:py-20">
          <Reveal className="mb-8">
            <Kicker>Who this is for</Kicker>
          </Reveal>
          <div className="grid gap-px overflow-hidden rounded-xl border border-hairline bg-hairline md:grid-cols-3">
            {ONE_BREATH.map((item, i) => (
              <Reveal key={item.label} delay={i * 0.06} className="bg-surface">
                <div className="h-full px-6 py-7 md:px-8 md:py-8">
                  <p className="font-mono text-[0.7rem] font-medium uppercase tracking-[0.16em] text-accent">
                    {item.label}
                  </p>
                  <p className="mt-3 text-[15px] leading-relaxed text-ink">{item.body}</p>
                </div>
              </Reveal>
            ))}
          </div>
          <Reveal delay={0.1} className="mt-8">
            <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
              <span className="font-mono text-[0.7rem] uppercase tracking-[0.16em] text-faint">
                The four suspects
              </span>
              <DriverLegend />
            </div>
          </Reveal>
        </div>
      </section>

      {/* ===== THE RESULT: robustness-verified headline ===== */}
      <section className="border-b border-hairline">
        <div className="mx-auto max-w-[1200px] px-5 py-20 md:px-8 md:py-28">
          <div className="grid gap-12 lg:grid-cols-[1.05fr_1fr] lg:items-center">
            <SectionHeader
              kicker={`Verified across ${ROBUSTNESS_METRICS.seedCount} batches`}
              title="The win shows up where the problem is actually hard."
              intro="Anyone can call the easy orders. The test is the hard ones, where two real causes fire at once. There, across six independently generated batches, the coordinator holds a wide margin over the naive rule that just blames the biggest number."
            />
            <Reveal delay={0.1}>
              <div className="reg rounded-xl border border-hairline bg-surface p-6 shadow-[var(--shadow-panel)] md:p-8">
                <div className="flex items-baseline justify-between">
                  <Stat
                    value={ROBUSTNESS_METRICS.meanAmbiguousPct}
                    decimals={1}
                    suffix="%"
                    accent
                    size="md"
                  />
                  <span className="font-mono text-[0.7rem] uppercase tracking-[0.14em] text-faint">
                    mean · hard orders
                  </span>
                </div>
                <div className="mt-8 space-y-5">
                  <RangeBar
                    label="Coordinator"
                    min={ROBUSTNESS_METRICS.minAmbiguousPct}
                    max={ROBUSTNESS_METRICS.maxAmbiguousPct}
                    mean={ROBUSTNESS_METRICS.meanAmbiguousPct}
                    color="var(--accent)"
                  />
                  <RangeBar
                    label="Naive &ldquo;biggest number&rdquo; rule"
                    min={ROBUSTNESS_METRICS.naiveMinPct}
                    max={ROBUSTNESS_METRICS.naiveMaxPct}
                    color="var(--muted)"
                    muted
                  />
                </div>
                <p className="mt-6 border-t border-hairline pt-4 font-mono text-[10.5px] uppercase tracking-[0.12em] text-faint">
                  Black tick marks the mean · full six-seed table on the results page
                </p>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ===== ROUTE CARDS ===== */}
      <RouteCards />
    </>
  );
}
