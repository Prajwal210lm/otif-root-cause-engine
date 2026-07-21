"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Wordmark from "./Wordmark";

const NAV = [
  { href: "/problem", label: "The Problem", n: "01" },
  { href: "/how-it-works", label: "How It Works", n: "02" },
  { href: "/results", label: "The Results", n: "03" },
  { href: "/live", label: "Run It Live", n: "04" },
];

export default function SiteNav() {
  const path = usePathname();
  const [open, setOpen] = useState(false);
  const isActive = (href) => path === href;

  return (
    <header className="sticky top-0 z-50 border-b border-hairline bg-canvas/80 backdrop-blur-md">
      <div className="mx-auto flex h-14 w-full max-w-[1200px] items-center justify-between px-5 md:px-8">
        <Link href="/" aria-label="OTIF Root-Cause Engine, home" className="rounded-sm">
          <Wordmark />
        </Link>

        <nav className="hidden items-center gap-8 md:flex" aria-label="Primary">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isActive(item.href) ? "page" : undefined}
              className={`relative font-mono text-[11px] uppercase tracking-[0.14em] transition-colors ${
                isActive(item.href) ? "text-ink" : "text-muted hover:text-ink"
              }`}
            >
              {item.label}
              {isActive(item.href) && (
                <span aria-hidden className="absolute -bottom-[19px] left-0 h-[2px] w-full bg-accent" />
              )}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <Link
            href="/live"
            className="hidden rounded-md bg-accent px-3.5 py-2 font-mono text-[11px] uppercase tracking-[0.12em] text-white transition hover:brightness-110 sm:inline-block"
          >
            Run it live
          </Link>
          <button
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-label="Toggle navigation"
            className="flex h-11 w-11 items-center justify-center rounded-md border border-hairline text-ink md:hidden"
          >
            <span aria-hidden>{open ? "✕" : "☰"}</span>
          </button>
        </div>
      </div>

      {open && (
        <nav className="border-t border-hairline bg-canvas px-5 py-2 md:hidden" aria-label="Mobile">
          <ul className="flex flex-col">
            {NAV.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className={`flex items-center justify-between border-b border-hairline py-3.5 font-mono text-[12px] uppercase tracking-[0.12em] ${
                    isActive(item.href) ? "text-accent" : "text-ink"
                  }`}
                >
                  <span>{item.label}</span>
                  <span className="tnum text-faint">§{item.n}</span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      )}
    </header>
  );
}
