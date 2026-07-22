import Link from "next/link";
import Reveal from "./Reveal";
import SectionHeader from "./SectionHeader";
import { METRICS, fmtAEDm } from "../lib/otif";

const ROUTES = [
  { n: "01", href: "/problem", title: "The Problem", body: "Why a failed delivery is so hard to pin on one team, and what it costs to keep guessing." },
  { n: "02", href: "/how-it-works", title: "How It Works", body: "Four agents reason; tested code computes. The method in plain language, then the architecture." },
  { n: "03", href: "/results", title: "The Results", body: `${METRICS.overallPct}% accuracy, ${fmtAEDm(METRICS.totalValue)} attributed by team, +${METRICS.liftPct} points over a simple rule, and the honest misses.` },
];

export default function RouteCards() {
  return (
    <section className="border-t border-hairline bg-canvas">
      <div className="mx-auto max-w-[1200px] px-5 py-20 md:px-8 md:py-28">
        <SectionHeader
          kicker="Go deeper"
          title="Read the case file."
          intro="Everything above is the whole story in one screen. Each section opens into the evidence, or run the engine yourself on a fresh batch."
        />

        <div className="mt-12 grid gap-px overflow-hidden rounded-xl border border-hairline bg-hairline md:grid-cols-2">
          {ROUTES.map((r, i) => (
            <Reveal key={r.href} delay={i * 0.06} className="bg-surface">
              <Link
                href={r.href}
                className="group relative block h-full p-7 transition-colors hover:bg-canvas md:p-9"
              >
                <div className="flex items-center justify-between">
                  <span className="tnum text-sm font-semibold text-accent">{r.n}</span>
                  <span aria-hidden className="text-lg text-faint transition-transform duration-300 group-hover:translate-x-1 group-hover:text-accent">→</span>
                </div>
                <h3 className="mt-6 text-xl font-semibold text-ink">{r.title}</h3>
                <p className="mt-2 max-w-[420px] text-[15px] leading-relaxed text-muted">{r.body}</p>
              </Link>
            </Reveal>
          ))}

          {/* fourth card is the live-run action, not a floating hero button */}
          <Reveal delay={ROUTES.length * 0.06} className="bg-accent">
            <div className="relative flex h-full flex-col p-7 md:p-9">
              <div className="flex items-center justify-between">
                <span className="tnum text-sm font-semibold text-white/70">04</span>
                <span aria-hidden className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.14em] text-white/70">
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="absolute inline-flex h-full w-full rounded-full bg-accent-soft opacity-70 motion-safe:animate-ping" />
                    <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-accent-soft" />
                  </span>
                  live
                </span>
              </div>
              <h3 className="mt-6 text-xl font-semibold text-white">Run It Live</h3>
              <p className="mt-2 max-w-[420px] text-[15px] leading-relaxed text-white/80">
                Trigger the multi-agent pipeline on a fresh, unseen batch and watch it attribute every
                failure in real time.
              </p>
              <Link
                href="/live"
                className="mt-6 inline-flex w-fit items-center gap-2 rounded-md bg-white px-4 py-3 text-sm font-semibold text-accent transition hover:bg-white/90"
              >
                Run a fresh analysis
                <span aria-hidden>→</span>
              </Link>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
