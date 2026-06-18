import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

export async function GET() {
  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return NextResponse.json({ ads_enabled: true });
  }

  const { data } = await supabase
    .from("settings")
    .select("key, value")
    .in("key", ["ads_enabled"]);

  const map: Record<string, string> = {};
  if (data) {
    for (const row of data) {
      map[row.key] = row.value;
    }
  }

  return NextResponse.json({
    ads_enabled: map.ads_enabled !== "false",
  });
}

export async function POST(req: Request) {
  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return NextResponse.json({ success: false, error: "Database not configured" }, { status: 500 });
  }

  try {
    const body = await req.json();

    if (body.ads_enabled !== undefined) {
      const val = body.ads_enabled ? "true" : "false";
      const { error } = await supabase
        .from("settings")
        .upsert({ key: "ads_enabled", value: val }, { onConflict: "key" });
      if (error) throw error;
    }

    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}
