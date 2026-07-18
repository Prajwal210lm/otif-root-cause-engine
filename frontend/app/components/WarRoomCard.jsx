import Kicker from "./Kicker";
import { DRIVERS } from "../lib/otif";

// The weekly-review scene: four teams, four deflections, no agreed cause. The
// concrete version of the blame problem, shared by Home and the Problem page.
const CLAIMS = [
  { who: "Planning", says: "Supply came in late. That is on procurement.", color: DRIVERS.supplier.color },
  { who: "Procurement", says: "The forecast under-called it. We ordered to plan.", color: DRIVERS.demand.color },
  { who: "Warehouse", says: "We picked and shipped exactly what the system showed.", color: DRIVERS.warehouse.color },
  { who: "Logistics", says: "The lane ran inside SLA. Not a transit problem.", color: DRIVERS.logistics.color },
];

export default function WarRoomCard() {
  return (
    <figure className="reg h-full rounded-xl border border-hairline bg-surface p-6 shadow-[var(--shadow-panel)] md:p-8">
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
  );
}
