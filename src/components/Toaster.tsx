/* src/components/Toaster.tsx */

"use client";

import { useToast } from "@/hooks/useToast";
import { cn } from "@/lib/utils";
import { X, CheckCircle2, AlertCircle, Info } from "lucide-react";

const icons = {
  success: CheckCircle2,
  destructive: AlertCircle,
  default: Info,
};

const styles = {
  success:
    "border-green-200 bg-green-50 text-green-900 dark:border-green-800 dark:bg-green-950/60 dark:text-green-100",
  destructive:
    "border-destructive/30 bg-destructive/10 text-destructive dark:bg-destructive/20",
  default:
    "border-border bg-card text-foreground",
};

export default function Toaster() {
  const { toasts, dismiss } = useToast();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2">
      {toasts.map((t) => {
        const Icon = icons[t.variant ?? "default"];
        return (
          <div
            key={t.id}
            className={cn(
              "flex items-start gap-3 rounded-xl border px-4 py-3 shadow-lg",
              "animate-in slide-in-from-bottom-2 fade-in duration-200",
              "min-w-64 max-w-sm text-sm",
              styles[t.variant ?? "default"]
            )}
          >
            <Icon className="mt-0.5 size-4 shrink-0" />
            <span className="flex-1">{t.message}</span>
            <button
              onClick={() => dismiss(t.id)}
              className="ml-1 shrink-0 opacity-60 hover:opacity-100 transition-opacity"
              aria-label="Dismiss"
            >
              <X className="size-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
}