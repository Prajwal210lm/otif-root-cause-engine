import Reveal from "./Reveal";
import GrowBar from "./GrowBar";
import CaseStudy from "./CaseStudy";
import { METRICS } from "../lib/otif";

function StatCard({ big, label, sub, accent }) {
  return (
    <div className="rounded-xl border border-hairline bg-canvas p-6 md:p-7">
      <div className={`tnum text-4xl font-bold leading-none ${accent ? "text-accent" : "text-ink"}`}>{big}</div>
      <p className="mt-3 text-sm font-semibold text-ink">{label}</p>
      <p className="mt-1 text-sm text-muted">{sub}</p>
    </div>
  );
}

export default function TrustSection() {
  const m = METRICS;
  return (
    <section id="trust" className="border-t border-hairline bg-surface">
      <div className="mx-auto max-w-[1120px] px-6 py-20 md:py-28">
        <Reveal>
          <p className="eyebrow">How we know it works</p>
          <h2 className="mt-4 text-balance text-[1.9rem] font-bold leading-[1.08] tracking-tight md:text-[2.6rem]">
            The easy 100% hides the real test.
          </h2>
          <p className="mt-5 max-w-[720px] text-lg leading-relaxed text-muted">
            We built a batch of {m.orders} failed orders where we already know the true cause of each
            one, because we planted it when generating the data. Then we ran the engine (four AI
            agents, one per team, and a coordinator that settles ties) blind: it never sees the answer
            key, and we checked how often it named the right team.
          </p>
        </Reveal>

        {/* what we got: headline accuracy */}
        <div className="mt-10 grid gap-4 sm:grid-cols-2">
          <Reveal>
            <StatCard
              big={`${m.overallPct}%`}
              label="Correct overall"
              sub={`${m.overallCorrect} of the ${m.orders} orders`}
              accent
            />
          </Reveal>
          <Reveal delay={0.06}>
            <StatCard
              big={`${Math.round(m.cleanPct)}%`}
              label="On the easy orders"
              sub="where one thing clearly went wrong"
            />
          </Reveal>
        </div>

        {/* the hard cases */}
        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <Reveal>
            <div className="h-full rounded-xl border border-hairline bg-canvas p-6 md:p-7">
              <p className="eyebrow">The {m.ambiguousOrders} hard orders (two teams at fault at once)</p>
              <div className="mt-6 space-y-6">
                <div>
                  <div className="flex items-baseline justify-between">
                    <span className="text-sm text-muted">Simple &ldquo;blame the biggest number&rdquo; rule</span>
                    <span className="tnum text-sm font-semibold text-ink">
                      {m.naivePct}% · {m.naiveAmbiguousCorrect}/{m.ambiguousOrders}
                    </span>
                  </div>
                  <div className="mt-2">
                    <GrowBar pct={m.naivePct} color="var(--muted)" />
                  </div>
                </div>
                <div>
                  <div className="flex items-baseline justify-between">
                    <span className="text-sm font-semibold text-ink">The four agents plus coordinator</span>
                    <span className="tnum text-sm font-semibold text-accent">
                      {m.ambiguousPct}% · {m.ambiguousCorrect}/{m.ambiguousOrders}
                    </span>
                  </div>
                  <div className="mt-2">
                    <GrowBar pct={m.ambiguousPct} color="var(--accent)" />
                  </div>
                </div>
              </div>
              <div className="mt-6 flex items-baseline gap-2 border-t border-hairline pt-4">
                <span className="tnum text-2xl font-bold text-accent">+{m.liftPct}</span>
                <span className="text-sm text-muted">points of accuracy, exactly where the problem is hard</span>
              </div>
            </div>
          </Reveal>

          <Reveal delay={0.1}>
            <CaseStudy />
          </Reveal>
        </div>

        {/* what it means + honest misses */}
        <Reveal delay={0.1}>
          <div className="mt-6 grid gap-6 rounded-lg border border-hairline bg-canvas p-6 md:grid-cols-[auto_1fr] md:items-center md:p-8">
            <div className="flex gap-8">
              <div>
                <p className="tnum text-3xl font-bold text-accent">{m.winsOverNaive}</p>
                <p className="eyebrow mt-1">Wins over the simple rule</p>
              </div>
              <div>
                <p className="tnum text-3xl font-bold text-ink">{m.misses}</p>
                <p className="eyebrow mt-1">Honest misses</p>
              </div>
            </div>
            <p className="max-w-[640px] text-sm leading-relaxed text-muted md:border-l md:border-hairline md:pl-8">
              What it means: the engine is reliable on the cases that actually cost you days of arguing,
              the ambiguous ones. And it is honest. It got {m.misses} of the {m.orders} wrong, and it
              tells you which ones and why.
            </p>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
