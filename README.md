# Chrona — Time Tracker

A personal SaaS-ready time tracker built with Next.js, Supabase, and Tailwind CSS. Track work sessions, log activity, manage workspaces, and export invoices.

## Features

- **Timer** — punch in/out with pause support, idle auto-pause after 30 min, midnight auto-split
- **Focus Score** — calculated per session from pause logs (0–100%)
- **Multi-workspace** — separate workspaces per client or project, each with its own rate and settings
- **Activity Log** — auto-tracked VS Code events + Chrome browser visits + manual entries
- **Streak Tracker** — consecutive days worked, displayed in header
- **Weekly Cap & Overtime Alert** — set a weekly hour cap; banner + toast fire when you exceed it
- **Sessions Table** — search, filter, sort, paginate, edit, delete all sessions; PR status dropdown per session
- **Invoice Page** — date-range picker, live exchange rates (USD → PHP and others), printable PDF invoice
- **CSV Export** — invoice-ready CSV with USD earnings
- **Reports Page** — all-time summary, GitHub-style activity heatmap, top tasks bar chart, 6-month trend
- **Notes Page** — Google Keep-style notes with rich text (Tiptap), checklists, color backgrounds, labels, pin, image upload, emoji picker, delete confirmation
- **Dashboard** — stat cards, daily/weekly charts, top tasks this week, notes widget, recent activity
- **Mobile Responsive** — hamburger nav, collapsible sidebar overlay, responsive grids throughout
- **Chrome Extension** — tracks productive browser tabs while punched in
- **VS Code Extension** — sends file edit, save, terminal, and git commit events to the activity log

## Tech Stack

- **Framework**: Next.js (App Router)
- **Database**: Supabase (PostgreSQL + Auth + Row Level Security)
- **Styling**: Tailwind CSS v4 + shadcn/ui (Base UI)
- **Rich Text**: Tiptap (StarterKit, TaskList, Link, Image, Placeholder)
- **Charts**: Recharts
- **State**: React Context (Auth, Workspace, Sessions, MobileSidebar)
- **Notes Storage**: localStorage (no DB table required)

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

Tracks browser tabs (GitHub, Linear, Figma, Notion, etc.) while punched in. Blocks social and entertainment sites automatically.

### Install

1. Open `chrome-extension/config.js` — fill in your Supabase URL and anon key
2. Go to `chrome://extensions` → Enable **Developer mode** → **Load unpacked** → select the `chrome-extension/` folder
3. Sign into Chrona — the extension connects automatically

## VS Code Extension

Sends file edit, save, terminal, and git commit events to `/api/activity`. Requires `SUPABASE_SERVICE_ROLE_KEY`.

### Install

1. `cd vscode-extension && npm install && npm run build`
2. In VS Code: `Extensions` panel → `...` menu → **Install from VSIX** → select the built `.vsix` file
   — or —
   Press `F5` inside the `vscode-extension/` folder to launch an Extension Development Host for testing

## Project Structure

```
src/
  app/
    api/activity/           # VS Code extension webhook
    invoice/                # Invoice page with exchange rates
    notes/                  # Notes page (Google Keep-style)
    reports/                # Reports page (heatmap, charts)
    sessions/               # Sessions table page
    settings/               # Workspace settings
    login/                  # Auth page
    page.tsx                # Dashboard
  components/
    DailyChart.tsx          # This week bar chart
    HoursHeatmap.tsx        # 52-week activity heatmap
    MonthlyTrend.tsx        # 6-month bar chart
    NoteCard.tsx            # Note card with delete confirm
    NoteEditorDialog.tsx    # Tiptap rich text note editor
    NotesWidget.tsx         # Dashboard notes shortcut widget
    OvertimeBanner.tsx      # Red banner when weekly cap exceeded
    ReportsSummary.tsx      # All-time stats cards on reports page
    SessionsTable.tsx       # Full sessions table with filters
    Sidebar.tsx             # Nav sidebar (desktop sticky + mobile overlay)
    StatCards.tsx           # Dashboard KPI strip
    TaskBreakdown.tsx       # Top tasks horizontal bar chart
    Timer.tsx               # Punch in/out timer
    TopTasks.tsx            # This week's top tasks widget
    WeeklyProgress.tsx      # Weekly progress ring/chart
    Header.tsx              # Page header with greeting + hamburger
  context/
    AuthContext.tsx          # Supabase auth
    WorkspaceContext.tsx     # Per-workspace config
    SessionsContext.tsx      # Sessions CRUD (optimistic updates)
    MobileSidebarContext.tsx # Mobile sidebar open/close state
  hooks/
    useNotes.ts             # Notes CRUD (localStorage, v2 schema)
    useStats.ts             # Derived stats from sessions
    useToast.tsx            # Toast notifications
  lib/
    exportCsv.ts            # CSV export
    session-utils.ts        # Midnight split, duration formatting
    supabase.ts             # Supabase client
    constants.ts            # DEFAULTS (week start: Monday)
  types/
    session.ts
    activity.ts
chrome-extension/           # Chrome browser activity tracker
vscode-extension/           # VS Code activity tracker
supabase/migrations/        # Database migration SQL files
```

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅ | Supabase anon key (public) |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ for VS Code ext | Service role key (server-side only, never commit) |

## Notes on Architecture

- **Optimistic updates**: `SessionsContext.updateSession` patches local state immediately, then syncs to Supabase — no refetch, no table flicker.
- **Notes**: Stored in `localStorage` under key `chrona_notes_v2`. No DB migration needed. Content is Tiptap HTML.
- **Week boundary**: Weeks start on **Monday** (`WEEK_STARTS_ON = 1` in `src/lib/constants.ts`). The weekly cap resets automatically each Monday.
- **PR status**: Stored on the `sessions` table as a string enum (`open | in_review | approved | merged | done`). Changed via dropdown in the sessions table with optimistic update.
- **Mobile sidebar**: `MobileSidebarContext` shared between `Header` (hamburger toggle) and `Sidebar` (overlay + close button). Desktop sidebar is `sticky` in normal document flow so `flex-1` content is naturally width-bounded.
