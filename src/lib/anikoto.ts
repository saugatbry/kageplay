import { getCached, setCache } from "./cache";

const BASE = "https://anikotoapi-ruby.vercel.app/api";
const CACHE_TIME = 3600;

function extractAnimeSlug(fullSlug: string): string {
  return fullSlug.split("/ep-")[0];
}

function buildEpisodeId(slug: string, epNumber: number): string {
  return `${slug}__ep${epNumber}`;
}

function parseEpisodeId(episodeId: string): { slug: string; epNumber: number } | null {
  const match = /^(.+)__ep(\d+)$/.exec(episodeId);
  if (match) return { slug: match[1], epNumber: parseInt(match[2], 10) };
  return null;
}

function mapAnimeItem(item: any, rank?: number) {
  const slug = extractAnimeSlug(item.slug);
  return {
    id: slug,
    name: item.title || "Unknown",
    jname: item.japaneseTitle || "",
    poster: item.poster || "",
    episodes: {
      sub: item.sub != null ? Number(item.sub) : null,
      dub: item.dub != null ? Number(item.dub) : null,
    },
    type: item.type || "TV",
    rank: rank ?? null,
    rating: item.rating ? parseFloat(item.rating) || null : null,
  };
}

async function fetchApi<T = any>(path: string): Promise<T> {
  const url = `${BASE}${path}`;
  const cached = await getCached(url, CACHE_TIME);
  if (cached) return cached as T;

  const res = await fetch(url, {
    headers: { "User-Agent": "Mozilla/5.0" },
    signal: AbortSignal.timeout(15000),
  });
  if (!res.ok) throw new Error(`AniKoto API error: ${res.status} for ${path}`);
  const json = await res.json();
  if (!json.success) throw new Error(json.error || "AniKoto API error");
  const data = json.results as T;
  await setCache(url, data);
  return data;
}

