/* src/lib/exportCsv.ts */

import { Session } from "@/types/session";
import { HOURLY_RATE_USD } from "@/lib/constants";
import { format } from "date-fns";

export function exportSessionsCsv(
  sessions: Session[],
  periodStart: string,
  periodEnd: string
) {
  const headers = [
    "Date",
    "Task",
    "Description",
    "Duration (min)",
    "Duration (hrs)",
    "Rate (USD/hr)",
    "Amount (USD)",
    "GitHub PR",
    "Start Time",
    "End Time",
  ];

  const rows = sessions.map((s) => {
    const hours = s.duration_minutes / 60;
    const amount = hours * HOURLY_RATE_USD;

    return [
      format(new Date(s.created_at), "yyyy-MM-dd"),
      s.task,
      s.description ?? "",
      s.duration_minutes.toFixed(2),
      hours.toFixed(4),
      HOURLY_RATE_USD.toFixed(2),
      amount.toFixed(2),
      s.github_pr ?? "",
      s.start_time ? format(new Date(s.start_time), "yyyy-MM-dd HH:mm") : "",
      s.end_time ? format(new Date(s.end_time), "yyyy-MM-dd HH:mm") : "",
    ].map((v) => `"${String(v).replace(/"/g, '""')}"`);
  });

  const totalHours = sessions.reduce((sum, s) => sum + s.duration_minutes / 60, 0);
  const totalAmount = totalHours * HOURLY_RATE_USD;

  // Summary footer rows
  rows.push([]);
  rows.push([`"Invoice Period"`, `"${periodStart} to ${periodEnd}"`]);
  rows.push([`"Total Hours"`, `"${totalHours.toFixed(4)}"`]);
  rows.push([`"Rate"`, `"$${HOURLY_RATE_USD}/hr"`]);
  rows.push([`"Total Amount Due"`, `"$${totalAmount.toFixed(2)}"`]);
  rows.push([`"Contractor"`, `"Eda Grace Jutba Paragoso"`]);
  rows.push([`"Client"`, `"Nudgine LLC"`]);

  const csv = [headers.map((h) => `"${h}"`), ...rows]
    .map((r) => r.join(","))
    .join("\n");

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `nudgine-invoice-${periodStart}-to-${periodEnd}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}