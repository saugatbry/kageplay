import { piratexplay } from "./piratexplay";

function encodeEpisodeId(seasonSlug: string, season: number, episode: number): string {
  return `${seasonSlug}-${season}x${episode}`;
}

function parseEpisodeId(episodeId: string): { animeId: string; season: number; episode: number } | null {
  const match = /^(.+)-(\d+)x(\d+)$/.exec(episodeId);
  if (match) {
    return { animeId: match[1], season: parseInt(match[2]), episode: parseInt(match[3]) };
  }
  return null;
}

export { piratexplay as aniverse, encodeEpisodeId, parseEpisodeId };
