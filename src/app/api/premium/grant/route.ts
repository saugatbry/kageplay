import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

const PLANS = {
  weekly: { days: 7 },
  monthly: { days: 30 },
  yearly: { days: 365 },
} as const;

function calcExpiry(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString();
}

export async function POST(req: Request) {
  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return NextResponse.json({ success: false, error: "Database not configured" }, { status: 500 });
  }

  try {
    const { username, email, plan, grantedBy } = await req.json();

    if (!username) {
      return NextResponse.json({ success: false, error: "Missing username" }, { status: 400 });
    }

    const planConfig = PLANS[plan as keyof typeof PLANS] || PLANS.monthly;
    const premiumUntil = calcExpiry(planConfig.days);

    const { data: existing } = await supabase
      .from("premium_users")
      .select("id")
      .eq("username", username)
      .single();

    let error;
    if (existing) {
      const result = await supabase
        .from("premium_users")
        .update({
          email: email || "",
          plan: plan || "monthly",
          premium_until: premiumUntil,
          active: true,
          granted_by: grantedBy || "system",
          granted_at: new Date().toISOString(),
        })
        .eq("username", username);
      error = result.error;
    } else {
      const result = await supabase
        .from("premium_users")
        .insert({
          username,
          email: email || "",
          plan: plan || "monthly",
          premium_until: premiumUntil,
          active: true,
          granted_by: grantedBy || "system",
          granted_at: new Date().toISOString(),
        });
      error = result.error;
    }

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, premiumUntil });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}
