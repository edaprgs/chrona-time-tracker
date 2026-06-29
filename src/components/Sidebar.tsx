"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, Table2, Receipt, Settings, LogOut,
  ChevronDown, Plus, Check, AlertTriangle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";
import { useWorkspace } from "@/context/WorkspaceContext";
import { useState } from "react";
import NewWorkspaceDialog from "@/components/NewWorkspaceDialog";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

const NAV_LINKS = [
  { href: "/",         label: "Dashboard",  icon: LayoutDashboard },
  { href: "/sessions", label: "Sessions",   icon: Table2          },
  { href: "/invoice",  label: "Invoice",    icon: Receipt         },
  { href: "/settings", label: "Settings",   icon: Settings        },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { user, signOut } = useAuth();
  const { workspaces, active, switchWorkspace } = useWorkspace();
  const [showWorkspaces, setShowWorkspaces] = useState(false);
  const [showNewWorkspace, setShowNewWorkspace] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  async function handleLogout() {
    setSigningOut(true);
    await signOut();
    setSigningOut(false);
    setShowLogoutConfirm(false);
  }

  const initials = (user?.email?.[0] ?? "U").toUpperCase();
  const emailName = user?.email?.split("@")[0] ?? "";

  return (
    <>
      <aside className="fixed inset-y-0 left-0 z-20 flex w-64 flex-col border-r bg-card/95 backdrop-blur-sm print:hidden">

        {/* Logo */}
        <div className="flex items-center gap-3 px-5 py-5">
          <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" className="size-9 shrink-0 drop-shadow-sm">
            <rect width="32" height="32" rx="7" fill="#ec4899"/>
            <rect width="32" height="32" rx="7" fill="white" fillOpacity="0.08"/>
            <path d="M11 6h10" stroke="white" strokeWidth="2" strokeLinecap="round"/>
            <path d="M16 6v3" stroke="white" strokeWidth="2" strokeLinecap="round"/>
            <path d="M23 14l1.4-1.4" stroke="white" strokeWidth="1.8" strokeLinecap="round"/>
            <circle cx="16" cy="20" r="8.5" fill="white" fillOpacity="0.15" stroke="white" strokeWidth="1.8"/>
            <line x1="16" y1="20" x2="16" y2="13.5" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
            <line x1="16" y1="20" x2="20.5" y2="16" stroke="white" strokeWidth="1" strokeLinecap="round" opacity="0.85"/>
            <circle cx="16" cy="20" r="1.2" fill="white"/>
          </svg>
          <div>
            <span className="text-base font-bold tracking-tight">Chrona</span>
            <p className="text-[10px] text-muted-foreground leading-none mt-0.5">Time Tracker</p>
          </div>
        </div>

        {/* Workspace switcher */}
        <div className="mx-3 mb-3">
          <button
            onClick={() => setShowWorkspaces((v) => !v)}
            className={cn(
              "flex w-full items-center gap-2.5 rounded-xl border px-3 py-2.5 text-left transition-all",
              showWorkspaces
                ? "border-primary/30 bg-primary/5"
                : "border-border bg-muted/30 hover:border-primary/20 hover:bg-muted/60"
            )}
          >
            <span
              className="flex size-8 shrink-0 items-center justify-center rounded-lg text-xs font-bold text-white shadow-sm"
              style={{ backgroundColor: active?.color ?? "#ec4899" }}
            >
              {(active?.workspace_name ?? "W")[0].toUpperCase()}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold leading-tight">
                {active?.workspace_name ?? "No workspace"}
              </p>
              {active?.client_name && (
                <p className="truncate text-[11px] text-muted-foreground leading-tight mt-0.5">
                  {active.client_name}
                </p>
              )}
            </div>
            <ChevronDown
              className={cn(
                "size-4 shrink-0 text-muted-foreground transition-transform duration-200",
                showWorkspaces && "rotate-180"
              )}
            />
          </button>

          {showWorkspaces && (
            <div className="mt-1.5 overflow-hidden rounded-xl border bg-popover shadow-lg">
              <div className="p-1.5 space-y-0.5">
                {workspaces.map((ws) => (
                  <button
                    key={ws.id}
                    onClick={() => { switchWorkspace(ws.id); setShowWorkspaces(false); }}
                    className={cn(
                      "flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm transition-colors",
                      ws.is_active
                        ? "bg-primary/8 text-foreground"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    )}
                  >
                    <span
                      className="flex size-6 shrink-0 items-center justify-center rounded-md text-[11px] font-bold text-white"
                      style={{ backgroundColor: ws.color }}
                    >
                      {ws.workspace_name[0].toUpperCase()}
                    </span>
                    <span className="flex-1 truncate text-left font-medium">{ws.workspace_name}</span>
                    {ws.is_active && <Check className="size-3.5 text-primary shrink-0" />}
                  </button>
                ))}
              </div>
              <div className="border-t p-1.5">
                <button
                  onClick={() => { setShowWorkspaces(false); setShowNewWorkspace(true); }}
                  className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                >
                  <div className="flex size-6 items-center justify-center rounded-md border border-dashed">
                    <Plus className="size-3.5" />
                  </div>
                  New workspace
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Nav label */}
        <p className="px-5 pb-1.5 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">
          Menu
        </p>

        {/* Nav links */}
        <nav className="flex-1 space-y-0.5 overflow-y-auto px-3 pb-4">
          {NAV_LINKS.map(({ href, label, icon: Icon }) => {
            const isActive = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all",
                  isActive
                    ? "bg-primary text-primary-foreground shadow-sm shadow-primary/20"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <Icon className={cn(
                  "size-4 shrink-0 transition-transform group-hover:scale-110",
                  isActive && "group-hover:scale-100"
                )} />
                {label}
                {isActive && (
                  <span className="ml-auto size-1.5 rounded-full bg-primary-foreground/60" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* User footer */}
        <div className="border-t p-3">
          <div className="rounded-xl bg-muted/40 p-2">
            {/* Avatar + name row */}
            <div className="flex items-center gap-2.5 px-1 py-1">
              <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary ring-1 ring-primary/20">
                {initials}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-semibold">{emailName}</p>
                <p className="truncate text-[10px] text-muted-foreground">{user?.email}</p>
              </div>
            </div>

            {/* Logout button — full width, explicit */}
            <button
              onClick={() => setShowLogoutConfirm(true)}
              className="mt-1.5 flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
            >
              <LogOut className="size-4 shrink-0" />
              Sign out
            </button>
          </div>
        </div>
      </aside>

      <NewWorkspaceDialog open={showNewWorkspace} onClose={() => setShowNewWorkspace(false)} />

      {/* Logout confirmation dialog */}
      <Dialog open={showLogoutConfirm} onOpenChange={setShowLogoutConfirm}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <div className="flex items-center gap-3 mb-1">
              <div className="flex size-10 items-center justify-center rounded-full bg-destructive/10">
                <AlertTriangle className="size-5 text-destructive" />
              </div>
              <DialogTitle>Sign out?</DialogTitle>
            </div>
            <DialogDescription>
              You&apos;ll be signed out of your account. Any unsaved timer progress will be
              preserved in your browser — just sign back in to continue.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-2">
            <Button
              variant="outline"
              onClick={() => setShowLogoutConfirm(false)}
              disabled={signingOut}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleLogout}
              disabled={signingOut}
              className="flex-1 gap-2"
            >
              <LogOut className="size-4" />
              {signingOut ? "Signing out…" : "Yes, sign out"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
