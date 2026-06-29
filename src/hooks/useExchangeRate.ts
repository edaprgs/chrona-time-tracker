"use client";

import { useEffect, useState } from "react";

export interface Rates {
  [currency: string]: number;
}

interface State {
  rates: Rates | null;
  loading: boolean;
  error: boolean;
  updatedAt: string | null;
}

// Keyed by base currency so we cache per base
const cache: Record<string, { rates: Rates; updatedAt: string; fetchedAt: number }> = {};
const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes

export function useExchangeRate(base: string = "USD") {
  const [state, setState] = useState<State>({ rates: null, loading: true, error: false, updatedAt: null });

  useEffect(() => {
    let cancelled = false;

    async function fetchRates() {
      const cached = cache[base];
      if (cached && Date.now() - cached.fetchedAt < CACHE_TTL_MS) {
        if (!cancelled) setState({ rates: cached.rates, loading: false, error: false, updatedAt: cached.updatedAt });
        return;
      }

      setState((s) => ({ ...s, loading: true, error: false }));
      try {
        const res = await fetch(`https://open.er-api.com/v6/latest/${base}`);
        const json = await res.json();
        if (json.result === "success") {
          const entry = { rates: json.rates as Rates, updatedAt: json.time_last_update_utc, fetchedAt: Date.now() };
          cache[base] = entry;
          if (!cancelled) setState({ rates: entry.rates, loading: false, error: false, updatedAt: entry.updatedAt });
        } else {
          if (!cancelled) setState((s) => ({ ...s, loading: false, error: true }));
        }
      } catch {
        if (!cancelled) setState((s) => ({ ...s, loading: false, error: true }));
      }
    }

    fetchRates();
    return () => { cancelled = true; };
  }, [base]);

  function convert(amountInBase: number, to: string): number | null {
    if (!state.rates) return null;
    const rate = state.rates[to];
    if (!rate) return null;
    return amountInBase * rate;
  }

  return { ...state, convert };
}
