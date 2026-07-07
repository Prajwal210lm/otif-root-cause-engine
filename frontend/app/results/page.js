import PageHero from "../components/PageHero";
import TrustSection from "../components/TrustSection";
import RobustnessSection from "../components/RobustnessSection";
import ValueSection from "../components/ValueSection";
import ScopeSection from "../components/ScopeSection";
import PageNav from "../components/PageNav";
import { SampleData } from "../components/DataNote";
import { METRICS, fmtAEDm } from "../lib/otif";

export const metadata = {
  title: "The Results · OTIF Root-Cause Engine",
  description: `${METRICS.overallPct}% overall accuracy. ${METRICS.ambiguousPct}% on the hard orders where two causes overlap, against ${METRICS.naivePct}% for a simple rule. Measured against a planted answer key, with the misses left in.`,
};

export default function ResultsPage() {
  return (
    <>
      <PageHero
        kicker="§03 · The Results"
        title={`${METRICS.overallPct}% right, and it tells you about the ones it got wrong.`}
        lede={`Accuracy measured against a known answer, not asserted. Here is what we tested, what we got, and what it means, then where the ${fmtAEDm(METRICS.totalValue)} actually went.`}
      >
        <div className="mt-6 max-w-[760px]">
          <SampleData short />
        </div>
      </PageHero>
      <TrustSection />
      <RobustnessSection />
      <ValueSection />
      <ScopeSection />
      <PageNav prev={{ href: "/how-it-works", label: "How It Works" }} next={{ href: "/live", label: "Run It Live" }} />
    </>
  );
}
