import PageHero from "../components/PageHero";
import PageNav from "../components/PageNav";
import SectionHeader from "../components/SectionHeader";
import Reveal from "../components/Reveal";
import Kicker from "../components/Kicker";
import OtifGap from "../components/OtifGap";
import { FictionalLabel, CompanyProfile } from "../components/DataNote";
import { COMPANY } from "../lib/company";

export const metadata = {
  title: "The Problem · OTIF Root-Cause Engine",
  description:
    "When OTIF drops, four teams blame each other and finding the real cause takes days, often with no agreement. This is why a failed delivery is so hard to pin on one team.",
};

const SUSPECTS = [
  { color: "var(--demand)", name: "Demand", role: "forecast the order" },
  { color: "var(--supplier)", name: "Supplier", role: "shipped the stock in" },
  { color: "var(--warehouse)", name: "Warehouse", role: "picked and packed it" },
  { color: "var(--logistics)", name: "Logistics", role: "drove it to the door" },
];

const CLAIMS = [
  { who: "Planning", says: "Supply came in late. That is on procurement.", color: "var(--supplier)" },
  { who: "Procurement", says: "The forecast under-called it. We ordered to plan.", color: "var(--demand)" },
  { who: "Warehouse", says: "We picked and shipped exactly what the system showed.", color: "var(--warehouse)" },
  { who: "Logistics", says: "The lane ran inside SLA. Not a transit problem.", color: "var(--logistics)" },
];

export default function ProblemPage() {
  return (
    <>
      <PageHero
        kicker="§01 · The Problem"
        title="Four suspects. One failed order."
        lede="When a delivery fails, four teams each have a reason it was not them. Finding the real cause takes days, and often never resolves. Here is why."
      >
        <FictionalLabel className="mt-6" />
      </PageHero>

      {/* OTIF defined + the gap + the four suspects */}
      <section className="border-b border-hairline bg-surface">
        <div className="mx-auto max-w-[1200px] px-5 py-18 md:px-8 md:py-24">
          <SectionHeader
            kicker="One number the board watches"
            title="On time, in full — and the gap that will not close."
            intro={
              <>
                <span className="font-semibold text-ink">OTIF, short for On Time In Full,</span> is the
                share of orders that arrive on the promised day with every item, nothing missing.{" "}
                {COMPANY.short} runs about {COMPANY.otifNow}%; the board wants {COMPANY.otifTarget}%.
                Closing that gap means knowing why the failures happen.
              </>
            }
          />

          <div className="mt-12 grid gap-6 lg:grid-cols-2">
            <Reveal>
              <div className="reg h-full rounded-xl border border-hairline bg-raised p-6 md:p-8">
                <Kicker>On time, in full: today vs target</Kicker>
                <div className="mt-6">
                  <OtifGap now={COMPANY.otifNow} target={COMPANY.otifTarget} />
                </div>
              </div>
            </Reveal>

            <Reveal delay={0.1}>
              <div className="reg h-full rounded-xl border border-hairline bg-raised p-6 md:p-8">
                <Kicker>When one fails, any of four teams could be the cause</Kicker>
                <ul className="mt-6 space-y-4">
                  {SUSPECTS.map((t) => (
                    <li key={t.name} className="flex items-baseline gap-3">
                      <span aria-hidden className="mt-1 h-2.5 w-2.5 shrink-0 rounded-[3px]" style={{ backgroundColor: t.color }} />
                      <p className="text-[15px] text-ink">
                        <span className="font-semibold">{t.name}:</span>
                        <span className="text-muted"> {t.role}</span>
                      </p>
                    </li>
                  ))}
                </ul>
                <p className="mt-6 border-t border-hairline pt-4 text-sm leading-relaxed text-muted">
                  Usually more than one went wrong at once, so the teams spend days blaming each other
                  and often never agree.{" "}
                  <span className="font-medium text-ink">You cannot fix a cause you cannot name.</span>
                </p>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* the blame game: war-room card + the cost of guessing + the fix */}
      <section className="border-b border-hairline">
        <div className="mx-auto max-w-[1200px] px-5 py-20 md:px-8 md:py-28">
          <SectionHeader
            kicker="The weekly review"
            title="Here is the hard part."
            intro="Every failure has four plausible owners, and each can point at another. The room runs on assertion, not evidence, so it rarely converges."
          />

          <div className="mt-12 grid items-start gap-6 lg:grid-cols-12">
            <Reveal className="lg:col-span-7">
              <figure className="reg rounded-xl border border-hairline bg-surface p-6 shadow-[var(--shadow-panel)] md:p-8">
                <figcaption>
                  <Kicker>Tuesday 09:00 · the weekly OTIF review</Kicker>
                </figcaption>
                <ul className="mt-6 space-y-4">
                  {CLAIMS.map((c) => (
                    <li key={c.who} className="flex gap-3">
                      <span aria-hidden className="mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: c.color }} />
                      <p className="text-[15px] leading-snug text-ink">
                        <span className="font-semibold">{c.who}:</span>{" "}
                        <span className="text-muted">&ldquo;{c.says}&rdquo;</span>
                      </p>
                    </li>
                  ))}
                </ul>
                <div className="mt-6 flex items-center justify-between border-t border-hairline pt-4">
                  <span className="font-mono text-[0.7rem] uppercase tracking-[0.14em] text-faint">Outcome</span>
                  <span className="text-sm font-semibold text-ink">Meeting adjourned. No agreed cause.</span>
                </div>
              </figure>
            </Reveal>

            <div className="space-y-6 lg:col-span-5">
              <Reveal delay={0.08}>
                <div className="grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-hairline bg-hairline">
                  <div className="bg-surface px-5 py-6">
                    <div className="tnum text-3xl font-bold leading-none text-ink">≈3<span className="ml-1 text-lg font-semibold text-muted">days</span></div>
                    <p className="mt-3 text-sm leading-relaxed text-muted">Typical time to argue a single failure to a conclusion.</p>
                  </div>
                  <div className="bg-surface px-5 py-6">
                    <div className="text-3xl font-bold leading-none text-ink">Often<span className="mt-1 block text-lg font-semibold text-muted">none</span></div>
                    <p className="mt-3 text-sm leading-relaxed text-muted">Failures that reach an agreed, actionable cause.</p>
                  </div>
                </div>
              </Reveal>

              <Reveal delay={0.16}>
                <div className="rounded-xl border border-accent/30 bg-accent-tint p-6 md:p-7">
                  <Kicker>The fix</Kicker>
                  <p className="mt-3 text-[15px] leading-relaxed text-ink">
                    The engine reads every failed order and names the team that actually caused it,
                    ranked by how much money each cause is costing, in seconds, with the evidence attached.
                  </p>
                </div>
              </Reveal>
            </div>
          </div>
        </div>
      </section>

      {/* company profile */}
      <section className="border-b border-hairline bg-surface">
        <div className="mx-auto max-w-[1200px] px-5 py-18 md:px-8 md:py-24">
          <SectionHeader
            kicker="The subject"
            title="Who this runs against."
            className="mb-10"
          />
          <Reveal>
            <CompanyProfile />
          </Reveal>
        </div>
      </section>

      <PageNav next={{ href: "/how-it-works", label: "How It Works" }} />
    </>
  );
}
