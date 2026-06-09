import { NextResponse } from "next/server";

const BASE = "https://kageplay.qzz.io";

const POPULAR_SEARCHES = [
  "naruto", "one piece", "attack on titan", "demon slayer", "jujutsu kaisen",
  "death note", "fullmetal alchemist", "steins gate", "hunter x hunter",
  "code geass", "one punch man", "mob psycho", "bleach", "dragon ball",
  "tokyo ghoul", "re zero", "sword art online", "my hero academia",
  "spy x family", "chainsaw man", "vinland saga", "classroom of the elite",
  "horimiya", "your lie in april", "violet evergarden", "kaguya sama",
  "haikyuu", "kuroko basket", "aot", "solo leveling",
];

export const dynamic = "force-dynamic";

export async function GET() {
  let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
  xml += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;

  for (const q of POPULAR_SEARCHES) {
    xml += `  <url>\n`;
    xml += `    <loc>${BASE}/search?q=${encodeURIComponent(q)}</loc>\n`;
    xml += `    <changefreq>weekly</changefreq>\n`;
    xml += `    <priority>0.6</priority>\n`;
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
