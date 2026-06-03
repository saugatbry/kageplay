import { hianime } from "@/lib/hianime";
import { cachedJson } from "@/lib/api-cache";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const data = await hianime.getInfo(id);
    return cachedJson({ data });
  } catch (err) {
    console.log(err);
    return cachedJson({ error: "something went wrong" }, { status: 500, ttl: 0 });
  }
}
