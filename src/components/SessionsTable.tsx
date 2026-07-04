"use client";

import { useMemo, useState } from "react";
import { format, parseISO, startOfDay, endOfDay } from "date-fns";
import { useSessionsContext } from "@/context/SessionsContext";
import { useToast } from "@/hooks/useToast";
import type { Session, PrStatus } from "@/types/session";
import { formatDuration } from "@/lib/session-utils";

import {
  Table, TableHeader, TableRow, TableHead, TableBody, TableCell,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import SessionDialog from "./SessionDialog";
import ViewSessionDialog from "./ViewSessionDialog";
import Pagination from "./Pagination";
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import {
  Pencil, Trash2, Globe, Loader2,
  ArrowUpDown, ArrowUp, ArrowDown,
  Search, X,
  Zap, MoreVertical, Eye,
} from "lucide-react";
import { cn } from "@/lib/utils";

type SortKey = "date" | "task" | "duration";
type SortDir = "asc" | "desc";
const PAGE_SIZE = 15;

const PR_STATUS_CONFIG: Record<PrStatus, { label: string; className: string }> = {
  open:      { label: "Open",       className: "border-slate-300 bg-slate-100 text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300" },
  in_review: { label: "In Review",  className: "border-blue-300 bg-blue-100 text-blue-700 dark:border-blue-700 dark:bg-blue-900/40 dark:text-blue-300" },
  approved:  { label: "Approved",   className: "border-green-300 bg-green-100 text-green-700 dark:border-green-700 dark:bg-green-900/40 dark:text-green-300" },
  merged:    { label: "Merged",     className: "border-purple-300 bg-purple-100 text-purple-700 dark:border-purple-700 dark:bg-purple-900/40 dark:text-purple-300" },
  done:      { label: "Done",        className: "border-emerald-300 bg-emerald-100 text-emerald-700 dark:border-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300" },
};

const PR_STATUS_CYCLE: PrStatus[] = ["open", "in_review", "approved", "merged", "done"];

export default function SessionsTable() {
  const { sessions, loading, updateSession, deleteSession } = useSessionsContext();
  const { toast } = useToast();

  const [editingSession, setEditingSession] = useState<Session | null>(null);
  const [viewingSession, setViewingSession] = useState<Session | null>(null);
  const [deletingId, setDeletingId]         = useState<string | null>(null);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [updatingPrId, setUpdatingPrId]     = useState<string | null>(null);

  const [search, setSearch]     = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo]     = useState("");
  const [prFilter, setPrFilter] = useState<PrStatus | "">("");

  const [sortKey, setSortKey] = useState<SortKey>("date");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [page, setPage]       = useState(1);

  function handleSort(key: SortKey) {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortKey(key); setSortDir("desc"); }
    setPage(1);
  }

  function clearFilters() {
    setSearch(""); setDateFrom(""); setDateTo(""); setPrFilter(""); setPage(1);
  }

  async function handleDelete(id: string) {
    if (pendingDeleteId !== id) {
      setPendingDeleteId(id);
      toast("Click delete again within 3s to confirm.", "destructive");
      setTimeout(() => setPendingDeleteId((p) => (p === id ? null : p)), 3000);
      return;
    }
    setDeletingId(id);
    await deleteSession(id);
    setDeletingId(null);
    setPendingDeleteId(null);
    toast("Session deleted.", "success");
  }

  async function cyclePrStatus(session: Session) {
    if (!session.github_pr) return;
    const idx  = PR_STATUS_CYCLE.indexOf(session.pr_status ?? "open");
    const next = PR_STATUS_CYCLE[(idx + 1) % PR_STATUS_CYCLE.length];
    setUpdatingPrId(session.id);
    await updateSession(session.id, { pr_status: next });
    setUpdatingPrId(null);
  }

  const filtered = useMemo(() => sessions.filter((s) => {
    if (search && !s.task.toLowerCase().includes(search.toLowerCase()) &&
        !(s.description ?? "").toLowerCase().includes(search.toLowerCase())) return false;
    if (dateFrom && new Date(s.date) < startOfDay(parseISO(dateFrom))) return false;
    if (dateTo   && new Date(s.date) > endOfDay(parseISO(dateTo)))     return false;
    if (prFilter && s.pr_status !== prFilter) return false;
    return true;
  }), [sessions, search, dateFrom, dateTo, prFilter]);

  const sorted = useMemo(() => [...filtered].sort((a, b) => {
    let cmp = 0;
    if (sortKey === "date")     cmp = new Date(a.date).getTime() - new Date(b.date).getTime();
    else if (sortKey === "task")     cmp = a.task.localeCompare(b.task);
    else if (sortKey === "duration") cmp = Number(a.duration_minutes) - Number(b.duration_minutes);
    return sortDir === "asc" ? cmp : -cmp;
  }), [filtered, sortKey, sortDir]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const safePage   = Math.min(page, totalPages);
  const paginated  = sorted.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);
  const hasFilters = search || dateFrom || dateTo || prFilter;

  function SortIcon({ col }: { col: SortKey }) {
    if (sortKey !== col) return <ArrowUpDown className="ml-1 inline size-3 opacity-40" />;
    return sortDir === "asc"
      ? <ArrowUp className="ml-1 inline size-3 text-primary" />
      : <ArrowDown className="ml-1 inline size-3 text-primary" />;
  }

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
      {/* Filters */}
      <div className="flex flex-wrap items-end gap-3">
        <div className="relative min-w-48 flex-1">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Search task or description…"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          />
        </div>

        <div className="flex items-center gap-2">
          <div className="space-y-0.5">
            <p className="text-xs text-muted-foreground">From</p>
            <Input type="date" className="w-36" value={dateFrom}
              onChange={(e) => { setDateFrom(e.target.value); setPage(1); }} />
          </div>
          <span className="mt-4 text-muted-foreground">→</span>
          <div className="space-y-0.5">
            <p className="text-xs text-muted-foreground">To</p>
            <Input type="date" className="w-36" value={dateTo}
              onChange={(e) => { setDateTo(e.target.value); setPage(1); }} />
          </div>
        </div>

        <div className="space-y-0.5">
          <p className="text-xs text-muted-foreground">PR Status</p>
          <select
            className="h-9 rounded-md border border-border bg-background px-3 text-sm"
            value={prFilter}
            onChange={(e) => { setPrFilter(e.target.value as PrStatus | ""); setPage(1); }}
          >
            <option value="">All</option>
            {PR_STATUS_CYCLE.map((s) => (
              <option key={s} value={s}>{PR_STATUS_CONFIG[s].label}</option>
            ))}
          </select>
        </div>

        {hasFilters && (
          <Button variant="ghost" size="sm" onClick={clearFilters} className="gap-1.5 text-muted-foreground">
            <X className="size-3.5" /> Clear
          </Button>
        )}
      </div>

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
            <Table className="table-fixed w-full">
              <colgroup>
                <col className="w-[110px]" />
                <col className="w-[22%]" />
                <col />
                <col className="w-[90px]" />
                <col className="w-[70px]" />
                <col className="w-[90px]" />
                <col className="w-[110px]" />
                <col className="w-[80px]" />
              </colgroup>
              <TableHeader>
                <TableRow>
                  <TableHead>
                    <button onClick={() => handleSort("date")} className="flex items-center font-medium hover:text-foreground">
                      Date <SortIcon col="date" />
                    </button>
                  </TableHead>
                  <TableHead>
                    <button onClick={() => handleSort("task")} className="flex items-center font-medium hover:text-foreground">
                      Task <SortIcon col="task" />
                    </button>
                  </TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>
                    <button onClick={() => handleSort("duration")} className="flex items-center font-medium hover:text-foreground">
                      Duration <SortIcon col="duration" />
                    </button>
                  </TableHead>
                  <TableHead>Focus</TableHead>
                  <TableHead className="whitespace-nowrap">Pull Request</TableHead>
                  <TableHead className="whitespace-nowrap">Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {paginated.map((session) => (
                  <TableRow key={session.id} className={session.is_split ? "bg-muted/30" : ""}>
                    <TableCell className="whitespace-nowrap text-muted-foreground">
                      {format(parseISO(session.date), "MMM d, yyyy")}
                      {session.is_split && (
                        <span className="ml-1.5 text-xs text-blue-500" title="Split session">↗</span>
                      )}
                    </TableCell>

                    <TableCell className="truncate font-medium">
                      {search ? <Highlight text={session.task} query={search} /> : session.task}
                    </TableCell>

                    <TableCell className="truncate text-muted-foreground">
                      {session.description
                        ? search ? <Highlight text={session.description} query={search} /> : session.description
                        : "-"}
                    </TableCell>

                    <TableCell className="whitespace-nowrap font-medium text-primary">
                      {formatDuration(Number(session.duration_minutes))}
                    </TableCell>

                    <TableCell>
                      {session.focus_score != null ? (
                        <span className={cn(
                          "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-semibold",
                          Number(session.focus_score) >= 80
                            ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400"
                            : Number(session.focus_score) >= 60
                            ? "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-900/30 dark:text-amber-400"
                            : "border-red-200 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-900/30 dark:text-red-400"
                        )}>
                          <Zap className="size-3" />
                          {session.focus_score}%
                        </span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>

                    <TableCell className="overflow-hidden">
                      {session.github_pr ? (
                        <a
                          href={session.github_pr}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 whitespace-nowrap text-primary hover:underline text-xs"
                        >
                          <Globe className="size-3.5 shrink-0" />
                          PR
                        </a>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>

                    <TableCell className="overflow-hidden">
                      <select
                        value={session.pr_status ?? "open"}
                        disabled={updatingPrId === session.id}
                        onChange={async (e) => {
                          setUpdatingPrId(session.id);
                          await updateSession(session.id, { pr_status: e.target.value as PrStatus });
                          setUpdatingPrId(null);
                        }}
                        className={cn(
                          "w-full rounded-full border px-1.5 py-px text-[11px] font-medium cursor-pointer appearance-none transition-colors focus:outline-none disabled:opacity-50 text-center",
                          PR_STATUS_CONFIG[session.pr_status ?? "open"].className
                        )}
                      >
                        {PR_STATUS_CYCLE.map((s) => (
                          <option key={s} value={s} className="bg-background text-foreground">
                            {PR_STATUS_CONFIG[s].label}
                          </option>
                        ))}
                      </select>
                    </TableCell>

                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger
                          render={
                            <Button variant="ghost" size="icon" disabled={deletingId === session.id}>
                              {deletingId === session.id
                                ? <Loader2 className="size-4 animate-spin" />
                                : <MoreVertical className="size-4" />}
                            </Button>
                          }
                        />
                        <DropdownMenuContent>
                          <DropdownMenuItem onClick={() => setViewingSession(session)}>
                            <Eye className="size-4" /> View
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setEditingSession(session)}>
                            <Pencil className="size-4" /> Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem variant="destructive" onClick={() => handleDelete(session.id)}>
                            <Trash2 className="size-4" /> Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <Pagination page={safePage} totalPages={totalPages} onChange={setPage} />
        </>
      )}

      <SessionDialog
        open={Boolean(editingSession)}
        setOpen={(o) => { if (!o) setEditingSession(null); }}
        session={editingSession || undefined}
      />

      <ViewSessionDialog
        open={Boolean(viewingSession)}
        setOpen={(o) => { if (!o) setViewingSession(null); }}
        session={viewingSession || undefined}
      />
    </>
  );
}

function Highlight({ text, query }: { text: string; query: string }) {
  if (!query) return <>{text}</>;
  const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "gi");
  const parts = text.split(regex);
  return (
    <>
      {parts.map((part, i) =>
        regex.test(part) ? (
          <mark key={i} className="rounded bg-primary/20 px-0.5 text-foreground">{part}</mark>
        ) : part
      )}
    </>
  );
}
