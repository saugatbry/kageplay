import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const username = searchParams.get("username");

  if (!username) {
    return NextResponse.json({ premium: false, error: "Missing username" }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return NextResponse.json({ premium: false, error: "Database not configured" }, { status: 500 });
  }

  const { data, error } = await supabase
    .from("premium_users")
    .select("*")
    .eq("username", username)
    .eq("active", true)
    .gte("premium_until", new Date().toISOString())
    .single();

  if (error && error.code !== "PGRST116") {
    return NextResponse.json({ premium: false, error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    premium: !!data,
    user: data || null,
  });
}
