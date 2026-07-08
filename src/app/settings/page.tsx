"use client";

import { useEffect, useState } from "react";
import { useWorkspace } from "@/context/WorkspaceContext";
import { useToast } from "@/hooks/useToast";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Settings, DollarSign, Clock, Calendar, User, Briefcase, Trash2, Plus, Check, Globe, Code2, Copy, CheckCheck } from "lucide-react";
import { getOrCreateApiKey, regenerateApiKey as regenerateApiKeyHelper } from "@/lib/apiKey";
import NewWorkspaceDialog from "@/components/NewWorkspaceDialog";
import PageHeader from "@/components/PageHeader";
import { cn } from "@/lib/utils";

const COLORS = [
  "#ec4899", "#0ea5e9", "#10b981", "#f59e0b",
  "#ef4444", "#8b5cf6", "#6366f1", "#14b8a6",
];

export default function SettingsPage() {
  const { workspaces, active, loading, updateWorkspace, deleteWorkspace, switchWorkspace } = useWorkspace();
  const { toast } = useToast();

  const [workspaceName, setWorkspaceName] = useState("");
  const [contractorName, setContractorName] = useState("");
  const [clientName, setClientName]       = useState("");
  const [hourlyRate, setHourlyRate]       = useState("7");
  const [weeklyCap, setWeeklyCap]         = useState("40");
  const [cycleDays, setCycleDays]         = useState("14");
  const [paymentTermsDays, setPaymentTermsDays] = useState("15");
  const [color, setColor]                 = useState(COLORS[0]);
  const [description, setDescription]     = useState("");
  const [workStartDay, setWorkStartDay]       = useState(1);
  const [workEndDay, setWorkEndDay]           = useState(5);
  const [mealBreakMaxMinutes, setMealBreakMaxMinutes] = useState(60);
  const [mealBreakBillable, setMealBreakBillable]     = useState(true);
  const [saving, setSaving]               = useState(false);
  const [showNew, setShowNew]             = useState(false);
  const [apiKey, setApiKey]               = useState("");
  const [apiKeyLoading, setApiKeyLoading] = useState(true);
  const [copied, setCopied]               = useState(false);

  useEffect(() => {
    getOrCreateApiKey().then((key) => {
      setApiKey(key ?? "");
      setApiKeyLoading(false);
    });
  }, []);

  async function handleRegenerateApiKey() {
    setApiKeyLoading(true);
    const key = await regenerateApiKeyHelper();
    setApiKey(key ?? "");
    setApiKeyLoading(false);
    toast("New API key generated. Update it in VS Code settings.", "default");
  }

  useEffect(() => {
    if (!active) return;
    setWorkspaceName(active.workspace_name);
    setContractorName(active.contractor_name);
    setClientName(active.client_name);
    setHourlyRate(String(active.hourly_rate_usd));
    setWeeklyCap(String(active.weekly_hour_cap));
    setCycleDays(String(active.invoice_cycle_days));
    setPaymentTermsDays(String(active.payment_terms_days));
    setColor(active.color ?? COLORS[0]);
    setDescription(active.description ?? "");
    setWorkStartDay(active.work_start_day ?? 1);
    setWorkEndDay(active.work_end_day ?? 5);
    setMealBreakMaxMinutes(active.meal_break_max_minutes ?? 60);
    setMealBreakBillable(active.meal_break_billable ?? true);
  }, [active]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!active) return;
    setSaving(true);
    await updateWorkspace(active.id, {
      workspace_name:     workspaceName,
      contractor_name:    contractorName,
      client_name:        clientName,
      hourly_rate_usd:    Number(hourlyRate),
      weekly_hour_cap:    Number(weeklyCap),
      invoice_cycle_days: Number(cycleDays),
      payment_terms_days: Number(paymentTermsDays),
      color,
      description: description || null,
      work_start_day:          workStartDay,
      work_end_day:            workEndDay,
      meal_break_max_minutes:  mealBreakMaxMinutes,
      meal_break_billable:     mealBreakBillable,
    });
    setSaving(false);
    toast("Workspace saved.", "success");
  }

  async function handleDelete(id: string, name: string) {
    if (workspaces.length <= 1) {
      toast("You must have at least one workspace.", "destructive");
      return;
    }
    await deleteWorkspace(id);
    toast(`"${name}" deleted.`, "success");
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-background">
        <PageHeader icon={Settings} title="Settings" />
        <div className="mx-auto max-w-2xl space-y-5 px-4 py-4 md:space-y-8 md:px-6 md:py-10">
          <p className="text-muted-foreground">Loading…</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background">
      <PageHeader
        icon={Settings}
        title="Settings"
        subtitle="Manage your workspaces. Each workspace is a separate job or client."
        actions={
          <Button onClick={() => setShowNew(true)} size="sm" className="shrink-0 gap-1.5">
            <Plus className="size-4" />
            <span className="hidden sm:inline">New workspace</span>
            <span className="sm:hidden">New</span>
          </Button>
        }
      />

      <div className="mx-auto max-w-2xl space-y-5 px-4 py-4 md:space-y-8 md:px-6 md:py-10">
      {/* Workspace tabs */}
      {workspaces.length > 1 && (
        <div className="flex flex-wrap gap-2">
          {workspaces.map((ws) => (
            <button
              key={ws.id}
              onClick={() => switchWorkspace(ws.id)}
              className={cn(
                "flex items-center gap-2 rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors",
                ws.is_active
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <span className="size-2.5 rounded-full" style={{ backgroundColor: ws.color }} />
              {ws.workspace_name}
              {ws.is_active && <Check className="size-3.5" />}
            </button>
          ))}
        </div>
      )}

      {active ? (
        <form onSubmit={handleSave} className="space-y-4 md:space-y-6">

          {/* Identity */}
          <fieldset className="space-y-3 rounded-xl border p-4 md:space-y-4 md:p-5">
            <legend className="px-1 text-base font-semibold">Identity</legend>

            <div className="space-y-1">
              <label className="block text-sm font-semibold text-foreground">
                Workspace name
              </label>
              <Input
                placeholder="e.g. Nudgine LLC"
                value={workspaceName}
                onChange={(e) => setWorkspaceName(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">Shown in the sidebar and browser tab.</p>
            </div>

            <div className="space-y-1">
              <label className="block text-sm font-semibold text-foreground">Your name</label>
              <p className="text-xs text-muted-foreground">Your name as the contractor on invoices.</p>
              <Input
                placeholder="e.g. Eda Grace Paragoso"
                value={contractorName}
                onChange={(e) => setContractorName(e.target.value)}
              />
            </div>

            <div className="space-y-1">
              <label className="block text-sm font-semibold text-foreground">Client / company</label>
              <p className="text-xs text-muted-foreground">Who you invoice — shown on the invoice header.</p>
              <Input
                placeholder="e.g. Nudgine, LLC"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
              />
            </div>

            <div className="space-y-1">
              <label className="block text-sm font-semibold text-foreground">
                Description <span className="text-muted-foreground font-normal text-xs">(optional)</span>
              </label>
              <Input
                placeholder="e.g. Frontend dev contract, 40h/wk"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-semibold text-foreground">Workspace color</label>
              <div className="flex flex-wrap gap-2.5">
                {COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setColor(c)}
                    className="size-8 rounded-full border-2 transition-transform hover:scale-110 active:scale-95"
                    style={{
                      backgroundColor: c,
                      borderColor: color === c ? "white" : "transparent",
                      outline: color === c ? `2px solid ${c}` : "none",
                    }}
                  />
                ))}
              </div>
            </div>
          </fieldset>

          {/* Schedule */}
          <fieldset className="space-y-3 rounded-xl border p-4 md:space-y-4 md:p-5">
            <legend className="px-1 text-base font-semibold">Schedule</legend>

            {(() => {
              const DAY_NAMES = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
              const s = workStartDay;
              const e = workEndDay;
              const numDays = s <= e ? e - s + 1 : 7 - s + e + 1;
              const dailyTarget = Number(weeklyCap) / numDays;
              return (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="block text-sm font-semibold text-foreground">Work starts</label>
                      <select
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        value={workStartDay}
                        onChange={(e) => setWorkStartDay(Number(e.target.value))}
                      >
                        {DAY_NAMES.map((name, i) => (
                          <option key={i} value={i}>{name}</option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="block text-sm font-semibold text-foreground">Work ends</label>
                      <select
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        value={workEndDay}
                        onChange={(e) => setWorkEndDay(Number(e.target.value))}
                      >
                        {DAY_NAMES.map((name, i) => (
                          <option key={i} value={i}>{name}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="rounded-lg bg-muted/50 px-3 py-2">
                    <p className="text-sm font-medium">{numDays} work day{numDays !== 1 ? "s" : ""} per week</p>
                    <p className="text-xs text-muted-foreground mt-0.5">Daily target: {dailyTarget.toFixed(1)}h based on {weeklyCap}h weekly cap</p>
                  </div>
                </>
              );
            })()}
          </fieldset>

          {/* Timer */}
          <fieldset className="space-y-3 rounded-xl border p-4 md:p-5">
            <legend className="px-1 text-base font-semibold">Timer</legend>
            <div className="space-y-1">
              <label className="block text-sm font-semibold text-foreground">Meal break max (minutes)</label>
              <select
                className="h-9 w-full rounded-md border border-border bg-background px-3 text-sm"
                value={mealBreakMaxMinutes}
                onChange={(e) => setMealBreakMaxMinutes(Number(e.target.value))}
              >
                <option value={0}>No meal breaks</option>
                {[30, 45, 60, 90, 120].map((m) => (
                  <option key={m} value={m}>{m} min</option>
                ))}
              </select>
              <p className="text-xs text-muted-foreground">
                Meal break timer auto-stops when this limit is reached.
              </p>
            </div>

            {mealBreakMaxMinutes > 0 && (
              <div className="space-y-1">
                <label className="block text-sm font-semibold text-foreground">Meal break billing</label>
                <button
                  type="button"
                  onClick={() => setMealBreakBillable((v) => !v)}
                  className={
                    "flex w-full items-center justify-between rounded-lg border px-4 py-2 text-sm transition-colors " +
                    (mealBreakBillable ? "border-border bg-muted/30" : "border-dashed border-muted-foreground/40 text-muted-foreground")
                  }
                >
                  <span className="font-medium">{mealBreakBillable ? "Billable" : "Non-billable"}</span>
                  <span className={
                    "rounded-full px-2 py-0.5 text-xs font-medium " +
                    (mealBreakBillable ? "bg-green-500/15 text-green-600" : "bg-muted text-muted-foreground")
                  }>
                    {mealBreakBillable ? "Counts toward billed hours" : "Excluded from billed hours"}
                  </span>
                </button>
                <p className="text-xs text-muted-foreground">
                  {mealBreakBillable
                    ? "Clock keeps running during meal breaks — that time is billed."
                    : "Meal break time is subtracted from your billed hours."}
                </p>
              </div>
            )}
          </fieldset>

          {/* Billing */}
          <fieldset className="space-y-3 rounded-xl border p-4 md:space-y-4 md:p-5">
            <legend className="px-1 text-base font-semibold">Billing</legend>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="block text-sm font-semibold text-foreground">Hourly rate (USD)</label>
                <Input type="number" min={0} step={0.01} value={hourlyRate} onChange={(e) => setHourlyRate(e.target.value)} />
              </div>
              <div className="space-y-1">
                <label className="block text-sm font-semibold text-foreground">Weekly cap (hrs)</label>
                <Input type="number" min={1} value={weeklyCap} onChange={(e) => setWeeklyCap(e.target.value)} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="block text-sm font-semibold text-foreground">Invoice cycle (days)</label>
                <Input type="number" min={7} value={cycleDays} onChange={(e) => setCycleDays(e.target.value)} />
                <p className="text-xs text-muted-foreground">14 = biweekly</p>
              </div>
              <div className="space-y-1">
                <label className="block text-sm font-semibold text-foreground">Payment terms (days)</label>
                <Input type="number" min={0} value={paymentTermsDays} onChange={(e) => setPaymentTermsDays(e.target.value)} />
                <p className="text-xs text-muted-foreground">15 = Net 15</p>
              </div>
            </div>
          </fieldset>

          <div className="flex gap-3">
            <Button type="submit" className="flex-1 gap-2" disabled={saving}>
              <Settings className="size-4" />
              {saving ? "Saving…" : "Save Changes"}
            </Button>

            {workspaces.length > 1 && (
              <Button
                type="button"
                variant="destructive"
                size="icon"
                title="Delete this workspace"
                onClick={() => handleDelete(active.id, active.workspace_name)}
              >
                <Trash2 className="size-4" />
              </Button>
            )}
          </div>
        </form>
      ) : (
        <div className="rounded-xl border border-dashed py-16 text-center text-muted-foreground">
          <p>No workspace yet.</p>
          <Button className="mt-4" onClick={() => setShowNew(true)}>Create your first workspace</Button>
        </div>
      )}

      <NewWorkspaceDialog open={showNew} onClose={() => setShowNew(false)} />

      {/* ── Connect Trackers ── */}
      <div className="mt-8 space-y-3">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Connect Trackers</h2>

        {/* Chrome Extension */}
        <div className="rounded-xl border bg-card p-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4 sm:p-5">
          <div className="flex items-center gap-3 sm:contents">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-muted">
              <Globe className="size-5 text-muted-foreground" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm">Chrome Extension</p>
              <p className="text-xs text-muted-foreground mt-0.5">Tracks browser tabs - GitHub, Linear, Figma, Notion, etc. Blocks social &amp; entertainment sites.</p>
            </div>
          </div>
          <Button size="sm" variant="secondary" className="self-start sm:shrink-0" onClick={() => window.open("chrome://extensions", "_blank")}>
            Manage in Chrome
          </Button>
        </div>

        {/* VS Code Extension */}
        <div className="rounded-xl border bg-card p-5 flex items-start gap-4">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-muted">
            <Code2 className="size-5 text-muted-foreground" />
          </div>
          <div className="flex-1 min-w-0 space-y-3">
            <div>
              <p className="font-semibold text-sm">VS Code Extension</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Sends file edits, saves, terminal activity, and git commits to your activity log.
              </p>
              <p className="text-xs text-muted-foreground mt-1.5">
                <span className="font-medium text-foreground">Easiest setup:</span> in VS Code, open the Command Palette (<span className="font-mono">Cmd+Shift+P</span>) and run <span className="font-mono">Chrona: Sign In</span>. It opens this page in your browser, you approve, and the key is saved automatically - no copy/paste.
              </p>
            </div>

            {/* API key */}
            <div className="space-y-1.5">
              <p className="text-xs font-medium text-muted-foreground">Or copy manually</p>
              <p className="text-xs text-muted-foreground">
                Paste this into VS Code → Settings → <span className="font-mono">chrona.accessToken</span>. Unlike a session token, this key doesn&apos;t expire.
              </p>
              <div className="space-y-2">
                <div className="flex-1 min-w-0 rounded-lg border bg-muted/40 px-3 py-2 font-mono text-xs text-muted-foreground truncate">
                  {apiKeyLoading ? "Loading…" : apiKey || "Failed to generate key"}
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1 gap-1.5"
                    disabled={!apiKey}
                    onClick={() => {
                      navigator.clipboard.writeText(apiKey);
                      setCopied(true);
                      setTimeout(() => setCopied(false), 2000);
                    }}
                  >
                    {copied ? <CheckCheck className="size-3.5 text-emerald-500" /> : <Copy className="size-3.5" />}
                    {copied ? "Copied!" : "Copy key"}
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="shrink-0 text-xs text-muted-foreground"
                    disabled={apiKeyLoading}
                    onClick={handleRegenerateApiKey}
                  >
                    Regenerate
                  </Button>
                </div>
              </div>
              <p className="text-[11px] text-muted-foreground/60">
                Also set <span className="font-mono">chrona.apiUrl</span> to your deployed URL (or <span className="font-mono">http://localhost:3000</span> for local dev).
              </p>
            </div>
          </div>
        </div>
      </div>
      </div>
    </main>
  );
}
