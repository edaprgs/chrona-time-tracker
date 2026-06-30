"use client";

import { useMemo, useState } from "react";
import { format, isWithinInterval, startOfDay, endOfDay, parseISO, addDays } from "date-fns";
import { useSessionsContext } from "@/context/SessionsContext";
import { useWorkspace } from "@/context/WorkspaceContext";
import { useExchangeRate } from "@/hooks/useExchangeRate";
import { exportSessionsCsv } from "@/lib/exportCsv";
import { formatDuration } from "@/lib/session-utils";
import { CURRENCIES } from "@/lib/currencies";

import {
  Table, TableHeader, TableRow, TableHead, TableBody, TableCell,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import Pagination from "./Pagination";
import { Download, FileText, Globe, Loader2, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  start: Date;
  end: Date;
  displayCurrency: string;
}

const PAGE_SIZE = 15;

function getCurrencySymbol(code: string): string {
  return CURRENCIES.find((c) => c.code === code)?.symbol ?? code;
}

function fmt(amount: number, symbol: string): string {
  // JPY has no decimals convention
  const decimals = symbol === "¥" ? 0 : 2;
  return `${symbol}${amount.toFixed(decimals)}`;
}

export default function InvoiceTable({ start, end, displayCurrency }: Props) {
  const { sessions, loading: sessionsLoading } = useSessionsContext();
  const { hourlyRate, contractorName, clientName, workspaceName, paymentTermsDays } = useWorkspace();

  // Exchange rates — base is always USD (the contract pays in USD)
  const { rates, loading: ratesLoading, error: ratesError, convert, updatedAt } = useExchangeRate("USD");

  const isUSD     = displayCurrency === "USD";
  const isPHP     = displayCurrency === "PHP";
  const showPHP   = !isPHP && !!rates; // show PHP conversion when displaying non-PHP currency
  const symbol    = getCurrencySymbol(displayCurrency);
  const phpSymbol = getCurrencySymbol("PHP");

  const [page, setPage] = useState(1);

  const filtered = useMemo(
    () => sessions.filter((s) =>
      isWithinInterval(parseISO(s.date), { start: startOfDay(start), end: endOfDay(end) })
    ),
    [sessions, start, end]
  );

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage    = Math.min(page, totalPages);

  // Deterministic per period — same invoice number every time you reopen the
  // same date range, rather than a random/incrementing id that would change
  // every render and make the document untrustworthy as a reference.
  const invoiceNumber = useMemo(() => {
    const slug = (workspaceName || "INV").slice(0, 3).toUpperCase().replace(/[^A-Z0-9]/g, "X");
    return `INV-${slug}-${format(start, "yyyyMMdd")}`;
  }, [workspaceName, start]);

  const generatedAt = useMemo(() => new Date(), [start, end, displayCurrency]);
  const dueDate      = useMemo(() => addDays(end, paymentTermsDays), [end, paymentTermsDays]);

  const totalMinutes = filtered.reduce((sum, s) => sum + Number(s.duration_minutes || 0), 0);
  const totalHours   = totalMinutes / 60;
  const totalUSD     = totalHours * hourlyRate;
  const totalDisplay = isUSD ? totalUSD : (convert(totalUSD, displayCurrency) ?? null);
  const totalPHP     = showPHP ? convert(totalUSD, "PHP") : null;

  function displayAmount(usdAmount: number): string {
    if (isUSD) return fmt(usdAmount, symbol);
    const converted = convert(usdAmount, displayCurrency);
    if (converted === null) return "—";
    return fmt(converted, symbol);
  }

  function phpAmount(usdAmount: number): string | null {
    if (!showPHP) return null;
    const converted = convert(usdAmount, "PHP");
    if (converted === null) return null;
    return fmt(converted, phpSymbol);
  }

  if (sessionsLoading) {
    return (
      <div className="flex items-center justify-center gap-2 py-16 text-muted-foreground">
        <Loader2 className="size-4 animate-spin" /> Loading sessions…
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Invoice meta */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground print:hidden">
        <span><span className="font-medium text-foreground">{invoiceNumber}</span></span>
        <span className="opacity-40">·</span>
        <span>Due {format(dueDate, "MMM d, yyyy")} (Net {paymentTermsDays})</span>
      </div>

      {/* Exchange rate notice */}
      {!isUSD && (
        <div className="flex items-center gap-2 rounded-lg border bg-muted/40 px-4 py-2.5 text-xs text-muted-foreground print:hidden">
          <RefreshCw className={`size-3.5 shrink-0 ${ratesLoading ? "animate-spin" : ""}`} />
          {ratesLoading && "Fetching live exchange rates…"}
          {ratesError  && "Could not fetch rates — showing USD only."}
          {!ratesLoading && !ratesError && rates && (
            <span>
              Live rates · 1 USD = {fmt(rates[displayCurrency] ?? 0, symbol)}
              {showPHP && ` · 1 USD = ${fmt(rates["PHP"] ?? 0, phpSymbol)}`}
              {updatedAt && ` · Updated ${new Date(updatedAt).toLocaleString()}`}
            </span>
          )}
        </div>
      )}

      {/* Summary cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="space-y-1 p-6">
            <p className="text-sm text-muted-foreground">Total Hours</p>
            <p className="text-3xl font-bold">{totalHours.toFixed(2)}h</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="space-y-1 p-6">
            <p className="text-sm text-muted-foreground">Rate</p>
            <p className="text-3xl font-bold">
              {isUSD
                ? `$${hourlyRate}/hr`
                : `${displayAmount(hourlyRate)}/hr`}
            </p>
            {!isUSD && (
              <p className="text-xs text-muted-foreground">${hourlyRate} USD/hr</p>
            )}
          </CardContent>
        </Card>

        <Card className="border-primary/40 bg-primary/5">
          <CardContent className="space-y-1 p-6">
            <p className="text-sm text-muted-foreground">Amount Due</p>
            <p className="text-3xl font-bold text-primary">
              {totalDisplay !== null ? fmt(totalDisplay, symbol) : `$${totalUSD.toFixed(2)}`}
            </p>
            {!isUSD && (
              <p className="text-xs text-muted-foreground">${totalUSD.toFixed(2)} USD</p>
            )}
            {totalPHP !== null && !isPHP && (
              <p className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">
                ≈ {fmt(totalPHP, phpSymbol)} PHP
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Printable invoice header */}
      <div className="hidden print:block space-y-2 border-b pb-6">
        <div className="flex items-start justify-between">
          <h1 className="text-2xl font-bold">Invoice</h1>
          <div className="text-right text-sm">
            <p className="font-semibold">{invoiceNumber}</p>
            <p className="text-muted-foreground">Generated {format(generatedAt, "MMMM d, yyyy")}</p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="font-semibold">From</p>
            <p>{contractorName || "—"}</p>
          </div>
          <div>
            <p className="font-semibold">To</p>
            <p>{clientName || "—"}</p>
          </div>
        </div>
        <div className="text-sm mt-2">
          <p><span className="font-semibold">Period:</span> {format(start, "MMMM d, yyyy")} – {format(end, "MMMM d, yyyy")}</p>
          <p><span className="font-semibold">Due Date:</span> {format(dueDate, "MMMM d, yyyy")} (Net {paymentTermsDays})</p>
          <p><span className="font-semibold">Rate:</span> ${hourlyRate}.00 USD / hour</p>
          {!isUSD && totalDisplay !== null && (
            <p><span className="font-semibold">Total ({displayCurrency}):</span> {fmt(totalDisplay, symbol)}</p>
          )}
          {totalPHP !== null && (
            <p><span className="font-semibold">Total (PHP):</span> {fmt(totalPHP, phpSymbol)}</p>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between print:hidden">
        <p className="text-sm text-muted-foreground">
          {filtered.length} session{filtered.length !== 1 ? "s" : ""} in this period
        </p>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2"
            onClick={() => exportSessionsCsv({
              sessions: filtered,
              periodStart: format(start, "yyyy-MM-dd"),
              periodEnd: format(end, "yyyy-MM-dd"),
              hourlyRateUsd: hourlyRate,
              contractorName,
              clientName,
              invoiceNumber,
              generatedAt,
              dueDate,
              displayCurrency,
              convert,
            })}
            disabled={filtered.length === 0}>
            <Download className="size-4" /> Export CSV
          </Button>
          <Button className="gap-2" onClick={() => window.print()} disabled={filtered.length === 0}>
            <FileText className="size-4" /> Print / Save PDF
          </Button>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed py-16 text-center text-muted-foreground">
          No sessions in this period. Adjust the date range above.
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border">
          <Table className="table-fixed w-full">
            <colgroup>
              <col className="w-[110px]" />
              <col className="w-[22%]" />
              <col />
              <col className="w-[90px]" />
              <col className="w-[110px]" />
              {showPHP && <col className="w-[110px]" />}
              <col className="w-[60px]" />
            </colgroup>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Task</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead>Amount ({displayCurrency})</TableHead>
                {showPHP && <TableHead>≈ PHP</TableHead>}
                <TableHead>PR</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((session, idx) => {
                const hours    = Number(session.duration_minutes) / 60;
                const usdAmt   = hours * hourlyRate;
                const php      = phpAmount(usdAmt);
                // Pagination only affects what's shown on screen — printing
                // (Print / Save PDF) always includes every session in the period.
                const inPage   = idx >= (safePage - 1) * PAGE_SIZE && idx < safePage * PAGE_SIZE;
                return (
                  <TableRow key={session.id} className={cn(!inPage && "hidden print:table-row")}>
                    <TableCell className="whitespace-nowrap text-muted-foreground">
                      {format(parseISO(session.date), "MMM d, yyyy")}
                    </TableCell>
                    <TableCell className="truncate font-medium">{session.task}</TableCell>
                    <TableCell className="truncate text-muted-foreground">
                      {session.description || "—"}
                    </TableCell>
                    <TableCell className="whitespace-nowrap font-medium">
                      {formatDuration(Number(session.duration_minutes))}
                    </TableCell>
                    <TableCell className="whitespace-nowrap font-medium text-primary">
                      {displayAmount(usdAmt)}
                    </TableCell>
                    {showPHP && (
                      <TableCell className="whitespace-nowrap text-emerald-600 dark:text-emerald-400">
                        {php ?? "—"}
                      </TableCell>
                    )}
                    <TableCell>
                      {session.github_pr ? (
                        <a href={session.github_pr} target="_blank" rel="noreferrer"
                          className="inline-flex items-center gap-1 text-primary hover:underline">
                          <Globe className="size-3.5" /> PR
                        </a>
                      ) : <span className="text-muted-foreground">—</span>}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>

          <div className="flex items-center justify-between border-t bg-muted/40 px-4 py-3 text-sm font-semibold">
            <span>Total</span>
            <div className="flex items-center gap-6">
              <span>{totalHours.toFixed(2)}h</span>
              <span className="text-primary">
                {totalDisplay !== null ? fmt(totalDisplay, symbol) : `$${totalUSD.toFixed(2)}`}
              </span>
              {totalPHP !== null && !isPHP && (
                <span className="text-emerald-600 dark:text-emerald-400">
                  ≈ {fmt(totalPHP, phpSymbol)}
                </span>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="print:hidden">
        <Pagination page={safePage} totalPages={totalPages} onChange={setPage} />
      </div>
    </div>
  );
}
