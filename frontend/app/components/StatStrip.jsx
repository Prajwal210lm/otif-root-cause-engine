"use client";

import CountUp from "./CountUp";
import { DRIVER_ORDER, DRIVERS, METRICS, fmtAEDm } from "../lib/otif";

function Cell({ idx, prefix, value, decimals, sign, unit, color, label, children }) {
  const border =
    idx === 1
      ? "border-l border-hairline"
      : idx === 2
        ? "border-t border-hairline md:border-t-0 md:border-l"
        : idx === 3
          ? "border-l border-t border-hairline md:border-t-0"
          : "";
  return (
    <div className={`px-5 py-7 md:px-7 md:py-8 ${border}`}>
      <dd className="flex items-baseline gap-1" style={{ color }}>
        {prefix && <span className="tnum text-sm font-semibold opacity-70 md:text-base">{prefix}</span>}
        <span className="tnum text-[1.85rem] font-bold leading-none md:text-[2.4rem]">
          <CountUp value={value} decimals={decimals} prefix={sign || ""} />
        </span>
        {unit && <span className="tnum text-base font-semibold md:text-lg">{unit}</span>}
      </dd>
      <dt className="eyebrow mt-2.5">{label}</dt>
      <div className="mt-4">{children}</div>
    </div>
  );
}

function Track({ children }) {
  return (
    <div aria-hidden="true" className="relative h-1.5 w-full overflow-hidden rounded-full bg-hairline">
      {children}
    </div>
  );
}

export default function StatStrip() {
  const m = METRICS;
  const totalM = +(m.totalValue / 1_000_000).toFixed(2); // e.g. 1.25
  return (
    <dl className="grid grid-cols-2 overflow-hidden rounded-lg border border-hairline bg-surface md:grid-cols-4">
      <Cell idx={0} value={m.overallPct} decimals={1} unit="%" color="var(--accent)" label="Overall accuracy">
        <Track>
          <div className="absolute inset-y-0 left-0 rounded-full bg-accent" style={{ width: `${m.overallPct}%` }} />
        </Track>
      </Cell>

      <Cell idx={1} value={m.ambiguousPct} decimals={1} unit="%" color="var(--ink)" label="On the hard orders (two causes at once)">
        <Track>
          <div className="absolute inset-y-0 left-0 rounded-full bg-ink" style={{ width: `${m.ambiguousPct}%` }} />
          <div
            className="absolute inset-y-[-2px] w-px bg-muted"
            style={{ left: `${m.naivePct}%` }}
            title={`simple rule ${m.naivePct}%`}
          />
        </Track>
        <p className="mt-1.5 font-mono text-[10px] tracking-wide text-muted">
          simple rule: {m.naivePct}%
        </p>
      </Cell>

      <Cell idx={2} value={m.liftPct} decimals={1} sign="+" unit="pts" color="var(--ink)" label="Improvement over a simple rule">
        <Track>
          <div className="absolute inset-y-0 left-0 rounded-full bg-hairline" />
          <div className="absolute inset-y-0 rounded-full bg-muted/40" style={{ left: "0%", width: `${m.naivePct}%` }} />
          <div className="absolute inset-y-0 rounded-full bg-accent" style={{ left: `${m.naivePct}%`, width: `${m.liftPct}%` }} />
        </Track>
        <p className="mt-1.5 font-mono text-[10px] tracking-wide text-muted">
          {m.naivePct}% → {m.ambiguousPct}% on the hard orders
        </p>
      </Cell>

      <Cell idx={3} prefix="AED" value={totalM} decimals={2} unit="M" color="var(--ink)" label="Failure value attributed">
        <div aria-hidden="true" className="flex h-1.5 w-full overflow-hidden rounded-full">
          {DRIVER_ORDER.map((k) => (
            <div
              key={k}
              style={{ width: `${DRIVERS[k].share * 100}%`, backgroundColor: DRIVERS[k].color }}
              title={`${DRIVERS[k].label} ${(DRIVERS[k].share * 100).toFixed(1)}%`}
            />
          ))}
        </div>
        <p className="mt-1.5 font-mono text-[10px] tracking-wide text-muted">across four teams</p>
      </Cell>
    </dl>
  );
}
