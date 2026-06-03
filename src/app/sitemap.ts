import type { MetadataRoute } from "next";

const baseUrl = (process.env.NEXT_PUBLIC_SITE_URL || "https://kageplay.saugii650.workers.dev").replace(/\/+$/, "");

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: baseUrl, lastModified: new Date(), changeFrequency: "daily", priority: 1.0 },
    { url: `${baseUrl}/search`, lastModified: new Date(), changeFrequency: "daily", priority: 0.6 },
    { url: `${baseUrl}/manga`, lastModified: new Date(), changeFrequency: "daily", priority: 0.6 },
  ];

  const animeSlugs: string[] = [];
  const mangaSlugs: string[] = [];
  const fetches: Promise<void>[] = [];

  fetches.push(
    fetch(`${baseUrl}/api/home?provider=subdub`, { signal: AbortSignal.timeout(5000) })
      .then(async (res) => {
        if (!res.ok) return;
        const json = await res.json();
        const data = json?.data;
        if (!data) return;
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
      })
      .catch(() => {}),
  );

  fetches.push(
    fetch(`${baseUrl}/api/manga/search?q=a`, { signal: AbortSignal.timeout(5000) })
      .then(async (res) => {
        if (!res.ok) return;
        const json = await res.json();
        const results = json?.data || [];
        for (const m of results) {
          if (m?.slug) mangaSlugs.push(m.slug);
        }
      })
      .catch(() => {}),
  );

  await Promise.all(fetches);

  const dynamicRoutes: MetadataRoute.Sitemap = [
    ...animeSlugs.slice(0, 200).map((slug) => ({
      url: `${baseUrl}/anime/${slug}`,
      lastModified: new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
    ...mangaSlugs.slice(0, 50).map((slug) => ({
      url: `${baseUrl}/manga/${slug}`,
      lastModified: new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.7,
    })),
  ];

  return [...staticRoutes, ...dynamicRoutes];
}
