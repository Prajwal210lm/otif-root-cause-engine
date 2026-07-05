import Reveal from "./Reveal";
import OtifGap from "./OtifGap";
import { COMPANY } from "../lib/company";

const TEAMS = [
  { color: "#2F6D9E", name: "Demand", role: "forecast the order" },
  { color: "#C0552F", name: "Supplier", role: "shipped the stock in" },
  { color: "#6E5B96", name: "Warehouse", role: "picked and packed it" },
  { color: "#B08738", name: "Logistics", role: "drove it to the door" },
];

export default function ExplainerSection() {
  return (
    <section className="border-t border-hairline bg-surface">
      <div className="mx-auto max-w-[1200px] px-5 py-20 md:px-8 md:py-28">
        <Reveal>
          <p className="eyebrow">The problem, in plain terms</p>
          <h2 className="mt-4 text-balance text-[1.9rem] font-bold leading-[1.08] tracking-tight md:text-[2.6rem]">
            One number the board watches. Four teams who could be to blame.
          </h2>
          <p className="mt-5 max-w-[720px] text-lg leading-relaxed text-muted">
            <span className="font-semibold text-ink">OTIF, short for On Time In Full,</span> is the share
            of orders that arrive on the promised day with every item, nothing missing. {COMPANY.short} runs
            about <span className="tnum font-semibold text-ink">{COMPANY.otifNow}%</span>; the board
            wants <span className="tnum font-semibold text-ink">{COMPANY.otifTarget}%</span>. Closing
            that gap means knowing why the failures happen.
          </p>
        </Reveal>

        <div className="mt-12 grid gap-6 lg:grid-cols-2">
          <Reveal>
            <div className="h-full rounded-xl border border-hairline bg-canvas p-6 md:p-8">
              <p className="eyebrow">On time, in full: today vs. target</p>
              <div className="mt-6">
                <OtifGap now={COMPANY.otifNow} target={COMPANY.otifTarget} />
              </div>
            </div>
          </Reveal>

          <Reveal delay={0.1}>
            <div className="h-full rounded-xl border border-hairline bg-canvas p-6 md:p-8">
              <p className="eyebrow">When one fails, any of four teams could be the cause</p>
              <ul className="mt-5 space-y-3.5">
                {TEAMS.map((t) => (
                  <li key={t.name} className="flex items-baseline gap-3">
                    <span aria-hidden className="mt-1 h-2.5 w-2.5 shrink-0 rounded-sm" style={{ backgroundColor: t.color }} />
                    <p className="text-[15px] text-ink">
                      <span className="font-semibold">{t.name}:</span>
                      <span className="text-muted"> {t.role}</span>
                    </p>
                  </li>
                ))}
              </ul>
              <p className="mt-5 border-t border-hairline pt-4 text-sm leading-relaxed text-muted">
                Usually more than one went wrong at once, so the teams spend days blaming each other
                and often never agree. <span className="font-medium text-ink">You can&rsquo;t fix a cause you can&rsquo;t name.</span>
              </p>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
