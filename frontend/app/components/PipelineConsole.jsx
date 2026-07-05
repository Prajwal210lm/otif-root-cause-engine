"use client";

import { motion } from "framer-motion";
import { useReducedMotionSafe } from "../lib/useReducedMotionSafe";
import { usePauseOnHidden } from "../lib/usePauseOnHidden";
import { DRIVERS, DRIVER_ORDER, METRICS, fmtAED } from "../lib/otif";

const SANS = "var(--font-plex-sans), ui-sans-serif, system-ui, sans-serif";
const MONO = "var(--font-plex-mono), ui-monospace, monospace";

const AGENTS = [
  { name: "Demand", color: "#2F6D9E", y: 44 },
  { name: "Supplier", color: "#C0552F", y: 112 },
  { name: "Warehouse", color: "#6E5B96", y: 180 },
  { name: "Logistics", color: "#B08738", y: 248 },
];

const FAN_OUT = [
  { color: "#2F6D9E", d: "M168,180 C230,180 230,66 300,66" },
  { color: "#C0552F", d: "M168,180 C230,180 230,134 300,134" },
  { color: "#6E5B96", d: "M168,180 C230,180 230,202 300,202" },
  { color: "#B08738", d: "M168,180 C230,180 230,270 300,270" },
];

const FAN_IN = [
  { color: "#2F6D9E", d: "M470,66 C560,66 560,180 612,180" },
  { color: "#C0552F", d: "M470,134 C560,134 560,180 612,180" },
  { color: "#6E5B96", d: "M470,202 C560,202 560,180 612,180" },
  { color: "#B08738", d: "M470,270 C560,270 560,180 612,180" },
];

function Connector() {
  return <div aria-hidden className="mx-auto h-5 w-px bg-gradient-to-b from-white/25 to-white/5" />;
}

