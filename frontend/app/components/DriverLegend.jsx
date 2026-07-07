import { DRIVERS, DRIVER_ORDER } from "../lib/otif";

// The recurring evidence-spectrum legend: the four driver colours, always in the
// same cash-ranked order, so the colour coding reads consistently sitewide.
export default function DriverLegend({ className = "", size = "md" }) {
  const dot = size === "sm" ? "h-2 w-2" : "h-2.5 w-2.5";
  return (
    <ul className={`flex flex-wrap items-center gap-x-5 gap-y-2 ${className}`}>
      {DRIVER_ORDER.map((k) => (
        <li key={k} className="flex items-center gap-2">
          <span
            className={`${dot} rounded-[3px]`}
            style={{ backgroundColor: DRIVERS[k].color }}
            aria-hidden
          />
          <span className="font-mono text-[0.72rem] uppercase tracking-[0.12em] text-muted">
            {DRIVERS[k].label}
          </span>
        </li>
      ))}
    </ul>
  );
}
