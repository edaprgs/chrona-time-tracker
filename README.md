# Chrona — Time Tracker

A personal SaaS-ready time tracker built with Next.js, Supabase, and Tailwind CSS. Track work sessions, log activity, manage workspaces, and export invoices.

## Features

- **Timer** — punch in/out with pause support, idle auto-pause after 30 min, midnight auto-split
- **Focus Score** — calculated per session from pause logs (0–100%)
- **Session Templates** — save and reuse common task setups
- **Multi-workspace** — separate workspaces per client or project, each with its own rate and settings
- **Activity Log** — auto-tracked VS Code events + Chrome browser visits + manual entries
- **Daily & Weekly Charts** — visualize hours worked per day and weekly goal progress
- **Streak Tracker** — consecutive days worked
- **Sessions Table** — search, filter, sort, edit, delete all sessions
- **CSV / Invoice Export** — export sessions as invoice-ready CSV with USD earnings
- **Chrome Extension** — tracks productive browser tabs while punched in

## Tech Stack

- **Framework**: Next.js (App Router)
- **Database**: Supabase (PostgreSQL + Auth + Row Level Security)
- **Styling**: Tailwind CSS v4 + shadcn/ui
- **State**: React Context (Auth, Workspace, Sessions)

## Getting Started

### 1. Clone and install

```bash
git clone <repo>
cd chrona-time-tracker
npm install
```

### 2. Set up environment variables

Create `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

> `SUPABASE_SERVICE_ROLE_KEY` is required for the VS Code extension activity endpoint. Find it in Supabase → Project Settings → API.

### 3. Run database migrations

Run each file **in order** in the Supabase SQL Editor:

| File | Description |
|------|-------------|
| `supabase/migrations/001_schema.sql` | Base tables, RLS, indexes |
| `supabase/migrations/002_multi_workspace.sql` | Multi-workspace support |
| `supabase/migrations/003_focus_score.sql` | Focus score column on sessions |
| `supabase/migrations/004_activity_note.sql` | Note column on activity_events |
| `supabase/migrations/005_backfill_sessions.sql` | Fix old sessions missing user_id/workspace_id |

### 4. Start the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Chrome Extension

Tracks browser tabs (GitHub, Linear, Figma, Notion, etc.) while punched in. Blocks social and entertainment sites automatically. Pauses when you pause the timer.

### Install

1. Open `chrome-extension/config.js` — fill in your Supabase URL and anon key if not already set
2. Go to `chrome://extensions` in Chrome → Enable **Developer mode** → **Load unpacked** → select the `chrome-extension/` folder
3. Open Chrona in a tab and sign in — the extension connects automatically (no login needed in the extension)

### Blocked sites

YouTube, Instagram, Facebook, Twitter/X, TikTok, Netflix, Reddit, LinkedIn, Pinterest, Twitch, Spotify, and more.

## VS Code Extension

The companion extension sends file edit, save, terminal, and git commit events to `/api/activity`. Requires `SUPABASE_SERVICE_ROLE_KEY` to be set in your environment.

## Project Structure

```
src/
  app/                  # Next.js App Router pages
    api/activity/       # VS Code extension webhook
    sessions/           # Sessions table page
    settings/           # Workspace settings page
  components/           # UI components
  context/              # React contexts (Auth, Workspace, Sessions)
  hooks/                # Custom hooks (useStats, useToast)
  lib/                  # Utilities (exportCsv, session-utils, supabase)
  types/                # TypeScript interfaces
chrome-extension/       # Chrome browser activity tracker
supabase/migrations/    # Database migration SQL files
```

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅ | Supabase anon key (public) |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ for VS Code ext | Service role key (server-side only, never commit) |