export default function PipelineConsole() {
  const reduce = useReducedMotionSafe();
  const { svgRef, hidden: tabHidden } = usePauseOnHidden();

  const node = (delay) =>
    reduce
      ? {}
      : {
          initial: { opacity: 0, y: 10 },
          animate: { opacity: 1, y: 0 },
          transition: { duration: 0.45, delay, ease: "easeOut" },
        };

  const draw = (delay) =>
    reduce
      ? { opacity: 0.8 }
      : {
          initial: { pathLength: 0, opacity: 0 },
          animate: { pathLength: 1, opacity: 0.8 },
          transition: { duration: 0.6, delay, ease: "easeInOut" },
        };

  return (
    <figure className="overflow-hidden rounded-xl border border-white/10 bg-[#0F1318] shadow-[0_40px_90px_-50px_rgba(11,94,85,0.55)]">
      {/* console header */}
      <div className="flex items-center justify-between border-b border-white/10 px-4 py-3 md:px-5">
        <div className="flex items-center gap-2.5">
          <span aria-hidden className="grid h-4 w-4 place-items-center rounded-[3px] border border-accent-soft/40">
            <span className="h-1.5 w-1.5 rounded-[1px] bg-accent-soft" />
          </span>
          <span className="font-mono text-[11px] uppercase tracking-[0.16em] text-white/55">otif-pipeline</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="hidden font-mono text-[10.5px] uppercase tracking-[0.16em] text-white/35 sm:inline">
            standard batch · {METRICS.orders} orders
          </span>
          <span className="flex items-center gap-1.5">
            <span className="relative flex h-2 w-2">
              <span className={`absolute inline-flex h-full w-full rounded-full bg-accent-soft opacity-60 ${tabHidden ? "" : "motion-safe:animate-ping"}`} />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-accent-soft" />
            </span>
            <span className="font-mono text-[10.5px] uppercase tracking-[0.16em] text-accent-soft">live</span>
          </span>
        </div>
      </div>

      {/* desktop: horizontal SVG pipeline */}
      <div className="console-grid hidden px-4 py-6 md:block md:px-7 md:py-8">
        <svg ref={svgRef} viewBox="0 0 980 360" className="h-auto w-full" role="img" aria-labelledby="pc-title pc-desc">
          <title id="pc-title">Multi-agent attribution pipeline</title>
          <desc id="pc-desc">
            {METRICS.orders} failed orders fan out to four specialist agents (demand, supplier,
            warehouse and logistics) investigating in parallel, then fan back in to a coordinator
            that adjudicates and returns a ranked root-cause verdict.
          </desc>

          <defs>
            <filter id="pkt-glow" x="-60%" y="-60%" width="220%" height="220%">
              <feGaussianBlur stdDeviation="2.4" result="b" />
              <feMerge>
                <feMergeNode in="b" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          <text x="385" y="26" textAnchor="middle" fontFamily={MONO} fontSize="9.5" letterSpacing="1.8" fill="#6B7585">
            4 AGENTS, IN PARALLEL
          </text>

          {FAN_OUT.map((c, i) => (
            <motion.path key={`fo-${i}`} d={c.d} fill="none" stroke={c.color} strokeWidth="1.6" strokeLinecap="round" {...draw(0.45 + i * 0.1)} />
          ))}
          {FAN_IN.map((c, i) => (
            <motion.path key={`fi-${i}`} d={c.d} fill="none" stroke={c.color} strokeWidth="1.6" strokeLinecap="round" {...draw(1.35 + i * 0.1)} />
          ))}

          {!reduce && (
            <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.7, delay: 3 }} filter="url(#pkt-glow)" aria-hidden="true">
              {FAN_OUT.map((c, i) => (
                <circle key={`pfo-${i}`} r="2.8" fill={c.color}>
                  <animateMotion dur="2.2s" repeatCount="indefinite" path={c.d} begin={`${-0.55 * i}s`} />
                </circle>
              ))}
              {FAN_IN.map((c, i) => (
                <circle key={`pfi-${i}`} r="2.8" fill={c.color}>
                  <animateMotion dur="2.2s" repeatCount="indefinite" path={c.d} begin={`${-0.55 * i - 1.1}s`} />
                </circle>
              ))}
            </motion.g>
          )}

          <motion.g {...node(0)}>
            <rect x="40" y="150" width="128" height="60" rx="7" fill="#1A2029" stroke="#FFFFFF" strokeOpacity="0.14" />
            <text x="104" y="174" textAnchor="middle" fontFamily={MONO} fontSize="9" letterSpacing="1" fill="#8B94A3">FAILED ORDERS</text>
            <text x="104" y="196" textAnchor="middle" fontFamily={SANS} fontSize="17" fontWeight="700" fill="#FFFFFF">{METRICS.orders} orders</text>
          </motion.g>

          {AGENTS.map((a, i) => (
            <motion.g key={a.name} {...node(0.6 + i * 0.12)}>
              <rect x="300" y={a.y} width="170" height="44" rx="7" fill="#171D26" stroke="#FFFFFF" strokeOpacity="0.10" />
              <rect x="312" y={a.y + 12} width="4" height="20" rx="2" fill={a.color} />
              <text x="326" y={a.y + 25} fontFamily={SANS} fontSize="13" fontWeight="600" fill="#E7EBF1">{a.name}</text>
              <text x="326" y={a.y + 37} fontFamily={MONO} fontSize="8.5" letterSpacing="0.8" fill="#7C8696">SPECIALIST AGENT</text>
            </motion.g>
          ))}

          <motion.g {...node(2.1)}>
            <rect x="612" y="150" width="148" height="60" rx="7" fill="#102220" stroke="#4FC4B0" strokeWidth="1.4" />
            <text x="686" y="177" textAnchor="middle" fontFamily={SANS} fontSize="14" fontWeight="700" fill="#9FD6CE">Coordinator</text>
            <text x="686" y="193" textAnchor="middle" fontFamily={MONO} fontSize="8.5" letterSpacing="1" fill="#6E8C86">ADJUDICATES</text>
          </motion.g>

          <motion.g {...node(2.45)}>
            <line x1="760" y1="180" x2="812" y2="180" stroke="#4FC4B0" strokeWidth="1.8" />
            <polygon points="812,174 824,180 812,186" fill="#4FC4B0" />
          </motion.g>

          <motion.g {...node(2.6)}>
            <rect x="824" y="144" width="120" height="72" rx="7" fill="#0B5E55" stroke="#5BCDB8" strokeWidth="1.2" />
            <text x="884" y="168" textAnchor="middle" fontFamily={MONO} fontSize="8.5" letterSpacing="1.6" fill="#9FD6CE">VERDICT</text>
            <text x="884" y="186" textAnchor="middle" fontFamily={SANS} fontSize="12.5" fontWeight="700" fill="#FFFFFF">Ranked</text>
            <text x="884" y="202" textAnchor="middle" fontFamily={SANS} fontSize="12.5" fontWeight="700" fill="#FFFFFF">root cause</text>
          </motion.g>
        </svg>
      </div>

      {/* mobile: vertical pipeline */}
      <div className="console-grid px-5 py-7 md:hidden">
        <div className="mx-auto w-full max-w-[300px]">
          <div className="rounded-lg border border-white/15 bg-[#1A2029] px-4 py-3 text-center">
            <p className="font-mono text-[9px] uppercase tracking-[0.14em] text-white/45">Failed orders</p>
            <p className="mt-0.5 text-lg font-bold text-white">{METRICS.orders} orders</p>
          </div>
          <Connector />
          <p className="text-center font-mono text-[9px] uppercase tracking-[0.18em] text-white/40">4 agents, in parallel</p>
          <div className="mt-3 space-y-2">
            {AGENTS.map((a) => (
              <div key={a.name} className="flex items-center gap-3 rounded-lg border border-white/10 bg-[#171D26] px-3 py-2.5">
                <span className="h-7 w-1 rounded-full" style={{ backgroundColor: a.color }} />
                <span className="text-[14px] font-semibold text-[#E7EBF1]">{a.name}</span>
                <span className="ml-auto font-mono text-[8.5px] uppercase tracking-[0.1em] text-[#7C8696]">specialist</span>
              </div>
            ))}
          </div>
          <Connector />
          <div className="rounded-lg border border-[#4FC4B0]/60 bg-[#102220] px-4 py-3 text-center">
            <p className="text-[15px] font-bold text-[#9FD6CE]">Coordinator</p>
            <p className="mt-0.5 font-mono text-[9px] uppercase tracking-[0.14em] text-[#6E8C86]">adjudicates</p>
          </div>
          <div aria-hidden className="py-1 text-center text-[#4FC4B0]">↓</div>
          <div className="rounded-lg border border-[#5BCDB8] bg-[#0B5E55] px-4 py-3 text-center">
            <p className="font-mono text-[9px] uppercase tracking-[0.16em] text-[#9FD6CE]">Verdict</p>
            <p className="mt-0.5 text-[15px] font-bold text-white">Ranked root cause</p>
          </div>
        </div>
      </div>

      {/* result readout */}
      <div className="flex flex-col gap-3 border-t border-white/10 px-4 py-4 md:flex-row md:items-center md:justify-between md:px-5">
        <div className="font-mono text-[12px] tracking-wide text-white/70">
          <span className="text-accent-soft">MAIN CAUSE ▸ </span>
          <span className="text-white">{DRIVERS[DRIVER_ORDER[0]].label.toLowerCase()}</span>
          <span className="text-white/45"> · </span>
          <span className="tnum text-white">{fmtAED(DRIVERS[DRIVER_ORDER[0]].value)}</span>
          <span className="text-white/45"> at risk ({(DRIVERS[DRIVER_ORDER[0]].share * 100).toFixed(1)}%)</span>
        </div>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 font-mono text-[10.5px] uppercase tracking-[0.14em] text-white/45">
          <span>overall <span className="tnum text-white/80">{METRICS.overallPct}%</span></span>
          <span>hard orders <span className="tnum text-white/80">{METRICS.ambiguousPct}%</span></span>
          <span>vs simple rule <span className="tnum text-accent-soft">+{METRICS.liftPct} pts</span></span>
        </div>
      </div>
    </figure>
  );
}
