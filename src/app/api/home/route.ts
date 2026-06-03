import { hianime } from "@/lib/hianime";
import { aniverse } from "@/lib/aniverse";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const provider = searchParams.get("provider") || "subdub";

    if (provider === "hindi") {
      const data = await aniverse.getHomePage();
      return Response.json({ data });
    }

    let data = await hianime.getHomePage().catch(() => null);
    if (!data || !data.spotlightAnimes || data.spotlightAnimes.length === 0) {
      console.log("[home] Jikan returned empty, falling back to Hindi provider");
      data = await aniverse.getHomePage();
    }
    return Response.json({ data });
  } catch (err) {
    console.log(err);
    return Response.json({ error: "something went wrong" }, { status: 500 });
  }
}
