import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

interface PauseRow {
  session_id: string;
  paused_at: string;
  resumed_at: string | null;
}

interface SessionRow {
  id: string;
  user_id: string;
  start_time: string | null;
  end_time: string | null;
  duration_minutes: number;
  is_split: boolean;
  parent_session_id: string | null;
}

/**
 * Subtracts completed pause intervals from a [start, end] window.
 * Returns net worked minutes.
 */
function workedMinutes(
  startMs: number,
  endMs: number,
  pauses: { from: number; to: number }[],
): number {
  let intervals: [number, number][] = [[startMs, endMs]];
  for (const p of pauses) {
    const next: [number, number][] = [];
    for (const [a, b] of intervals) {
      if (p.from >= b || p.to <= a) { next.push([a, b]); continue; }
      if (a < p.from) next.push([a, p.from]);
      if (p.to < b)   next.push([p.to, b]);
    }
    intervals = next;
  }
  const ms = intervals.reduce((s, [a, b]) => s + (b - a), 0);
  return Math.max(1, Math.round(ms / 60000));
}

export async function GET(req: Request) {
  // Require a simple secret so this can't be called anonymously
  const url  = new URL(req.url);
  const code = url.searchParams.get("code");
  if (code !== "fix-my-durations") {
    return NextResponse.json({ error: "Missing code param" }, { status: 401 });
  }

  // 1. Load all sessions that have start_time + end_time
  const { data: sessions, error: sErr } = await supabase
    .from("sessions")
    .select("id, user_id, start_time, end_time, duration_minutes, is_split, parent_session_id")
    .not("start_time", "is", null)
    .not("end_time", "is", null);

  if (sErr) return NextResponse.json({ error: sErr.message }, { status: 500 });

  // 2. Load all pause_logs
  const { data: allPauses, error: pErr } = await supabase
    .from("pause_logs")
    .select("session_id, paused_at, resumed_at")
    .not("resumed_at", "is", null);

  if (pErr) return NextResponse.json({ error: pErr.message }, { status: 500 });

  // Group pauses by session_id
  const pausesBySession: Record<string, { from: number; to: number }[]> = {};
  for (const p of (allPauses as PauseRow[])) {
    if (!p.resumed_at) continue;
    const entry = { from: new Date(p.paused_at).getTime(), to: new Date(p.resumed_at).getTime() };
    (pausesBySession[p.session_id] ??= []).push(entry);
  }

  const updates: { id: string; old: number; corrected: number }[] = [];

  for (const s of (sessions as SessionRow[])) {
    const pauses = pausesBySession[s.id] ?? [];
    const startMs = new Date(s.start_time!).getTime();
    const endMs   = new Date(s.end_time!).getTime();

    // For split child sessions, the parent holds all pause_logs.
    // Compute parent-portion worked time so we can infer the child's share.
    let correct: number;

    if (s.is_split && s.parent_session_id) {
      // Child split session — pauses live on the parent, not here.
      // Find the parent in our session list.
      const parent = (sessions as SessionRow[]).find((x) => x.id === s.parent_session_id);
      if (!parent || !parent.start_time || !parent.end_time) continue;

      const parentPauses = pausesBySession[parent.id] ?? [];
      const parentStart  = new Date(parent.start_time).getTime();
      const parentEnd    = new Date(parent.end_time).getTime();

      // Total worked across both split portions combined
      const totalMs = (parentEnd - parentStart) + (endMs - startMs);
      const totalWorkedMin = workedMinutes(parentStart, endMs, parentPauses);

      // Parent-portion worked (before midnight boundary)
      const parentWorkedMin = workedMinutes(parentStart, parentEnd, parentPauses);

      correct = Math.max(1, totalWorkedMin - parentWorkedMin);
    } else {
      // Regular session or split parent — straightforward subtraction
      correct = workedMinutes(startMs, endMs, pauses);
    }

    const current = Math.round(Number(s.duration_minutes));
    if (correct !== current) {
      updates.push({ id: s.id, old: current, corrected: correct });
    }
  }

  if (updates.length === 0) {
    return NextResponse.json({ message: "All session durations already correct — nothing to update.", updates: [] });
  }

  // 3. Apply updates in batches
  for (const u of updates) {
    await supabase
      .from("sessions")
      .update({ duration_minutes: u.corrected })
      .eq("id", u.id);
  }

  return NextResponse.json({
    message: `Fixed ${updates.length} session(s).`,
    updates,
  });
}
