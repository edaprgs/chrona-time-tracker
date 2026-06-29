"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Clock3, Table2, Receipt, Settings, LogOut, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";
import { useWorkspace } from "@/context/WorkspaceContext";

const links = [
  { href: "/",         label: "Timer",    icon: Clock3   },
  { href: "/sessions", label: "Sessions", icon: Table2   },
  { href: "/invoice",  label: "Invoice",  icon: Receipt  },
  { href: "/settings", label: "Settings", icon: Settings },
];

export default function Nav() {
  const pathname = usePathname();
  const { user, signOut } = useAuth();
  const { workspaceName } = useWorkspace();

  return (
    <header className="sticky top-0 z-10 border-b bg-card/70 backdrop-blur print:hidden">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link href="/" className="flex flex-col leading-none">
          <span className="text-lg font-semibold text-primary">Chrona</span>
          {workspaceName && workspaceName !== "My Workspace" && (
            <span className="text-xs text-muted-foreground">{workspaceName}</span>
          )}
        </Link>

        <nav className="flex gap-1">
          {links.map(({ href, label, icon: Icon }) => {
            const active = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-colors",
                  active
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                )}
              >
                <Icon className="size-4" />
                {label}
              </Link>
            );
          })}
        </nav>

        {user && (
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <User className="size-3.5" />
              {user.email}
            </span>
            <button
              onClick={signOut}
              className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              <LogOut className="size-3.5" />
              Sign out
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
