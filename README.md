# Chrona — Time Tracker

A SaaS-ready time tracker for contractors and freelancers. Track work sessions with auto-captured VS Code + browser activity, generate focus-scored reports, and export client-ready invoices — all in one place.

Built with **Next.js 16**, **Supabase**, and **Tailwind CSS v4**.

---

## Features

### Timer & Sessions
- **One-click punch in/out** with pause support and a logged pause reason per break
- **Idle auto-pause** after 30 min of inactivity
- **Midnight auto-split** — sessions crossing midnight are split into two accurate records
- **Focus score** (0–100%) calculated per session from active vs. pause time
- **Session edit/view dialog** — receipt-style pause breakdown, PR link, focus score, split indicator
- **Optimistic updates** — edits apply instantly without table flicker

### Activity Tracking (Extensions)
- **VS Code extension** — logs file edits (net line delta), file saves, terminal opens, and git commits (branch + message) while punched in. One-click browser sign-in via `/vscode-auth`
- **Chrome extension** — tracks productive tabs (GitHub, Linear, Figma, Notion, etc.) while punched in; blocks social/entertainment sites. Tab duration flushed on switch-away, not periodic
- **Realtime activity log** — all events appear instantly via Supabase Realtime (no refresh), tabbed by source, searchable

### Dashboard
- **Stat cards** — today's hours, this week, current streak, avg focus score
- **Daily bar chart** — this week's hours per day; off-days (based on work schedule) shown greyed out
- **Weekly progress ring** — hours vs. weekly cap, overflow highlighted
- **Overtime banner** — fires when weekly cap is exceeded
- **Top tasks** — most-logged tasks this week with time breakdown
- **Notes widget** — Google Keep-style notes shortcut on the dashboard
- **Recent activity** — today + yesterday sessions with focus score and time range

### Reports
- **All-time summary** — total hours, sessions, avg session length, best day
- **GitHub-style heatmap** — 52-week activity grid
- **Top tasks bar chart** — all-time task breakdown
- **6-month trend** — monthly hours over the past 6 months

### Invoices
- **Date range picker** — prev/next navigation, any custom period
- **Live exchange rates** — 15+ currencies via Frankfurter API (server-proxied, 5-min cache)
- **Summary cards** — total hours, rate, amount due in chosen currency + PHP equivalent
- **Itemised table** — date, task + description (truncated), duration, amount; no horizontal scroll
- **Auto invoice number** — deterministic from workspace slug + period start (`INV-XYZ-20250101`)
- **Due date** — period end + configurable payment terms (Net 7/14/30/custom)
- **Print to PDF** — browser-native print with printable invoice header (contractor, client, totals)
- **CSV export** — all sessions with USD + converted-currency amounts, focus score, invoice metadata

### Workspace & Settings
- **Multi-workspace** — unlimited workspaces per account, each with its own:
  - Hourly rate and weekly hour cap
  - Work schedule (start/end day of week, e.g. Mon–Fri or Wed–Sun)
  - Invoice currency, payment terms, contractor name, client name
  - Long-lived personal API key for the VS Code extension
- **Work schedule** — daily target hours derived from cap ÷ work days; daily chart marks off-days

### Notes
- **Google Keep-style** — create, edit, pin, color, label, delete notes
- **Rich text** — Tiptap editor with checklists, bold, italic, links, image upload, emoji picker
- **Stored in localStorage** — no DB migration needed

### UI & Navigation
- **Collapsible desktop sidebar** — icon-only when collapsed, state persisted in localStorage
- **Mobile-first** — full-screen sidebar overlay with body scroll lock, responsive grids, adaptive text sizes
- **Multi-currency calculator widget** — convert between 15+ currencies using live rates
- **Shared `PageHeader`** — title, subtitle, mobile hamburger on every page
- **Dark mode** — via CSS variables and Tailwind dark utilities

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router) |
| Database | Supabase (PostgreSQL + Auth + RLS) |
| Styling | Tailwind CSS v4 + shadcn/ui (Base UI) |
| Rich Text | Tiptap (StarterKit, TaskList, Link, Image) |
| Charts | Recharts |
| Exchange Rates | Frankfurter API (proxied via `/api/exchange-rate`) |
| State | React Context (Auth, Workspace, Sessions, MobileSidebar) |
| Notes Storage | localStorage (no DB table) |

