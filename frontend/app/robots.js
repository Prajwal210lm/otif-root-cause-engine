// Generates /robots.txt. Allows all; points crawlers at the sitemap.
export default function robots() {
  const base = "https://otif-root-cause-engine.vercel.app";
  return {
    rules: { userAgent: "*", allow: "/" },
    sitemap: `${base}/sitemap.xml`,
  };
}
