# Work Time Tracker

A personal time tracker I built for my contract work. I designed it around the terms of my independent contractor agreement, 40-hour weekly cap, and biweekly invoicing cycle.

---

## Tech Stack

I intentionally kept the stack simple so I could focus on tracking my work instead of maintaining infrastructure.

| Piece | Choice | Why I Chose It |
| --- | --- | --- |
| Framework | Next.js (App Router) | I'm already familiar with it and it works great with Vercel |
| Language | TypeScript | It helps me catch bugs early |
| Styling | Tailwind CSS v4 + shadcn/ui | Fast to build with and easy to customize |
| Icons | lucide-react | Lightweight and clean |
| Database | Supabase (Postgres) | The free tier is more than enough for my personal use and gives me a real database I can query later |
| Hosting | Vercel | Free and integrates directly with GitHub |

This setup is intentionally simple. I don't have to maintain a backend server or configure a separate API layer. The app is essentially a Next.js frontend connected directly to a managed Postgres database.

---

## Problems I Encountered and Fixed

During development, I ran into several issues and fixed them along the way:

1. **Session validation**
   - I initially placed validation outside `saveSession()`, which caused the component to crash on render.
   - I fixed this by moving the validation inside the save function.

2. **Incomplete Sessions Table**
   - `SessionsTable.tsx` originally contained only imports.
   - I implemented a complete table with edit and delete functionality.

3. **Dashboard not updating**
   - My stats weren't refreshing after saving sessions.
   - I solved this by introducing a shared `SessionsContext` as a single source of truth.

4. **Incorrect TypeScript types**
   - `start_time` could be `null`, but my type definition required a string.
   - I updated it to `string | null`.

5. **Invalid CSS import**
   - I removed the non-existent `shadcn/tailwind.css` import.

6. **Theme inconsistencies**
   - I switched from hardcoded colors to design tokens so the entire UI follows the same pastel pink theme.

7. **Dead code**
   - `SessionForm.tsx` became unnecessary after implementing `SessionDialog.tsx`, so I removed it.

8. **Weekly calculations**
   - I explicitly set Monday as the start of the week for more predictable hour tracking.

---

## Features

### Dashboard

- Track today's hours
- Monitor weekly progress
- View biweekly totals
- Track remaining hours before reaching the weekly limit
- Calculate estimated earnings

### Session Management

- Save work sessions
- Add descriptions and GitHub PR links
- Edit previous sessions
- Delete sessions
- View sessions in a table

### Architecture

- Shared `SessionsContext`
- Automatic updates after save, edit, and delete
- Reusable dialog component for creating and editing sessions

---

## Project Setup

### 1. Create the Project

```bash
npx create-next-app@latest nudgine-time-tracker --typescript --tailwind --app
cd nudgine-time-tracker
```

### 2. Install Dependencies

```bash
npm install @supabase/supabase-js date-fns clsx tailwind-merge lucide-react tw-animate-css
```

### 3. Install shadcn/ui Components

```bash
npx shadcn@latest init
npx shadcn@latest add button card dialog input textarea progress table
```

### 4. Configure Supabase

1. Create a new project.
2. Open the SQL Editor.
3. Run the schema.
4. Copy the Project URL and anon key.

### 5. Create Environment Variables

Create `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### 6. Run the Application

```bash
npm run dev
```

After that, I can:

- Start the timer
- Pause it
- Stop it
- Save a session
- Review previous sessions

---

## Deployment

To deploy the app, I:

1. Push the repository to GitHub.
2. Import the repository into Vercel.
3. Add the same environment variables.
4. Deploy.

Vercel automatically provides a production URL.

---

## Security Notes

Since my task descriptions may reference internal work, I treat this project as private.

Possible improvements:

- Add Supabase Authentication
- Implement Row Level Security (RLS)
- Restrict data access to my own account

---

## Future Improvements

- [ ] Add Supabase Authentication
- [ ] Implement Row Level Security
- [ ] Add manual time entry
- [ ] Export sessions to CSV
- [ ] Add invoice reminders
- [ ] Add analytics and charts
- [ ] Add dark mode
- [ ] Add monthly reports
- [ ] Add task-based breakdowns
- [ ] Add earnings history

---

## Project Status

🚧 Currently under active development.

This project started as a simple time tracker for my work and gradually evolved into a lightweight productivity dashboard inspired by Clockify, Harvest, and Linear.