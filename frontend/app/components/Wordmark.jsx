// Shared wordmark: a teal registration-square mark plus the mono lockup. Used in
// the nav and footer so the brand mark is defined once.
export default function Wordmark({ full = false }) {
  return (
    <span className="flex items-center gap-2.5">
      <span aria-hidden className="grid h-5 w-5 place-items-center rounded-[4px] border border-accent/50">
        <span className="h-2 w-2 rounded-[2px] bg-accent" />
      </span>
      <span className="font-mono text-[12px] uppercase tracking-[0.16em] text-ink">
        <span className="font-semibold">OTIF</span>
        <span className={full ? "text-muted" : "hidden text-muted sm:inline"}>
          {" "}
          {full ? "Root-Cause Engine" : "· root-cause engine"}
        </span>
      </span>
    </span>
  );
}
