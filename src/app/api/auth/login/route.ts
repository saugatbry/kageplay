import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { hashPassword } from "@/lib/auth-utils";

export async function POST(req: Request) {
  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return NextResponse.json({ success: false, error: "Database not configured" }, { status: 500 });
  }

  try {
    const { username, password } = await req.json();

    if (!username || !password) {
      return NextResponse.json({ success: false, error: "Username and password required" }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("users")
      .select("*")
      .eq("username", username)
      .single();

    if (error || !data) {
      return NextResponse.json({ success: false, error: "Invalid username or password" }, { status: 401 });
    }

    const passwordHash = await hashPassword(password, data.password_salt);
    if (passwordHash !== data.password_hash) {
      return NextResponse.json({ success: false, error: "Invalid username or password" }, { status: 401 });
    }

    return NextResponse.json({
      success: true,
      user: {
        id: data.id,
        username: data.username,
        email: data.email || "",
        avatar: data.avatar || "",
        autoSkip: data.auto_skip || false,
      },
    });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}
