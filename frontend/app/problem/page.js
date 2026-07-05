import PageHero from "../components/PageHero";
import ExplainerSection from "../components/ExplainerSection";
import ProblemSection from "../components/ProblemSection";
import PageNav from "../components/PageNav";
import { FictionalLabel } from "../components/DataNote";

export const metadata = {
  title: "The Problem · OTIF Root-Cause Engine",
  description:
    "When OTIF drops, four teams blame each other. Finding the real cause takes days. This tool does it in seconds.",
};

export default function ProblemPage() {
  return (
    <>
      <PageHero
        eyebrow="§01 · The Problem"
        title="Four suspects. One failed order."
        lede="When a delivery fails, four teams blame each other. This finds who's right."
      >
        <FictionalLabel className="mt-6" />
      </PageHero>
      <ExplainerSection />
      <ProblemSection />
      <PageNav next={{ href: "/how-it-works", label: "How It Works" }} />
    </>
  );
}
