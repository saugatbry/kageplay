import { NextResponse } from "next/server";

const BASE = "https://kageplay.qzz.io";

export const dynamic = "force-dynamic";

export async function GET() {
  const urls: string[] = [];

  try {
    const res = await fetch(`${BASE}/api/home?provider=subdub`, { signal: AbortSignal.timeout(8000) });
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
            urls.push(a.id);
          }
        }
      }
    }
  } catch {}

  if (urls.length === 0) {
    const fallback = [
      "naruto-shippuden-306", "one-piece-100", "attack-on-titan-112",
      "demon-slayer-kimetsu-no-yaiba-167", "jujutsu-kaisen-363",
      "death-note-104", "fullmetal-alchemist-brotherhood-197",
      "steins-gate-168", "hunter-x-hunter-111", "code-geass-179",
      "one-punch-man-183", "mob-psycho-100-247",
    ];
    urls.push(...fallback);
  }

  let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
  xml += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;

  for (const slug of urls) {
    xml += `  <url>\n`;
    xml += `    <loc>${BASE}/anime/${slug}</loc>\n`;
    xml += `    <changefreq>weekly</changefreq>\n`;
    xml += `    <priority>0.8</priority>\n`;
    xml += `  </url>\n`;
  }

  xml += `</urlset>`;

  return new NextResponse(xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}
