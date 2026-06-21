import { getAnilistWeeklySchedule } from "@/lib/anilist";

const ANIKOTO_API = "https://anikotoapi-ruby.vercel.app";

async function fetchAnikotoApi<T = any>(path: string): Promise<T> {
  const res = await fetch(`${ANIKOTO_API}${path}`, {
    signal: AbortSignal.timeout(8000),
    headers: { Accept: "application/json" },
  });
  if (!res.ok) throw new Error(`AniKoto API error: ${res.status}`);
  return res.json();
}

const slugCache = new Map<string, { slug: string; expiry: number }>();

async function findSlug(title: string): Promise<string> {
  const cached = slugCache.get(title);
  if (cached && cached.expiry > Date.now()) return cached.slug;
  try {
    const results = await fetchAnikotoApi<any>(`/search?keyword=${encodeURIComponent(title)}&page=1`);
    const items = results?.data || [];
    if (items.length > 0) {
      const slug = items[0].slug?.split("/ep-")[0] || items[0].slug || "";
      slugCache.set(title, { slug, expiry: Date.now() + 3600000 });
      return slug;
    }
  } catch {}
  slugCache.set(title, { slug: "", expiry: Date.now() + 3600000 });
  return "";
}

function extractWeekday(date: Date): string {
  return date.toLocaleString("en-US", { weekday: "long" });
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const { searchParams } = url;
  const dateParam = searchParams.get("date");
  const date = dateParam ? new Date(dateParam) : new Date();

  const dayStart = new Date(date);
  dayStart.setHours(0, 0, 0, 0);
  const weekStart = Math.floor(dayStart.getTime() / 1000);
  const weekEnd = weekStart + 7 * 86400;

  try {
    const results = await getAnilistWeeklySchedule(weekStart, weekEnd);
    const requestedDay = date.toISOString().split("T")[0];

    const mapped = await Promise.all(
      results.map(async (r) => {
        const slug = r.id && !isNaN(Number(r.id)) ? await findSlug(r.name) : r.id;
        return {
          id: slug || r.id,
          name: r.name,
          jname: r.jname,
          time: new Date(r.airingTimestamp * 1000).toLocaleTimeString("en-US", {
            hour: "2-digit",
            minute: "2-digit",
            hour12: true,
          }),
          airingTimestamp: r.airingTimestamp,
          secondsUntilAiring: Math.max(0, r.airingTimestamp - Math.floor(Date.now() / 1000)),
          episode: r.episode,
          airingDay: extractWeekday(new Date(r.airingTimestamp * 1000)),
        };
      }),
    );

    const filtered = mapped.filter((item) => {
      const itemDate = new Date(item.airingTimestamp * 1000).toISOString().split("T")[0];
      return itemDate === requestedDay;
    });

    return Response.json({ data: { scheduledAnimes: filtered } });
  } catch (err) {
    console.error(err);
    return Response.json({ error: "something went wrong" }, { status: 500 });
  }
}
