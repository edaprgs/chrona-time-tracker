import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// This endpoint is called by the VS Code companion extension.
// Auth: the extension sends a long-lived personal API key (from the
// `api_keys` table) in the Authorization header - not the user's
// short-lived Supabase session token, which expires every ~1 hour.

// IMPORTANT: SUPABASE_SERVICE_ROLE_KEY must be set in .env.local (server-side only, never NEXT_PUBLIC_).
// Without it, the api_keys lookup will fail and VS Code extension events will be rejected.
if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.warn("[activity route] SUPABASE_SERVICE_ROLE_KEY not set - VS Code extension events will fail");
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
    note:         e.note ?? null,
    metadata:     e.metadata ?? null,
  }));

  const { error } = await supabaseAdmin.from("activity_events").insert(rows);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ inserted: rows.length });
}

// The extension polls this to know whether to track activity at all.
// The `sessions` table only gets a row at punch-out (after the confirmation
// dialog), so it can never answer "are you punched in right now" - that's
// what `live_status` is for, written by Timer.tsx on every transition.
export async function GET(req: NextRequest) {
  const userId = await userIdFromApiKey(req);
  if (!userId) return NextResponse.json({ error: "Invalid token" }, { status: 401 });

  const { data } = await supabaseAdmin
    .from("live_status")
    .select("is_punched_in, is_paused")
    .eq("user_id", userId)
    .maybeSingle();

  return NextResponse.json({
    punchedIn: data?.is_punched_in ?? false,
    paused:    data?.is_paused ?? false,
  });
}
