import { getCached, setCache } from "./cache";

const PUBLIC_API = "https://piratexplay.cc/api";
const INTERNAL_API = "https://api-js.piratexplay.cc";
const TMDB_IMG = "https://image.tmdb.org/t/p";
const CACHE_TIME = 3600;

async function fetchJson(url: string): Promise<any> {
  const cached = await getCached(url, CACHE_TIME);
  if (cached) return cached;
  const res = await fetch(url, {
    headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36" },
    signal: AbortSignal.timeout(15000),
  });
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  const data = await res.json();
  if (data.status === "error") throw new Error(data.message || "API error");
  await setCache(url, data);
  return data;
}

function tmdbPoster(path: string, size = "w342"): string {
  return path ? `${TMDB_IMG}/${size}${path}` : "";
}

function tmdbBackdrop(path: string): string {
  return path ? `${TMDB_IMG}/original${path}` : "";
}

function extractTitleFromSlug(slug: string): string {
  return slug.replace(/-season-\d+-\d+$/, "");
}

async function fetchPosterForSlug(slug: string): Promise<string> {
  try {
    const data = await fetchJson(`${PUBLIC_API}/episodes.php?id=${encodeURIComponent(slug)}`);
    return tmdbPoster(data?.data?.tmdb?.poster);
  } catch {
    return "";
  }
}

async function batchFetchPosters(slugs: string[]): Promise<Map<string, string>> {
  const map = new Map<string, string>();
  for (let i = 0; i < slugs.length; i += 3) {
    const batch = slugs.slice(i, i + 3);
    const results = await Promise.all(
      batch.map(async (slug) => ({ slug, poster: await fetchPosterForSlug(slug) }))
    );
    for (const r of results) map.set(r.slug, r.poster);
  }
  return map;
}

function sortByPopularity(items: any[]): any[] {
  return [...items].sort((a, b) => (b.popularity || 0) - (a.popularity || 0));
}

function sortByRating(items: any[]): any[] {
  return [...items].sort((a, b) => (b.rating || 0) - (a.rating || 0));
}

function mapSeriesItem(item: any, rank: number) {
  const seasonNum = parseInt(item.tmdb?.season) || 1;
  return {
    id: item.tmdb?.url || item._id || "",
    name: item.tmdb?.title || "Unknown",
    jname: item.tmdb?.org_language === "ja" ? "" : "",
    poster: tmdbPoster(item.tmdb?.poster),
    banner: tmdbBackdrop(item.tmdb?.backdrop),
    episodes: {
      sub: item.tmdb?.sub ? parseInt(item.tmdb.sub) : null,
      dub: item.tmdb?.dub ? parseInt(item.tmdb.dub) : null,
    },
    type: item.tmdb?.type === "movie" ? "Movie" as const : "TV" as const,
    rank,
    season: seasonNum,
    rating: item.tmdb?.rating || 0,
    popularity: item.tmdb?.popularity || 0,
    status: item.tmdb?.status || "",
    genre: Array.isArray(item.tmdb?.genre) ? item.tmdb.genre : [],
  };
}

