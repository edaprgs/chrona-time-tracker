import type { Session } from "@/types/session";
import { format, parseISO } from "date-fns";

interface ExportCsvOptions {
  sessions: Session[];
  periodStart: string;
  periodEnd: string;
  hourlyRateUsd: number;
  contractorName: string;
  clientName: string;
  invoiceNumber: string;
  generatedAt: Date;
  dueDate: Date;
  // When set and not "USD", an extra "Amount (<currency>)" column is added —
  // without this the CSV would only ever show USD even if the client is
  // viewing (and expecting) a different currency on the invoice page.
  displayCurrency?: string;
  convert?: (usdAmount: number, currency: string) => number | null;
}

export function exportSessionsCsv({
  sessions,
  periodStart,
  periodEnd,
  hourlyRateUsd,
  contractorName,
  clientName,
  invoiceNumber,
  generatedAt,
  dueDate,
  displayCurrency,
  convert,
}: ExportCsvOptions) {
  const showConverted = !!displayCurrency && displayCurrency !== "USD" && !!convert;

  const headers = [
    "Date",
    "Task",
    "Description",
    "Duration (min)",
    "Duration (hrs)",
    "Focus Score (%)",
    "Rate (USD/hr)",
    "Amount (USD)",
    ...(showConverted ? [`Amount (${displayCurrency})`] : []),
    "GitHub PR",
    "PR Status",
    "Start Time",
    "End Time",
  ];

  const rows = sessions.map((s) => {
    const hours  = Number(s.duration_minutes) / 60;
    const amount = hours * hourlyRateUsd;
    const converted = showConverted ? convert!(amount, displayCurrency!) : null;
    return [
      format(parseISO(s.date), "yyyy-MM-dd"),
      s.task,
      s.description ?? "",
      Number(s.duration_minutes).toFixed(2),
      hours.toFixed(4),
      s.focus_score !== null ? Number(s.focus_score).toFixed(0) : "",
      hourlyRateUsd.toFixed(2),
      amount.toFixed(2),
      ...(showConverted ? [converted !== null ? converted.toFixed(2) : ""] : []),
      s.github_pr ?? "",
      s.pr_status ?? "",
      s.start_time ? format(new Date(s.start_time), "yyyy-MM-dd HH:mm") : "",
      s.end_time   ? format(new Date(s.end_time),   "yyyy-MM-dd HH:mm") : "",
    ].map((v) => `"${String(v).replace(/"/g, '""')}"`);
  });

  const totalHours  = sessions.reduce((sum, s) => sum + Number(s.duration_minutes) / 60, 0);
  const totalAmount = totalHours * hourlyRateUsd;
  const totalConverted = showConverted ? convert!(totalAmount, displayCurrency!) : null;

  rows.push([]);
  rows.push([`"Invoice Number"`,   `"${invoiceNumber}"`]);
  rows.push([`"Invoice Period"`,   `"${periodStart} to ${periodEnd}"`]);
  rows.push([`"Generated On"`,     `"${format(generatedAt, "yyyy-MM-dd HH:mm")}"`]);
  rows.push([`"Due Date"`,         `"${format(dueDate, "yyyy-MM-dd")}"`]);
  rows.push([`"Total Hours"`,      `"${totalHours.toFixed(4)}"`]);
  rows.push([`"Rate (USD/hr)"`,    `"$${hourlyRateUsd.toFixed(2)}"`]);
  rows.push([`"Total Amount Due"`, `"$${totalAmount.toFixed(2)} USD"`]);
  if (showConverted && totalConverted !== null) {
    rows.push([`"Total Amount Due (${displayCurrency})"`, `"${totalConverted.toFixed(2)} ${displayCurrency}"`]);
  }
  rows.push([`"Contractor"`,       `"${contractorName}"`]);
  rows.push([`"Client"`,           `"${clientName}"`]);

  const csv = [headers.map((h) => `"${h}"`), ...rows]
    .map((r) => r.join(","))
    .join("\n");

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url  = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href     = url;
  // Slugify client/contractor name into the filename so multiple clients
  // don't all produce identically-named "invoice-<dates>.csv" files.
  const who = (clientName || contractorName || "invoice")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
  link.download = `${who || "invoice"}-${periodStart}-to-${periodEnd}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}
