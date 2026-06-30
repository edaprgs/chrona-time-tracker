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
| `supabase/migrations/006_api_keys.sql` | Long-lived personal API keys for the VS Code extension |
| `supabase/migrations/007_realtime_activity.sql` | Enables Supabase Realtime on activity_events (live Activity Log updates) |
| `supabase/migrations/008_live_status.sql` | Live punch-in/paused state, polled by the VS Code extension |

### 4. Start the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Chrome Extension

Tracks browser tabs (GitHub, Linear, Figma, Notion, etc.) while punched in. Blocks social and entertainment sites automatically.

### Install

1. Open `chrome-extension/config.js` — fill in your Supabase URL and anon key (must match the same project as `content.js`'s hardcoded `SUPABASE_URL`/`SUPABASE_ANON_KEY`)
2. Go to `chrome://extensions` → Enable **Developer mode** → **Load unpacked** → select the `chrome-extension/` folder
3. Sign into Chrona on the matching origin — the extension connects automatically by reading the `sb-<project-ref>-auth-token` key from `localStorage`

### After every reload

Any time you reload the extension from `chrome://extensions` (e.g. after editing `background.js`/`content.js`), **hard-refresh every already-open Chrona tab**. Old content script instances become orphaned ("Extension context invalidated") and silently stop sending punch-in/tab events until the page is refreshed.

### Debugging

Open `chrome://extensions` → Chrona Tracker → **service worker** link to inspect the background worker directly. To check live state without relying on self-messaging (unreliable from the worker's own console):
```js
const r = await chrome.storage.session.get("trackerState");
console.log(r);
```
Check `isPunchedIn`, `supabaseUrl`/`supabaseAnonKey` (must be non-null), and decode `accessToken` to confirm its `iss` claim matches `supabaseUrl`'s project ref.

## VS Code Extension

Sends file edit, save, terminal, and git commit events to `/api/activity` — but only while you're actually punched in and not paused on Chrona (polls `live_status` every 10s). Requires `SUPABASE_SERVICE_ROLE_KEY`, the `api_keys` table (migration 006), and the `live_status` table (migration 008).

Tracks: file opens, file saves (with net line delta), consolidated file edits (one entry per ~10s of editing activity on a file, not one per keystroke), terminal opens, and git commits (with the commit message and branch) via VS Code's built-in Git extension API.

### Install

1. `cd vscode-extension && npm install && npm run compile`
2. `npx vsce package --allow-missing-repository` to build the `.vsix`
3. In VS Code: `Extensions` panel → `...` menu → **Install from VSIX** → select the built `.vsix` file
   — or —
   Press `F5` inside the `vscode-extension/` folder to launch an Extension Development Host for testing

### Authenticate

Run **Chrona: Sign In** from the Command Palette (`Cmd+Shift+P`). It opens your browser to `/vscode-auth`, you click **Approve**, and a permanent personal API key (`chrona_...`) is saved into `chrona.accessToken` automatically — no copy/paste, and unlike a Supabase session token it never expires.

To do it manually instead: Chrona → Settings → Connect Trackers → VS Code Extension → Copy, then paste into `chrona.accessToken` in VS Code settings.

Also set `chrona.apiUrl` to your deployed URL (defaults to `http://localhost:3000`).

## Project Structure

```
src/
  app/
    api/activity/           # VS Code extension webhook
    invoice/                # Invoice page with exchange rates
    notes/                  # Notes page (Google Keep-style)
    reports/                # Reports page (heatmap, charts)
    sessions/               # Sessions table page
    settings/               # Workspace settings + API key management
    login/                  # Auth page
    vscode-auth/            # One-click VS Code sign-in approval page
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
    apiKey.ts               # Get-or-create / regenerate long-lived API keys
    currencies.ts           # Shared currency list (invoice page + table)
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
- **Timer hydration**: All timer state read from `localStorage` (recording/paused/idle, elapsed time, button labels) is gated behind a `mounted` flag in `Timer.tsx`. The server always renders the neutral/idle markup; the real state applies after the client mounts, avoiding React hydration mismatches.
- **VS Code auth**: `/api/activity` validates requests against the `api_keys` table (a permanent per-user token), not a Supabase session JWT — session tokens expire hourly and broke the integration repeatedly. The `chrona.signIn` VS Code command opens `/vscode-auth` in the browser, which on approval redirects to `vscode://<publisher>.<name>/auth?key=...` to hand the key back to the extension via its registered URI handler.
- **Chrome extension token refresh**: `content.js` re-pushes the current Supabase session token to the background worker every 4 minutes, since Supabase's silent token refresh updates `localStorage` without firing a same-tab `storage` event — without this, the background worker's token goes stale after ~1 hour and tab-tracking inserts fail silently.
- **Chrome extension tab logging**: `background.js` logs one `browser_visit` entry per tab visit — duration is flushed when you switch away from a tab (or punch out/pause), not on a periodic timer. A tab left open and untouched does not spam repeat entries.
- **Chrome extension project-scoped auth**: `getSupabaseCredentials()` in `content.js` reads the auth token from the exact `sb-<project-ref>-auth-token` localStorage key (ref derived from the hardcoded `SUPABASE_URL`), not a wildcard scan — scanning for any `sb-*-auth-token` key picks up stale sessions from other Supabase projects, producing a JWT whose issuer doesn't match `supabaseUrl` and gets silently rejected on every insert. Likewise, `sendToBackground()` falls back to the hardcoded `SUPABASE_URL`/`SUPABASE_ANON_KEY` constants instead of passing through `null`, since a `PUNCH_IN` message with `null` credentials would overwrite the working values `AUTO_AUTH` had already set.
- **Live punch state (`live_status` table)**: the `sessions` table only gets a row written at punch-out (after the confirmation dialog) — it can never answer "is the user punched in right now." `Timer.tsx` writes to `live_status` on every punch-in/pause/resume/punch-out, and the VS Code extension polls `/api/activity` (GET) every 10s to decide whether to track activity at all, matching the Chrome extension's punched-in gating.
- **Realtime Activity Log**: `ActivityLog.tsx` subscribes to Supabase Realtime (`postgres_changes` on `activity_events`, filtered by `user_id`) so new VS Code/Chrome/manual entries appear instantly without a page refresh. Requires migration 007 and `REPLICA IDENTITY FULL` on the table so delete/update payloads include `user_id` for the filter to match.
- **VS Code edit consolidation**: `onDidChangeTextDocument` accumulates a net line delta per file and flushes one `file_edit` event after 10s of inactivity on that file (or immediately on save) — logging a row per keystroke batch would spam the Activity Log.
- **No circular imports**: `CURRENCIES` lives in `src/lib/currencies.ts`, imported by both `invoice/page.tsx` and `InvoiceTable.tsx` — previously `InvoiceTable.tsx` imported it from the page file that imports `InvoiceTable.tsx` itself, a circular dependency that risked intermittent "cannot access before initialization" errors under HMR.
