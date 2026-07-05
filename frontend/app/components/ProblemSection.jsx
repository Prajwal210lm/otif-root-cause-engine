import Reveal from "./Reveal";

const CLAIMS = [
  { who: "Planning", says: "Supply came in late, that's on procurement.", blame: "#C0552F" },
  { who: "Procurement", says: "The forecast under-called it. We ordered to plan.", blame: "#2F6D9E" },
  { who: "Warehouse", says: "We picked and shipped exactly what the system showed.", blame: "#6E5B96" },
  { who: "Logistics", says: "The lane ran inside SLA. Not a transit problem.", blame: "#B08738" },
];

export default function ProblemSection() {
  return (
    <section id="problem" className="border-t border-hairline bg-canvas">
      <div className="mx-auto grid max-w-[1120px] items-start gap-12 px-6 py-20 md:grid-cols-12 md:py-28">
        <div className="md:col-span-6">
          <Reveal>
            <h2 className="text-balance text-[1.9rem] font-bold leading-[1.08] tracking-tight md:text-[2.4rem]">
              Here&rsquo;s the hard part.
            </h2>
            <p className="mt-5 max-w-[540px] text-lg leading-relaxed text-muted">
              When an order fails, any of four teams could be the cause: the demand planners who
              forecast it, the suppliers who shipped the stock in, the warehouse that picked and packed
              it, or the carrier that drove it. Usually more than one thing went wrong at once, so the
              four teams spend days in meetings blaming each other and often never agree.{" "}
              <span className="font-medium text-ink">Nobody can fix a cause they can&rsquo;t name.</span>
            </p>
          </Reveal>
          <Reveal delay={0.1}>
            <div className="mt-6 rounded-xl border border-accent/30 bg-accent/[0.06] p-6">
              <p className="eyebrow text-accent">The fix</p>
              <p className="mt-2 max-w-[520px] text-[15px] leading-relaxed text-ink">
                The OTIF Root-Cause Engine reads every failed order and names the team that actually
                caused it, ranked by how much money each cause is costing, in seconds, with the evidence
                attached.
              </p>
            </div>
          </Reveal>
        </div>

        <div className="md:col-span-6 md:col-start-7">
          <Reveal delay={0.15}>
            <figure className="rounded-lg border border-hairline bg-surface p-6 shadow-[0_24px_50px_-40px_rgba(20,24,31,0.5)]">
              <figcaption className="eyebrow">Tuesday, 09:00 · the weekly OTIF review</figcaption>
              <ul className="mt-5 space-y-4">
                {CLAIMS.map((c) => (
                  <li key={c.who} className="flex gap-3">
                    <span aria-hidden className="mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: c.blame }} />
                    <p className="text-[15px] leading-snug text-ink">
                      <span className="font-semibold">{c.who}:</span>{" "}
                      <span className="text-muted">&ldquo;{c.says}&rdquo;</span>
                    </p>
                  </li>
                ))}
              </ul>
              <div className="mt-5 flex items-center justify-between border-t border-hairline pt-4">
                <span className="eyebrow">Outcome</span>
                <span className="text-sm font-semibold text-ink">Meeting adjourned. No agreed cause.</span>
              </div>
            </figure>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
