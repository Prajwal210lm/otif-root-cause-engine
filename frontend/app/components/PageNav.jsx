import Link from "next/link";

// Prev/next case-file navigation at the foot of each deeper page. When one
// side has no real link (Problem has no Previous, Live has no Next), that
// side gets a quieter "back to home" link instead of an empty gap, so the
// row never looks broken or lopsided.
export default function PageNav({ prev, next }) {
  return (
    <section className="border-t border-hairline bg-canvas">
      <div className="mx-auto flex max-w-[1200px] items-stretch justify-between gap-4 px-5 py-10 md:px-8">
        {prev ? (
          <Link href={prev.href} className="group flex-1 rounded-lg border border-hairline bg-surface p-5 transition hover:border-ink/30">
            <span className="eyebrow">← Previous</span>
            <div className="mt-1 font-semibold text-ink transition-colors group-hover:text-accent">{prev.label}</div>
          </Link>
        ) : (
          <Link href="/" className="group flex flex-1 items-center rounded-lg border border-dashed border-hairline p-5 text-muted transition hover:border-ink/30 hover:text-ink">
            <span className="font-mono text-[11px] uppercase tracking-[0.12em]">← Back to Home</span>
          </Link>
        )}
        {next ? (
          <Link href={next.href} className="group flex-1 rounded-lg border border-hairline bg-surface p-5 text-right transition hover:border-ink/30">
            <span className="eyebrow">Next →</span>
            <div className="mt-1 font-semibold text-ink transition-colors group-hover:text-accent">{next.label}</div>
          </Link>
        ) : (
          <Link href="/" className="group flex flex-1 items-center justify-end rounded-lg border border-dashed border-hairline p-5 text-right text-muted transition hover:border-ink/30 hover:text-ink">
            <span className="font-mono text-[11px] uppercase tracking-[0.12em]">Back to Home →</span>
          </Link>
        )}
      </div>
    </section>
  );
}
