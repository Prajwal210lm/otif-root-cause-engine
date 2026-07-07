import { CANONICAL, DRIVERS } from "../lib/otif";

// The running worked example: order OTIF-0011. The dark "instrument" card shows a
// specialist claim and the coordinator's adjudication. The attributed cause is
// read from the canonical answer key so this can never drift from the data again;
// the surrounding evidence line is illustrative (the cache stores final
// attributions, not per-order raw signals) and is labelled as such.
const ORDER_ID = "OTIF-0011";

export default function SpecimenClaim({ showTruth = false }) {
  const truth = CANONICAL.attributions[ORDER_ID]; // "warehouse"
  const meta = DRIVERS[truth];

  return (
    <figure className="overflow-hidden rounded-xl border border-white/10 bg-console shadow-[0_40px_90px_-55px_rgba(11,94,85,0.5)]">
      <div className="flex items-center justify-between border-b border-white/10 px-5 py-3 font-mono text-[10.5px] uppercase tracking-[0.16em]">
        <span className="text-white/55">specialist claim · file</span>
        <span className="text-accent-bright">{ORDER_ID}</span>
      </div>

      <div className="console-grid px-5 py-6 md:px-6">
        <div className="flex flex-wrap items-center gap-2">
          <span
            className="rounded-full px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.12em] text-white"
            style={{ backgroundColor: meta.color }}
          >
            {meta.label}
          </span>
          <span className="rounded-full border border-accent-bright/40 px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.12em] text-accent-bright">
            binding cause
          </span>
          <span className="rounded-full border border-white/15 px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.12em] text-white/60">
            high confidence
          </span>
        </div>

        <p className="mt-4 max-w-[680px] text-[15px] leading-relaxed text-white/85">
          &ldquo;Stock was on hand, but dispatch slipped two days past the promised ship date and a
          pick short left units behind. With inventory physically present, the order could have shipped
          in full that day. The late supplier PO landed as well, yet it did not bind the outcome.
          Warehouse execution is the deciding cause.&rdquo;
        </p>

        <p className="mt-4 font-mono text-[11px] leading-relaxed tracking-wide text-white/40">
          evidence ▸ on_hand_cover=<span className="text-white/70">true</span> ·
          dispatch_delay_days=<span className="text-white/70">2</span> ·
          pick_short_units=<span className="text-white/70">&gt;0</span> ·
          supplier_late_days=<span className="text-white/70">6</span>{" "}
          <span className="text-white/30">(contributing)</span>
        </p>

        <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-white/10 pt-4 font-mono text-[11px] tracking-wide">
          <span className="text-accent-bright">coordinator ▸</span>
          <span className="text-white/70">
            two teams fired; ruled <span className="text-white">{meta.label.toLowerCase()}</span> binding over supplier
          </span>
          {showTruth && (
            <span className="ml-auto rounded-full border border-accent-bright/40 px-2.5 py-1 text-[10px] uppercase tracking-[0.12em] text-accent-bright">
              planted cause · {meta.label.toLowerCase()} · correct
            </span>
          )}
        </div>
      </div>
    </figure>
  );
}
