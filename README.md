# Chrona

A time tracker for contractors and freelancers. Log work sessions, capture VS Code and browser activity automatically, and generate client-ready invoices.

Built with **Next.js 16**, **Supabase**, and **Tailwind CSS v4**.

---

## Features

- **Timer** — punch in/out with pause support, idle auto-pause, and midnight auto-split
- **Focus score** — per-session 0–100% score based on active vs. pause time
- **VS Code extension** — logs file edits, git commits, and terminal activity while punched in
- **Chrome extension** — tracks productive browser tabs while punched in
- **Activity log** — all events in a live, searchable log (updates via Supabase Realtime)
- **Dashboard** — stat cards, daily chart, weekly cap ring, top tasks, recent activity
- **Reports** — 52-week heatmap, task breakdown, 6-month trend, all-time summary
- **Invoices** — date range picker, live exchange rates (15+ currencies), PDF print, CSV export
- **Notes** — Google Keep-style notes with rich text, checklists, and color labels
- **Multi-workspace** — separate rate, cap, schedule, and API key per client or project
- **Collapsible sidebar** — desktop collapse + mobile overlay
- **Multi-currency calculator** — quick converter widget in the sidebar

---

## Getting Started

### 1. Clone and install

```bash
git clone <repo>
cd chrona-time-tracker
npm install
```

### 2. Environment variables

Create `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

> `SUPABASE_SERVICE_ROLE_KEY` is only used server-side and is required for the VS Code extension endpoint. Never expose it to the client or commit it.

### 3. Run migrations

Run each file in order in the Supabase SQL Editor (`supabase/migrations/`):

```
001_schema.sql
002_multi_workspace.sql
003_focus_score.sql
004_activity_note.sql
005_backfill_sessions.sql
006_api_keys.sql
007_realtime_activity.sql
008_live_status.sql
009_payment_terms.sql
010_work_schedule.sql
```

### 4. Start the dev server

```bash
npm run dev
```

---

## VS Code Extension

Install from the built `.vsix`:

```bash
cd vscode-extension
npm install && npm run compile
npx vsce package --allow-missing-repository
```

Then in VS Code: **Extensions → ⋯ → Install from VSIX**.

Sign in via the Command Palette: **Chrona: Sign In**. Set `chrona.apiUrl` to your deployed URL (defaults to `http://localhost:3000`).

## Chrome Extension

1. Fill in your Supabase credentials in `chrome-extension/config.js`
2. Go to `chrome://extensions` → **Developer mode** → **Load unpacked** → select `chrome-extension/`

---

## Tech Stack

| | |
|---|---|
| Framework | Next.js 16 (App Router) |
| Database | Supabase (PostgreSQL + Auth + RLS) |
| Styling | Tailwind CSS v4 + shadcn/ui |
| Charts | Recharts |
| Rich text | Tiptap |
| Exchange rates | Frankfurter API |