export const anikoto = {
  async getHomePage() {
    try {
      const home = await fetchApi<any>("/");
      const spotlights = (home.spotlights || []).slice(0, 8).map((s: any, i: number) => {
        const slug = extractAnimeSlug(s.slug);
        const startDate = s.date ? s.date.split(" to ")[0]?.trim() || "" : "";
        const year = startDate ? parseInt(startDate.split(",")[1]?.trim() || "0", 10) || null : null;
        return {
          id: slug,
          name: s.title || "Unknown",
          jname: s.japaneseTitle || "",
          poster: s.poster || "",
          banner: "",
          description: s.description || "No description available",
          otherInfo: [],
          episodes: { sub: s.sub != null ? Number(s.sub) : null, dub: s.dub != null ? Number(s.dub) : null },
          type: "TV",
          rank: i + 1,
          duration: "24m",
          rating: s.rating ? (parseFloat(s.rating) || null) : null,
          genres: [],
          studios: [],
          status: "",
          year,
          season: "",
        };
      });

      const trendingList = (home.trending || []).slice(0, 25).map(mapAnimeItem);
      const topAiringList = (home.topAiring || []).slice(0, 25).map(mapAnimeItem);
      const genres = home.genres || [];
      const allAnime = [...trendingList, ...topAiringList.filter((a: any) => !trendingList.some((t: any) => t.id === a.id))];

      return {
        spotlightAnimes: spotlights,
        trendingAnimes: topAiringList.slice(0, 15),
        latestEpisodeAnimes: allAnime.slice(0, 20),
        topUpcomingAnimes: [],
        top10Animes: {
          today: allAnime.slice(0, 10),
          week: trendingList.slice(0, 10),
          month: [...topAiringList].sort((a: any, b: any) => (b.rating || 0) - (a.rating || 0)).slice(0, 10),
        },
        topAiringAnimes: topAiringList.slice(0, 15),
        mostPopularAnimes: trendingList.slice(0, 15),
        mostFavoriteAnimes: [...allAnime].sort((a: any, b: any) => (b.rating || 0) - (a.rating || 0)).slice(0, 15),
        latestCompletedAnimes: [],
        genres,
      };
    } catch (error) {
      console.error("Error fetching AniKoto home page:", error);
      return {
        spotlightAnimes: [], trendingAnimes: [], latestEpisodeAnimes: [],
        topUpcomingAnimes: [], top10Animes: { today: [], week: [], month: [] },
        topAiringAnimes: [], mostPopularAnimes: [], mostFavoriteAnimes: [],
        latestCompletedAnimes: [], genres: [],
      };
    }
  },

  async getInfo(id: string) {
    try {
      const info = await fetchApi<any>(`/info?id=${encodeURIComponent(id)}`);
      if (!info || (!info.title && !info.slug)) throw new Error("Anime not found");

      const slug = info.slug || id;
      const statsRating = info.malScore ? parseFloat(info.malScore) || 0 : 0;
      const totalEps = parseInt(info.episodes) || 0;

      return {
        anime: {
          info: {
            id: slug,
            anilistId: info.animeId ? Number(info.animeId) : 0,
            malId: info.animeId ? Number(info.animeId) : 0,
            name: info.title || "Unknown",
            poster: info.poster || "",
            banner: info.backgroundImage || "",
            description: info.synopsis || "",
            stats: {
              rating: String(statsRating),
              quality: "HD",
              episodes: { sub: totalEps, dub: 0 },
              type: info.type || "TV",
              duration: info.duration || "",
            },
            promotionalVideos: [],
            charactersVoiceActors: [],
          },
          moreInfo: {
            japanese: info.japaneseTitle || "",
            synonyms: info.altNames || info.title || "",
            aired: info.aired || "",
            premiered: info.premiered || "",
            duration: info.duration || "",
            status: info.status || "Unknown",
            malscore: info.malScore || String(statsRating),
            genres: Array.isArray(info.genres) ? info.genres : [],
            studios: Array.isArray(info.studios) ? info.studios.join(", ") : "",
            producers: Array.isArray(info.producers) ? info.producers : [],
          },
        },
        seasons: [],
        mostPopularAnimes: [],
        relatedAnimes: [],
        recommendedAnimes: [],
      };
    } catch (error) {
      console.error("Error fetching AniKoto info:", error);
      throw error;
    }
  },

  async search(query: string, page: number = 1, _filters?: Record<string, any>) {
    try {
      const results = await fetchApi<any>(`/search?keyword=${encodeURIComponent(query)}&page=${page}`);
      const items = results?.data || [];
      const animes = items.map((item: any) => ({
        id: extractAnimeSlug(item.slug),
        name: item.title || "Unknown",
        jname: item.japaneseTitle || "",
        poster: item.poster || "",
        episodes: { sub: item.sub != null ? Number(item.sub) : null, dub: item.dub != null ? Number(item.dub) : null },
        type: item.type || "TV",
        rank: item.rating ? (parseFloat(item.rating) || null) : null,
      }));
      return {
        animes,
        totalPages: results?.totalPages || 1,
        currentPage: page,
        hasNextPage: page < (results?.totalPages || 1),
        hasPrevPage: page > 1,
      };
    } catch {
      return { animes: [], totalPages: 1, currentPage: 1, hasNextPage: false, hasPrevPage: false };
    }
  },

  async getEpisodes(id: string) {
    try {
      const slug = extractAnimeSlug(id);
      const results = await fetchApi<any>(`/episodes/${encodeURIComponent(slug)}`);
      const totalEp = results?.totalEpisodes || 0;
      const episodes = (results?.episodes || []).map((ep: any) => ({
        number: ep.episode_no || 0,
        episodeId: buildEpisodeId(slug, ep.episode_no || 0),
        title: ep.title || `Episode ${ep.episode_no || 0}`,
        isFiller: false,
        season: 1,
      }));
      return { totalEpisodes: totalEp, episodes };
    } catch (error) {
      console.error("Error fetching AniKoto episodes:", error);
      return { totalEpisodes: 0, episodes: [] };
    }
  },

  async getEpisodeServers(episodeId: string) {
    try {
      const parsed = parseEpisodeId(episodeId);
      if (!parsed) {
        return { episodeId, episodeNo: "1", sub: [], dub: [], raw: [] };
      }

      const epData = await fetchApi<any>(`/episodes/${encodeURIComponent(parsed.slug)}`);
      const episode = (epData?.episodes || []).find(
        (e: any) => e.episode_no === parsed.epNumber,
      );
      if (!episode || !episode.server_ids) {
        return { episodeId, episodeNo: String(parsed.epNumber), sub: [], dub: [], raw: [] };
      }

      const servers = await fetchApi<any[]>(`/servers?ids=${encodeURIComponent(episode.server_ids)}`);
      const sub = servers
        .filter((s: any) => s.type === "sub" || s.type === "hsub")
        .map((s: any, i: number) => ({
          serverId: i + 1,
          serverName: s.name || `Server ${i + 1}`,
        }));
      const dub = servers
        .filter((s: any) => s.type === "dub")
        .map((s: any, i: number) => ({
          serverId: i + 1,
          serverName: s.name || `Server ${i + 1}`,
        }));

      return {
        episodeId,
        episodeNo: String(parsed.epNumber),
        sub,
        dub,
        raw: [],
      };
    } catch (error) {
      console.error("Error fetching AniKoto servers:", error);
      return { episodeId, episodeNo: "1", sub: [], dub: [], raw: [] };
    }
  },

  async getEpisodeSources(episodeId: string, serverId?: number, _category?: string) {
    try {
      const parsed = parseEpisodeId(episodeId);
      if (!parsed) {
        return {
          headers: { Referer: "" },
          subtitles: [], intro: { start: 0, end: 0 }, outro: { start: 0, end: 0 },
          sources: [{ url: "", type: "hls" }], anilistID: 0, malID: 0,
        };
      }

      const epData = await fetchApi<any>(`/episodes/${encodeURIComponent(parsed.slug)}`);
      const episode = (epData?.episodes || []).find(
        (e: any) => e.episode_no === parsed.epNumber,
      );
      if (!episode || !episode.server_ids) {
        return {
          headers: { Referer: "" },
          subtitles: [], intro: { start: 0, end: 0 }, outro: { start: 0, end: 0 },
          sources: [{ url: "", type: "hls" }], anilistID: 0, malID: 0,
        };
      }

      const servers = await fetchApi<any[]>(`/servers?ids=${encodeURIComponent(episode.server_ids)}`);

      const category = _category || "sub";
      const filtered = servers.filter(
        (s: any) => s.type === category || (category === "sub" && s.type === "hsub"),
      );

      const idx = typeof serverId === "number" && serverId > 0 && serverId <= filtered.length
        ? serverId - 1
        : 0;
      const selected = filtered[idx] || filtered[0];

      if (!selected || !selected.link_id) {
        return {
          headers: { Referer: "" },
          subtitles: [], intro: { start: 0, end: 0 }, outro: { start: 0, end: 0 },
          sources: [{ url: "", type: "hls" }], anilistID: 0, malID: 0,
        };
      }

      const stream = await fetchApi<any>(`/stream?id=${encodeURIComponent(selected.link_id)}`);
      const skipData = stream?.skipData;
      const intro = skipData?.intro
        ? { start: skipData.intro[0] || 0, end: skipData.intro[1] || 0 }
        : { start: 0, end: 0 };
      const outro = skipData?.outro
        ? { start: skipData.outro[0] || 0, end: skipData.outro[1] || 0 }
        : { start: 0, end: 0 };

      return {
        headers: { Referer: "https://anikotoapi-ruby.vercel.app" },
        subtitles: [],
        intro,
        outro,
        sources: [{ url: stream?.url || "", type: "hls" }],
        anilistID: episode.mal_id ? Number(episode.mal_id) : 0,
        malID: episode.mal_id ? Number(episode.mal_id) : 0,
      };
    } catch (error) {
      console.error("Error fetching AniKoto sources:", error);
      return {
        headers: { Referer: "" },
        subtitles: [], intro: { start: 0, end: 0 }, outro: { start: 0, end: 0 },
        sources: [{ url: "", type: "hls" }], anilistID: 0, malID: 0,
      };
    }
  },

  async searchSuggestions(query: string) {
    try {
      const results = await fetchApi<any[]>(`/search/suggest?keyword=${encodeURIComponent(query)}`);
      return (results || []).slice(0, 8).map((item: any) => ({
        id: extractAnimeSlug(item.slug),
        name: item.title || "Unknown",
        jname: item.japaneseTitle || "",
        poster: item.poster || "",
        type: item.type || "TV",
        rank: null,
        episodes: { sub: null, dub: null },
        moreInfo: [],
      }));
    } catch {
      return [];
    }
  },

  async getEstimatedSchedule(date?: string) {
    try {
      if (!date) {
        const d = new Date();
        const month = String(d.getMonth() + 1).padStart(2, "0");
        const day = String(d.getDate()).padStart(2, "0");
        const year = d.getFullYear();
        date = `${month}/${day}/${year}`;
      } else {
        const d = new Date(date);
        const month = String(d.getMonth() + 1).padStart(2, "0");
        const day = String(d.getDate()).padStart(2, "0");
        const year = d.getFullYear();
        date = `${month}/${day}/${year}`;
      }

      const results = await fetchApi<any[]>(`/schedule?date=${encodeURIComponent(date)}`);
      return (results || []).map((item: any) => ({
        id: item.slug || item.animeId || "",
        name: item.title || "Unknown",
        jname: item.japaneseTitle || "",
        time: item.time || "",
        airingTimestamp: item.airingTimestamp || 0,
        secondsUntilAiring: item.secondsUntilAiring || 0,
        episode: item.episode || 0,
      }));
    } catch {
      return [];
    }
  },
};
