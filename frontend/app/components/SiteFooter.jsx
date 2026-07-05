import Link from "next/link";
import { COMPANY } from "../lib/company";
import { METRICS } from "../lib/otif";

const PAGES = [
  { href: "/problem", label: "The Problem" },
  { href: "/how-it-works", label: "How It Works" },
  { href: "/results", label: "The Results" },
  { href: "/live", label: "Run It Live" },
];

const TOOLS = [
  { name: "Liquidity Lens", href: "https://supply-chain-liquidity-lens.vercel.app", status: "live", desc: "finds cash trapped in the wrong inventory and says what to sell down first." },
  { name: "Supplier Resilience Radar", href: "https://supplier-resilience-radar.vercel.app", status: "live", desc: "flags which suppliers are risky before a shipment fails." },
  { name: "OTIF Root-Cause Engine", href: "/", status: "this one", desc: "finds why deliveries fail and what each cause costs." },
  { name: "Project four", href: null, status: "in progress", desc: "ask the supply chain questions in plain English, get grounded answers with a chart." },
];

// TODO: set to the public repository URL once created; the link stays hidden until then.
const GITHUB_URL = null;
const LINKEDIN_URL = "https://www.linkedin.com/in/prajwal-b-006050228/";

export default function SiteFooter() {
  return (
    <footer className="border-t border-hairline bg-canvas">
      <div className="mx-auto max-w-[1200px] px-5 py-16 md:px-8 md:py-20">
        <div className="grid gap-10 md:grid-cols-[1.4fr_1fr]">
          <div>
            <div className="flex items-center gap-2.5">
              <span aria-hidden className="grid h-5 w-5 place-items-center rounded-[4px] border border-accent/50">
                <span className="h-2 w-2 rounded-[2px] bg-accent" />
              </span>
              <span className="font-mono text-[13px] uppercase tracking-[0.16em] text-ink">
                <span className="font-semibold">OTIF</span> Root-Cause Engine
              </span>
            </div>
            <p className="mt-5 max-w-[460px] text-[15px] leading-relaxed text-muted">
              This is the third of four tools I built to show how AI can solve real supply-chain
              problems for a Gulf distributor. Each one solves a different problem.
            </p>
            <p className="mt-5 text-base font-semibold text-ink">Built to be defensible line by line.</p>
          </div>

          <nav aria-label="Pages" className="md:justify-self-end">
            <p className="eyebrow">This case file</p>
            <ul className="mt-4 space-y-3">
              {PAGES.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="text-[15px] font-medium text-ink transition-colors hover:text-accent">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        <div className="mt-14">
          <p className="eyebrow">The four tools</p>
          <ul className="mt-5 grid gap-x-10 gap-y-4 md:grid-cols-2">
            {TOOLS.map((t) => {
              const name = (
                <span className="font-semibold text-ink">
                  {t.name}
                  <span className="ml-2 font-mono text-[10px] uppercase tracking-[0.12em] text-muted">
                    {t.status === "live" ? "live ↗" : t.status}
                  </span>
                </span>
              );
              return (
                <li key={t.name} className="text-[15px] leading-relaxed">
                  {t.href ? (
                    <a href={t.href} className="group">
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

        <div className="mt-14 flex flex-col gap-3 border-t border-hairline pt-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex gap-6">
            {GITHUB_URL && (
              <a href={GITHUB_URL} className="text-[15px] font-medium text-ink transition-colors hover:text-accent">
                GitHub repository ↗
              </a>
            )}
            <a href={LINKEDIN_URL} className="text-[15px] font-medium text-ink transition-colors hover:text-accent">
              LinkedIn ↗
            </a>
          </div>
          <span className="font-mono text-[10.5px] uppercase tracking-[0.14em] text-muted">
            Case {COMPANY.caseId} · {COMPANY.short} · fictional, synthetic data · {METRICS.tests} tests green
          </span>
        </div>
      </div>
    </footer>
  );
}
