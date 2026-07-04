import Link from "next/link";
import {
  Clock3, Code2, Globe, BarChart2, Receipt, ArrowRight,
  GitBranch, Zap, Flame, CheckCircle2, Pause, SplitSquareHorizontal,
  FileText, Settings2, LayoutDashboard, Shield,
} from "lucide-react";
import LandingDemo from "@/components/landing/LandingDemo";
import LandingNav from "@/components/landing/LandingNav";

const FEATURES = [
  {
    icon: Clock3,
    title: "Smart timer",
    description: "Punch in, pause with a reason, punch out. Idle auto-pause kicks in after 30 min. Sessions that cross midnight are split automatically — no manual edits.",
    tags: ["Auto-pause", "Midnight split", "Pause log"],
  },
  {
    icon: Code2,
    title: "VS Code extension",
    description: "Every file edit, save, git commit (with branch + message), and terminal open is logged automatically while you're punched in. One-click sign-in via browser.",
    tags: ["File edits", "Git commits", "Terminal"],
  },
  {
    icon: Globe,
    title: "Chrome extension",
    description: "Productive browser tabs — GitHub, Linear, Figma, Notion — are tracked while you work. Social and entertainment sites are blocked from logging.",
    tags: ["Tab tracking", "Auto-filter", "Duration"],
  },
  {
    icon: Zap,
    title: "Focus score",
    description: "Every session gets a 0-100% focus score based on active work time vs. pause time. See it per session and as a weekly average on the dashboard.",
    tags: ["Per session", "Weekly avg", "Color coded"],
  },
  {
    icon: BarChart2,
    title: "Reports & heatmap",
    description: "GitHub-style 52-week activity heatmap, top tasks bar chart, 6-month trend, and all-time totals — real evidence behind every invoiced hour.",
    tags: ["Heatmap", "Trends", "Task breakdown"],
  },
  {
    icon: Receipt,
    title: "Invoices in one click",
    description: "Pick a date range, see a live summary with exchange rates (15+ currencies), then print a client-ready PDF or export a CSV. Invoice number and due date computed automatically.",
    tags: ["PDF export", "CSV", "Live rates"],
  },
  {
    icon: Settings2,
    title: "Multi-workspace",
    description: "One account, unlimited workspaces — separate rates, hour caps, schedules, and API keys per client or project. Switch instantly from the sidebar.",
    tags: ["Per-client rates", "Hour caps", "Work schedule"],
  },
  {
    icon: SplitSquareHorizontal,
    title: "Activity log",
    description: "All VS Code edits, Chrome visits, and manual entries in a searchable, tabbed live log — updates in real time via Supabase Realtime without refreshing.",
    tags: ["Realtime", "Searchable", "Tabbed"],
  },
];

const STEPS = [
  {
    n: "01",
    title: "Punch in",
    description: "Start a session for a task. Chrona starts the clock and your focus score.",
  },
  {
    n: "02",
    title: "Work normally",
    description: "VS Code and Chrome extensions silently log every edit, commit, and productive tab in the background.",
  },
  {
    n: "03",
    title: "Invoice with proof",
    description: "Pick a period, generate an invoice backed by timestamped, itemised work logs your client can verify.",
  },
];

const INTEGRATIONS = [
  { icon: Code2,     label: "VS Code Extension" },
  { icon: Globe,     label: "Chrome Extension" },
  { icon: GitBranch, label: "Git commit tracking" },
  { icon: Zap,       label: "Focus score" },
  { icon: Pause,     label: "Pause reason log" },
  { icon: Shield,    label: "Row-level security" },
];

