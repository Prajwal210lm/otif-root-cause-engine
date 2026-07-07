// Generates /sitemap.xml for the five case-file routes.
export default function sitemap() {
  const base = "https://otif-root-cause-engine.vercel.app";
  const routes = ["", "/problem", "/how-it-works", "/results", "/live"];
  return routes.map((path) => ({
    url: `${base}${path}`,
    changeFrequency: "monthly",
    priority: path === "" ? 1 : 0.8,
  }));
}
