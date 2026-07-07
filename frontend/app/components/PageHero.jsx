import Reveal from "./Reveal";
import Kicker from "./Kicker";

// Shared hero for the deeper pages: mono kicker (with section number) + page H1
// + lede, on the faded blueprint grid, matching the Home masthead language.
export default function PageHero({ kicker, title, lede, children }) {
  return (
    <section className="relative overflow-hidden border-b border-hairline">
      <div aria-hidden className="field-grid field-grid-fade absolute inset-0" />
      <div className="relative mx-auto max-w-[1200px] px-5 pt-16 pb-14 md:px-8 md:pt-20 md:pb-16">
        <Reveal>
          {kicker && <Kicker>{kicker}</Kicker>}
          <h1 className="mt-4 text-balance text-[2.1rem] font-bold leading-[1.04] tracking-[-0.02em] md:text-[3rem]">
            {title}
          </h1>
          {lede && <p className="mt-5 max-w-[680px] text-lg leading-relaxed text-muted">{lede}</p>}
          {children}
        </Reveal>
      </div>
    </section>
  );
}
