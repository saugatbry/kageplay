import type { MetadataRoute } from "next";

const baseUrl = (process.env.NEXT_PUBLIC_SITE_URL || "https://kageplay.saugii650.workers.dev").replace(/\/+$/, "");

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: baseUrl, lastModified: new Date(), changeFrequency: "daily", priority: 1.0 },
    { url: `${baseUrl}/search`, lastModified: new Date(), changeFrequency: "daily", priority: 0.6 },
  ];

  let animeSlugs: string[] = [];
  try {
    const res = await fetch(`${baseUrl}/api/home?provider=subdub`, {
      signal: AbortSignal.timeout(5000),
    });
    if (res.ok) {
      const json = await res.json();
      const data = json?.data;
      if (data) {
        const all = [
          ...(data.spotlightAnimes || []),
          ...(data.trendingAnimes || []),
          ...(data.mostPopularAnimes || []),
          ...(data.mostFavoriteAnimes || []),
          ...(data.topAiringAnimes || []),
        ];
        const seen = new Set<string>();
        for (const a of all) {
          if (a?.id && !seen.has(a.id)) {
            seen.add(a.id);
            animeSlugs.push(a.id);
          }
        }
      }
    }
  } catch {}

  const dynamicRoutes: MetadataRoute.Sitemap = animeSlugs.slice(0, 200).map((slug) => ({
    url: `${baseUrl}/anime/${slug}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: 0.8,
  }));

  return [...staticRoutes, ...dynamicRoutes];
}
