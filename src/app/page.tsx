import Link from "next/link";
import {
  Clock3, Code2, Globe, BarChart2, Receipt, ArrowRight,
  GitBranch, Zap, Flame, CheckCircle2,
} from "lucide-react";
import LandingDemo from "@/components/landing/LandingDemo";

const FEATURES = [
  {
    icon: Clock3,
    title: "One-click time tracking",
    description: "Punch in, pause, and punch out with automatic idle detection and midnight auto-split — no manual math.",
  },
  {
    icon: Code2,
    title: "VS Code & Chrome extensions",
    description: "Every file edit, save, git commit, and productive browser tab is logged automatically while you're punched in.",
  },
  {
    icon: BarChart2,
    title: "Reports that prove your work",
    description: "GitHub-style activity heatmap, task breakdowns, and trend charts — real evidence behind every invoiced hour.",
  },
  {
    icon: Receipt,
    title: "Invoices in one click",
    description: "Pick a date range, print a client-ready PDF or export a CSV — with live currency conversion built in.",
  },
];

const STEPS = [
  { title: "Punch in", description: "Start a session for any task — Chrona tracks the clock and your focus score." },
  { title: "Work normally", description: "VS Code and Chrome extensions log your real activity in the background." },
  { title: "Get paid accurately", description: "Generate an invoice backed by real, timestamped proof of work." },
];

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-background">
      {/* Nav */}
      <header className="border-b">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 md:px-8">
          <div className="flex items-center gap-2">
            <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10">
              <Clock3 className="size-4 text-primary" />
            </div>
            <span className="text-lg font-bold tracking-tight">Chrona</span>
          </div>
          <Link
            href="/login"
            className="flex items-center gap-1.5 rounded-lg border px-4 py-2 text-sm font-medium hover:bg-muted transition-colors"
          >
            Sign in
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="mx-auto max-w-6xl px-4 py-16 md:px-8 md:py-24">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <div>
            <div className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/5 px-3 py-1 text-xs font-medium text-primary">
              <Flame className="size-3" />
              Built for contractors and freelancers
            </div>
            <h1 className="mt-4 text-4xl font-bold tracking-tight md:text-5xl">
              Time tracking with <span className="text-primary">proof</span>, not just numbers.
            </h1>
            <p className="mt-4 text-lg text-muted-foreground">
              Chrona punches your clock, watches your actual work in VS Code and your browser,
              and turns it into invoices your clients can trust.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link
                href="/login"
                className="flex items-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
              >
                Get started free
                <ArrowRight className="size-4" />
              </Link>
              <Link
                href="#features"
                className="flex items-center gap-2 rounded-xl border px-6 py-3 text-sm font-semibold hover:bg-muted transition-colors"
              >
                See how it works
              </Link>
            </div>
            <div className="mt-6 flex items-center gap-2 text-xs text-muted-foreground">
              <CheckCircle2 className="size-3.5 text-emerald-500" />
              No credit card required · Free to start
            </div>
          </div>

          {/* Live demo */}
          <div className="flex justify-center lg:justify-end">
            <LandingDemo />
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="border-t bg-muted/20">
        <div className="mx-auto max-w-6xl px-4 py-16 md:px-8 md:py-24">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight">Everything you need to bill with confidence</h2>
            <p className="mt-3 text-muted-foreground">
              Stop guessing your hours. Chrona tracks what you actually did, automatically.
            </p>
          </div>

          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {FEATURES.map(({ icon: Icon, title, description }) => (
              <div key={title} className="rounded-xl border bg-card p-6">
                <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10">
                  <Icon className="size-5 text-primary" />
                </div>
                <h3 className="mt-4 font-semibold">{title}</h3>
                <p className="mt-1.5 text-sm text-muted-foreground">{description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="border-t">
        <div className="mx-auto max-w-6xl px-4 py-16 md:px-8 md:py-24">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight">Three steps, zero spreadsheets</h2>
          </div>

          <div className="mt-12 grid gap-8 sm:grid-cols-3">
            {STEPS.map(({ title, description }, i) => (
              <div key={title} className="text-center sm:text-left">
                <div className="mx-auto flex size-10 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground sm:mx-0">
                  {i + 1}
                </div>
                <h3 className="mt-4 font-semibold">{title}</h3>
                <p className="mt-1.5 text-sm text-muted-foreground">{description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Integrations strip */}
      <section className="border-t bg-muted/20">
        <div className="mx-auto max-w-6xl px-4 py-12 md:px-8">
          <div className="flex flex-wrap items-center justify-center gap-x-10 gap-y-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-2"><Code2 className="size-4" /> VS Code Extension</span>
            <span className="flex items-center gap-2"><Globe className="size-4" /> Chrome Extension</span>
            <span className="flex items-center gap-2"><GitBranch className="size-4" /> Git commit tracking</span>
            <span className="flex items-center gap-2"><Zap className="size-4" /> Focus score</span>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t">
        <div className="mx-auto max-w-3xl px-4 py-16 text-center md:px-8 md:py-24">
          <h2 className="text-3xl font-bold tracking-tight">Start tracking honest hours today</h2>
          <p className="mt-3 text-muted-foreground">
            Free to use. Set up your first workspace in under a minute.
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
