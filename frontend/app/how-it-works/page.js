import PageHero from "../components/PageHero";
import MethodSection from "../components/MethodSection";
import PageNav from "../components/PageNav";

export const metadata = {
  title: "How It Works · OTIF Root-Cause Engine",
  description:
    "Four specialist agents investigate in parallel. A coordinator decides. Tested code computes every number. The model never invents a figure.",
};

export default function HowItWorksPage() {
  return (
    <>
      <PageHero
        eyebrow="§02 · How It Works"
        title="From a failed order to a ranked verdict."
        lede="Four specialist agents investigate in parallel, one for each team that could be at fault. A coordinator makes the final call when they disagree. The plain version first, then the parts that keep the numbers honest."
      />
      <MethodSection />
      <PageNav prev={{ href: "/problem", label: "The Problem" }} next={{ href: "/results", label: "The Results" }} />
    </>
  );
}
