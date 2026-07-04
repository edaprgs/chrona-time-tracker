"use client";

import { useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Clock3, LogIn, UserPlus, Eye, EyeOff, ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";

type Mode = "signin" | "signup";

export default function LoginPage() {
  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm]   = useState("");
  const [showPassword, setShowPassword]   = useState(false);
  const [showConfirm, setShowConfirm]     = useState(false);
  const [loading, setLoading]             = useState(false);
  const [error, setError]       = useState("");
  const [success, setSuccess]   = useState("");

  function switchMode(next: Mode) {
    setMode(next);
    setError("");
    setSuccess("");
    setConfirm("");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(""); setSuccess("");

    if (mode === "signup" && password !== confirm) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    if (mode === "signin") {
      const { error: err } = await supabase.auth.signInWithPassword({ email, password });
      if (err) setError(err.message);
    } else {
      const { error: err } = await supabase.auth.signUp({ email, password });
      if (err) setError(err.message);
      else setSuccess("Account created! You can now sign in.");
    }

    setLoading(false);
  }

  const isSignIn = mode === "signin";

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm space-y-6">

        <Link href="/" className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="size-3.5" />
          Back to home
        </Link>

        {/* Logo */}
        <div className="space-y-2 text-center">
          <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-primary/10">
            <Clock3 className="size-6 text-primary" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Chrona</h1>
          <p className="text-sm text-muted-foreground">Honest time tracking for contract work.</p>
        </div>

        {/* Mode tabs */}
        <div className="flex rounded-xl border bg-muted p-1 text-sm font-medium">
          <button
            type="button"
            onClick={() => switchMode("signin")}
            className={cn(
              "flex flex-1 items-center justify-center gap-2 rounded-lg py-2 transition-colors",
              isSignIn
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <LogIn className="size-4" />
            Sign In
          </button>
          <button
            type="button"
            onClick={() => switchMode("signup")}
            className={cn(
              "flex flex-1 items-center justify-center gap-2 rounded-lg py-2 transition-colors",
              !isSignIn
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <UserPlus className="size-4" />
            Create Account
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Sign-up heading context */}
          {!isSignIn && (
            <div className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800 dark:border-blue-900 dark:bg-blue-950/40 dark:text-blue-300">
              One account, unlimited workspaces - add a separate workspace for each client or job, all under the same login.
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-sm font-medium">Email</label>
            <Input
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Password</label>
              {isSignIn && (
                <span className="text-xs text-muted-foreground">min. 6 characters</span>
              )}
            </div>
            <div className="relative">
              <Input
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                autoComplete={isSignIn ? "current-password" : "new-password"}
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
          </div>

          {/* Confirm password - signup only */}
          {!isSignIn && (
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Confirm Password</label>
              <div className="relative">
                <Input
                  type={showConfirm ? "text" : "password"}
                  placeholder="••••••••"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  required
                  minLength={6}
                  autoComplete="new-password"
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  aria-label={showConfirm ? "Hide password" : "Show password"}
                >
                  {showConfirm ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
            </div>
          )}

          {error && (
            <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>
          )}
          {success && (
            <p className="rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700 dark:bg-green-950/40 dark:text-green-400">
              {success}
            </p>
          )}

          <Button type="submit" className="w-full gap-2" disabled={loading}>
            {loading ? "Please wait…" : isSignIn
              ? <><LogIn className="size-4" /> Sign In</>
              : <><UserPlus className="size-4" /> Create Account</>
            }
          </Button>
        </form>

        <p className="text-center text-xs text-muted-foreground">
          {isSignIn ? "No account yet?" : "Already have an account?"}{" "}
          <button
            type="button"
            onClick={() => switchMode(isSignIn ? "signup" : "signin")}
            className="font-medium text-primary hover:underline"
          >
            {isSignIn ? "Create one →" : "Sign in →"}
          </button>
        </p>
      </div>
    </main>
  );
}
