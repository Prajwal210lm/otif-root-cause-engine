import Link from "next/link";
import Reveal from "./Reveal";
import { METRICS, fmtAEDm } from "../lib/otif";

const ROUTES = [
  { n: "01", href: "/problem", title: "The Problem", body: "Why a failed delivery is so hard to pin on one team, and what it costs to keep guessing." },
  { n: "02", href: "/how-it-works", title: "How It Works", body: "Four agents reason; tested code computes. The method in plain language, then the architecture." },
  { n: "03", href: "/results", title: "The Results", body: `${METRICS.overallPct}% accuracy, ${fmtAEDm(METRICS.totalValue)} attributed by team, +${METRICS.liftPct} points over a simple rule, and the honest misses.` },
  { n: "04", href: "/live", title: "Run It Live", body: "Trigger the multi-agent pipeline on a fresh batch and watch it attribute in real time." },
];

export default function RouteCards() {
  return (
    <section className="border-t border-hairline bg-surface">
      <div className="mx-auto max-w-[1200px] px-5 py-20 md:px-8 md:py-28">
        <Reveal>
          <p className="eyebrow">Go deeper</p>
          <h2 className="mt-4 text-balance text-[1.9rem] font-bold leading-[1.08] tracking-tight md:text-[2.5rem]">
            Read the case file.
          </h2>
          <p className="mt-5 max-w-[600px] text-lg leading-relaxed text-muted">
            Everything above is the whole story in one screen. Each section opens into the evidence.
            Pick your depth.
          </p>
        </Reveal>

        <div className="mt-12 grid gap-px overflow-hidden rounded-xl border border-hairline bg-hairline md:grid-cols-2">
          {ROUTES.map((r, i) => (
            <Reveal key={r.href} delay={i * 0.06} className="bg-surface">
              <Link href={r.href} className="group block h-full p-7 transition-colors hover:bg-canvas md:p-9">
                <div className="flex items-center justify-between">
                  <span className="tnum text-sm font-semibold text-accent">§{r.n}</span>
                  <span aria-hidden className="text-lg text-muted transition-transform duration-300 group-hover:translate-x-1 group-hover:text-accent">→</span>
                </div>
                <h3 className="mt-6 text-xl font-semibold text-ink">{r.title}</h3>
                <p className="mt-2 max-w-[420px] text-[15px] leading-relaxed text-muted">{r.body}</p>
              </Link>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
