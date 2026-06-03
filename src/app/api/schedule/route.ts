import { aniverse } from "@/lib/aniverse";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const { searchParams } = url;
  const date = searchParams.get("date");
  const formattedDate = date
    ? new Date(date).toISOString().split("T")[0]
    : new Date().toISOString().split("T")[0];

  try {
    const estimated = await aniverse.getEstimatedSchedule(formattedDate);
    // Wrap the array into the expected shape { scheduledAnimes: [...] }
    const data = { scheduledAnimes: Array.isArray(estimated) ? estimated : [] };
    return Response.json({ data });
  } catch (err) {
    console.log(err);
    return Response.json({ error: "something went wrong" }, { status: 500 });
  }
}
