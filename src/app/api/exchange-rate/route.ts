import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const from = req.nextUrl.searchParams.get("from") ?? "USD";
  const to   = req.nextUrl.searchParams.get("to")   ?? "PHP";

  try {
    const res  = await fetch(`https://api.frankfurter.app/latest?from=${from}&to=${to}`, {
      next: { revalidate: 300 }, // cache for 5 minutes
    });
    if (!res.ok) throw new Error(`Frankfurter ${res.status}`);
    const data = await res.json();
    const rate = data.rates?.[to] ?? null;
    if (rate === null) throw new Error("Rate not found");
    return NextResponse.json({ rate, from, to });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 502 });
  }
}
