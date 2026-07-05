import Reveal from "./Reveal";

// Shared hero for the deeper pages: breadcrumb eyebrow + page H1 + lede,
// on the faint technical grid, matching the Home masthead language.
export default function PageHero({ eyebrow, title, lede, children }) {
  return (
    <section className="field-grid border-b border-hairline">
      <div className="mx-auto max-w-[1200px] px-5 pt-14 pb-12 md:px-8 md:pt-20 md:pb-16">
        <Reveal>
          <p className="eyebrow">{eyebrow}</p>
          <h1 className="mt-4 text-balance text-[2.1rem] font-bold leading-[1.05] tracking-tight md:text-[3rem]">
            {title}
          </h1>
          {lede && (
            <p className="mt-5 max-w-[680px] text-lg leading-relaxed text-muted">{lede}</p>
          )}
          {children}
        </Reveal>
      </div>
    </section>
  );
}
