/* src/components/Header.tsx */

"use client";

import { useMemo } from "react";

export default function Header() {
  const today = useMemo(
    () =>
      new Date().toLocaleDateString("en-US", {
        weekday: "long",
        month: "long",
        day: "numeric",
      }),
    []
  );

  return (
    <div>
      <h1 className="text-3xl font-bold">Welcome back, Eda</h1>
      <p className="text-muted-foreground">{today} · Nudgine, LLC</p>
    </div>
  );
}