---

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

> `SUPABASE_SERVICE_ROLE_KEY` is required for the VS Code extension activity endpoint. Find it in Supabase → Project Settings → API. Never expose it client-side.

### 3. Run database migrations

Run each file **in order** in the Supabase SQL Editor:

| File | Description |
|---|---|
| `001_schema.sql` | Base tables, RLS, indexes |
| `002_multi_workspace.sql` | Multi-workspace support |
| `003_focus_score.sql` | Focus score column on sessions |
| `004_activity_note.sql` | Note column on activity_events |
| `005_backfill_sessions.sql` | Fix old sessions missing user_id/workspace_id |
| `006_api_keys.sql` | Long-lived personal API keys for VS Code extension |
| `007_realtime_activity.sql` | Supabase Realtime on activity_events |
| `008_live_status.sql` | Live punch-in/paused state for VS Code extension |
| `009_payment_terms.sql` | Payment terms days on workspace_config |
| `010_work_schedule.sql` | Work start/end day on workspace_config |

### 4. Start the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Chrome Extension

Tracks productive browser tabs (GitHub, Linear, Figma, Notion, etc.) while punched in.

### Install

1. Open `chrome-extension/config.js` — fill in your Supabase URL and anon key
2. Go to `chrome://extensions` → Enable **Developer mode** → **Load unpacked** → select `chrome-extension/`
3. Sign into Chrona — the extension connects automatically by reading the Supabase auth token from `localStorage`

### After every extension reload

Hard-refresh every open Chrona tab after reloading from `chrome://extensions`. Old content script instances become orphaned and stop sending events.

### Debugging

Open `chrome://extensions` → Chrona Tracker → **service worker** link. To inspect live state:

```js
const r = await chrome.storage.session.get("trackerState");
console.log(r); // check isPunchedIn, supabaseUrl, supabaseAnonKey
```

---

## VS Code Extension

Logs file edits, saves, terminal opens, and git commits to `/api/activity` while punched in and not paused.

### Install

```bash
cd vscode-extension
npm install && npm run compile
npx vsce package --allow-missing-repository
```

In VS Code: Extensions panel → `...` → **Install from VSIX** → select the built `.vsix`.

Or press `F5` inside `vscode-extension/` to launch an Extension Development Host.

### Authenticate

Run **Chrona: Sign In** from the Command Palette (`Cmd+Shift+P`). It opens `/vscode-auth` in the browser — click **Approve** and a permanent personal API key is saved to `chrona.accessToken` automatically.

Also set `chrona.apiUrl` to your deployed URL (defaults to `http://localhost:3000`).

---

## Project Structure

