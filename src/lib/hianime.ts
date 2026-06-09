import { aniverse } from "./aniverse";
import { getJikanInfo } from "./jikan";
import { getPreSeededEpisodeCount } from "@/data/episode-counts";
import { getAnilistEpisodeCount, getAnilistAiringSchedule } from "./anilist";
import { getCached, setCache } from "./cache";

const JIKAN_API = "https://api.jikan.moe/v4";
const MEGAPLAY_BASE = "https://megaplay.buzz";
const isMAL = (id: string) => /^\d+$/.test(id);
const isMALEpsiode = (id: string) => /^\d+-\d+$/.test(id);
const CACHE_TIME = 3600;

function parseMALEpisode(episodeId: string): { malId: string; ep: string } | null {
  const match = /^(\d+)-(\d+)$/.exec(episodeId);
  return match ? { malId: match[1], ep: match[2] } : null;
}

let lastRequestTime = 0;
let requestCount = 0;
let windowStart = Date.now();

async function doFetch(url: string): Promise<Response> {
  const headers = { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36" };
  return fetch(url, { headers, signal: AbortSignal.timeout(15000) });
}

async function rateLimitedFetch(url: string, retries = 3): Promise<any> {
  for (let attempt = 0; attempt <= retries; attempt++) {
    const now = Date.now();
    if (now - windowStart > 1000) { requestCount = 0; windowStart = now; }
    if (requestCount >= 3) {
      await new Promise((r) => setTimeout(r, 1000 - (now - windowStart)));
      requestCount = 0; windowStart = Date.now();
    }
    const timeSinceLastRequest = now - lastRequestTime;
    if (timeSinceLastRequest < 450) await new Promise((r) => setTimeout(r, 450 - timeSinceLastRequest));
    lastRequestTime = Date.now(); requestCount++;
    try {
      const response = await doFetch(url);
      if (response.status === 429) {
        const retryAfter = parseInt(response.headers.get("Retry-After") || "2", 10);
        await new Promise((r) => setTimeout(r, Math.min(retryAfter * 1000, 5000)));
        continue;
      }
      if (!response.ok) throw new Error(`API error: ${response.status}`);
      return await response.json();
    } catch (error: any) {
      if (attempt < retries) continue;
      throw error;
    }
  }
}

async function fetchWithCache(url: string): Promise<any> {
  const cached = await getCached(url, CACHE_TIME);
  if (cached) return cached;
  const data = await rateLimitedFetch(url);
  if (!data || !data.data) throw new Error("Empty API response");
  await setCache(url, data);
  return data;
}

interface JikanAnime {
  mal_id: number;
  title: string;
  title_english?: string;
  title_japanese?: string;
  images: { jpg: { image_url: string; large_image_url?: string; small_image_url?: string } };
  trailer?: { images?: { maximum_image_url?: string } };
  synopsis?: string;
  type?: string;
  episodes?: number;
  score?: number;
  rank?: number;
  genres?: Array<{ mal_id: number; type: string; name: string }>;
  studios?: Array<{ mal_id: number; type: string; name: string }>;
  producers?: Array<{ mal_id: number; name: string }>;
  status?: string;
  year?: number;
  season?: string;
  duration?: string;
  aired?: { string?: string };
}

interface CommonAnime {
  id: string; name: string; jname: string; poster: string;
  episodes: { sub: number | null; dub: number | null };
  type: string; duration: string; rating: number | null; rank: number | null | undefined;
  description: string; genres: string[]; studios: string[];
  status: string; year: number | null | undefined; season: string | null | undefined;
}

function mapJikanAnimeToCommon(anime: JikanAnime, rank?: number): CommonAnime {
  return {
    id: String(anime.mal_id),
    name: anime.title_english || anime.title || "Unknown Title",
    jname: anime.title_japanese || anime.title || "Unknown",
    poster: anime.images.jpg.large_image_url || anime.images.jpg.image_url || "",
    episodes: { sub: anime.episodes || null, dub: null },
    type: anime.type || "TV",
    duration: "24m",
    rating: anime.score || null,
    rank: rank || anime.rank,
    description: anime.synopsis || "",
    genres: anime.genres?.map((g) => g.name) || [],
    studios: anime.studios?.map((s) => s.name) || [],
    status: anime.status || "Unknown",
    year: anime.year,
    season: anime.season,
  };
}

function buildInfoResponse(a: JikanAnime) {
  return {
    anime: {
      info: {
        id: String(a.mal_id),
        anilistId: 0,
        malId: a.mal_id,
        name: a.title_english || a.title || "Unknown",
        poster: a.images?.jpg?.large_image_url || a.images?.jpg?.image_url || "",
        description: a.synopsis || "",
        stats: {
          rating: String(a.score || ""),
          quality: "HD",
          episodes: { sub: a.episodes || 0, dub: 0 },
          type: a.type || "TV",
          duration: a.duration || "",
        },
        promotionalVideos: [],
        charactersVoiceActors: [],
      },
      moreInfo: {
        japanese: a.title_japanese || "",
        synonyms: a.title || "",
        aired: a.aired?.string || "",
        premiered: `${a.season || ""} ${a.year || ""}`.trim(),
        duration: a.duration || "",
        status: a.status || "",
        malscore: String(a.score || ""),
        genres: (a.genres || []).map((g: any) => g.name),
        studios: (a.studios || []).map((s: any) => s.name).join(", "),
        producers: (a.producers || []).map((p: any) => p.name),
      },
    },
    seasons: [],
    mostPopularAnimes: [],
    relatedAnimes: [],
    recommendedAnimes: [],
  };
}

export const hianime = {
  async getHomePage() {
    try {
      const fetchSafe = async (url: string) => {
        try { return await fetchWithCache(url); } catch { return { data: [] }; }
      };
      const [topAiring, topUpcoming, topPopular] = await Promise.all([
        fetchSafe(`${JIKAN_API}/top/anime?filter=airing&limit=25&page=1`),
        fetchSafe(`${JIKAN_API}/seasons/now?limit=25&page=1`),
        fetchSafe(`${JIKAN_API}/top/anime?filter=bypopularity&limit=25&page=1`),
      ]);
      const trendingData = topAiring.data || [];
      const upcomingData = topUpcoming.data || [];
      const popularData = topPopular.data || [];
      if (trendingData.length === 0 && upcomingData.length === 0) {
        return { spotlightAnimes: [], trendingAnimes: [], latestEpisodeAnimes: [], topUpcomingAnimes: [], top10Animes: { today: [], week: [], month: [] }, topAiringAnimes: [], mostPopularAnimes: [], mostFavoriteAnimes: [], latestCompletedAnimes: [], genres: [] };
      }
      const trendingList = trendingData.slice(0, 25).map((a: JikanAnime, i: number) => mapJikanAnimeToCommon(a, i + 1));
      const upcomingList = upcomingData.slice(0, 25).map((a: JikanAnime, i: number) => mapJikanAnimeToCommon(a, i + 1));
      const popularList = popularData.slice(0, 25).map((a: JikanAnime, i: number) => mapJikanAnimeToCommon(a, i + 1));
      const allAnime = [...trendingList, ...upcomingList.filter((a: CommonAnime) => !trendingList.some((t: CommonAnime) => t.id === a.id)), ...popularList.filter((a: CommonAnime) => !trendingList.some((t: CommonAnime) => t.id === a.id) && !upcomingList.some((u: CommonAnime) => u.id === a.id))];
      const animeList = allAnime.slice(0, 30);
      const spotlightAnimes = animeList.slice(0, 5).map((anime: CommonAnime, idx: number) => {
        const jikan = trendingData[idx] || {};
        return { ...anime, banner: jikan.trailer?.images?.maximum_image_url || "", description: jikan.synopsis || "No description available", otherInfo: jikan.genres?.map((g: any) => g.name) || [] };
      });
      const latestEpisodeAnimes = animeList.slice(0, 20);
      const trendingAnimes = animeList.slice(0, 15);
      const topUpcomingAnimes = upcomingList.slice(0, 10);
      const mostPopularAnimes = popularList.slice(0, 15);
      const mostFavoriteAnimes = animeList.sort((a: CommonAnime, b: CommonAnime) => (b.rating || 0) - (a.rating || 0)).slice(0, 15);
      const latestCompletedAnimes = animeList.slice(15, 30);
      const allGenres = new Set<string>();
      animeList.forEach((anime: CommonAnime) => { (anime.genres || []).forEach((g: string) => allGenres.add(g)); });
      return { spotlightAnimes, trendingAnimes, latestEpisodeAnimes, topUpcomingAnimes, top10Animes: { today: latestEpisodeAnimes.slice(0, 10), week: trendingAnimes.slice(0, 10), month: mostPopularAnimes.slice(0, 10) }, topAiringAnimes: trendingList.slice(0, 15), mostPopularAnimes, mostFavoriteAnimes, latestCompletedAnimes, genres: Array.from(allGenres) };
    } catch (error) {
      console.error("Error fetching home page:", error);
      return { spotlightAnimes: [], trendingAnimes: [], latestEpisodeAnimes: [], topUpcomingAnimes: [], top10Animes: { today: [], week: [], month: [] }, topAiringAnimes: [], mostPopularAnimes: [], mostFavoriteAnimes: [], latestCompletedAnimes: [], genres: [] };
    }
  },

  async getInfo(id: string) {
    if (isMAL(id)) {
      const a = await getJikanInfo(id);
      if (a) return buildInfoResponse(a);
      try {
        const searchResult = await aniverse.search(id, 1).catch(() => ({ animes: [] }));
        if (searchResult.animes?.length > 0) {
          const aniverseId = searchResult.animes[0].id;
          if (aniverseId) return await aniverse.getInfo(aniverseId);
        }
      } catch {}
      throw new Error("Anime not found");
    }
    try {
      const data = await aniverse.getInfo(id);
      if (data?.anime?.info?.name) return data;
    } catch {
      console.log(`[hianime] PirateXPlay getInfo failed for ${id}, trying Jikan fallback`);
    }
    const titleFromSlug = id.replace(/-season-\d+-\d+$/, "").replace(/-/g, " ");
    try {
      const searchRes = await rateLimitedFetch(`${JIKAN_API}/anime?q=${encodeURIComponent(titleFromSlug)}&limit=5&page=1`);
      const found = searchRes?.data?.[0];
      if (found) return buildInfoResponse(found);
    } catch {
      console.log(`[hianime] Jikan fallback search failed for "${titleFromSlug}"`);
    }
    throw new Error("Anime not found");
  },

  async search(query: string, page: number = 1, _filters?: Record<string, any>) {
    try {
      const result = await aniverse.search(query, page);
      if (result?.animes?.length) return result;
    } catch {
      console.log(`[hianime] PirateXPlay search failed, using Jikan`);
    }
    try {
      const res = await rateLimitedFetch(`${JIKAN_API}/anime?q=${encodeURIComponent(query)}&page=${page}&limit=20`);
      const items = (res?.data || []).map((item: any) => ({
        id: String(item.mal_id),
        name: item.title_english || item.title || "Unknown",
        jname: item.title_japanese || "",
        poster: item.images?.jpg?.large_image_url || item.images?.jpg?.image_url || "",
        episodes: { sub: item.episodes || null, dub: null },
        type: item.type || "TV",
        rank: item.rank || null,
      }));
      return { animes: items, totalPages: res?.pagination?.last_visible_page || 1, currentPage: page, hasNextPage: res?.pagination?.has_next_page || false, hasPrevPage: page > 1 };
    } catch {
      return { animes: [], totalPages: 1, currentPage: 1, hasNextPage: false, hasPrevPage: false };
    }
  },

  async getEpisodes(id: string) {
    if (isMAL(id)) {
      const EP_CACHE_KEY = `episodes:${id}`;
      const fromCache = await getCached(EP_CACHE_KEY, 86400);
      if (fromCache) return fromCache;

      let total = 0;

      const preSeeded = getPreSeededEpisodeCount(id);
      if (preSeeded !== null) {
        total = preSeeded;
      } else {
        const anilist = await getAnilistEpisodeCount(id);
        if (anilist.count !== null && anilist.count > 0) {
          total = anilist.count;
        } else {
          try {
            const a = await getJikanInfo(id);
            total = a?.episodes || 0;
          } catch {
            total = 0;
          }
        }
      }

      if (total === 0) return { totalEpisodes: 0, episodes: [] };

      const airing = await getAnilistAiringSchedule(id);
      const latestAired = airing.latestAiredEpisode;
      const nextAiring = airing.nextAiringEpisode;

      if (latestAired !== null) {
        total = Math.max(total, latestAired);
      }
      if (nextAiring) {
        total = Math.max(total, nextAiring.episode);
      }

      const episodes: any[] = [];
      for (let i = 1; i <= total; i++) {
        const ep: any = { number: i, episodeId: `${id}-${i}`, title: `Episode ${i}`, isFiller: false, season: 1 };
        if (nextAiring && i === nextAiring.episode) {
          ep.airingAt = nextAiring.airingAt;
        } else {
          const sched = airing.upcomingSchedule.find((s) => s.episode === i);
          if (sched) ep.airingAt = sched.airingAt;
        }
        episodes.push(ep);
      }

      const result = { totalEpisodes: total, episodes, ...(airing.latestAiredEpisode !== null ? { latestAiredEpisode: airing.latestAiredEpisode } : {}) };
      await setCache(EP_CACHE_KEY, result);
      return result;
    }
    return aniverse.getEpisodes(id);
  },

  async getEpisodeServers(episodeId: string) {
    if (isMALEpsiode(episodeId)) {
      const parsed = parseMALEpisode(episodeId);
      return {
        episodeId,
        episodeNo: parsed?.ep || "1",
        sub: [{ serverId: 1, serverName: "MegaPlay" }],
        dub: [{ serverId: 2, serverName: "MegaPlay" }],
        raw: [],
      };
    }
    return aniverse.getEpisodeServers(episodeId);
  },

  async getEpisodeSources(episodeId: string, serverId?: number, _category?: string) {
    if (isMALEpsiode(episodeId)) {
      const parsed = parseMALEpisode(episodeId);
      if (!parsed) {
        return {
          headers: { Referer: "" },
          subtitles: [], intro: { start: 0, end: 0 }, outro: { start: 0, end: 0 },
          sources: [{ url: "", type: "hls" }], anilistID: 0, malID: 0,
        };
      }
      const category = _category || "sub";
      const streamUrl = `${MEGAPLAY_BASE}/stream/mal/${parsed.malId}/${parsed.ep}/${category}`;
      return {
        headers: { Referer: MEGAPLAY_BASE },
        subtitles: [], intro: { start: 0, end: 0 }, outro: { start: 0, end: 0 },
        sources: [{ url: streamUrl, type: "hls" }],
        anilistID: 0, malID: parseInt(parsed.malId, 10),
      };
    }
    return aniverse.getEpisodeSources(episodeId, serverId);
  },

  async searchSuggestions(query: string) {
    return aniverse.searchSuggestions(query);
  },

  async getEstimatedSchedule(date?: string) {
    return aniverse.getEstimatedSchedule(date);
  },
};
