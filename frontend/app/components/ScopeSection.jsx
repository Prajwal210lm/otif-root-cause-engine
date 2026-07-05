import Reveal from "./Reveal";
import { METRICS } from "../lib/otif";

const ITEMS = [
  {
    n: "01",
    title: "Measured, not asserted",
    body: "A synthetic GCC FMCG batch is generated with the true cause planted in every failed order. Accuracy is scored against that answer key, never claimed.",
  },
  {
    n: "02",
    title: "Wrong is allowed; fabrication is not",
    body: "A firewall hides the answer from the agents; a render gate blocks any model-authored number. The model can misjudge a close call, but it cannot invent a figure.",
  },
  {
    n: "03",
    title: "Pinned by tests",
    body: `${METRICS.tests} passing tests over hand-verified fixtures cover the engine, scoring, firewall and render gate. Every number on this page is a tested number.`,
  },
  {
    n: "04",
    title: "Sonnet, on purpose",
    body: `The agents run on ${METRICS.model}. It cleared the bar at ${METRICS.overallPct}%, so escalating to a larger, costlier model wasn't warranted. That is a deliberate cost decision, not a shortcut.`,
  },
];

const NAIVE_ITEM = {
  n: "05",
  title: "The simple rule isn't rigged to lose",
  body: "It is the standard largest-signal rule: normalize every signal that fired to a comparable severity score, then pick the domain with the highest one. The normalization units are fixed in the code, not chosen after seeing the score: demand is measured in multiples of its own 15% forecast-error threshold, supplier lateness in weeks, warehouse in whichever is worse of a 10%-of-order pick shortfall or a 2-day dispatch delay, and logistics in multiples of that order's own lane SLA. A skeptic can read naive_attribution next to the constants file and check the units were fixed before any batch was scored.",
};

export default function ScopeSection() {
  return (
    <section id="scope" className="border-t border-hairline bg-surface">
      <div className="mx-auto max-w-[1120px] px-6 py-20 md:py-28">
        <Reveal>
          <p className="eyebrow">Scope &amp; honesty</p>
          <h2 className="mt-4 text-balance text-[1.9rem] font-bold leading-[1.08] tracking-tight md:text-[2.6rem]">
            Scoped on purpose, and said out loud.
          </h2>
          <p className="mt-5 max-w-[640px] text-lg leading-relaxed text-muted">
            The boundaries are deliberate. Stating them plainly is part of the work. It&rsquo;s how a
            reviewer knows which claims are proven and which are framed.
          </p>
        </Reveal>

        <div className="mt-12 grid gap-4 sm:grid-cols-2">
          {ITEMS.map((it, i) => (
            <Reveal key={it.n} delay={i * 0.07}>
              <div className="h-full rounded-lg border border-hairline bg-canvas p-6 md:p-7">
                <div className="flex items-baseline gap-3">
                  <span className="tnum text-sm font-semibold text-accent">{it.n}</span>
                  <h3 className="text-base font-semibold text-ink">{it.title}</h3>
                </div>
                <p className="mt-3 text-sm leading-relaxed text-muted">{it.body}</p>
              </div>
            </Reveal>
          ))}
          <Reveal delay={ITEMS.length * 0.07} className="sm:col-span-2">
            <div className="h-full rounded-lg border border-hairline bg-canvas p-6 md:p-7">
              <div className="flex items-baseline gap-3">
                <span className="tnum text-sm font-semibold text-accent">{NAIVE_ITEM.n}</span>
                <h3 className="text-base font-semibold text-ink">{NAIVE_ITEM.title}</h3>
              </div>
              <p className="mt-3 max-w-[820px] text-sm leading-relaxed text-muted">{NAIVE_ITEM.body}</p>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
