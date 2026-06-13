import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { generateSalt, hashPassword } from "@/lib/auth-utils";

export async function POST(req: Request) {
  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return NextResponse.json({ success: false, error: "Database not configured" }, { status: 500 });
  }

  try {
    const { username, email, password } = await req.json();

    if (!username || !password) {
      return NextResponse.json({ success: false, error: "Username and password required" }, { status: 400 });
    }

    const { data: existing } = await supabase
      .from("users")
      .select("username")
      .eq("username", username)
      .single();

    if (existing) {
      return NextResponse.json({ success: false, error: "Username already taken" }, { status: 409 });
    }

    const salt = generateSalt();
    const passwordHash = await hashPassword(password, salt);

    const { data, error } = await supabase
      .from("users")
      .insert({
        username,
        email: email || "",
        password_hash: passwordHash,
        password_salt: salt,
        avatar: "",
        auto_skip: false,
      })
      .select("id, username, email, avatar, auto_skip")
      .single();

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, user: data });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}
