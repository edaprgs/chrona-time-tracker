"use client";

import { useEffect, useState, useCallback } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Calculator, DollarSign, RefreshCw, ArrowLeftRight } from "lucide-react";
import { cn } from "@/lib/utils";

// Popular currencies shown in selector
const CURRENCIES = [
  "USD", "PHP", "EUR", "GBP", "JPY", "AUD", "CAD", "SGD",
  "HKD", "KRW", "INR", "MYR", "THB", "IDR", "VND",
];

const CURRENCY_SYMBOLS: Record<string, string> = {
  USD: "$", PHP: "₱", EUR: "€", GBP: "£", JPY: "¥", AUD: "A$",
  CAD: "C$", SGD: "S$", HKD: "HK$", KRW: "₩", INR: "₹",
  MYR: "RM", THB: "฿", IDR: "Rp", VND: "₫",
};

// ── Currency calculator ───────────────────────────────────────────────────────

function CurrencyCalc() {
  const [from, setFrom]       = useState("USD");
  const [to, setTo]           = useState("PHP");
  const [amount, setAmount]   = useState("");
  const [rate, setRate]       = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState<string | null>(null);

  const fetchRate = useCallback(async (f = from, t = to) => {
    if (f === t) { setRate(1); return; }
    setLoading(true); setError(null);
    try {
      const res  = await fetch(`/api/exchange-rate?from=${f}&to=${t}`);
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setRate(data.rate);
    } catch (e) {
      setError((e as Error).message || "Could not load rate");
      setRate(null);
    }
    setLoading(false);
  }, [from, to]);

  useEffect(() => { fetchRate(from, to); }, [from, to]); // eslint-disable-line react-hooks/exhaustive-deps

  const num    = parseFloat(amount);
  const result = !isNaN(num) && rate !== null ? num * rate : null;
  const sym    = CURRENCY_SYMBOLS[to] ?? "";
  const fromSym = CURRENCY_SYMBOLS[from] ?? "";

  function swap() {
    setFrom(to);
    setTo(from);
    setAmount("");
  }

  return (
    <div className="space-y-4">
      {/* Currency selectors */}
      <div className="flex items-center gap-2">
        <select
          value={from}
          onChange={(e) => setFrom(e.target.value)}
          className="flex-1 rounded-lg border bg-background px-2 py-1.5 text-sm font-medium"
        >
          {CURRENCIES.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        <button
          onClick={swap}
          className="rounded-lg border p-1.5 hover:bg-muted transition-colors"
          title="Swap currencies"
        >
          <ArrowLeftRight className="size-3.5 text-muted-foreground" />
        </button>
        <select
          value={to}
          onChange={(e) => setTo(e.target.value)}
          className="flex-1 rounded-lg border bg-background px-2 py-1.5 text-sm font-medium"
        >
          {CURRENCIES.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      {/* Rate display */}
      <div className="flex items-center justify-between text-xs">
        <p className="text-muted-foreground">
          {loading && "Fetching live rate…"}
          {error   && <span className="text-destructive">{error}</span>}
          {!loading && !error && rate !== null && (
            <span>1 {from} = <span className="font-semibold text-foreground">{sym}{rate.toFixed(4)} {to}</span></span>
          )}
        </p>
        <button
          onClick={() => fetchRate(from, to)}
          disabled={loading}
          className="flex items-center gap-1 rounded-md px-2 py-1 text-[11px] text-muted-foreground hover:bg-muted transition-colors"
        >
          <RefreshCw className={cn("size-3", loading && "animate-spin")} />
          Refresh
        </button>
      </div>

      {/* Amount input */}
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-medium text-muted-foreground">{fromSym}</span>
        <input
          type="number"
          placeholder="0.00"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="w-full rounded-xl border bg-muted/30 py-3 pl-8 pr-4 text-lg font-semibold tabular-nums outline-none focus:ring-2 focus:ring-primary/30"
        />
      </div>

      {/* Result */}
      <div className="rounded-xl border bg-primary/5 px-4 py-3 text-center">
        <p className="text-2xl font-bold tabular-nums text-primary">
          {result !== null
            ? `${sym}${result.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
            : `${sym}-`}
        </p>
        <p className="mt-0.5 text-[11px] text-muted-foreground">{to}</p>
      </div>

      {/* Quick amounts */}
      <div className="grid grid-cols-4 gap-1.5">
        {[5, 10, 25, 50, 100, 500, 1000, 2000].map((amt) => (
          <button
            key={amt}
            onClick={() => setAmount(String(amt))}
            className={cn(
              "rounded-lg border px-2 py-1.5 text-xs font-medium transition-colors",
              num === amt ? "border-primary bg-primary/10 text-primary" : "hover:bg-muted"
            )}
          >
            {fromSym}{amt}
          </button>
        ))}
      </div>
    </div>
  );
}

// ── Arithmetic calculator ─────────────────────────────────────────────────────

const BUTTONS = [
  ["C", "+/-", "%", "/"],
  ["7", "8",   "9",  "x"],
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

    if (["+", "-", "x", "/"].includes(val)) {
      setPrev(display); setOp(val); setFresh(true); return;
    }

    if (val === "=") {
      if (!prev || !op) return;
      const a = parseFloat(prev), b = parseFloat(display);
      const result = op === "+" ? a + b : op === "-" ? a - b : op === "x" ? a * b : a / b;
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
      <div className="rounded-xl border bg-muted/30 px-4 py-3 text-right">
        {op && prev && (
          <p className="text-[11px] text-muted-foreground tabular-nums">{prev} {op}</p>
        )}
        <p className="text-3xl font-bold tabular-nums leading-none">{display}</p>
      </div>

      <div className="grid gap-1.5" style={{ gridTemplateColumns: "repeat(4, 1fr)" }}>
        {BUTTONS.flat().map((btn, i) => {
          const isOp    = ["+", "-", "x", "/"].includes(btn);
          const isEq    = btn === "=";
          const isClear = btn === "C";
          const isZero  = btn === "0";
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
  const [open, setOpen] = useState(false);
  const [tab, setTab]   = useState<Tab>("currency");

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 z-40 flex size-12 items-center justify-center rounded-full bg-primary shadow-lg shadow-primary/30 text-primary-foreground transition-transform hover:scale-105 active:scale-95 print:hidden"
        aria-label="Open calculator"
      >
        <Calculator className="size-5" />
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="w-[calc(100vw-2rem)] max-w-xs p-0 gap-0 overflow-hidden">
          <DialogHeader className="px-5 pt-5 pb-0">
            <DialogTitle className="text-base">Quick Tools</DialogTitle>
          </DialogHeader>

          <div className="flex border-b mx-5 mt-3">
            {([
              { id: "currency", label: "Currency", icon: DollarSign },
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
