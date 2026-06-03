const API_BASE = "https://kageread-api.vercel.app/api";

export interface MangaSearchResult {
  slug: string;
  title: string;
  poster: string;
  latest_chapter: string;
  type: string;
  time: string;
}

export async function searchManga(q: string): Promise<MangaSearchResult[]> {
  if (!q.trim()) return [];
  const res = await fetch(`${API_BASE}/manga/search?q=${encodeURIComponent(q)}`, {
    headers: { "User-Agent": "Mozilla/5.0" },
    signal: AbortSignal.timeout(15000),
  });
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  const data = await res.json();
  return data?.results || [];
}

export interface MangaChapter {
  id: string;
  number: string;
  title: string;
  url: string;
}

export interface MangaChapterList {
  mangaName: string;
  chapters: MangaChapter[];
}

export async function getMangaChapters(name: string, start = 1, end = 1000): Promise<MangaChapterList> {
  const res = await fetch(`${API_BASE}/manga/chapters?name=${encodeURIComponent(name)}&start=${start}&end=${end}`, {
    headers: { "User-Agent": "Mozilla/5.0" },
    signal: AbortSignal.timeout(15000),
  });
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  const data = await res.json();
  return {
    mangaName: data?.mangaName || name,
    chapters: (data?.chapters || []).map((ch: any) => ({
      id: ch.id || ch.url?.split("/").pop() || "",
      number: ch.number || "",
      title: ch.title || `Chapter ${ch.number}`,
      url: ch.url || "",
    })),
  };
}

export interface ChapterImage {
  page: number;
  url: string;
}

export async function getChapterImages(url: string): Promise<ChapterImage[]> {
  const res = await fetch(`${API_BASE}/manga/images?url=${encodeURIComponent(url)}`, {
    headers: { "User-Agent": "Mozilla/5.0" },
    signal: AbortSignal.timeout(20000),
  });
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  const data = await res.json();
  const images = data?.images || data?.data || [];
  return images.map((img: any, i: number) => ({
    page: i + 1,
    url: typeof img === "string" ? img : (img.url || img.src || ""),
  }));
}
