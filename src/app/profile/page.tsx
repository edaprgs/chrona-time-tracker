"use client";

import { useState } from "react";
import { format } from "date-fns";
import { useAuth } from "@/context/AuthContext";
import { useWorkspace } from "@/context/WorkspaceContext";
import { useSessionsContext } from "@/context/SessionsContext";
import { useToast } from "@/hooks/useToast";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { User, Mail, Calendar, Briefcase, KeyRound, Eye, EyeOff } from "lucide-react";
import PageHeader from "@/components/PageHeader";

export default function ProfilePage() {
  const { user } = useAuth();
  const { workspaces } = useWorkspace();
  const { sessions } = useSessionsContext();
  const { toast } = useToast();

  const [newPassword, setNewPassword]   = useState("");
  const [confirmPassword, setConfirm]   = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [saving, setSaving]             = useState(false);

  const initials  = (user?.email?.[0] ?? "U").toUpperCase();
  const emailName = user?.email?.split("@")[0] ?? "";
  const joined    = user?.created_at ? format(new Date(user.created_at), "MMMM d, yyyy") : "N/A";

  const totalHours = sessions.reduce((sum, s) => sum + Number(s.duration_minutes || 0), 0) / 60;

  async function handleChangePassword() {
    if (newPassword.length < 6) {
      toast("Password must be at least 6 characters.", "destructive");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast("Passwords don't match.", "destructive");
      return;
    }
    setSaving(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setSaving(false);
    if (error) {
      toast(error.message, "destructive");
      return;
    }
    setNewPassword("");
    setConfirm("");
    toast("Password updated.", "success");
  }

  return (
    <main className="min-h-screen bg-background">
      <PageHeader icon={User} title="Profile" subtitle="Your account details and preferences." />

      <div className="mx-auto max-w-2xl space-y-6 px-4 py-6 md:px-8 md:py-10">
      {/* Identity card */}
      <div className="rounded-xl border bg-card p-6">
        <div className="flex items-center gap-4">
          <div className="flex size-16 shrink-0 items-center justify-center rounded-full bg-primary/10 text-2xl font-bold text-primary ring-1 ring-primary/20">
            {initials}
          </div>
          <div className="min-w-0">
            <p className="truncate text-lg font-semibold">{emailName}</p>
            <p className="truncate text-sm text-muted-foreground">{user?.email}</p>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="flex items-center gap-2.5 rounded-lg bg-muted/40 px-3 py-2.5">
            <Calendar className="size-4 shrink-0 text-muted-foreground" />
            <div className="min-w-0">
              <p className="text-[11px] text-muted-foreground">Joined</p>
              <p className="truncate text-sm font-medium">{joined}</p>
            </div>
          </div>
          <div className="flex items-center gap-2.5 rounded-lg bg-muted/40 px-3 py-2.5">
            <Briefcase className="size-4 shrink-0 text-muted-foreground" />
            <div className="min-w-0">
              <p className="text-[11px] text-muted-foreground">Workspaces</p>
              <p className="truncate text-sm font-medium">{workspaces.length}</p>
            </div>
          </div>
          <div className="flex items-center gap-2.5 rounded-lg bg-muted/40 px-3 py-2.5">
            <User className="size-4 shrink-0 text-muted-foreground" />
            <div className="min-w-0">
              <p className="text-[11px] text-muted-foreground">Total hours logged</p>
              <p className="truncate text-sm font-medium">{totalHours.toFixed(1)}h</p>
            </div>
          </div>
        </div>
      </div>

      {/* Email (read-only) */}
      <div className="rounded-xl border bg-card p-6 space-y-2">
        <div className="flex items-center gap-2">
          <Mail className="size-4 text-muted-foreground" />
          <h2 className="font-semibold">Email</h2>
        </div>
        <p className="text-sm text-muted-foreground">
          {user?.email} · Contact support to change your email address.
        </p>
      </div>

      {/* Change password */}
      <div className="rounded-xl border bg-card p-6 space-y-4">
        <div className="flex items-center gap-2">
          <KeyRound className="size-4 text-muted-foreground" />
          <h2 className="font-semibold">Change Password</h2>
        </div>

        <div className="space-y-3">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">New password</label>
            <div className="relative">
              <Input
                type={showPassword ? "text" : "password"}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="At least 6 characters"
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Confirm new password</label>
            <Input
              type={showPassword ? "text" : "password"}
              value={confirmPassword}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="Re-enter password"
              autoComplete="new-password"
            />
          </div>

          <Button onClick={handleChangePassword} disabled={saving || !newPassword || !confirmPassword}>
            {saving ? "Updating…" : "Update Password"}
          </Button>
        </div>
      </div>
      </div>
    </main>
  );
}
