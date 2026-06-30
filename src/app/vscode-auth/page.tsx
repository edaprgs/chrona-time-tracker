"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Code2, ShieldCheck, CheckCircle2 } from "lucide-react";
import { getOrCreateApiKey } from "@/lib/apiKey";

const VSCODE_EXTENSION_ID = "your-publisher-id.chrona-tracker";

function VscodeAuthContent() {
  const { user, loading } = useAuth();
  const searchParams = useSearchParams();
  const state = searchParams.get("state") ?? "";
  const [status, setStatus] = useState<"idle" | "approving" | "done" | "error">("idle");

  async function handleApprove() {
    setStatus("approving");
    const key = await getOrCreateApiKey();
    if (!key) {
      setStatus("error");
      return;
    }
    const callback = `vscode://${VSCODE_EXTENSION_ID}/auth?key=${encodeURIComponent(key)}&state=${encodeURIComponent(state)}`;
    window.location.href = callback;
    setStatus("done");
  }

  if (loading) {
    return <p className="text-sm text-muted-foreground">Loading…</p>;
  }

  if (!user) {
    return (
      <div className="text-center space-y-2">
        <p className="font-medium">You need to sign in to Chrona first.</p>
        <p className="text-sm text-muted-foreground">
          Log in, then run <span className="font-mono">Chrona: Sign In</span> in VS Code again.
        </p>
        <Button className="mt-2" onClick={() => (window.location.href = "/login")}>
          Go to login
        </Button>
      </div>
    );
  }

  if (status === "done") {
    return (
      <div className="text-center space-y-2">
        <CheckCircle2 className="size-10 mx-auto text-emerald-500" />
        <p className="font-medium">VS Code connected!</p>
        <p className="text-sm text-muted-foreground">You can close this tab and return to VS Code.</p>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="text-center space-y-2">
        <p className="font-medium text-destructive">Something went wrong generating your key.</p>
        <Button variant="outline" onClick={handleApprove}>Try again</Button>
      </div>
    );
  }

  return (
    <div className="text-center space-y-4">
      <ShieldCheck className="size-10 mx-auto text-primary" />
      <div>
        <p className="font-semibold">Authorize VS Code Extension</p>
        <p className="text-sm text-muted-foreground mt-1">
          Signed in as <span className="font-medium text-foreground">{user.email}</span>. Approving will send a
          personal API key to your VS Code extension so it can log activity to your account.
        </p>
      </div>
      <Button size="lg" className="w-full gap-2" onClick={handleApprove} disabled={status === "approving"}>
        {status === "approving" ? "Approving…" : "Approve"}
      </Button>
    </div>
  );
}

export default function VscodeAuthPage() {
  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm rounded-xl border bg-card p-8 shadow-sm">
        <div className="mb-6 flex items-center justify-center gap-2">
          <div className="flex size-9 items-center justify-center rounded-lg bg-muted">
            <Code2 className="size-4.5 text-muted-foreground" />
          </div>
          <span className="font-semibold">Chrona for VS Code</span>
        </div>
        <Suspense fallback={<p className="text-center text-sm text-muted-foreground">Loading…</p>}>
          <VscodeAuthContent />
        </Suspense>
      </div>
    </main>
  );
}
