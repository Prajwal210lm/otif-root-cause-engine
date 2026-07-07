import Link from "next/link";

// Prev/next case-file navigation at the foot of each deeper page. When one side
// has no real link (Problem has no Previous, Live has no Next), that side gets a
// quieter "back to home" link instead of an empty gap.
export default function PageNav({ prev, next }) {
  return (
    <section className="border-t border-hairline bg-canvas">
      <div className="mx-auto flex max-w-[1200px] items-stretch justify-between gap-4 px-5 py-10 md:px-8">
        {prev ? (
          <Link href={prev.href} className="group flex-1 rounded-lg border border-hairline bg-surface p-5 transition hover:border-hairline-strong hover:bg-canvas">
            <span className="font-mono text-[10.5px] uppercase tracking-[0.16em] text-faint">← Previous</span>
            <div className="mt-1.5 font-semibold text-ink transition-colors group-hover:text-accent">{prev.label}</div>
          </Link>
        ) : (
          <Link href="/" className="group flex flex-1 items-center rounded-lg border border-dashed border-hairline p-5 text-faint transition hover:border-hairline-strong hover:text-ink">
            <span className="font-mono text-[11px] uppercase tracking-[0.12em]">← Back to Home</span>
          </Link>
        )}
        {next ? (
          <Link href={next.href} className="group flex-1 rounded-lg border border-hairline bg-surface p-5 text-right transition hover:border-hairline-strong hover:bg-canvas">
            <span className="font-mono text-[10.5px] uppercase tracking-[0.16em] text-faint">Next →</span>
            <div className="mt-1.5 font-semibold text-ink transition-colors group-hover:text-accent">{next.label}</div>
          </Link>
        ) : (
          <Link href="/" className="group flex flex-1 items-center justify-end rounded-lg border border-dashed border-hairline p-5 text-right text-faint transition hover:border-hairline-strong hover:text-ink">
            <span className="font-mono text-[11px] uppercase tracking-[0.12em]">Back to Home →</span>
          </Link>
        )}
      </div>
    </section>
  );
}