export const piratexplay = {
  async getHomePage() {
    try {
      const [page1, page2, page3] = await Promise.all([
        fetchJson(`${INTERNAL_API}/home?page=1&per_page=50`),
        fetchJson(`${INTERNAL_API}/home?page=2&per_page=50`).catch(() => ({ series: [] })),
        fetchJson(`${INTERNAL_API}/home?page=3&per_page=50`).catch(() => ({ series: [] })),
      ]);
      const allSeries = [...(page1?.series || []), ...(page2?.series || []), ...(page3?.series || [])];

      const mapped = allSeries.map((r: any, i: number) => mapSeriesItem(r, i + 1));
      const byRating = sortByRating(mapped);
      const byPopularity = sortByPopularity(mapped);
      const airing = mapped.filter((a: any) => a.status === "returning series");
      const ended = mapped.filter((a: any) => a.status === "ended");
      const movies = mapped.filter((a: any) => a.type === "Movie");
      const tv = mapped.filter((a: any) => a.type === "TV");

      const spotlightAnimes = byRating.slice(0, 7).map((a: any) => ({
        ...a,
        description: "",
        otherInfo: a.genre.slice(0, 3),
      }));

      return {
        spotlightAnimes,
        trendingAnimes: byPopularity.slice(0, 20),
        latestEpisodeAnimes: mapped.slice(0, 30),
        topUpcomingAnimes: airing.slice(0, 15),
        top10Animes: {
          today: mapped.slice(0, 10),
          week: byRating.slice(0, 10),
          month: byPopularity.slice(0, 10),
        },
        topAiringAnimes: airing.slice(0, 20),
        mostPopularAnimes: byPopularity.slice(0, 20),
        mostFavoriteAnimes: byRating.slice(0, 20),
        latestCompletedAnimes: ended.slice(0, 20),
        genres: [],
        movies: movies.slice(0, 15),
        recentlyAdded: mapped.slice(-15).reverse(),
      };
    } catch (error) {
      console.error("Error fetching home page:", error);
      return {
        spotlightAnimes: [], trendingAnimes: [], latestEpisodeAnimes: [],
        topUpcomingAnimes: [], top10Animes: { today: [], week: [], month: [] },
        topAiringAnimes: [], mostPopularAnimes: [], mostFavoriteAnimes: [],
        latestCompletedAnimes: [], genres: [], movies: [], recentlyAdded: [],
      };
    }
  },

  async getInfo(id: string) {
    try {
      const data = await fetchJson(`${PUBLIC_API}/episodes.php?id=${encodeURIComponent(id)}`);
      const tmdb = data?.data?.tmdb;
      const episodes = data?.data?.episodes || [];
      if (!tmdb || !tmdb.title) throw new Error("Anime not found");

      const genres = Array.isArray(tmdb.genre) ? tmdb.genre : [];
      const totalEpisodes = parseInt(tmdb.total_episodes) || episodes.length || 0;
      const rating = tmdb.rating ? String(tmdb.rating) : "";

      let seasonList: { id: string; name: string; title: string; poster: string; isCurrent: boolean }[] = [];
      let relatedAnimes: { id: string; name: string; jname: string; poster: string; episodes: { sub: number | null; dub: number | null }; type: string }[] = [];
      let recommendedAnimes: { id: string; name: string; jname: string; poster: string; duration: string; type: string; rating?: string; episodes: { sub: number | null; dub: number | null } }[] = [];

      if (tmdb.type !== "movie") {
        seasonList = [{
          id,
          name: `Season ${tmdb.season || 1}`,
          title: `Season ${tmdb.season || 1}`,
          poster: tmdbPoster(tmdb.poster),
          isCurrent: true,
        }];
        try {
          const baseMatch = id.match(/^(.+)-season-\d+-\d+$/);
          const baseTitle = baseMatch ? baseMatch[1] : id;
          const tmdbId = id.match(/-(\d+)$/)?.[1];

          if (baseMatch && tmdbId) {
            const discovered: typeof seasonList = [];
            const isOnePiece = tmdbId === "37854";
            const maxProbe = isOnePiece ? 22 : 20;
            const slugs = Array.from({ length: maxProbe }, (_, i) =>
              `${baseTitle}-season-${i + 1}-${tmdbId}`
            );
            const results = await Promise.all(
              slugs.map(async (slug) => {
                try {
                  const sData = await fetchJson(`${PUBLIC_API}/episodes.php?id=${encodeURIComponent(slug)}`);
                  if (!sData?.data?.tmdb) return null;
                  return {
                    id: slug,
                    name: `Season ${slug.match(/-season-(\d+)-/)?.[1] || "?"}`,
                    title: sData.data.tmdb.title || `Season ${slug.match(/-season-(\d+)-/)?.[1] || "?"}`,
                    poster: tmdbPoster(sData.data.tmdb.poster),
                    isCurrent: slug === id,
                  };
                } catch {
                  return null;
                }
              })
            );
            for (const res of results) {
              if (res) discovered.push(res);
            }
            if (isOnePiece) {
              for (let s = 1; s <= 22; s++) {
                const slug = `${baseTitle}-season-${s}-${tmdbId}`;
                if (!discovered.find((d) => d.id === slug)) {
                  discovered.push({
                    id: slug,
                    name: `Season ${s}`,
                    title: `Season ${s}`,
                    poster: "",
                    isCurrent: slug === id,
                  });
                }
              }
            }
            if (discovered.length > 1) seasonList = discovered;
          }
        } catch {
          // fallback to single season
        }
      }

      return {
        anime: {
          info: {
            id,
            anilistId: 0,
            malId: tmdb.tmdb_id || 0,
            name: tmdb.title || "Unknown",
            poster: tmdbPoster(tmdb.poster, "w500"),
            banner: tmdbBackdrop(tmdb.backdrop),
            description: tmdb.overview || "",
            stats: {
              rating,
              quality: "HD",
              episodes: { sub: totalEpisodes, dub: 0 },
              type: tmdb.type === "movie" ? "Movie" : "TV",
              duration: tmdb.episode_runtime ? `${tmdb.episode_runtime} min` : "",
            },
            promotionalVideos: (tmdb.trailers || []).map((t: any) => ({
              title: t.name || "",
              source: t.url || "",
              thumbnail: "",
            })),
            charactersVoiceActors: [],
          },
          moreInfo: {
            japanese: tmdb.org_language || "",
            synonyms: "",
            aired: String(tmdb.release_year || ""),
            premiered: String(tmdb.release_year || ""),
            duration: tmdb.episode_runtime ? `${tmdb.episode_runtime} min` : "",
            status: tmdb.status || "Unknown",
            malscore: rating,
            genres,
            studios: "",
            producers: [],
          },
        },
        seasons: seasonList,
        mostPopularAnimes: [],
        relatedAnimes,
        recommendedAnimes,
      };
    } catch (error) {
      console.error("Error fetching anime info:", error);
      throw error;
    }
  },

  async search(query: string, page: number = 1) {
    try {
      const data = await fetchJson(`${PUBLIC_API}/search.php/?keyword=${encodeURIComponent(query)}&page=1`);
      const totalPages = data?.total_pages || 1;
      let items = data?.data || [];

      if (totalPages > 1) {
        const remainingPages = [];
        for (let p = 2; p <= totalPages; p++) {
          remainingPages.push(
            fetchJson(`${PUBLIC_API}/search.php/?keyword=${encodeURIComponent(query)}&page=${p}`)
              .then((r) => r?.data || [])
              .catch(() => [])
          );
        }
        const extraItems = await Promise.all(remainingPages);
        for (const extra of extraItems) {
          items = items.concat(extra);
        }
      }

      const animes = items.map((item: any) => ({
        id: item.tmdb?.url || "",
        name: item.tmdb?.title || "Unknown",
        jname: "",
        poster: "",
        episodes: { sub: null, dub: null },
        type: item.tmdb?.type === "movie" ? "Movie" as const : "TV" as const,
        rank: null as number | null,
      }));

      const slugs = animes.map((a: any) => a.id).filter(Boolean);
      if (slugs.length > 0) {
        const posterMap = await batchFetchPosters(slugs);
        for (const a of animes) {
          if (posterMap.has(a.id)) a.poster = posterMap.get(a.id) || "";
        }
      }

      return {
        animes,
        totalPages: 1,
        currentPage: 1,
        hasNextPage: false,
        hasPrevPage: false,
      };
    } catch (error) {
      console.error("Error searching anime:", error);
      return { animes: [], totalPages: 1, currentPage: 1, hasNextPage: false, hasPrevPage: false };
    }
  },

  async getEpisodes(id: string) {
    try {
      const baseMatch = id.match(/^(.+)-season-\d+-\d+$/);
      const tmdbId = id.match(/-(\d+)$/)?.[1];

      if (!baseMatch || !tmdbId) {
        const data = await fetchJson(`${PUBLIC_API}/episodes.php?id=${encodeURIComponent(id)}`);
        const episodes = data?.data?.episodes || [];
        return {
          totalEpisodes: parseInt(data?.data?.tmdb?.total_episodes) || episodes.length,
          episodes: episodes.map((ep: any) => ({
            number: parseInt(ep.episode),
            episodeId: `${id}-${ep.season}x${ep.episode}`,
            title: `Episode ${ep.episode}`,
            isFiller: false,
            season: parseInt(ep.season) || 1,
            image: ep.image || "",
          })),
        };
      }

      const baseTitle = baseMatch[1];
      const s1Slug = `${baseTitle}-season-1-${tmdbId}`;
      const s1Data = await fetchJson(`${PUBLIC_API}/episodes.php?id=${encodeURIComponent(s1Slug)}`);
      const grandTotal = parseInt(s1Data?.data?.tmdb?.total_episodes) || 0;
      if (!grandTotal) {
        const fallback = s1Data?.data?.episodes || [];
        return {
          totalEpisodes: fallback.length,
          episodes: fallback.map((ep: any) => ({
            number: parseInt(ep.episode),
            episodeId: `${s1Slug}-${ep.season}x${ep.episode}`,
            title: `Episode ${ep.episode}`,
            isFiller: false,
            season: parseInt(ep.season) || 1,
            image: ep.image || "",
          })),
        };
      }

      const foundMap = new Map<number, { number: number; episodeId: string; title: string; isFiller: boolean; season: number; image: string }>();
      const isOnePiece = tmdbId === "37854";
      const maxProbe = isOnePiece ? 22 : 20;
      const seasonSlugs = Array.from({ length: maxProbe }, (_, i) =>
        `${baseTitle}-season-${i + 1}-${tmdbId}`
      );
      const seasonResults = await Promise.all(
        seasonSlugs.map(async (slug, idx) => {
          try {
            const data = await fetchJson(`${PUBLIC_API}/episodes.php?id=${encodeURIComponent(slug)}`);
            if (!data?.data?.episodes || data.data.episodes.length === 0) return null;
            return { season: idx + 1, slug, episodes: data.data.episodes as any[] };
          } catch {
            return null;
          }
        })
      );
      for (const sr of seasonResults) {
        if (!sr) continue;
        for (const ep of sr.episodes) {
          const epNum = parseInt(ep.episode);
          foundMap.set(epNum, {
            number: epNum,
            episodeId: `${sr.slug}-${ep.season}x${epNum}`,
            title: `Episode ${epNum}`,
            isFiller: false,
            season: parseInt(ep.season) || sr.season,
            image: ep.image || "",
          });
        }
      }

      if (isOnePiece) {
        const OP_S22_EPISODES: [number, number][] = [[1089, 1138]];
        for (let s = 1; s <= 22; s++) {
          const slug = `${baseTitle}-season-${s}-${tmdbId}`;
          for (const [epStart, epEnd] of OP_S22_EPISODES) {
            for (let ep = epStart; ep <= epEnd; ep++) {
              if (!foundMap.has(ep)) {
                foundMap.set(ep, {
                  number: ep,
                  episodeId: `${slug}-${s}x${ep}`,
                  title: `Episode ${ep}`,
                  isFiller: false,
                  season: s,
                  image: "",
                });
              }
            }
          }
        }
      }

      const tailSeason = 1;
      const allEpisodes: { number: number; episodeId: string; title: string; isFiller: boolean; season?: number; image: string }[] = [];
      for (let i = 1; i <= grandTotal; i++) {
        if (foundMap.has(i)) {
          allEpisodes.push(foundMap.get(i)!);
        } else {
          const tailSlug = `${baseTitle}-season-${tailSeason}-${tmdbId}`;
          allEpisodes.push({
            number: i,
            episodeId: `${tailSlug}-${tailSeason}x${i}`,
            title: `Episode ${i}`,
            isFiller: false,
            season: tailSeason,
            image: "",
          });
        }
      }

      return {
        totalEpisodes: grandTotal,
        episodes: allEpisodes,
      };
    } catch (error) {
      console.error("Error fetching episodes:", error);
      return { totalEpisodes: 0, episodes: [] };
    }
  },

  async getEpisodeServers(episodeId: string) {
    try {
      const data = await fetchJson(`${PUBLIC_API}/sources.php?id=${encodeURIComponent(episodeId)}`);
      const sources = data?.sources || [];

      if (sources.length === 0) {
        return {
          episodeId,
          episodeNo: String(data?.episode || 1),
          sub: [],
          dub: [],
          raw: [],
          unavailable: true,
        };
      }

      const sub: { serverId: number; serverName: string }[] = sources.map((s: any, i: number) => ({
        serverId: i + 1,
        serverName: s.label || s.server_name || `Server ${i + 1}`,
      }));

      const vidIdx = sub.findIndex((s) =>
        s.serverName.toLowerCase().includes("vidmoly"),
      );
      if (vidIdx > 0) {
        const [vid] = sub.splice(vidIdx, 1);
        sub.unshift(vid);
      }

      return {
        episodeId,
        episodeNo: String(data?.episode || 1),
        sub,
        dub: [],
        raw: [],
      };
    } catch {
      return {
        episodeId,
        episodeNo: "1",
        sub: [{ serverId: 1, serverName: "Default" }],
        dub: [],
        raw: [],
      };
    }
  },

  async getEpisodeSources(episodeId: string, serverId?: number) {
    try {
      const data = await fetchJson(`${PUBLIC_API}/sources.php?id=${encodeURIComponent(episodeId)}`);
      const sources = data?.sources || [];
      const downloads = data?.downloads || [];

      const idx = typeof serverId === 'number' && serverId > 0 && serverId <= sources.length ? serverId - 1 : 0;
      const selected = sources[idx] || sources[0];

      return {
        headers: { Referer: "https://piratexplay.cc" },
        subtitles: [],
        intro: { start: 0, end: 0 },
        outro: { start: 0, end: 0 },
        sources: [{ url: selected?.url || "", type: "iframe" }],
        anilistID: 0,
        malID: data?.tmdb?.tmdb_id || 0,
      };
    } catch {
      return {
        headers: { Referer: "" },
        subtitles: [],
        intro: { start: 0, end: 0 },
        outro: { start: 0, end: 0 },
        sources: [{ url: "", type: "hls" }],
        anilistID: 0,
        malID: 0,
      };
    }
  },

  async searchSuggestions(query: string) {
    try {
      const data = await fetchJson(`${PUBLIC_API}/search.php/?keyword=${encodeURIComponent(query)}&page=1`);
      const items = data?.data || [];
      const suggestions = items.slice(0, 8).map((item: any) => ({
        id: item.tmdb?.url || "",
        name: item.tmdb?.title || "Unknown",
        jname: "",
        poster: "",
        type: item.tmdb?.type === "movie" ? "Movie" : "TV",
        rank: null,
        episodes: { sub: null, dub: null },
        moreInfo: [],
      }));
      const slugs = suggestions.map((a: any) => a.id).filter(Boolean);
      if (slugs.length > 0) {
        const posterMap = await batchFetchPosters(slugs);
        for (const a of suggestions) {
          if (posterMap.has(a.id)) a.poster = posterMap.get(a.id) || "";
        }
      }
      return suggestions;
    } catch {
      return [];
    }
  },

  async getEstimatedSchedule() {
    return [];
  },
};

export { piratexplay as aniverse };
