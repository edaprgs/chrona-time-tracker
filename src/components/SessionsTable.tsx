/* src/components/SessionsTable.tsx */

"use client";

import { useMemo, useState } from "react";
import { format, isWithinInterval, startOfDay, endOfDay, parseISO } from "date-fns";

import { useSessionsContext } from "@/context/SessionsContext";
import { useToast } from "@/hooks/useToast";
import { supabase } from "@/lib/supabase";
import { Session } from "@/types/session";

import {
  Table, TableHeader, TableRow, TableHead,
  TableBody, TableCell,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import SessionDialog from "./SessionDialog";
import {
  Pencil, Trash2, Globe, Loader2,
  ArrowUpDown, ArrowUp, ArrowDown,
  Search, X, ChevronLeft, ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ── helpers ────────────────────────────────────────────────────────────────

function formatDuration(totalMinutes: number) {
  const h = Math.floor(totalMinutes / 60);
  const m = Math.round(totalMinutes % 60);
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

type SortKey = "date" | "task" | "duration";
type SortDir = "asc" | "desc";

const PAGE_SIZE = 15;

// ── component ──────────────────────────────────────────────────────────────

export default function SessionsTable() {
  const { sessions, loading, refetch } = useSessionsContext();
  const { toast } = useToast();

  // Editing / deleting
  const [editingSession, setEditingSession] = useState<Session | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  // Sorting
  const [sortKey, setSortKey] = useState<SortKey>("date");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  // Pagination
  const [page, setPage] = useState(1);

  function handleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
    setPage(1);
  }

  function clearFilters() {
    setSearch("");
    setDateFrom("");
    setDateTo("");
    setPage(1);
  }

  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

  async function handleDelete(id: string) {
    if (pendingDeleteId !== id) {
      setPendingDeleteId(id);

      toast(
        "Delete session? Click delete again within 3 seconds to confirm.",
        "destructive"
      );

      setTimeout(() => {
        setPendingDeleteId((prev) => (prev === id ? null : prev));
      }, 3000);

      return;
    }

    setDeletingId(id);

    const { error } = await supabase
      .from("sessions")
      .delete()
      .eq("id", id);

    setDeletingId(null);
    setPendingDeleteId(null);

    if (error) {
      toast("Failed to delete session.", "destructive");
      return;
    }

    toast("Session deleted.", "success");
    refetch();
  }

  // ── filtering ─────────────────────────────────────────────────────────────

  const filtered = useMemo(() => {
    return sessions.filter((s) => {
      const sessionDate = new Date(s.created_at);

      if (search && !s.task.toLowerCase().includes(search.toLowerCase()) &&
          !(s.description ?? "").toLowerCase().includes(search.toLowerCase())) {
        return false;
      }

      if (dateFrom) {
        const from = startOfDay(parseISO(dateFrom));
        if (sessionDate < from) return false;
      }

      if (dateTo) {
        const to = endOfDay(parseISO(dateTo));
        if (sessionDate > to) return false;
      }

      return true;
    });
  }, [sessions, search, dateFrom, dateTo]);

  // ── sorting ───────────────────────────────────────────────────────────────

  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      let cmp = 0;
      if (sortKey === "date") {
        cmp = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      } else if (sortKey === "task") {
        cmp = a.task.localeCompare(b.task);
      } else if (sortKey === "duration") {
        cmp = a.duration_minutes - b.duration_minutes;
      }
      return sortDir === "asc" ? cmp : -cmp;
    });
  }, [filtered, sortKey, sortDir]);

  // ── pagination ────────────────────────────────────────────────────────────

  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const paginated = sorted.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const hasFilters = search || dateFrom || dateTo;

  // ── sort icon helper ──────────────────────────────────────────────────────

  function SortIcon({ col }: { col: SortKey }) {
    if (sortKey !== col) return <ArrowUpDown className="ml-1 inline size-3 opacity-40" />;
    return sortDir === "asc"
      ? <ArrowUp className="ml-1 inline size-3 text-primary" />
      : <ArrowDown className="ml-1 inline size-3 text-primary" />;
  }

  // ── render ────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-2 py-16 text-muted-foreground">
        <Loader2 className="size-4 animate-spin" />
        Loading sessions…
      </div>
    );
  }

  return (
    <>
      {/* ── Filters bar ── */}
      <div className="flex flex-wrap items-end gap-3">
        {/* Search */}
        <div className="relative min-w-48 flex-1">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Search task or description…"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          />
        </div>

        {/* Date range */}
        <div className="flex items-center gap-2">
          <div className="space-y-0.5">
            <p className="text-xs text-muted-foreground">From</p>
            <Input
              type="date"
              className="w-36"
              value={dateFrom}
              onChange={(e) => { setDateFrom(e.target.value); setPage(1); }}
            />
          </div>
          <span className="mt-4 text-muted-foreground">→</span>
          <div className="space-y-0.5">
            <p className="text-xs text-muted-foreground">To</p>
            <Input
              type="date"
              className="w-36"
              value={dateTo}
              onChange={(e) => { setDateTo(e.target.value); setPage(1); }}
            />
          </div>
        </div>

        {hasFilters && (
          <Button variant="ghost" size="sm" onClick={clearFilters} className="gap-1.5 text-muted-foreground">
            <X className="size-3.5" />
            Clear
          </Button>
        )}
      </div>

      {/* ── Result summary ── */}
      <p className="text-sm text-muted-foreground">
        {filtered.length === sessions.length
          ? `${sessions.length} session${sessions.length !== 1 ? "s" : ""}`
          : `${filtered.length} of ${sessions.length} sessions`}
      </p>

      {filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed py-16 text-center text-muted-foreground">
          {sessions.length === 0
            ? "No sessions logged yet. Start the timer from the home page."
            : "No sessions match your filters."}
        </div>
      ) : (
        <>
          <div className="overflow-hidden rounded-xl border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>
                    <button
                      onClick={() => handleSort("date")}
                      className="flex items-center font-medium hover:text-foreground"
                    >
                      Date <SortIcon col="date" />
                    </button>
                  </TableHead>
                  <TableHead>
                    <button
                      onClick={() => handleSort("task")}
                      className="flex items-center font-medium hover:text-foreground"
                    >
                      Task <SortIcon col="task" />
                    </button>
                  </TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>
                    <button
                      onClick={() => handleSort("duration")}
                      className="flex items-center font-medium hover:text-foreground"
                    >
                      Duration <SortIcon col="duration" />
                    </button>
                  </TableHead>
                  <TableHead>Pull Request</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {paginated.map((session) => (
                  <TableRow key={session.id}>
                    <TableCell className="whitespace-nowrap text-muted-foreground">
                      {format(new Date(session.created_at), "MMM d, yyyy")}
                    </TableCell>

                    <TableCell className="font-medium">
                      {search ? (
                        <Highlight text={session.task} query={search} />
                      ) : session.task}
                    </TableCell>

                    <TableCell className="max-w-xs truncate text-muted-foreground">
                      {session.description
                        ? search
                          ? <Highlight text={session.description} query={search} />
                          : session.description
                        : "—"}
                    </TableCell>

                    <TableCell className="whitespace-nowrap font-medium text-primary">
                      {formatDuration(session.duration_minutes)}
                    </TableCell>

                    <TableCell>
                      {session.github_pr ? (
                        <a
                          href={session.github_pr}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-primary hover:underline"
                        >
                          <Globe className="size-4" />
                          PR
                        </a>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>

                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon" onClick={() => setEditingSession(session)}>
                          <Pencil className="size-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(session.id)}
                          disabled={deletingId === session.id}
                        >
                          <Trash2 className="size-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* ── Pagination ── */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>
                Page {safePage} of {totalPages}
              </span>
              <div className="flex gap-1">
                <Button
                  variant="outline"
                  size="icon"
                  disabled={safePage === 1}
                  onClick={() => setPage((p) => p - 1)}
                >
                  <ChevronLeft className="size-4" />
                </Button>

                {/* Page number pills */}
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter((p) => p === 1 || p === totalPages || Math.abs(p - safePage) <= 1)
                  .reduce<(number | "…")[]>((acc, p, i, arr) => {
                    if (i > 0 && p - (arr[i - 1] as number) > 1) acc.push("…");
                    acc.push(p);
                    return acc;
                  }, [])
                  .map((item, i) =>
                    item === "…" ? (
                      <span key={`ellipsis-${i}`} className="px-2 py-1">…</span>
                    ) : (
                      <Button
                        key={item}
                        variant={item === safePage ? "default" : "outline"}
                        size="icon"
                        onClick={() => setPage(item as number)}
                        className="size-9"
                      >
                        {item}
                      </Button>
                    )
                  )}

                <Button
                  variant="outline"
                  size="icon"
                  disabled={safePage === totalPages}
                  onClick={() => setPage((p) => p + 1)}
                >
                  <ChevronRight className="size-4" />
                </Button>
              </div>
            </div>
          )}
        </>
      )}

      <SessionDialog
        open={Boolean(editingSession)}
        setOpen={(open) => { if (!open) setEditingSession(null); }}
        session={editingSession || undefined}
      />
    </>
  );
}

// ── Highlight matching text in search results ──────────────────────────────

function Highlight({ text, query }: { text: string; query: string }) {
  if (!query) return <>{text}</>;
  const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "gi");
  const parts = text.split(regex);
  return (
    <>
      {parts.map((part, i) =>
        regex.test(part) ? (
          <mark key={i} className="rounded bg-primary/20 px-0.5 text-foreground">
            {part}
          </mark>
        ) : (
          part
        )
      )}
    </>
  );
}