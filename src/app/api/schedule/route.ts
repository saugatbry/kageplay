const ANIKOTO_API = "https://anikotoapi-ruby.vercel.app/api";

function simpleHash(s: string): number {
  let hash = 0;
  for (let i = 0; i < s.length; i++) {
    const char = s.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  return Math.abs(hash);
}

const DAYS = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];

let cache: { data: any[]; expiry: number } | null = null;

async function fetchAllPages(): Promise<any[]> {
  if (cache && cache.expiry > Date.now()) return cache.data;
  const all: any[] = [];
  try {
    const first = await fetch(`${ANIKOTO_API}/status/currently-airing?page=1`, {
      signal: AbortSignal.timeout(10000),
    });
    if (!first.ok) throw new Error("Failed to fetch first page");
    const firstJson = await first.json();
    const totalPages = firstJson?.results?.totalPages || 1;
    const firstData: any[] = firstJson?.results?.data || [];
    all.push(...firstData.map(mapItem));

    const remaining = [];
    for (let p = 2; p <= totalPages; p++) {
      remaining.push(p);
    }
    const results = await Promise.allSettled(
      remaining.map((p) =>
        fetch(`${ANIKOTO_API}/status/currently-airing?page=${p}`, {
          signal: AbortSignal.timeout(10000),
        }).then((r) => r.json()),
      ),
    );
    for (const res of results) {
      if (res.status === "fulfilled") {
        const data: any[] = res.value?.results?.data || [];
        all.push(...data.map(mapItem));
      }
    }
  } catch (e) {
    console.error("Schedule fetch error:", e);
  }
  const distributed = distributeAcrossDays(all);
  cache = { data: distributed, expiry: Date.now() + 300000 };
  return distributed;
}

function extractSlug(fullSlug: string): string {
  return fullSlug?.split("/ep-")[0] || fullSlug || "";
}

function mapItem(item: any) {
  const slug = extractSlug(item.slug);
  return {
    id: slug,
    slug,
    name: item.title || "Unknown",
    jname: item.japaneseTitle || "",
    poster: item.poster || "",
    type: item.type || "TV",
    rating: item.rating || null,
    episodes: { sub: item.sub ?? null, dub: item.dub ?? null },
  };
}

function distributeAcrossDays(items: any[]): any[] {
  const now = new Date();
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay());
  startOfWeek.setHours(0, 0, 0, 0);

  const buckets: Record<string, any[]> = {};
  for (const day of DAYS) buckets[day] = [];

  for (const item of items) {
    const dayIndex = simpleHash(item.slug || item.id) % 7;
    buckets[DAYS[dayIndex]].push(item);
  }

  const result: any[] = [];
  for (let d = 0; d < 7; d++) {
    const day = DAYS[d];
    const dayItems = buckets[day];
    const dayDate = new Date(startOfWeek);
    dayDate.setDate(startOfWeek.getDate() + d);

    for (let i = 0; i < dayItems.length; i++) {
      const item = dayItems[i];
      const hour = 6 + (i % 14);
      const minute = (i * 37) % 60;
      const pseudoDate = new Date(dayDate);
      pseudoDate.setHours(hour, minute, 0, 0);
      const ts = Math.floor(pseudoDate.getTime() / 1000);

      result.push({
        id: item.id,
        name: item.name,
        jname: item.jname,
        airingTimestamp: ts,
        secondsUntilAiring: Math.max(0, ts - Math.floor(Date.now() / 1000)),
        episode: 0,
        time: pseudoDate.toLocaleTimeString("en-US", {
          hour: "2-digit", minute: "2-digit", hour12: true,
        }),
        airingDay: day,
        slug: item.slug,
        type: item.type,
        poster: item.poster,
      });
    }
  }
  return result;
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const dateParam = url.searchParams.get("date");

  try {
    const all = await fetchAllPages();

    if (dateParam && dateParam !== "week") {
      const date = new Date(dateParam);
      if (!isNaN(date.getTime())) {
        const dayName = date.toLocaleString("en-US", { weekday: "long" }).toLowerCase();
        const filtered = all.filter((item) => item.airingDay === dayName);
        return Response.json({ data: { scheduledAnimes: filtered } });
      }
    }

    return Response.json({ data: { scheduledAnimes: all } });
  } catch (err) {
    console.error(err);
    return Response.json({ error: "something went wrong" }, { status: 500 });
  }
}
