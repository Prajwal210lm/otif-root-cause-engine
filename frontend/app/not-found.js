import Link from "next/link";
import Wordmark from "./components/Wordmark";
import Kicker from "./components/Kicker";
import Button from "./components/Button";

export const metadata = { title: "Page not found · OTIF Root-Cause Engine" };

export default function NotFound() {
  return (
    <section className="relative overflow-hidden">
      <div aria-hidden className="field-grid field-grid-fade absolute inset-0" />
      <div className="relative mx-auto flex max-w-[1200px] flex-col items-start px-5 py-28 md:px-8 md:py-40">
        <Wordmark full />
        <div className="mt-8">
          <Kicker>404 · not on the case file</Kicker>
        </div>
        <h1 className="mt-4 text-balance text-[2rem] font-bold leading-[1.05] tracking-[-0.02em] md:text-[2.8rem]">
          This page does not exist.
        </h1>
        <p className="mt-4 max-w-[480px] text-lg leading-relaxed text-muted">
          No verdict here. The investigation lives on the home page.
        </p>
        <Button href="/" className="mt-8">
          Back to the case
        </Button>
      </div>
    </section>
  );
}
