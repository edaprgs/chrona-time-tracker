import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// This endpoint is called by the VS Code companion extension.
// Auth: the extension sends a long-lived personal API key (from the
// `api_keys` table) in the Authorization header — not the user's
// short-lived Supabase session token, which expires every ~1 hour.

// IMPORTANT: SUPABASE_SERVICE_ROLE_KEY must be set in .env.local (server-side only, never NEXT_PUBLIC_).
// Without it, the api_keys lookup will fail and VS Code extension events will be rejected.
if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.warn("[activity route] SUPABASE_SERVICE_ROLE_KEY not set — VS Code extension events will fail");
}

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

async function userIdFromApiKey(req: NextRequest): Promise<string | null> {
  const authHeader = req.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) return null;

  const key = authHeader.slice(7);
  const { data } = await supabaseAdmin
    .from("api_keys")
    .select("user_id")
    .eq("key", key)
    .single();

  return data?.user_id ?? null;
}

export async function POST(req: NextRequest) {
  const userId = await userIdFromApiKey(req);
  if (!userId) return NextResponse.json({ error: "Invalid token" }, { status: 401 });

  const body = await req.json();
  const events = Array.isArray(body) ? body : [body];

  const rows = events.map((e) => ({
    user_id:      userId,
    session_id:   e.session_id ?? null,
    event_type:   e.event_type,
    file_path:    e.file_path ?? null,
    workspace:    e.workspace ?? null,
    language:     e.language ?? null,
    lines_changed: e.lines_changed ?? null,
    git_branch:   e.git_branch ?? null,
    timestamp:    e.timestamp ?? new Date().toISOString(),
    metadata:     e.metadata ?? null,
  }));

  const { error } = await supabaseAdmin.from("activity_events").insert(rows);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ inserted: rows.length });
}

// The extension may also GET the currently active session ID so it can
// attach events to the right session automatically.
export async function GET(req: NextRequest) {
  const userId = await userIdFromApiKey(req);
  if (!userId) return NextResponse.json({ error: "Invalid token" }, { status: 401 });

  // Return the most-recent in-progress session (end_time IS NULL) for this user
  const { data } = await supabaseAdmin
    .from("sessions")
    .select("id, task, start_time")
    .eq("user_id", userId)
    .is("end_time", null)
    .order("start_time", { ascending: false })
    .limit(1)
    .single();

  return NextResponse.json({ session: data ?? null });
}
