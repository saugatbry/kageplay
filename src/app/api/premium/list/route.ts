import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

export async function GET() {
  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return NextResponse.json({ users: [], error: "Database not configured" }, { status: 500 });
  }

  const { data, error } = await supabase
    .from("premium_users")
    .select("*")
    .order("granted_at", { ascending: false });

  if (error) {
    return NextResponse.json({ users: [], error: error.message }, { status: 500 });
  }

  const users = (data || []).map((u: any) => ({
    username: u.username,
    email: u.email || "",
    premiumUntil: u.premium_until,
    plan: u.plan || "monthly",
    active: u.active,
    grantedBy: u.granted_by || "",
    grantedAt: u.granted_at,
  }));

  return NextResponse.json({ users });
}
