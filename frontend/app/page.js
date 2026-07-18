import BlameBoard from "./components/BlameBoard";
import WarRoomCard from "./components/WarRoomCard";
import PipelineConsole from "./components/PipelineConsole";
import OtifGap from "./components/OtifGap";
import RouteCards from "./components/RouteCards";
import Kicker from "./components/Kicker";
import Stat from "./components/Stat";
import Reveal from "./components/Reveal";
import SectionHeader from "./components/SectionHeader";
import DriverLegend from "./components/DriverLegend";
import { SampleData } from "./components/DataNote";
import { COMPANY } from "./lib/company";
import { METRICS, ROBUSTNESS_METRICS, fmtAEDm } from "./lib/otif";

export const metadata = {
  title: "OTIF Root-Cause Engine · when a delivery fails, this finds who's right",
  description: `Four specialist AI agents investigate every failed delivery in parallel; a coordinator names the dominant cause, ranked by cash. ${METRICS.overallPct}% accurate across ${METRICS.orders} orders, every figure traced to tested code.`,
};

const RESULT_STATS = [
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
          style={{ left: `${min}%`, width: `${max - min}%`, backgroundColor: color, opacity: muted ? 0.35 : 0.85 }}
        />
        {mean != null && (
          <div className="absolute inset-y-[-3px] w-[2px] rounded-full" style={{ left: `${mean}%`, backgroundColor: "var(--ink)" }} />
        )}
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <>
      {/* ===== 1 · HERO: the stakes and the question (not the answer) ===== */}
      <section className="relative overflow-hidden border-b border-hairline">
        <div aria-hidden className="field-grid field-grid-fade absolute inset-0" />
        <div className="relative mx-auto w-full max-w-[1200px] px-5 md:px-8">
          <div className="flex items-center justify-between border-b border-hairline py-3 font-mono text-[10.5px] uppercase tracking-[0.16em] text-faint">
            <span>Case {COMPANY.caseId} · {COMPANY.short} Distribution (fictional)</span>
            <span className="hidden sm:inline">Fictional company · synthetic data</span>
          </div>

          <div className="grid items-center gap-12 py-14 md:py-20 lg:grid-cols-[1.05fr_1fr] lg:gap-16">
            <Reveal>
              <Kicker>Multi-agent failure attribution</Kicker>
              <h1 className="mt-5 text-balance text-[2.1rem] font-bold leading-[1.04] tracking-[-0.02em] sm:text-[2.6rem] md:text-[3.15rem]">
                When a delivery fails, four teams blame each other.{" "}
                <span className="text-accent">This names who&rsquo;s right, ranked by cash.</span>
              </h1>
              <p className="mt-6 max-w-[560px] text-lg leading-relaxed text-muted">
                Four specialist agents investigate every failed order in parallel, and a coordinator,
                a fifth agent, makes the final call when the four disagree, naming the deciding cause
                with the evidence attached.
              </p>
              <p className="mt-7 flex flex-wrap items-center gap-x-2.5 gap-y-1 font-mono text-[11px] uppercase tracking-[0.14em] text-faint">
                <span className="h-1.5 w-1.5 rounded-[1px] bg-accent" aria-hidden />
                Scored against a known answer, never asserted
                <span className="text-hairline-strong">·</span>
                every figure produced by tested code
              </p>
            </Reveal>

            <Reveal delay={0.12}>
              <BlameBoard />
            </Reveal>
          </div>
        </div>
      </section>

      {/* ===== 2 · THE COMPANY & THE PROBLEM ===== */}
      <section className="border-b border-hairline bg-surface">
        <div className="mx-auto max-w-[1200px] px-5 py-18 md:px-8 md:py-24">
          <SectionHeader
            kicker="The company & the problem"
            title="One number the board watches. Four teams who could be to blame."
            intro={
              <>
                {COMPANY.name} moves about 9,000 products through two UAE warehouses to roughly 3,200
                delivery points (fictional company, synthetic data). Its OTIF, orders arriving on the
                promised day with every item, sits near {COMPANY.otifNow}% against a {COMPANY.otifTarget}%
                board target. Every point of that gap is orders landing late or short, and when one
                fails, four teams each have a reason it was not them. Pinning the real cause takes days,
                and often never resolves.
              </>
            }
          />

          <div className="mt-12 grid items-stretch gap-6 lg:grid-cols-[1.1fr_1fr]">
            <Reveal>
              <WarRoomCard />
            </Reveal>
            <Reveal delay={0.1}>
              <div className="reg flex h-full flex-col justify-center rounded-xl border border-hairline bg-raised p-6 md:p-8">
                <Kicker>On time, in full: today vs target</Kicker>
                <div className="mt-6">
                  <OtifGap now={COMPANY.otifNow} target={COMPANY.otifTarget} />
                </div>
              </div>
            </Reveal>
          </div>

          <Reveal delay={0.12} className="mt-8">
            <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
              <span className="font-mono text-[0.7rem] uppercase tracking-[0.16em] text-faint">The four suspects</span>
              <DriverLegend />
            </div>
          </Reveal>
        </div>
      </section>

      {/* ===== 3 · WHAT THE TOOL DOES + the pipeline (the answer) ===== */}
      <section className="border-b border-hairline">
        <div className="mx-auto max-w-[1200px] px-5 py-20 md:px-8 md:py-28">
          <SectionHeader
            kicker="The method"
            title="Four investigators. One honest referee."
            intro="Each failed order is handed to four specialist agents at once, one per team that could be at fault. Each files a claim on its own evidence. A coordinator reads the competing claims, decides the deciding cause, and ranks the causes by cash. The agents reason; tested code does every calculation."
          />
          <Reveal delay={0.08} className="mt-12">
            <PipelineConsole />
          </Reveal>
        </div>
      </section>

      {/* ===== 4 + 5 · THE DATA (grounding) then THE RESULT (earned numbers) ===== */}
      <section className="border-b border-hairline bg-surface">
        <div className="mx-auto max-w-[1200px] px-5 py-20 md:px-8 md:py-28">
          <SectionHeader
            kicker="The result · measured, not asserted"
            title="Now the numbers mean something."
            intro="Because the answer key exists and the engine never sees it, the accuracy below is scored, not claimed."
          />

          <Reveal delay={0.06} className="mt-8">
            <SampleData short />
          </Reveal>

          <Reveal delay={0.1}>
            <div className="reg mt-6 grid gap-px overflow-hidden rounded-xl border border-hairline bg-hairline md:grid-cols-3">
              {RESULT_STATS.map((s) => (
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
                    count={false}
                  />
                </div>
              ))}
            </div>
          </Reveal>

          <Reveal delay={0.14}>
            <div className="mt-6 grid gap-8 rounded-xl border border-hairline bg-raised p-6 md:grid-cols-[1fr_1.1fr] md:items-center md:p-8">
              <div>
                <Kicker>Not one lucky seed</Kicker>
                <p className="mt-4 text-[15px] leading-relaxed text-muted">
                  Across {ROBUSTNESS_METRICS.seedCount} independently generated batches, the coordinator
                  holds a wide margin over the naive rule on the hard orders, exactly where the problem is
                  genuinely difficult. One batch where the naive rule won is left in the record, not
                  hidden. Full table on the results page.
                </p>
              </div>
              <div className="space-y-5">
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
                <p className="font-mono text-[10.5px] uppercase tracking-[0.12em] text-faint">
                  Black tick marks the {ROBUSTNESS_METRICS.meanAmbiguousPct}% mean across the {ROBUSTNESS_METRICS.seedCount} batches
                </p>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ===== 6 · GO DEEPER (Run It Live CTA lives in the fourth card) ===== */}
      <RouteCards />
    </>
  );
}
