/* src/hooks/useSessions.ts */

"use client";

// Sessions now live in a shared context (src/context/SessionsContext.tsx) so
// that every component sees the same data and stays in sync after a save,
// edit, or delete. This file is kept only so existing imports keep working.
export { useSessionsContext as useSessions } from "@/context/SessionsContext";