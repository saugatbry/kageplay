import { hianime } from "@/lib/hianime";
import { aniverse } from "@/lib/aniverse";
import { cachedJson } from "@/lib/api-cache";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const provider = searchParams.get("provider") || "subdub";

    if (provider === "hindi") {
      const data = await aniverse.getHomePage();
      return cachedJson({ data });
    }

    let data = await hianime.getHomePage().catch(() => null);
    if (!data || !data.spotlightAnimes || data.spotlightAnimes.length === 0) {
      console.log("[home] Jikan returned empty, falling back to Hindi provider");
      data = await aniverse.getHomePage();
    }
    return cachedJson({ data });
  } catch (err) {
    console.log(err);
    return cachedJson({ error: "something went wrong" }, { status: 500, ttl: 0 });
  }
}