function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-background">
      <LandingNav />

      {/* Hero */}
      <section className="mx-auto max-w-6xl px-4 py-16 md:px-8 md:py-24">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <div>
            <div className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/5 px-3 py-1 text-xs font-medium text-primary">
              <Flame className="size-3" />
              Built for contractors and freelancers
            </div>

            <h1 className="mt-5 text-[2.6rem] font-bold leading-[1.12] tracking-tight md:text-5xl lg:text-[3.1rem]">
              Time tracking<br />
              with{" "}
              <span className="relative inline-block text-primary">
                proof
                <svg
                  className="absolute -bottom-1 left-0 w-full"
                  viewBox="0 0 120 8"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  preserveAspectRatio="none"
                  aria-hidden="true"
                >
                  <path
                    d="M2 6 C30 2, 90 2, 118 6"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    className="opacity-40"
                  />
                </svg>
              </span>
              ,{" "}not<br className="hidden sm:block" /> just numbers.
            </h1>

            <p className="mt-5 max-w-md text-lg text-muted-foreground leading-relaxed">
              Punch in, let Chrona watch your VS Code and browser activity,
              then generate invoices your clients can actually trust.
            </p>

            <ul className="mt-5 space-y-2.5 text-sm text-muted-foreground">
              {[
                "Auto-tracked edits, git commits, and browser tabs",
                "Focus score per session — full pause log included",
                "PDF invoices with live multi-currency conversion",
              ].map((item) => (
                <li key={item} className="flex items-center gap-2.5">
                  <CheckCircle2 className="size-4 shrink-0 text-emerald-500" />
                  {item}
                </li>
              ))}
            </ul>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link
                href="/login"
                className="group flex items-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition-all duration-200 hover:bg-primary/90 hover:shadow-lg hover:shadow-primary/25 hover:-translate-y-px"
              >
                Get started free
                <ArrowRight className="size-4 transition-transform duration-200 group-hover:translate-x-0.5" />
              </Link>
              <a
                href="#features"
                className="flex items-center gap-2 rounded-xl border px-6 py-3 text-sm font-semibold transition-all duration-200 hover:bg-muted hover:border-muted-foreground/30"
              >
                See all features
              </a>
            </div>
            <p className="mt-4 text-xs text-muted-foreground">No credit card required · Free to start</p>
          </div>

          {/* Live demo */}
          <div className="flex justify-center lg:justify-end">
            <LandingDemo />
          </div>
        </div>
      </section>

      {/* Integrations strip */}
      <section className="border-y bg-muted/30">
        <div className="mx-auto max-w-6xl px-4 py-5 md:px-8">
          <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-xs font-medium text-muted-foreground">
            {INTEGRATIONS.map(({ icon: Icon, label }) => (
              <span key={label} className="flex items-center gap-1.5">
                <Icon className="size-3.5" /> {label}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="border-b">
        <div className="mx-auto max-w-6xl px-4 py-16 md:px-8 md:py-24">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight">Everything you need to bill with confidence</h2>
            <p className="mt-3 text-muted-foreground">
              Stop guessing your hours. Chrona tracks what you actually did — automatically.
            </p>
          </div>

          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {FEATURES.map(({ icon: Icon, title, description, tags }) => (
              <div
                key={title}
                className="group relative rounded-xl border bg-card p-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-primary/8 hover:border-primary/20"
              >
                <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 transition-all duration-300 group-hover:bg-primary/20 group-hover:scale-105">
                  <Icon className="size-5 text-primary" />
                </div>
                <h3 className="mt-4 font-semibold leading-snug">{title}</h3>
                <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed">{description}</p>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {tags.map((tag) => (
                    <span key={tag} className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground transition-colors duration-200 group-hover:bg-primary/10 group-hover:text-primary">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Dashboard preview */}
      <section className="border-b bg-muted/20">
        <div className="mx-auto max-w-6xl px-4 py-16 md:px-8 md:py-24">
          <div className="grid items-center gap-10 lg:grid-cols-2">
            <div>
              <h2 className="text-3xl font-bold tracking-tight">Your dashboard, at a glance</h2>
              <p className="mt-3 text-muted-foreground leading-relaxed">
                See today's hours, weekly progress, your top tasks, and recent activity — all on one screen.
                The daily bar chart highlights off-days based on your configured work schedule.
              </p>
              <ul className="mt-6 space-y-3">
                {[
                  { icon: LayoutDashboard, text: "Stat cards: today, this week, streak, focus avg" },
                  { icon: BarChart2,       text: "Daily bar chart with work-day / off-day distinction" },
                  { icon: Zap,            text: "Weekly cap ring with overtime alert banner" },
                  { icon: FileText,       text: "Notes widget + recent sessions side by side" },
                ].map(({ icon: Icon, text }) => (
                  <li key={text} className="flex items-start gap-3 text-sm text-muted-foreground">
                    <div className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                      <Icon className="size-3.5 text-primary" />
                    </div>
                    {text}
                  </li>
                ))}
              </ul>
            </div>

            {/* Static dashboard mockup */}
            <div className="rounded-2xl border bg-card p-4 shadow-xl shadow-primary/5">
              <div className="mb-3 flex items-center gap-1.5">
                <span className="size-2 rounded-full bg-red-400/70" />
                <span className="size-2 rounded-full bg-amber-400/70" />
                <span className="size-2 rounded-full bg-emerald-400/70" />
                <span className="ml-2 text-[10px] text-muted-foreground">chrona.app/dashboard</span>
              </div>

              <div className="mb-3 grid grid-cols-4 gap-2">
                {[
                  { label: "Today", value: "4h 22m" },
                  { label: "This week", value: "21.5h" },
                  { label: "Streak", value: "9 days" },
                  { label: "Focus avg", value: "84%" },
                ].map(({ label, value }) => (
                  <div key={label} className="rounded-lg border bg-muted/30 p-2">
                    <p className="text-[9px] text-muted-foreground">{label}</p>
                    <p className="mt-0.5 text-xs font-bold">{value}</p>
                  </div>
                ))}
              </div>

              <div className="mb-3 rounded-lg border bg-muted/20 p-3">
                <p className="mb-2 text-[9px] font-semibold uppercase tracking-wide text-muted-foreground">Daily hours</p>
                <div className="flex items-end gap-1" style={{ height: 48 }}>
                  {[
                    { h: 30, label: "M", off: false },
                    { h: 42, label: "T", off: false },
                    { h: 0,  label: "W", off: true  },
                    { h: 38, label: "T", off: false },
                    { h: 50, label: "F", off: false },
                    { h: 0,  label: "S", off: true  },
                    { h: 0,  label: "S", off: true  },
                  ].map(({ h, label, off }, i) => (
                    <div key={i} className="flex flex-1 flex-col items-center gap-0.5">
                      <div
                        className={cn("w-full rounded-t-[2px]", off ? "bg-muted/60" : i === 4 ? "bg-primary" : "bg-primary/60")}
                        style={{ height: Math.max(3, h * 0.9) }}
                      />
                      <span className="text-[7px] text-muted-foreground/60">{label}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-lg border bg-muted/20 p-3">
                <p className="mb-2 text-[9px] font-semibold uppercase tracking-wide text-muted-foreground">Top tasks</p>
                <div className="space-y-1.5">
                  {[
                    { task: "Fix login bug", pct: 78 },
                    { task: "Invoice page UI", pct: 52 },
                    { task: "API rate proxy", pct: 31 },
                  ].map(({ task, pct }) => (
                    <div key={task} className="space-y-0.5">
                      <div className="flex justify-between text-[9px]">
                        <span className="text-muted-foreground">{task}</span>
                        <span className="font-medium">{pct}%</span>
                      </div>
                      <div className="h-1 rounded-full bg-muted">
                        <div className="h-1 rounded-full bg-primary/70" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="border-b">
        <div className="mx-auto max-w-6xl px-4 py-16 md:px-8 md:py-24">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight">Three steps, zero spreadsheets</h2>
            <p className="mt-3 text-muted-foreground">From task start to signed invoice in minutes.</p>
          </div>

          <div className="relative mt-12 grid gap-8 sm:grid-cols-3">
            {/* Connector line */}
            <div className="absolute left-0 right-0 top-5 hidden h-px bg-gradient-to-r from-transparent via-border to-transparent sm:block" />

            {STEPS.map(({ n, title, description }, i) => (
              <div key={n} className="group relative text-center sm:text-left">
                <div className="relative mx-auto flex size-10 items-center justify-center rounded-full border-2 border-primary bg-background text-sm font-bold text-primary transition-all duration-300 group-hover:bg-primary group-hover:text-primary-foreground group-hover:shadow-lg group-hover:shadow-primary/30 sm:mx-0">
                  {n}
                </div>
                <h3 className="mt-4 font-semibold transition-colors duration-200 group-hover:text-primary">{title}</h3>
                <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed">{description}</p>

                {/* Step connector dot for mobile */}
                {i < STEPS.length - 1 && (
                  <div className="mx-auto mt-6 flex size-1.5 rounded-full bg-border sm:hidden" />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section>
        <div className="mx-auto max-w-3xl px-4 py-16 text-center md:px-8 md:py-24">
          <div className="mb-5 inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/5 px-3 py-1 text-xs font-medium text-primary">
            <CheckCircle2 className="size-3" /> Free to use
          </div>
          <h2 className="text-3xl font-bold tracking-tight">Start tracking honest hours today</h2>
          <p className="mt-3 text-muted-foreground">
            Set up your first workspace in under a minute. No credit card required.
          </p>
          <Link
            href="/login"
            className="mt-8 inline-flex items-center gap-2 rounded-xl bg-primary px-8 py-3 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            Get started free
            <ArrowRight className="size-4" />
          </Link>
        </div>
      </section>

      <footer className="border-t py-8">
        <div className="mx-auto max-w-6xl px-4 text-center text-xs text-muted-foreground md:px-8">
          © {new Date().getFullYear()} Chrona. Built for people who bill by the hour.
        </div>
      </footer>
    </main>
  );
}
