/* src/components/InvoicePeriodPicker.tsx */

"use client";

import { addDays, format, startOfDay, subDays } from "date-fns";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { INVOICE_CYCLE_DAYS } from "@/lib/constants";

interface Props {
  start: Date;
  end: Date;
  onChange: (start: Date, end: Date) => void;
}

export default function InvoicePeriodPicker({ start, end, onChange }: Props) {
  function shiftPeriod(direction: -1 | 1) {
    const days = INVOICE_CYCLE_DAYS * direction;
    onChange(addDays(start, days), addDays(end, days));
  }

  function handleStartChange(value: string) {
    const newStart = startOfDay(new Date(value + "T00:00:00"));
    const newEnd = addDays(newStart, INVOICE_CYCLE_DAYS - 1);
    onChange(newStart, newEnd);
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <Button
        variant="outline"
        size="icon"
        onClick={() => shiftPeriod(-1)}
        title="Previous period"
      >
        <ChevronLeft className="size-4" />
      </Button>

      <div className="flex items-center gap-2">
        <div className="space-y-0.5">
          <p className="text-xs text-muted-foreground">From</p>
          <Input
            type="date"
            value={format(start, "yyyy-MM-dd")}
            onChange={(e) => handleStartChange(e.target.value)}
            className="w-40"
          />
        </div>

        <span className="mt-4 text-muted-foreground">→</span>

        <div className="space-y-0.5">
          <p className="text-xs text-muted-foreground">To</p>
          <Input
            type="date"
            value={format(end, "yyyy-MM-dd")}
            readOnly
            className="w-40 cursor-default bg-muted"
          />
        </div>
      </div>

      <Button
        variant="outline"
        size="icon"
        onClick={() => shiftPeriod(1)}
        title="Next period"
        disabled={end >= subDays(new Date(), 0)}
      >
        <ChevronRight className="size-4" />
      </Button>

      <p className="text-sm text-muted-foreground">
        {INVOICE_CYCLE_DAYS}-day billing cycle
      </p>
    </div>
  );
}