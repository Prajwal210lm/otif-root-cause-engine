import PageHero from "../components/PageHero";
import LiveConsole from "../components/LiveConsole";
import PageNav from "../components/PageNav";
import { SampleData } from "../components/DataNote";

export const metadata = {
  title: "Run It Live · OTIF Root-Cause Engine",
  description:
    "Run the multi-agent pipeline live on a fresh batch. See the coordinator's attribution, the scorecard, and what it could not establish.",
};

export default function LivePage() {
  return (
    <>
      <PageHero
        kicker="§04 · Run It Live"
        title="Run the engine on a live batch."
        lede="This runs the four AI investigators, one for each team that could be at fault, plus the coordinator that makes the final call, on a batch of failed orders, and shows which team caused each one and what it cost."
      />
      <div className="mx-auto max-w-[1200px] px-5 pt-12 md:px-8 md:pt-14">
        <SampleData />
      </div>
      <LiveConsole />
      <PageNav prev={{ href: "/results", label: "The Results" }} />
    </>
  );
}