```
src/
  app/
    api/activity/           # VS Code extension webhook
    api/exchange-rate/      # Server-side Frankfurter proxy (avoids CORS)
    dashboard/              # Authenticated app home
    invoice/                # Invoice page with exchange rates
    notes/                  # Google Keep-style notes
    profile/                # Account details + change password
    reports/                # Heatmap, charts, all-time stats
    sessions/               # Sessions table with filters + actions
    settings/               # Workspace settings, schedule, API key
    login/                  # Auth page
    vscode-auth/            # One-click VS Code sign-in approval
    page.tsx                # Public landing page
  components/
    landing/LandingDemo.tsx # Auto-playing hero demo widget
    ActivityLog.tsx         # Realtime activity log (tabbed)
    CalculatorWidget.tsx    # Multi-currency converter
    DailyChart.tsx          # This week bar chart (work/off day aware)
    Header.tsx              # Dashboard header with greeting + streak
    HoursHeatmap.tsx        # 52-week activity heatmap
    InvoicePeriodPicker.tsx # Date range picker with prev/next
    InvoiceTable.tsx        # Itemised invoice table (no x-scroll)
    NotesWidget.tsx         # Dashboard notes shortcut
    OvertimeBanner.tsx      # Alert when weekly cap exceeded
    PageHeader.tsx          # Shared page header with mobile hamburger
    Pagination.tsx          # Shared pagination control
    RecentActivity.tsx      # Today + yesterday sessions card
    ReportsSummary.tsx      # All-time stat cards
    SessionDialog.tsx       # Create/edit session dialog
    SessionsTable.tsx       # Sessions table with filters + actions
    Sidebar.tsx             # Collapsible nav sidebar
    StatCards.tsx           # Dashboard KPI strip
    Timer.tsx               # Punch in/out timer
    TopTasks.tsx            # This week's top tasks widget
    ViewSessionDialog.tsx   # Read-only session detail + pause log
    WeeklyProgress.tsx      # Weekly progress ring
  context/
    AuthContext.tsx
    WorkspaceContext.tsx
    SessionsContext.tsx
    MobileSidebarContext.tsx
  hooks/
    useStats.ts             # Derived stats (work-schedule-aware)
    useExchangeRate.ts      # Exchange rate fetcher
    useNotes.ts             # Notes CRUD (localStorage)
    useToast.tsx
  lib/
    currencies.ts           # 15+ currency list with symbols
    exportCsv.ts
    session-utils.ts        # Midnight split, duration formatting
    supabase.ts
  types/
chrome-extension/
vscode-extension/
supabase/migrations/
```

---

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Supabase anon key (public) |
| `SUPABASE_SERVICE_ROLE_KEY` | VS Code ext | Service role key (server-side only — never commit) |

---

## Architecture Notes

- **Optimistic updates** — `SessionsContext.updateSession` patches local state immediately, then syncs to Supabase
- **Work schedule** — `useStats` uses `workStartDay`/`workEndDay` from workspace config to determine which days are work days, compute `dailyTargetHours`, and reset the week on the correct day
- **Notes** — stored in `localStorage` under `chrona_notes_v2`. No DB migration needed. Content is Tiptap HTML
- **Exchange rates** — fetched server-side via `/api/exchange-rate` (Frankfurter API, 5-min revalidation) to avoid client-side CORS errors
- **Invoice number** — deterministic from workspace slug + period start (`INV-<3-letter-slug>-<yyyyMMdd>`), so reopening the same range always shows the same invoice number
- **Due date** — period end + `payment_terms_days` (workspace setting)
- **PR status** — stored as a string enum (`open | in_review | approved | merged | done`) on the sessions table; changed via dropdown with optimistic update
- **Mobile sidebar** — `MobileSidebarContext` shared between `Header` (hamburger) and `Sidebar` (overlay); sets `document.body.style.overflow = "hidden"` when open
- **Desktop sidebar collapse** — `collapsed` state persisted in `localStorage.sidebar-collapsed`
- **Timer hydration** — timer state from `localStorage` is gated behind a `mounted` flag to avoid SSR/hydration mismatch
- **VS Code auth** — `/api/activity` validates a permanent personal API key from the `api_keys` table, not a short-lived Supabase session JWT
- **Live punch state** — `live_status` table (written by `Timer.tsx`) lets the VS Code extension poll `/api/activity` (GET) to know if tracking should be active, since the `sessions` table only gets a row at punch-out
- **Realtime activity log** — `ActivityLog.tsx` subscribes to `postgres_changes` on `activity_events` filtered by `user_id`; requires migration 007 and `REPLICA IDENTITY FULL`
- **VS Code edit consolidation** — one `file_edit` event per ~10s of inactivity per file (not one per keystroke)
- **Chrome extension tab logging** — duration flushed on tab switch-away or punch-out, not on a timer
- **Chrome extension token refresh** — `content.js` re-pushes the Supabase session token to the background worker every 4 min (Supabase's silent refresh updates `localStorage` without firing a `storage` event in the same tab)
- **Landing vs. dashboard split** — `/` is a public marketing page; the authenticated app lives at `/dashboard`. `SidebarWrapper` hides the sidebar on `/` and `/login` only
- **HoursHeatmap cell radius** — uses `rounded-[2px]` (not `rounded-sm`) because at 12px cell size the theme's `--radius` variable makes `rounded-sm` render as a full circle
