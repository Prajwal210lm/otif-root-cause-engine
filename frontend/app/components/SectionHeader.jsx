import Kicker from "./Kicker";
import Reveal from "./Reveal";

// Shared section rhythm: kicker -> headline -> one-line intro. Every section on
// every page opens with this so the whole hub reads as one document.
export default function SectionHeader({ kicker, title, intro, align = "left", className = "" }) {
  const alignment =
    align === "center" ? "items-center text-center mx-auto" : "items-start text-left";
  return (
    <Reveal className={`flex max-w-2xl flex-col ${alignment} ${className}`}>
      {kicker && <Kicker>{kicker}</Kicker>}
      <h2 className="mt-4 text-balance text-[1.75rem] font-semibold leading-[1.12] tracking-[-0.02em] text-ink md:text-[2.5rem]">
        {title}
      </h2>
      {intro && <p className="mt-4 text-lg leading-relaxed text-muted">{intro}</p>}
    </Reveal>
  );
}
