import { DRIVERS } from "../lib/otif";

// Hero problem-visual: an open case where four teams blame each other in a ring
// and no cause is agreed. This is the QUESTION; the pipeline console (further
// down the page) is the ANSWER. Deliberately light and static so the animated
// pipeline stays the one signature motion. The four short deflections here are
// terse; the full war-room quotes live in the section below.
const SANS = "var(--font-plex-sans), ui-sans-serif, system-ui, sans-serif";
const MONO = "var(--font-plex-mono), ui-monospace, monospace";

const SUSPECTS = [
  { key: "demand", deflection: "forecast was to plan", cx: 360, cy: 56 },
  { key: "supplier", deflection: "PO shipped on time", cx: 600, cy: 202 },
  { key: "warehouse", deflection: "picked to the system", cx: 360, cy: 348 },
  { key: "logistics", deflection: "ran inside its SLA", cx: 114, cy: 202 },
];

// clockwise ring of blame: each team points at the next. Source-coloured arcs
// that bow outward from the centre, with a matching arrowhead at the target.
const ARCS = [
  { color: DRIVERS.demand.color, id: "a-demand", d: "M452,58 C572,50 636,112 610,168" },
  { color: DRIVERS.supplier.color, id: "a-supplier", d: "M610,236 C636,300 566,356 452,346" },
  { color: DRIVERS.warehouse.color, id: "a-warehouse", d: "M268,346 C150,356 84,300 110,236" },
  { color: DRIVERS.logistics.color, id: "a-logistics", d: "M110,168 C84,110 150,50 268,58" },
];

function DesktopBoard() {
  return (
    <svg viewBox="0 0 720 404" className="hidden h-auto w-full md:block" role="img" aria-labelledby="bb-title bb-desc">
      <title id="bb-title">Four teams blame each other for one failed order</title>
      <desc id="bb-desc">
        A weekly review of one failed OTIF order. The demand, supplier, warehouse and logistics teams
        each deflect blame to the next, and no cause is agreed.
      </desc>

      <defs>
        {ARCS.map((a) => (
          <marker key={a.id} id={a.id} viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6.5" markerHeight="6.5" orient="auto-start-reverse">
            <path d="M0,0 L10,5 L0,10 z" fill={a.color} />
          </marker>
        ))}
      </defs>

      {/* blame ring */}
      {ARCS.map((a) => (
        <path key={a.id} d={a.d} fill="none" stroke={a.color} strokeWidth="2" strokeLinecap="round" opacity="0.55" markerEnd={`url(#${a.id})`} />
      ))}

      {/* centre: the unresolved cause */}
      <circle cx="360" cy="202" r="47" fill="var(--raised)" stroke="var(--hairline-strong)" />
      <line x1="360" y1="167" x2="360" y2="237" stroke="var(--hairline-strong)" strokeWidth="1" />
      <line x1="325" y1="202" x2="395" y2="202" stroke="var(--hairline-strong)" strokeWidth="1" />
      <text x="360" y="192" textAnchor="middle" fontFamily={MONO} fontSize="8.5" letterSpacing="1.4" fill="var(--faint)">CAUSE</text>
      <text x="360" y="222" textAnchor="middle" fontFamily={SANS} fontSize="30" fontWeight="700" fill="var(--ink)">?</text>

      {/* suspect nodes */}
      {SUSPECTS.map((s) => {
        const d = DRIVERS[s.key];
        const x = s.cx - 93;
        const y = s.cy - 28;
        return (
          <g key={s.key}>
            <rect x={x} y={y} width="186" height="56" rx="9" fill="var(--surface)" stroke="var(--hairline)" />
            <rect x={x + 12} y={y + 14} width="4" height="28" rx="2" fill={d.color} />
            <text x={x + 26} y={y + 26} fontFamily={SANS} fontSize="14" fontWeight="600" fill="var(--ink)">{d.label}</text>
            <text x={x + 26} y={y + 44} fontFamily={MONO} fontSize="10.5" letterSpacing="0.2" fill="var(--muted)">
              &ldquo;{s.deflection}&rdquo;
            </text>
          </g>
        );
      })}
    </svg>
  );
}

function MobileBoard() {
  return (
    <div className="md:hidden">
      <div className="grid grid-cols-2 gap-2.5">
        {SUSPECTS.map((s) => {
          const d = DRIVERS[s.key];
          return (
            <div key={s.key} className="rounded-lg border border-hairline bg-surface p-3">
              <div className="flex items-center gap-2">
                <span className="h-4 w-1 rounded-full" style={{ backgroundColor: d.color }} aria-hidden />
                <span className="text-sm font-semibold text-ink">{d.label}</span>
              </div>
              <p className="mt-1.5 font-mono text-[11px] leading-snug text-muted">&ldquo;{s.deflection}&rdquo;</p>
            </div>
          );
        })}
      </div>
      <div className="mt-3 flex items-center justify-center gap-2 rounded-lg border border-dashed border-hairline-strong bg-raised px-3 py-2.5">
        <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-faint">Cause</span>
        <span className="text-base font-bold text-ink">?</span>
        <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-faint">unresolved</span>
      </div>
    </div>
  );
}

export default function BlameBoard() {
  return (
    <figure className="reg overflow-hidden rounded-xl border border-hairline bg-surface shadow-[var(--shadow-panel)]">
      <div className="flex items-center justify-between border-b border-hairline px-4 py-3 md:px-5">
        <span className="font-mono text-[10.5px] uppercase tracking-[0.16em] text-faint">Open case · one failed order</span>
        <span className="flex items-center gap-1.5 font-mono text-[10.5px] uppercase tracking-[0.16em]" style={{ color: "var(--supplier)" }}>
          <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: "var(--supplier)" }} aria-hidden />
          cause unresolved
        </span>
      </div>

      <div className="px-4 py-6 md:px-6 md:py-5">
        <DesktopBoard />
        <MobileBoard />
      </div>

      <div className="flex items-center justify-between border-t border-hairline px-4 py-3 md:px-5">
        <span className="font-mono text-[10.5px] uppercase tracking-[0.14em] text-faint">The blame cycle</span>
        <span className="text-sm font-medium text-muted">Each team points to the next. No one owns it.</span>
      </div>
    </figure>
  );
}
