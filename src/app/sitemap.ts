import type { MetadataRoute } from "next";

const getBaseUrl = () =>
  (process.env.NEXT_PUBLIC_SITE_URL || "https://kageplay.qzz.io").replace(/\/+$/, "");

const GENRES = [
  "action", "adventure", "comedy", "drama", "fantasy",
  "horror", "mystery", "romance", "sci-fi",
  "slice-of-life", "sports", "supernatural",
];

export async function generateSitemaps() {
  return [
    { id: "page" },
    { id: "type" },
    { id: "genre" },
    ...Array.from({ length: 20 }, (_, i) => ({ id: `anime-${i + 1}` })),
  ];
}

export default async function sitemap({
  id,
}: {
  id: string;
}): Promise<MetadataRoute.Sitemap> {
  const baseUrl = getBaseUrl();

  switch (id) {
    case "page":
      return [
        { url: baseUrl, lastModified: new Date(), changeFrequency: "daily", priority: 1.0 },
        { url: `${baseUrl}/search`, lastModified: new Date(), changeFrequency: "daily", priority: 0.6 },
        { url: `${baseUrl}/manga`, lastModified: new Date(), changeFrequency: "daily", priority: 0.6 },
      ];

    case "type":
      return [
        { url: `${baseUrl}/search?type=sub`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.5 },
        { url: `${baseUrl}/search?type=dub`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.5 },
      ];

    case "genre":
      return GENRES.map((genre) => ({
        url: `${baseUrl}/search?genre=${genre}`,
        lastModified: new Date(),
        changeFrequency: "weekly" as const,
        priority: 0.7,
      }));

    default: {
      const animeSlugs: string[] = [];
      try {
        const res = await fetch(`${baseUrl}/api/home?provider=subdub`, { signal: AbortSignal.timeout(5000) });
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

      const pageIndex = parseInt(id.replace("anime-", ""), 10) - 1;
      const pageSize = 10;
      const pageSlugs = animeSlugs.slice(pageIndex * pageSize, (pageIndex + 1) * pageSize);

      return pageSlugs.map((slug) => ({
        url: `${baseUrl}/anime/${slug}`,
        lastModified: new Date(),
        changeFrequency: "weekly" as const,
        priority: 0.8,
      }));
    }
  }
}
