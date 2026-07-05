import Reveal from "./Reveal";
import MethodTechnical from "./MethodTechnical";

const MONO = "var(--font-plex-mono), ui-monospace, monospace";

const INVESTIGATORS = [
  {
    color: "#2F6D9E",
    name: "Demand agent",
    q: "Was this order set up to fail before it started?",
    body: "Checks whether the forecast was too low, so stock ran out before the order could be filled.",
  },
  {
    color: "#C0552F",
    name: "Supplier agent",
    q: "Did stock arrive late or short from the vendor?",
    body: "Checks inbound purchase orders and lead times.",
  },
  {
    color: "#6E5B96",
    name: "Warehouse agent",
    q: "Did the warehouse pick the wrong items, miss some, or dispatch late?",
    body: "",
  },
  {
    color: "#B08738",
    name: "Logistics agent",
    q: "Did the order leave on time, but the carrier take too long in transit?",
    body: "",
  },
];

export default function MethodSection() {
  return (
    <section id="method" className="border-t border-hairline bg-surface">
      <div className="mx-auto max-w-[1120px] px-6 py-20 md:py-28">
        <Reveal>
          <h2 className="text-balance text-[1.9rem] font-bold leading-[1.08] tracking-tight md:text-[2.6rem]">
            Four AI investigators. One honest referee.
          </h2>
          <p className="mt-5 max-w-[680px] text-lg leading-relaxed text-muted">
            The thinking and the arithmetic are kept apart on purpose. Small AI investigators argue
            about the cause; tested code owns every number. First, two words this page uses.
          </p>
        </Reveal>

        {/* definitions */}
        <div className="mt-10 grid gap-4 md:grid-cols-2">
          <Reveal>
            <div className="h-full rounded-xl border border-hairline bg-canvas p-6 md:p-7">
              <p className="eyebrow">Agent</p>
              <p className="mt-3 text-[15px] leading-relaxed text-ink">
                A small AI investigator with one job and one area it knows. This tool has four, one for
                each team that could be at fault.
              </p>
            </div>
          </Reveal>
          <Reveal delay={0.08}>
            <div className="h-full rounded-xl border border-hairline bg-canvas p-6 md:p-7">
              <p className="eyebrow">Coordinator</p>
              <p className="mt-3 text-[15px] leading-relaxed text-ink">
                A fifth AI whose only job is to read what the four found and make the final call when
                they disagree.
              </p>
            </div>
          </Reveal>
        </div>

        {/* four investigators */}
        <Reveal>
          <h3 className="mt-12 text-xl font-semibold text-ink">The four investigators, and what each checks</h3>
        </Reveal>
        <div className="mt-6 grid gap-px overflow-hidden rounded-xl border border-hairline bg-hairline md:grid-cols-2">
          {INVESTIGATORS.map((a, i) => (
            <Reveal key={a.name} delay={i * 0.06} className="bg-surface">
              <div className="h-full p-6 md:p-7">
                <div className="flex items-center gap-2.5">
                  <span aria-hidden className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: a.color }} />
                  <h4 className="font-semibold text-ink">{a.name}</h4>
                </div>
                <p className="mt-3 text-[15px] leading-relaxed text-ink">{a.q}</p>
                {a.body && <p className="mt-1.5 text-sm leading-relaxed text-muted">{a.body}</p>}
              </div>
            </Reveal>
          ))}
        </div>

        <Reveal>
          <p className="mt-10 max-w-[760px] text-lg leading-relaxed text-muted">
            Each agent looks only at its own evidence for that one order, decides how responsible its
            team is (the main cause, a smaller contributing factor, or not involved), and writes down
            its reasoning.
          </p>
        </Reveal>

        <Reveal delay={0.05}>
          <div className="mt-6 rounded-xl border border-hairline bg-canvas p-6 md:p-8">
            <p className="eyebrow">Then the coordinator</p>
            <p className="mt-3 max-w-[780px] text-[15px] leading-relaxed text-ink">
              Often two things went wrong at once, say the supplier was late and the forecast was also
              off. The coordinator reads all four reports and decides which one was the real deciding
              cause, not just the biggest number. Then it ranks the causes by money and writes the summary.
            </p>
          </div>
        </Reveal>

        {/* concrete artifact */}
        <Reveal delay={0.05}>
          <p className="mt-12 max-w-[760px] text-sm leading-relaxed text-muted">
            Here is one agent&rsquo;s actual claim on a real order. It found supplier was the main cause
            (the code calls this &ldquo;binding&rdquo;):
          </p>
          <figure className="mt-4 overflow-hidden rounded-xl border border-white/10 bg-[#0F1318]">
            <div className="flex items-center justify-between border-b border-white/10 px-5 py-3 font-mono text-[10.5px] uppercase tracking-[0.16em]">
              <span className="text-white/55">specialist claim · file</span>
              <span className="text-accent-soft">OTIF-0011</span>
            </div>
            <div className="console-grid px-5 py-6">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.12em] text-white" style={{ backgroundColor: "#C0552F" }}>
                  supplier
                </span>
                <span className="rounded-full border border-accent-soft/40 px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.12em] text-accent-soft">
                  main cause
                </span>
                <span className="rounded-full border border-white/15 px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.12em] text-white/60">
                  high confidence
                </span>
              </div>
              <p className="mt-4 max-w-[680px] text-[15px] leading-relaxed text-white/85">
                &ldquo;The PO landed ten days past due, and the late quantity alone would have closed the
                shortfall had it arrived on time. The warehouse dispatch slipped two days, but it was not
                the deciding cause. Fix supply and this order ships in full, on time.&rdquo;
              </p>
              <p className="mt-4 font-mono text-[11px] tracking-wide text-white/40">
                evidence ▸ supplier_late_days=<span className="text-white/70">10</span> · dispatch_delay_days=<span className="text-white/70">2</span> · shortfall_closed_by_po=<span className="text-white/70">true</span>
              </p>
            </div>
          </figure>
        </Reveal>

        <MethodTechnical />
      </div>
    </section>
  );
}
