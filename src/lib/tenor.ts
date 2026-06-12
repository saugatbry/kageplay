const TENOR_KEY = "LIVDSRZULELA";
const CATEGORIES = ["anime", "anime girl", "anime boy", "cute anime", "cool anime", "anime aesthetic"];

export async function fetchAnimeGifs(count = 30): Promise<string[]> {
  const perCategory = Math.max(1, Math.ceil(count / CATEGORIES.length));
  const results = await Promise.allSettled(
    CATEGORIES.map((q) =>
      fetch(
        `https://g.tenor.com/v1/search?q=${encodeURIComponent(q)}&key=${TENOR_KEY}&limit=${perCategory}`,
      ).then((r) => r.json()),
    ),
  );
  const urls: string[] = [];
  for (const res of results) {
    if (res.status === "fulfilled") {
      const items: string[] = (res.value?.results || [])
        .map((g: any) => g.media[0]?.gif?.url || g.media[0]?.tinygif?.url)
        .filter(Boolean);
      urls.push(...items);
    }
  }
  for (let i = urls.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [urls[i], urls[j]] = [urls[j], urls[i]];
  }
  return urls.slice(0, count);
}
