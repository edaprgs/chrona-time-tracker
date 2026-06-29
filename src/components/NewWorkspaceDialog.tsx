"use client";

import { useState } from "react";
import { useWorkspace } from "@/context/WorkspaceContext";
import { useToast } from "@/hooks/useToast";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const COLORS = [
  "#ec4899", "#0ea5e9", "#10b981", "#f59e0b",
  "#ef4444", "#8b5cf6", "#6366f1", "#14b8a6",
];

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function NewWorkspaceDialog({ open, onClose }: Props) {
  const { createWorkspace } = useWorkspace();
  const { toast } = useToast();

  const [name, setName]         = useState("");
  const [client, setClient]     = useState("");
  const [contractor, setContractor] = useState("");
  const [rate, setRate]         = useState("7");
  const [cap, setCap]           = useState("40");
  const [color, setColor]       = useState(COLORS[0]);
  const [loading, setLoading]   = useState(false);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);
    await createWorkspace({
      workspace_name:    name.trim(),
      client_name:       client.trim(),
      contractor_name:   contractor.trim(),
      hourly_rate_usd:   Number(rate),
      weekly_hour_cap:   Number(cap),
      color,
    });
    toast(`Workspace "${name}" created and activated.`, "success");
    setLoading(false);
    setName(""); setClient(""); setContractor(""); setRate("7"); setCap("40"); setColor(COLORS[0]);
    onClose();
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>New Workspace</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleCreate} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Workspace name <span className="text-destructive">*</span></label>
            <Input placeholder="e.g. Acme Corp" value={name} onChange={(e) => setName(e.target.value)} required />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium">Client / company</label>
            <Input placeholder="e.g. Acme Corp, Inc." value={client} onChange={(e) => setClient(e.target.value)} />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium">Your name (contractor)</label>
            <Input placeholder="e.g. Eda Grace Paragoso" value={contractor} onChange={(e) => setContractor(e.target.value)} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Rate (USD/hr)</label>
              <Input type="number" min={0} step={0.01} value={rate} onChange={(e) => setRate(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Weekly cap (hrs)</label>
              <Input type="number" min={1} value={cap} onChange={(e) => setCap(e.target.value)} />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium">Color</label>
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

          <Button type="submit" className="w-full" disabled={loading || !name.trim()}>
            {loading ? "Creating…" : "Create Workspace"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
