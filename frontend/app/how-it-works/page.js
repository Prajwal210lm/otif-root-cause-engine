import PageHero from "../components/PageHero";
import PageNav from "../components/PageNav";
import SectionHeader from "../components/SectionHeader";
import Reveal from "../components/Reveal";
import Kicker from "../components/Kicker";
import SpecimenClaim from "../components/SpecimenClaim";
import MethodTechnical from "../components/MethodTechnical";
import { METRICS } from "../lib/otif";

export const metadata = {
  title: "How It Works · OTIF Root-Cause Engine",
  description:
    "Four specialist agents investigate in parallel; a coordinator adjudicates. Tested code computes every number, and the model never invents a figure. The method in plain language, then the architecture.",
};

const DEFINITIONS = [
  {
    term: "Agent",
    body: "A small AI investigator with one job and one area it knows. This tool has four, one for each team that could be at fault.",
  },
  {
    term: "Coordinator",
    body: "A fifth AI whose only job is to read what the four found and make the final call when they disagree.",
  },
];

const INVESTIGATORS = [
  { color: "var(--demand)", name: "Demand agent", q: "Was this order set up to fail before it started?", body: "Checks whether the forecast was too low, so stock ran out before the order could be filled." },
  { color: "var(--supplier)", name: "Supplier agent", q: "Did stock arrive late or short from the vendor?", body: "Reads inbound purchase orders and lead times." },
  { color: "var(--warehouse)", name: "Warehouse agent", q: "Did the warehouse pick wrong, miss items, or dispatch late?", body: "Compares what was on hand against what actually shipped." },
  { color: "var(--logistics)", name: "Logistics agent", q: "Did the order leave on time, but the carrier take too long?", body: "Checks dispatch timestamps against transit and lane SLAs." },
];

const STEPS = [
  { n: "01", title: "Partition", body: "The batch is split one order at a time. Each order's raw signals are routed to the four specialists, and to nobody else." },
  { n: "02", title: "Specialists file claims", body: "Each agent investigates its own team and files a claim: binding, contributing, or not involved, with its reasoning. It never sees the planted answer." },
  { n: "03", title: "Coordinator adjudicates", body: "When more than one team fired, the coordinator reads all four claims and decides which was the deciding cause, not just the biggest number." },
  { n: "04", title: "Ranked verdict", body: "Causes are ranked by cash and the board brief is rendered, every figure bound to a value computed by tested code." },
];

const GUARANTEES = [
  { tag: "The firewall", body: "Each agent sees only the raw signals for its own team on one order. It never sees the planted answer, so the accuracy it earns is real, not leaked." },
  { tag: "Tested computation", body: `Every figure, shortfall, cost, accuracy, is produced by deterministic code under ${METRICS.tests} passing tests. The model reasons about cause; it never does the arithmetic.` },
  { tag: "The render gate", body: "The final brief prints numbers only through a template bound to audited values. Any figure the model tries to write itself is rejected before it reaches the page." },
];

