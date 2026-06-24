/* src/components/InvoiceTable.tsx */

"use client";

import { useMemo } from "react";
import { format, isWithinInterval, startOfDay, endOfDay } from "date-fns";
import { useSessionsContext } from "@/context/SessionsContext";
import { HOURLY_RATE_USD } from "@/lib/constants";
import { exportSessionsCsv } from "@/lib/exportCsv";
import { Session } from "@/types/session";

import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Download, FileText, Globe, Loader2 } from "lucide-react";

function formatDuration(totalMinutes: number) {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = Math.round(totalMinutes % 60);
  if (hours === 0) return `${minutes}m`;
  if (minutes === 0) return `${hours}h`;
  return `${hours}h ${minutes}m`;
}

interface Props {
  start: Date;
  end: Date;
}

export default function InvoiceTable({ start, end }: Props) {
  const { sessions, loading } = useSessionsContext();

  const filtered = useMemo(
    () =>
      sessions.filter((s) =>
        isWithinInterval(new Date(s.created_at), {
          start: startOfDay(start),
          end: endOfDay(end),
        })
      ),
    [sessions, start, end]
  );

  const totalMinutes = filtered.reduce((sum, s) => sum + (s.duration_minutes || 0), 0);
  const totalHours = totalMinutes / 60;
  const totalAmount = totalHours * HOURLY_RATE_USD;

  const periodStart = format(start, "yyyy-MM-dd");
  const periodEnd = format(end, "yyyy-MM-dd");

  function handleExportCsv() {
    exportSessionsCsv(filtered, periodStart, periodEnd);
  }

  function handlePrintInvoice() {
    window.print();
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
    <div className="space-y-6">
      {/* Invoice summary card */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="border-border/60">
          <CardContent className="space-y-1 p-6">
            <p className="text-sm text-muted-foreground">Total Hours</p>
            <p className="text-3xl font-bold">{totalHours.toFixed(2)}h</p>
          </CardContent>
        </Card>

        <Card className="border-border/60">
          <CardContent className="space-y-1 p-6">
            <p className="text-sm text-muted-foreground">Rate</p>
            <p className="text-3xl font-bold">${HOURLY_RATE_USD}/hr</p>
          </CardContent>
        </Card>

        <Card className="border-border/60 border-primary/40 bg-primary/5">
          <CardContent className="space-y-1 p-6">
            <p className="text-sm text-muted-foreground">Amount Due</p>
            <p className="text-3xl font-bold text-primary">${totalAmount.toFixed(2)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Invoice header (visible in print) */}
      <div className="hidden print:block space-y-2 border-b pb-6">
        <h1 className="text-2xl font-bold">Invoice</h1>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="font-semibold">From</p>
            <p>Eda Grace Jutba Paragoso</p>
            <p>Lancaster New City, General Trias, Cavite, Philippines</p>
            <p>edaparagoso2002@gmail.com</p>
          </div>
          <div>
            <p className="font-semibold">To</p>
            <p>Nudgine LLC</p>
            <p>502 Lupine Drive, Alpine, Utah, USA 84004</p>
            <p>bryce@nudgine.app</p>
          </div>
        </div>
        <div className="text-sm mt-2">
          <p><span className="font-semibold">Period:</span> {format(start, "MMMM d, yyyy")} – {format(end, "MMMM d, yyyy")}</p>
          <p><span className="font-semibold">Rate:</span> ${HOURLY_RATE_USD}.00 / hour</p>
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex items-center justify-between print:hidden">
        <p className="text-sm text-muted-foreground">
          {filtered.length} session{filtered.length !== 1 ? "s" : ""} in this period
        </p>

        <div className="flex gap-2">
          <Button
            variant="outline"
            className="gap-2"
            onClick={handleExportCsv}
            disabled={filtered.length === 0}
          >
            <Download className="size-4" />
            Export CSV
          </Button>

          <Button
            className="gap-2"
            onClick={handlePrintInvoice}
            disabled={filtered.length === 0}
          >
            <FileText className="size-4" />
            Print / Save PDF
          </Button>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed py-16 text-center text-muted-foreground">
          No sessions in this period. Adjust the date range above.
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Task</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>PR</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {filtered.map((session) => {
                const hours = session.duration_minutes / 60;
                const amount = hours * HOURLY_RATE_USD;

                return (
                  <TableRow key={session.id}>
                    <TableCell className="whitespace-nowrap text-muted-foreground">
                      {format(new Date(session.created_at), "MMM d, yyyy")}
                    </TableCell>

                    <TableCell className="font-medium">{session.task}</TableCell>

                    <TableCell className="max-w-xs truncate text-muted-foreground">
                      {session.description || "—"}
                    </TableCell>

                    <TableCell className="whitespace-nowrap font-medium">
                      {formatDuration(session.duration_minutes)}
                    </TableCell>

                    <TableCell className="whitespace-nowrap font-medium text-primary">
                      ${amount.toFixed(2)}
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
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>

          {/* Totals row */}
          <div className="flex items-center justify-between border-t bg-muted/40 px-4 py-3 text-sm font-semibold">
            <span>Total</span>
            <div className="flex gap-8">
              <span>{totalHours.toFixed(2)}h</span>
              <span className="text-primary">${totalAmount.toFixed(2)}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}