import Reveal from "./Reveal";
import SectionHeader from "./SectionHeader";
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
    body: `The agents run on ${METRICS.model}. It cleared the bar at ${METRICS.overallPct}%, so escalating to a larger, costlier model was not warranted. That is a deliberate cost decision, not a shortcut.`,
  },
];

const NAIVE_ITEM = {
  n: "05",
  title: "The simple rule is not rigged to lose",
  body: "It is the standard largest-signal rule: normalize every signal that fired to a comparable severity score, then pick the domain with the highest one. The normalization units are fixed in the code, not chosen after seeing the score: demand in multiples of its own 15% forecast-error threshold, supplier lateness in weeks, warehouse in whichever is worse of a 10%-of-order pick shortfall or a 2-day dispatch delay, and logistics in multiples of that order's own lane SLA. A skeptic can read naive_attribution next to the constants file and check the units were fixed before any batch was scored.",
};

const BOUNDARY_ITEM = {
  n: "06",
  title: "Scoped to cause, not queries",
  body: (
    <>
      This is a root-cause engine, not a query tool. It investigates why a failure happened. For
      the daily question, &ldquo;what happened to OTIF last month,&rdquo; that is{" "}
      <a
        href="https://supply-chain-copilot-nine.vercel.app/"
        target="_blank"
        rel="noreferrer"
        className="font-medium text-ink underline decoration-hairline-strong underline-offset-2 transition-colors hover:text-accent hover:decoration-accent"
      >
        Project 4
      </a>
      &rsquo;s job.
    </>
  ),
};

export default function ScopeSection() {
  return (
    <section id="scope" className="border-b border-hairline">
      <div className="mx-auto max-w-[1200px] px-5 py-20 md:px-8 md:py-28">
        <SectionHeader
          kicker="Scope &amp; honesty"
          title="Scoped on purpose, and said out loud."
          intro="The boundaries are deliberate. Stating them plainly is part of the work. It is how a reviewer knows which claims are proven and which are framed."
        />

        <div className="mt-12 grid gap-px overflow-hidden rounded-xl border border-hairline bg-hairline sm:grid-cols-2">
          {ITEMS.map((it, i) => (
            <Reveal key={it.n} delay={i * 0.06} className="bg-surface">
              <div className="h-full p-6 md:p-7">
                <div className="flex items-baseline gap-3">
                  <span className="tnum text-sm font-semibold text-accent">{it.n}</span>
                  <h3 className="text-base font-semibold text-ink">{it.title}</h3>
                </div>
                <p className="mt-3 text-sm leading-relaxed text-muted">{it.body}</p>
              </div>
            </Reveal>
          ))}
          <Reveal delay={ITEMS.length * 0.06} className="bg-surface sm:col-span-2">
            <div className="h-full p-6 md:p-7">
              <div className="flex items-baseline gap-3">
                <span className="tnum text-sm font-semibold text-accent">{NAIVE_ITEM.n}</span>
                <h3 className="text-base font-semibold text-ink">{NAIVE_ITEM.title}</h3>
              </div>
              <p className="mt-3 max-w-[860px] text-sm leading-relaxed text-muted">{NAIVE_ITEM.body}</p>
            </div>
          </Reveal>
          <Reveal delay={(ITEMS.length + 1) * 0.06} className="bg-surface sm:col-span-2">
            <div className="h-full p-6 md:p-7">
              <div className="flex items-baseline gap-3">
                <span className="tnum text-sm font-semibold text-accent">{BOUNDARY_ITEM.n}</span>
                <h3 className="text-base font-semibold text-ink">{BOUNDARY_ITEM.title}</h3>
              </div>
              <p className="mt-3 max-w-[860px] text-sm leading-relaxed text-muted">{BOUNDARY_ITEM.body}</p>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
