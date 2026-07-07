import Reveal from "./Reveal";
import GrowBar from "./GrowBar";
import CaseStudy from "./CaseStudy";
import SectionHeader from "./SectionHeader";
import Kicker from "./Kicker";
import Stat from "./Stat";
import { METRICS } from "../lib/otif";

export default function TrustSection() {
  const m = METRICS;
  return (
    <section id="trust" className="border-b border-hairline bg-surface">
      <div className="mx-auto max-w-[1200px] px-5 py-20 md:px-8 md:py-28">
        <SectionHeader
          kicker="What we tested · what we got"
          title="The easy 100% hides the real test."
          intro={`We built a batch of ${m.orders} failed orders where the true cause of each is planted in advance. Then we ran the engine blind, it never sees the answer key, and checked how often it named the right team.`}
        />

        {/* headline accuracy */}
        <div className="mt-10 grid gap-px overflow-hidden rounded-xl border border-hairline bg-hairline sm:grid-cols-2">
          <div className="bg-surface px-6 py-7 md:px-8">
            <Stat value={m.overallPct} decimals={1} suffix="%" accent size="md" label="Correct overall" sub={`${m.overallCorrect} of the ${m.orders} orders`} />
          </div>
          <div className="bg-surface px-6 py-7 md:px-8">
            <Stat value={m.cleanPct} decimals={0} suffix="%" size="md" label="On the easy orders" sub="where one thing clearly went wrong" />
          </div>
        </div>

        {/* the hard cases + worked example */}
        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <Reveal>
            <div className="reg h-full rounded-xl border border-hairline bg-raised p-6 md:p-7">
              <Kicker>The {m.ambiguousOrders} hard orders · two teams at fault at once</Kicker>
              <div className="mt-6 space-y-6">
                <div>
                  <div className="flex items-baseline justify-between">
                    <span className="text-sm text-muted">Simple &ldquo;biggest number&rdquo; rule</span>
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
          <div className="mt-6 grid gap-6 rounded-xl border border-hairline bg-raised p-6 md:grid-cols-[auto_1fr] md:items-center md:p-8">
            <div className="flex gap-10">
              <div>
                <p className="tnum text-3xl font-bold text-accent">{m.winsOverNaive}</p>
                <p className="mt-2 font-mono text-[0.7rem] uppercase tracking-[0.14em] text-muted">Wins over the simple rule</p>
              </div>
              <div>
                <p className="tnum text-3xl font-bold text-ink">{m.misses}</p>
                <p className="mt-2 font-mono text-[0.7rem] uppercase tracking-[0.14em] text-muted">Honest misses</p>
              </div>
            </div>
            <p className="max-w-[640px] text-sm leading-relaxed text-muted md:border-l md:border-hairline md:pl-10">
              What it means: the engine is reliable on the cases that actually cost you days of arguing,
              the ambiguous ones. And it is honest. It got {m.misses} of the {m.orders} wrong, and the
              scorecard says which and why rather than hiding them.
            </p>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
