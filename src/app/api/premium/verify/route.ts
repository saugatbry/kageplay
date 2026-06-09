import { NextResponse } from "next/server";

const GOOGLE_SCRIPT_URL = process.env.NEXT_PUBLIC_GOOGLE_SCRIPT_URL || "";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const utr = searchParams.get("utr");

  if (!utr || utr.length < 6) {
    return NextResponse.json({ success: false, error: "Invalid UTR" }, { status: 400 });
  }

  if (!GOOGLE_SCRIPT_URL) {
    return NextResponse.json({ success: false, error: "Verification not configured" }, { status: 500 });
  }

  try {
    const res = await fetch(`${GOOGLE_SCRIPT_URL}?utr=${encodeURIComponent(utr)}`, {
      signal: AbortSignal.timeout(10000),
    });
    const data = await res.json();
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ success: false, error: "Verification failed" }, { status: 502 });
  }
}