export default function HowItWorksPage() {
  return (
    <>
      <PageHero
        kicker="02 · How It Works"
        title="From a failed order to a ranked verdict."
        lede="Four specialist agents investigate in parallel, one for each team that could be at fault. A coordinator makes the final call when they disagree. The plain version first, then the parts that keep the numbers honest."
      />

      {/* plain approach + definitions */}
      <section className="border-b border-hairline bg-surface">
        <div className="mx-auto max-w-[1200px] px-5 py-18 md:px-8 md:py-24">
          <SectionHeader
            kicker="How I approached it"
            title="Four AI investigators. One honest referee."
            intro="The thinking and the arithmetic are kept apart on purpose. Small AI investigators argue about the cause; tested code owns every number. First, two words this page uses."
          />
          <div className="mt-10 grid gap-4 md:grid-cols-2">
            {DEFINITIONS.map((d, i) => (
              <Reveal key={d.term} delay={i * 0.08}>
                <div className="h-full rounded-xl border border-hairline bg-raised p-6 md:p-7">
                  <Kicker>{d.term}</Kicker>
                  <p className="mt-3 text-[15px] leading-relaxed text-ink">{d.body}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* the four investigators */}
      <section className="border-b border-hairline">
        <div className="mx-auto max-w-[1200px] px-5 py-20 md:px-8 md:py-28">
          <SectionHeader
            kicker="The specialists"
            title="Four investigators, and what each checks."
            intro="Each agent looks only at its own evidence for that one order, decides how responsible its team is, and writes down its reasoning."
          />
          <div className="mt-10 grid gap-px overflow-hidden rounded-xl border border-hairline bg-hairline md:grid-cols-2">
            {INVESTIGATORS.map((a, i) => (
              <Reveal key={a.name} delay={i * 0.06} className="bg-surface">
                <div className="h-full p-6 md:p-7">
                  <div className="flex items-center gap-2.5">
                    <span aria-hidden className="h-2.5 w-2.5 rounded-[3px]" style={{ backgroundColor: a.color }} />
                    <h3 className="font-semibold text-ink">{a.name}</h3>
                  </div>
                  <p className="mt-3 text-[15px] leading-relaxed text-ink">{a.q}</p>
                  <p className="mt-1.5 text-sm leading-relaxed text-muted">{a.body}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* the four-step flow + the specimen artifact */}
      <section className="border-b border-hairline bg-surface">
        <div className="mx-auto max-w-[1200px] px-5 py-20 md:px-8 md:py-28">
          <SectionHeader
            kicker="The method, end to end"
            title="Partition, investigate, adjudicate, rank."
            intro="The same four steps run on every order, whether it is the saved batch or a fresh live run."
          />

          <ol className="mt-10 grid gap-px overflow-hidden rounded-xl border border-hairline bg-hairline md:grid-cols-2 lg:grid-cols-4">
            {STEPS.map((s, i) => (
              <Reveal key={s.n} delay={i * 0.06} className="bg-surface">
                <li className="flex h-full flex-col p-6 md:p-7">
                  <span className="tnum text-sm font-semibold text-accent">{s.n}</span>
                  <h3 className="mt-4 text-lg font-semibold text-ink">{s.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted">{s.body}</p>
                </li>
              </Reveal>
            ))}
          </ol>

          <Reveal delay={0.05} className="mt-12">
            <p className="max-w-[720px] text-[15px] leading-relaxed text-muted">
              Here is a representative specialist claim on one order. Two teams fired; the coordinator
              weighed them and named the deciding cause.
            </p>
            <div className="mt-4">
              <SpecimenClaim />
            </div>
          </Reveal>
        </div>
      </section>

      {/* the three guarantees + technical toggle */}
      <section className="border-b border-hairline">
        <div className="mx-auto max-w-[1200px] px-5 py-20 md:px-8 md:py-28">
          <SectionHeader
            kicker="Why you can trust the numbers"
            title="The model reasons. Tested code computes."
            intro="Three mechanisms keep the accuracy earned and the figures honest. None of them relies on trusting the model."
          />
          <div className="mt-10 grid gap-px overflow-hidden rounded-xl border border-hairline bg-hairline md:grid-cols-3">
            {GUARANTEES.map((g, i) => (
              <Reveal key={g.tag} delay={i * 0.06} className="bg-surface">
                <div className="h-full p-6 md:p-7">
                  <div className="flex items-center gap-2">
                    <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-accent" />
                    <h3 className="font-mono text-[11px] uppercase tracking-[0.14em] text-ink">{g.tag}</h3>
                  </div>
                  <p className="mt-3 text-sm leading-relaxed text-muted">{g.body}</p>
                </div>
              </Reveal>
            ))}
          </div>
          <Reveal delay={0.1} className="mt-6">
            <MethodTechnical />
          </Reveal>
        </div>
      </section>

      <PageNav prev={{ href: "/problem", label: "The Problem" }} next={{ href: "/results", label: "The Results" }} />
    </>
  );
}
