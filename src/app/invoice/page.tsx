"use client";

import { useState } from "react";
import { startOfDay, subDays } from "date-fns";
import { useWorkspace } from "@/context/WorkspaceContext";
import InvoicePeriodPicker from "@/components/InvoicePeriodPicker";
import InvoiceTable from "@/components/InvoiceTable";

export const CURRENCIES = [
  { code: "USD", label: "USD — US Dollar",          symbol: "$"   },
  { code: "PHP", label: "PHP — Philippine Peso",     symbol: "₱"   },
  { code: "EUR", label: "EUR — Euro",                symbol: "€"   },
  { code: "GBP", label: "GBP — British Pound",       symbol: "£"   },
  { code: "AUD", label: "AUD — Australian Dollar",   symbol: "A$"  },
  { code: "SGD", label: "SGD — Singapore Dollar",    symbol: "S$"  },
  { code: "JPY", label: "JPY — Japanese Yen",        symbol: "¥"   },
  { code: "CAD", label: "CAD — Canadian Dollar",     symbol: "CA$" },
];

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
    <main className="mx-auto max-w-6xl space-y-6 px-4 py-6 md:space-y-8 md:px-6 md:py-10 print:px-0 print:py-4">
      <div className="print:hidden">
        <h1 className="text-3xl font-bold">Invoice</h1>
        <p className="text-muted-foreground">
          Select a billing period to preview, export, or print your invoice.
        </p>
      </div>

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
    </main>
  );
}
