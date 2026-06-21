import { anikoto } from "./anikoto";
import { aniverse } from "./aniverse";

function isSlug(id: string): boolean {
  return !/^\d+$/.test(id);
}

export const hianime = {
  async getHomePage() {
    try {
      const data = await anikoto.getHomePage();
      if (data?.spotlightAnimes?.length) return data;
    } catch {
      console.log("[hianime] AniKoto home failed, trying hindi fallback");
    }
    return aniverse.getHomePage();
  },

  async getInfo(id: string) {
    if (isSlug(id)) {
      try {
        const data = await anikoto.getInfo(id);
        if (data?.anime?.info?.name) return data;
      } catch {
        console.log(`[hianime] AniKoto getInfo failed for ${id}, trying hindi fallback`);
      }
    }
    try {
      const searchResult = await aniverse.search(id, 1).catch(() => ({ animes: [] }));
      if (searchResult.animes?.length > 0) {
        const aniverseId = searchResult.animes[0].id;
        if (aniverseId) return await aniverse.getInfo(aniverseId);
      }
    } catch {}
    throw new Error("Anime not found");
  },

  async search(query: string, page: number = 1, _filters?: Record<string, any>) {
    try {
      const result = await anikoto.search(query, page);
      if (result?.animes?.length) return result;
    } catch {
      console.log(`[hianime] AniKoto search failed, using hindi fallback`);
    }
    try {
      return await aniverse.search(query, page);
    } catch {
      return { animes: [], totalPages: 1, currentPage: 1, hasNextPage: false, hasPrevPage: false };
    }
  },

  async getEpisodes(id: string) {
    try {
      const data = await anikoto.getEpisodes(id);
      if (data?.episodes?.length) return data;
    } catch {
      console.log(`[hianime] AniKoto episodes failed for ${id}, trying hindi fallback`);
    }
    try {
      return await aniverse.getEpisodes(id);
    } catch {
      return { totalEpisodes: 0, episodes: [] };
    }
  },

  async getEpisodeServers(episodeId: string) {
    try {
      const data = await anikoto.getEpisodeServers(episodeId);
      if (data?.sub?.length || data?.dub?.length) return data;
    } catch {
      console.log(`[hianime] AniKoto servers failed for ${episodeId}, trying hindi fallback`);
    }
    try {
      return await aniverse.getEpisodeServers(episodeId);
    } catch {
      return { episodeId, episodeNo: "1", sub: [], dub: [], raw: [] };
    }
  },

  async getEpisodeSources(episodeId: string, serverId?: number, _category?: string) {
    try {
      const data = await anikoto.getEpisodeSources(episodeId, serverId, _category);
      if (data?.sources?.[0]?.url) return data;
    } catch {
      console.log(`[hianime] AniKoto sources failed for ${episodeId}, trying hindi fallback`);
    }
    try {
      return await aniverse.getEpisodeSources(episodeId, serverId);
    } catch {
      return {
        headers: { Referer: "" },
        subtitles: [], intro: { start: 0, end: 0 }, outro: { start: 0, end: 0 },
        sources: [{ url: "", type: "hls" }], anilistID: 0, malID: 0,
      };
    }
  },

  async searchSuggestions(query: string) {
    try {
      const results = await anikoto.searchSuggestions(query);
      if (results?.length) return results;
    } catch {
      console.log(`[hianime] AniKoto suggestions failed, using hindi fallback`);
    }
    try {
      return await aniverse.searchSuggestions(query);
    } catch {
      return [];
    }
  },

  async getEstimatedSchedule(date?: string) {
    try {
      return await anikoto.getEstimatedSchedule(date);
    } catch {
      console.log(`[hianime] AniKoto schedule failed, using hindi fallback`);
    }
    try {
      return await aniverse.getEstimatedSchedule(date);
    } catch {
      return [];
    }
  },
};
