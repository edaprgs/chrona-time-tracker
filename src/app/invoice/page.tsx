/* src/app/invoice/page.tsx */

"use client";

import { useState } from "react";
import { startOfDay, subDays, addDays } from "date-fns";
import { INVOICE_CYCLE_DAYS } from "@/lib/constants";
import InvoicePeriodPicker from "@/components/InvoicePeriodPicker";
import InvoiceTable from "@/components/InvoiceTable";

function defaultPeriod() {
  // Most recent completed biweekly cycle ending yesterday
  const today = startOfDay(new Date());
  const end = subDays(today, 1);
  const start = subDays(end, INVOICE_CYCLE_DAYS - 1);
  return { start, end };
}

export default function InvoicePage() {
  const { start: defaultStart, end: defaultEnd } = defaultPeriod();
  const [start, setStart] = useState(defaultStart);
  const [end, setEnd] = useState(defaultEnd);

  return (
    <main className="mx-auto max-w-6xl space-y-8 px-6 py-10 print:px-0 print:py-4">
      <div className="print:hidden">
        <h1 className="text-3xl font-bold">Invoice</h1>
        <p className="text-muted-foreground">
          Select a billing period to preview, export, or print your invoice.
        </p>
      </div>

      <div className="print:hidden">
        <InvoicePeriodPicker
          start={start}
          end={end}
          onChange={(s, e) => {
            setStart(s);
            setEnd(e);
          }}
        />
      </div>

      <InvoiceTable start={start} end={end} />
    </main>
  );
}