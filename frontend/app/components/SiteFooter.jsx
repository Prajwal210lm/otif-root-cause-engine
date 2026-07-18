import Link from "next/link";
import Wordmark from "./Wordmark";
import Kicker from "./Kicker";
import { COMPANY } from "../lib/company";
import { METRICS } from "../lib/otif";

const PAGES = [
  { href: "/problem", label: "The Problem", n: "01" },
  { href: "/how-it-works", label: "How It Works", n: "02" },
  { href: "/results", label: "The Results", n: "03" },
  { href: "/live", label: "Run It Live", n: "04" },
];

const TOOLS = [
  { name: "Liquidity Lens", href: "https://supply-chain-liquidity-lens.vercel.app", status: "live", desc: "finds cash trapped in the wrong inventory and says what to sell down first." },
  { name: "Supplier Resilience Radar", href: "https://supplier-resilience-radar.vercel.app", status: "live", desc: "flags which suppliers are risky before a shipment fails." },
  { name: "OTIF Root-Cause Engine", href: "/", status: "this one", desc: "finds why deliveries fail and what each cause costs." },
  { name: "Supply Chain Copilot", href: "https://supply-chain-copilot-nine.vercel.app", status: "live", desc: "ask the supply chain a question in plain English, get a grounded answer with the query shown." },
];

const GITHUB_URL = "https://github.com/Prajwal210lm/otif-root-cause-engine";
const LINKEDIN_URL = "https://www.linkedin.com/in/prajwal-b-006050228/";

export default function SiteFooter() {
  return (
    <footer className="border-t border-hairline bg-canvas">
      <div className="mx-auto max-w-[1200px] px-5 py-16 md:px-8 md:py-20">
        <div className="grid gap-12 md:grid-cols-[1.5fr_1fr]">
          <div>
            <Wordmark full />
            <p className="mt-6 max-w-[460px] text-[15px] leading-relaxed text-muted">
              The third of four tools I built to show how AI can solve real supply-chain problems for
              Gulf supply chains. Each one solves a different problem.
            </p>
            <p className="mt-6 text-base font-semibold text-ink">Built to be defensible line by line.</p>
          </div>

          <nav aria-label="Pages" className="md:justify-self-end">
            <Kicker>This case file</Kicker>
            <ul className="mt-5 space-y-3">
              {PAGES.map((l) => (
                <li key={l.href} className="flex items-center gap-3">
                  <span className="tnum text-[11px] text-faint">§{l.n}</span>
                  <Link href={l.href} className="text-[15px] font-medium text-ink transition-colors hover:text-accent">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        <div className="mt-14">
          <Kicker>The four tools</Kicker>
          <ul className="mt-6 grid gap-x-10 gap-y-4 md:grid-cols-2">
            {TOOLS.map((t) => {
              const name = (
                <span className="font-semibold text-ink">
                  {t.name}
                  <span className="ml-2 font-mono text-[10px] uppercase tracking-[0.12em] text-faint">
                    {t.status === "live" ? "live ↗" : t.status}
                  </span>
                </span>
              );
              return (
                <li key={t.name} className="text-[15px] leading-relaxed">
                  {t.href ? (
                    <a href={t.href} className="group" target={t.href.startsWith("http") ? "_blank" : undefined} rel="noreferrer">
                      <span className="transition-colors group-hover:text-accent">{name}</span>
                    </a>
                  ) : (
                    name
                  )}
                  <span className="text-muted">: {t.desc}</span>
                </li>
              );
            })}
          </ul>
        </div>

        <div className="mt-14 flex flex-col gap-4 border-t border-hairline pt-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex gap-6">
            <a href={GITHUB_URL} className="text-[15px] font-medium text-ink transition-colors hover:text-accent" target="_blank" rel="noreferrer">
              GitHub repository ↗
            </a>
            <a href={LINKEDIN_URL} className="text-[15px] font-medium text-ink transition-colors hover:text-accent" target="_blank" rel="noreferrer">
              LinkedIn ↗
            </a>
          </div>
          <span className="font-mono text-[10.5px] uppercase tracking-[0.14em] text-faint">
            Case {COMPANY.caseId} · {COMPANY.short} · synthetic data · {METRICS.tests} tests green
          </span>
        </div>
      </div>
    </footer>
  );
}
