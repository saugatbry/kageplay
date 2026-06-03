import { hianime } from "@/lib/hianime";
import { cachedJson } from "@/lib/api-cache";

export async function GET(
  request: Request,
  props: { params: Promise<{ id: string }> },
) {
  const params = await props.params;
  try {
    const { id } = params;
    const data = await hianime.getEpisodes(id);
    return cachedJson({ data });
  } catch (err) {
    console.log(err);
    return cachedJson({ error: "something went wrong" }, { status: 500, ttl: 0 });
  }
}
