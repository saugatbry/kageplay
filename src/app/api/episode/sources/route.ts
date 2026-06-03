import { hianime } from "@/lib/hianime";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const episodeId = searchParams.get("animeEpisodeId") as string;
    const serverParam = searchParams.get("server");
    const category = searchParams.get("category");

    let serverId: number | undefined;
    if (serverParam) {
      const num = parseInt(serverParam.replace(/\D/g, ""), 10);
      if (!isNaN(num)) serverId = num;
    }

    const data = await hianime.getEpisodeSources(
      decodeURIComponent(episodeId),
      serverId,
      category || undefined,
    );

    return Response.json({ data });
  } catch (err) {
    console.error(err);
    return Response.json({ error: "something went wrong" }, { status: 500 });
  }
}
