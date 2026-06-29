"use client";

import { useEffect, useState } from "react";
import { useWorkspace } from "@/context/WorkspaceContext";
import { useToast } from "@/hooks/useToast";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Settings, DollarSign, Clock, Calendar, User, Briefcase, Trash2, Plus, Check, Globe } from "lucide-react";
import NewWorkspaceDialog from "@/components/NewWorkspaceDialog";
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
  const [color, setColor]                 = useState(COLORS[0]);
  const [description, setDescription]     = useState("");
  const [saving, setSaving]               = useState(false);
  const [showNew, setShowNew]             = useState(false);

  useEffect(() => {
    if (!active) return;
    setWorkspaceName(active.workspace_name);
    setContractorName(active.contractor_name);
    setClientName(active.client_name);
    setHourlyRate(String(active.hourly_rate_usd));
    setWeeklyCap(String(active.weekly_hour_cap));
    setCycleDays(String(active.invoice_cycle_days));
    setColor(active.color ?? COLORS[0]);
    setDescription(active.description ?? "");
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
      color,
      description: description || null,
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
      <main className="mx-auto max-w-2xl space-y-6 px-4 py-6 md:space-y-8 md:px-6 md:py-10">
        <p className="text-muted-foreground">Loading…</p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-2xl space-y-6 px-4 py-6 md:space-y-8 md:px-6 md:py-10">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold">Settings</h1>
          <p className="text-muted-foreground">Manage your workspaces. Each workspace is a separate job or client.</p>
        </div>
        <Button onClick={() => setShowNew(true)} size="sm" className="gap-2">
          <Plus className="size-4" /> New workspace
        </Button>
      </div>

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
        <form onSubmit={handleSave} className="space-y-6">
          {/* Identity */}
          <fieldset className="space-y-4 rounded-xl border p-5">
            <legend className="px-1 text-sm font-semibold">Identity</legend>

            <div className="space-y-1.5">
              <label className="flex items-center gap-1.5 text-sm font-medium">
                <Briefcase className="size-3.5" /> Workspace name
              </label>
              <Input
                placeholder="e.g. Nudgine LLC"
                value={workspaceName}
                onChange={(e) => setWorkspaceName(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">Shown in the sidebar and browser tab.</p>
            </div>

            <div className="space-y-1.5">
              <label className="flex items-center gap-1.5 text-sm font-medium">
                <User className="size-3.5" /> Your name (contractor)
              </label>
              <Input
                placeholder="e.g. Eda Grace Jutba Paragoso"
                value={contractorName}
                onChange={(e) => setContractorName(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <label className="flex items-center gap-1.5 text-sm font-medium">
                <Briefcase className="size-3.5" /> Client / company name
              </label>
              <Input
                placeholder="e.g. Nudgine, LLC"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium">Description <span className="text-muted-foreground font-normal">(optional)</span></label>
              <Input
                placeholder="e.g. Frontend dev contract, 40h/wk"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium">Workspace color</label>
              <div className="flex gap-2">
                {COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setColor(c)}
                    className="size-7 rounded-full border-2 transition-transform hover:scale-110"
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

          {/* Billing */}
          <fieldset className="space-y-4 rounded-xl border p-5">
            <legend className="px-1 text-sm font-semibold">Billing</legend>

            <div className="space-y-1.5">
              <label className="flex items-center gap-1.5 text-sm font-medium">
                <DollarSign className="size-3.5" /> Hourly rate (USD)
              </label>
              <Input type="number" min={0} step={0.01} value={hourlyRate} onChange={(e) => setHourlyRate(e.target.value)} />
            </div>

            <div className="space-y-1.5">
              <label className="flex items-center gap-1.5 text-sm font-medium">
                <Clock className="size-3.5" /> Weekly hour cap
              </label>
              <Input type="number" min={1} value={weeklyCap} onChange={(e) => setWeeklyCap(e.target.value)} />
            </div>

            <div className="space-y-1.5">
              <label className="flex items-center gap-1.5 text-sm font-medium">
                <Calendar className="size-3.5" /> Invoice cycle (days)
              </label>
              <Input type="number" min={7} value={cycleDays} onChange={(e) => setCycleDays(e.target.value)} />
              <p className="text-xs text-muted-foreground">14 = biweekly, 7 = weekly.</p>
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
        <div className="rounded-xl border bg-card p-5 flex items-center gap-4">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-muted">
            <Globe className="size-5 text-muted-foreground" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm">Chrome Extension</p>
            <p className="text-xs text-muted-foreground mt-0.5">Tracks browser tabs — GitHub, Linear, Figma, Notion, etc. Blocks social &amp; entertainment sites.</p>
          </div>
          <Button size="sm" variant="secondary" onClick={() => window.open("chrome://extensions", "_blank")}>
            Manage in Chrome
          </Button>
        </div>
      </div>
    </main>
  );
}
