const ANILIST_API = "https://graphql.anilist.co";

const EPISODE_COUNT_QUERY = `query ($idMal: Int) {
  Media(idMal: $idMal, type: ANIME) {
    episodes
    status
  }
}`;

export async function getAnilistEpisodeCount(malId: string): Promise<{
  count: number | null;
  status: string | null;
}> {
  try {
    const res = await fetch(ANILIST_API, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        query: EPISODE_COUNT_QUERY,
        variables: { idMal: parseInt(malId, 10) },
      }),
      signal: AbortSignal.timeout(5000),
    });

    if (!res.ok) return { count: null, status: null };

    const json = await res.json();
    if (json?.errors) return { count: null, status: null };

    const media = json?.data?.Media;
    return {
      count: media?.episodes ?? null,
      status: media?.status ?? null,
    };
  } catch {
    return { count: null, status: null };
  }
}

const BANNER_QUERY = `query ($idMals: [Int]) {
  Page(page: 1, perPage: 50) {
    media(idMal_in: $idMals, type: ANIME) {
      id
      idMal
      bannerImage
      coverImage { large }
    }
  }
}`;

export type AnilistBannerInfo = {
  id: number;
  idMal: number;
  bannerImage: string | null;
  coverImage: string | null;
};

const AIRING_QUERY = `query ($idMal: Int) {
  Media(idMal: $idMal, type: ANIME) {
    id
    episodes
    status
    nextAiringEpisode {
      airingAt
      timeUntilAiring
      episode
    }
    airingSchedule(perPage: 10) {
      nodes {
        airingAt
        episode
      }
    }
  }
}`;

export async function getAnilistAiringSchedule(malId: string): Promise<{
  latestAiredEpisode: number | null;
  nextAiringEpisode: { episode: number; airingAt: number; timeUntilAiring: number } | null;
  upcomingSchedule: { episode: number; airingAt: number }[];
  totalEpisodes: number | null;
  status: string | null;
}> {
  try {
    const res = await fetch(ANILIST_API, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({
        query: AIRING_QUERY,
        variables: { idMal: parseInt(malId, 10) },
      }),
      signal: AbortSignal.timeout(5000),
    });

    if (!res.ok) {
      return { latestAiredEpisode: null, nextAiringEpisode: null, upcomingSchedule: [], totalEpisodes: null, status: null };
    }

    const json = await res.json();
    if (json?.errors) {
      return { latestAiredEpisode: null, nextAiringEpisode: null, upcomingSchedule: [], totalEpisodes: null, status: null };
    }

    const media = json?.data?.Media;
    if (!media) {
      return { latestAiredEpisode: null, nextAiringEpisode: null, upcomingSchedule: [], totalEpisodes: null, status: null };
    }

    const nextEp = media.nextAiringEpisode;
    const schedule = media.airingSchedule?.nodes || [];
    const latestAired = nextEp ? nextEp.episode - 1 : (media.episodes || null);

    return {
      latestAiredEpisode: latestAired,
      nextAiringEpisode: nextEp
        ? {
            episode: nextEp.episode,
            airingAt: nextEp.airingAt,
            timeUntilAiring: nextEp.timeUntilAiring,
          }
        : null,
      upcomingSchedule: schedule.map((n: any) => ({
        episode: n.episode,
        airingAt: n.airingAt,
      })),
      totalEpisodes: media.episodes ?? null,
      status: media.status ?? null,
    };
  } catch {
    return { latestAiredEpisode: null, nextAiringEpisode: null, upcomingSchedule: [], totalEpisodes: null, status: null };
  }
}

export async function getAnilistBanners(
  malIds: number[],
): Promise<Map<number, AnilistBannerInfo>> {
  const result = new Map<number, AnilistBannerInfo>();
  if (malIds.length === 0) return result;

  try {
    const res = await fetch(ANILIST_API, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        query: BANNER_QUERY,
        variables: { idMals: malIds },
      }),
      signal: AbortSignal.timeout(5000),
    });

    if (!res.ok) return result;

    const json = await res.json();
    if (json?.errors) return result;

    const mediaList = json?.data?.Page?.media || [];
    for (const media of mediaList) {
      result.set(media.idMal, {
        id: media.id,
        idMal: media.idMal,
        bannerImage: media.bannerImage || null,
        coverImage: media.coverImage?.large || null,
      });
    }
  } catch {
    // silently fail
  }
  return result;
}
