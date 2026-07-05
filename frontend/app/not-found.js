import Link from "next/link";

export const metadata = { title: "Page not found · OTIF Root-Cause Engine" };

export default function NotFound() {
  return (
    <section className="field-grid border-b border-hairline">
      <div className="mx-auto flex max-w-[1200px] flex-col items-start px-5 py-28 md:px-8 md:py-40">
        <div className="flex items-center gap-2.5">
          <span aria-hidden className="grid h-5 w-5 place-items-center rounded-[4px] border border-accent/50">
            <span className="h-2 w-2 rounded-[2px] bg-accent" />
          </span>
          <span className="eyebrow">404 · not on the case file</span>
        </div>
        <h1 className="mt-5 text-balance text-[2rem] font-bold leading-[1.06] tracking-tight md:text-[2.8rem]">
          This page doesn&rsquo;t exist.
        </h1>
        <p className="mt-4 max-w-[480px] text-lg leading-relaxed text-muted">
          No verdict here. The investigation lives on the home page.
        </p>
        <Link
          href="/"
          className="mt-8 rounded-md bg-accent px-5 py-3 text-sm font-semibold text-white transition hover:brightness-110"
        >
          Back to the case
        </Link>
      </div>
    </section>
  );
}
