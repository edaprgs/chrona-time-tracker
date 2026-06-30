"use client";

import { useState } from "react";
import { Receipt } from "lucide-react";
import { startOfDay, subDays } from "date-fns";
import { useWorkspace } from "@/context/WorkspaceContext";
import InvoicePeriodPicker from "@/components/InvoicePeriodPicker";
import InvoiceTable from "@/components/InvoiceTable";
import PageHeader from "@/components/PageHeader";
import { CURRENCIES } from "@/lib/currencies";

function defaultPeriod(cycleDays: number) {
  const today = startOfDay(new Date());
  const end   = subDays(today, 1);
  const start = subDays(end, cycleDays - 1);
  return { start, end };
}

export default function InvoicePage() {
  const { invoiceCycleDays } = useWorkspace();
  const { start: defaultStart, end: defaultEnd } = defaultPeriod(invoiceCycleDays);
  const [start, setStart]           = useState(defaultStart);
  const [end, setEnd]               = useState(defaultEnd);
  const [displayCurrency, setDisplayCurrency] = useState("USD");

  return (
    <main className="min-h-screen bg-background print:bg-transparent">
      <PageHeader
        icon={Receipt}
        title="Invoice"
        subtitle="Select a billing period to preview, export, or print your invoice."
      />

      <div className="mx-auto max-w-6xl space-y-6 px-4 py-6 md:space-y-8 md:px-6 md:py-10 print:px-0 print:py-4">
      <div className="flex flex-wrap items-end gap-4 print:hidden">
        <div className="flex-1">
          <InvoicePeriodPicker
            start={start}
            end={end}
            onChange={(s, e) => { setStart(s); setEnd(e); }}
          />
        </div>

        <div className="space-y-1">
          <p className="text-xs text-muted-foreground">Display currency</p>
          <select
            className="h-9 rounded-md border border-border bg-background px-3 text-sm"
            value={displayCurrency}
            onChange={(e) => setDisplayCurrency(e.target.value)}
          >
            {CURRENCIES.map((c) => (
              <option key={c.code} value={c.code}>{c.label}</option>
            ))}
          </select>
        </div>
      </div>

      <InvoiceTable start={start} end={end} displayCurrency={displayCurrency} />
      </div>
    </main>
  );
}
