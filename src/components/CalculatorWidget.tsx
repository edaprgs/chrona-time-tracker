"use client";

import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Calculator, DollarSign, RefreshCw, X } from "lucide-react";
import { cn } from "@/lib/utils";

// ── Currency calculator ───────────────────────────────────────────────────────

function CurrencyCalc() {
  const [usd, setUsd]         = useState("");
  const [rate, setRate]       = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState(false);

  async function fetchRate() {
    setLoading(true); setError(false);
    try {
      const res  = await fetch("https://api.frankfurter.app/latest?from=USD&to=PHP");
      const data = await res.json();
      setRate(data.rates?.PHP ?? null);
    } catch {
      setError(true);
    }
    setLoading(false);
  }

  useEffect(() => { fetchRate(); }, []);

  const usdNum = parseFloat(usd);
  const php    = !isNaN(usdNum) && rate ? usdNum * rate : null;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">
          {loading && "Fetching live rate…"}
          {error   && "Could not load rate."}
          {!loading && !error && rate && (
            <span>1 USD = <span className="font-semibold text-foreground">₱{rate.toFixed(2)}</span></span>
          )}
        </p>
        <button
          onClick={fetchRate}
          disabled={loading}
          className="flex items-center gap-1 rounded-md px-2 py-1 text-[11px] text-muted-foreground hover:bg-muted transition-colors"
        >
          <RefreshCw className={cn("size-3", loading && "animate-spin")} />
          Refresh
        </button>
      </div>

      <div className="space-y-2">
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-medium text-muted-foreground">$</span>
          <input
            type="number"
            placeholder="0.00"
            value={usd}
            onChange={(e) => setUsd(e.target.value)}
            className="w-full rounded-xl border bg-muted/30 py-3 pl-8 pr-4 text-lg font-semibold tabular-nums outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>

        <div className="flex items-center justify-center">
          <span className="text-xs text-muted-foreground">converts to</span>
        </div>

        <div className="rounded-xl border bg-primary/5 px-4 py-3 text-center">
          <p className="text-2xl font-bold tabular-nums text-primary">
            {php !== null ? `₱${php.toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : "₱—"}
          </p>
          <p className="mt-0.5 text-[11px] text-muted-foreground">Philippine Peso</p>
        </div>
      </div>

      {/* Quick amounts */}
      <div className="grid grid-cols-4 gap-1.5">
        {[5, 10, 25, 50, 100, 500, 1000, 2000].map((amt) => (
          <button
            key={amt}
            onClick={() => setUsd(String(amt))}
            className={cn(
              "rounded-lg border px-2 py-1.5 text-xs font-medium transition-colors",
              usdNum === amt ? "border-primary bg-primary/10 text-primary" : "hover:bg-muted"
            )}
          >
            ${amt}
          </button>
        ))}
      </div>
    </div>
  );
}

// ── Arithmetic calculator ─────────────────────────────────────────────────────

const BUTTONS = [
  ["C", "+/-", "%", "/"],
  ["7", "8",   "9",  "×"],
  ["4", "5",   "6",  "-"],
  ["1", "2",   "3",  "+"],
  ["0",        ".",  "="],
];

function ArithCalc() {
  const [display, setDisplay] = useState("0");
  const [prev, setPrev]       = useState<string | null>(null);
  const [op, setOp]           = useState<string | null>(null);
  const [fresh, setFresh]     = useState(false);

  function handleBtn(val: string) {
    if (val === "C") {
      setDisplay("0"); setPrev(null); setOp(null); setFresh(false); return;
    }
    if (val === "+/-") { setDisplay((d) => d.startsWith("-") ? d.slice(1) : "-" + d); return; }
    if (val === "%") { setDisplay((d) => String(parseFloat(d) / 100)); return; }

    if (["+", "-", "×", "/"].includes(val)) {
      setPrev(display); setOp(val); setFresh(true); return;
    }

    if (val === "=") {
      if (!prev || !op) return;
      const a = parseFloat(prev), b = parseFloat(display);
      const result = op === "+" ? a + b : op === "-" ? a - b : op === "×" ? a * b : a / b;
      const str = isFinite(result) ? String(parseFloat(result.toFixed(10))) : "Error";
      setDisplay(str); setPrev(null); setOp(null); setFresh(false); return;
    }

    if (val === ".") {
      const cur = fresh ? "0" : display;
      if (cur.includes(".")) return;
      setDisplay(cur + "."); setFresh(false); return;
    }

    if (fresh || display === "0") { setDisplay(val); setFresh(false); }
    else setDisplay((d) => d.length < 12 ? d + val : d);
  }

  return (
    <div className="space-y-3">
      {/* Display */}
      <div className="rounded-xl border bg-muted/30 px-4 py-3 text-right">
        {op && prev && (
          <p className="text-[11px] text-muted-foreground tabular-nums">{prev} {op}</p>
        )}
        <p className="text-3xl font-bold tabular-nums leading-none">{display}</p>
      </div>

      {/* Buttons */}
      <div className="grid gap-1.5" style={{ gridTemplateColumns: "repeat(4, 1fr)" }}>
        {BUTTONS.flat().map((btn, i) => {
          const isOp     = ["+", "-", "×", "/"].includes(btn);
          const isEq     = btn === "=";
          const isClear  = btn === "C";
          const isZero   = btn === "0";
          return (
            <button
              key={i}
              onClick={() => handleBtn(btn)}
              style={isZero ? { gridColumn: "span 2" } : undefined}
              className={cn(
                "rounded-xl py-3.5 text-sm font-semibold transition-colors active:scale-95",
                isEq    ? "bg-primary text-primary-foreground hover:bg-primary/90"
                : isOp  ? "bg-primary/10 text-primary hover:bg-primary/20"
                : isClear ? "bg-destructive/10 text-destructive hover:bg-destructive/20"
                : "bg-muted hover:bg-muted/70 text-foreground"
              )}
            >
              {btn}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ── Widget shell ──────────────────────────────────────────────────────────────

type Tab = "currency" | "calc";

export default function CalculatorWidget() {
  const [open, setOpen]     = useState(false);
  const [tab, setTab]       = useState<Tab>("currency");

  return (
    <>
      {/* Floating trigger */}
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 z-40 flex size-12 items-center justify-center rounded-full bg-primary shadow-lg shadow-primary/30 text-primary-foreground transition-transform hover:scale-105 active:scale-95 print:hidden"
        aria-label="Open calculator"
      >
        <Calculator className="size-5" />
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-xs p-0 gap-0 overflow-hidden">
          <DialogHeader className="px-5 pt-5 pb-0">
            <div className="flex items-center justify-between">
              <DialogTitle className="text-base">Quick Tools</DialogTitle>
            </div>
          </DialogHeader>

          {/* Tabs */}
          <div className="flex border-b mx-5 mt-3">
            {([
              { id: "currency", label: "USD → PHP", icon: DollarSign },
              { id: "calc",     label: "Calculator", icon: Calculator },
            ] as { id: Tab; label: string; icon: React.ElementType }[]).map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setTab(id)}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-2 text-xs font-medium border-b-2 -mb-px transition-colors",
                  tab === id
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                )}
              >
                <Icon className="size-3.5" />
                {label}
              </button>
            ))}
          </div>

          <div className="px-5 py-4">
            {tab === "currency" ? <CurrencyCalc /> : <ArithCalc />}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
