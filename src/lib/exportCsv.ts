import type { Session } from "@/types/session";
import { format, parseISO } from "date-fns";

export function exportSessionsCsv(
  sessions: Session[],
  periodStart: string,
  periodEnd: string,
  hourlyRateUsd: number,
  contractorName: string,
  clientName: string,
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
    "PR Status",
    "Start Time",
    "End Time",
  ];

  const rows = sessions.map((s) => {
    const hours  = Number(s.duration_minutes) / 60;
    const amount = hours * hourlyRateUsd;
    return [
      format(parseISO(s.date), "yyyy-MM-dd"),
      s.task,
      s.description ?? "",
      Number(s.duration_minutes).toFixed(2),
      hours.toFixed(4),
      hourlyRateUsd.toFixed(2),
      amount.toFixed(2),
      s.github_pr ?? "",
      s.pr_status ?? "",
      s.start_time ? format(new Date(s.start_time), "yyyy-MM-dd HH:mm") : "",
      s.end_time   ? format(new Date(s.end_time),   "yyyy-MM-dd HH:mm") : "",
    ].map((v) => `"${String(v).replace(/"/g, '""')}"`);
  });

  const totalHours  = sessions.reduce((sum, s) => sum + Number(s.duration_minutes) / 60, 0);
  const totalAmount = totalHours * hourlyRateUsd;

  rows.push([]);
  rows.push([`"Invoice Period"`,   `"${periodStart} to ${periodEnd}"`]);
  rows.push([`"Total Hours"`,      `"${totalHours.toFixed(4)}"`]);
  rows.push([`"Rate (USD/hr)"`,    `"$${hourlyRateUsd.toFixed(2)}"`]);
  rows.push([`"Total Amount Due"`, `"$${totalAmount.toFixed(2)} USD"`]);
  rows.push([`"Contractor"`,       `"${contractorName}"`]);
  rows.push([`"Client"`,           `"${clientName}"`]);

  const csv = [headers.map((h) => `"${h}"`), ...rows]
    .map((r) => r.join(","))
    .join("\n");

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url  = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href     = url;
  link.download = `invoice-${periodStart}-to-${periodEnd}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}
