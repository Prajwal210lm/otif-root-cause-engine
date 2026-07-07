import CountUp from "./CountUp";

// A single measured figure: big mono count-up numeral, a mono unit label, and an
// optional one-line gloss. Prefix (currency/sign) renders as a small superscript
// and the suffix (unit) is slightly reduced, so "AED 1.23M" reads as one figure
// rather than three same-size words. Large sizes get a touch of negative tracking
// to close IBM Plex Mono's wide decimal.
const SIZES = {
  sm: "text-3xl md:text-4xl tracking-[-0.01em]",
  md: "text-4xl md:text-5xl tracking-[-0.02em]",
  lg: "text-[2.6rem] leading-none md:text-[3.6rem] tracking-[-0.03em]",
};

export default function Stat({
  value,
  decimals = 0,
  prefix = "",
  suffix = "",
  label,
  sub,
  accent = false,
  size = "md",
  count = true,
}) {
  const formatted = value.toLocaleString("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
  return (
    <div>
      <div
        className={`tnum font-bold leading-none ${SIZES[size]} ${
          accent ? "text-accent" : "text-ink"
        }`}
      >
        {prefix && (
          <span className="mr-[0.12em] align-top text-[0.44em] font-semibold text-muted">
            {prefix.trim()}
          </span>
        )}
        {count ? (
          <CountUp value={value} decimals={decimals} />
        ) : (
          <span className="tnum">{formatted}</span>
        )}
        {suffix && <span className="ml-[0.04em] text-[0.62em] font-semibold">{suffix}</span>}
      </div>
      {label && (
        <div className="mt-3 font-mono text-[0.7rem] font-medium uppercase tracking-[0.16em] text-muted">
          {label}
        </div>
      )}
      {sub && <p className="mt-2 max-w-[28ch] text-sm leading-relaxed text-faint">{sub}</p>}
    </div>
  );
}
