const ANILIST_API = "https://graphql.anilist.co";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const malId = parseInt(id, 10);
    if (isNaN(malId)) {
      return Response.json({ error: "invalid mal id" }, { status: 400 });
    }

    const query = `query ($idMal: Int) {
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

    const res = await fetch(ANILIST_API, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Accept": "application/json" },
      body: JSON.stringify({ query, variables: { idMal: malId } }),
      signal: AbortSignal.timeout(10000),
    });

    if (!res.ok) {
      return Response.json({ error: "anilist error" }, { status: 502 });
    }

    const json = await res.json();
    if (json?.errors) {
      return Response.json({ error: json.errors[0]?.message }, { status: 502 });
    }

    const media = json?.data?.Media;
    if (!media) {
      return Response.json({ error: "not found" }, { status: 404 });
    }

    const nextEp = media.nextAiringEpisode;
    const schedule = media.airingSchedule?.nodes || [];
    const latestAired = nextEp ? nextEp.episode - 1 : (media.episodes || 0);

    return Response.json({
      anilistId: media.id,
      totalEpisodes: media.episodes,
      status: media.status,
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
    });
  } catch (err) {
    console.error(err);
    return Response.json({ error: "something went wrong" }, { status: 500 });
  }
}
