"use client";

import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface Props {
  page: number;
  totalPages: number;
  onChange: (page: number) => void;
}

export default function Pagination({ page, totalPages, onChange }: Props) {
  if (totalPages <= 1) return null;

  const items = Array.from({ length: totalPages }, (_, i) => i + 1)
    .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
    .reduce<(number | "…")[]>((acc, p, i, arr) => {
      if (i > 0 && p - (arr[i - 1] as number) > 1) acc.push("…");
      acc.push(p);
      return acc;
    }, []);

  return (
    <div className="flex items-center justify-between text-sm text-muted-foreground">
      <span>Page {page} of {totalPages}</span>
      <div className="flex gap-1">
        <Button variant="outline" size="icon" disabled={page === 1} onClick={() => onChange(page - 1)}>
          <ChevronLeft className="size-4" />
        </Button>
        {items.map((item, i) =>
          item === "…" ? (
            <span key={`e-${i}`} className="px-2 py-1">…</span>
          ) : (
            <Button
              key={item}
              variant={item === page ? "default" : "outline"}
              size="icon"
              onClick={() => onChange(item as number)}
              className="size-9"
            >
              {item}
            </Button>
          )
        )}
        <Button variant="outline" size="icon" disabled={page === totalPages} onClick={() => onChange(page + 1)}>
          <ChevronRight className="size-4" />
        </Button>
      </div>
    </div>
  );
}
