import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { signOut } from "@/app/auth/actions";
import { LayoutDashboard, BookOpen, Zap, LogOut } from "lucide-react";
import { PLAN_LIMITS } from "@/types";
import type { Plan } from "@/types";

export default async function Navbar() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let profile: {
    name: string;
    plan: Plan;
    daily_minutes_used: number;
    daily_reset_at: string;
  } | null = null;

  if (user) {
    const { data } = await supabase
      .from("users")
      .select("name, plan, daily_minutes_used, daily_reset_at")
      .eq("id", user.id)
      .single();
    profile = data;
  }

  const plan = (profile?.plan ?? "seeker") as Plan;
  const limits = PLAN_LIMITS[plan];
  const minutesUsed = profile?.daily_minutes_used ?? 0;
  const usagePct =
    limits.dailyMinutes === Infinity
      ? 0
      : Math.min((minutesUsed / limits.dailyMinutes) * 100, 100);
  const showUsage = user && plan !== "sage";

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-4">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 shrink-0 group">
          <span className="font-cinzel text-lg font-bold tracking-[0.2em] text-text-primary group-hover:text-accent transition-colors">
            GNOSIS
          </span>
        </Link>

        {/* Center nav */}
        <nav className="hidden md:flex items-center gap-1">
          {user && (
            <Link
              href="/dashboard"
              className="gnosis-btn-ghost flex items-center gap-1.5 text-sm"
            >
              <LayoutDashboard className="w-4 h-4" />
              My Learning
            </Link>
          )}
          <Link
            href="/pricing"
            className="gnosis-btn-ghost flex items-center gap-1.5 text-sm"
          >
            <Zap className="w-4 h-4" />
            Plans & Pricing
          </Link>
        </nav>

        {/* Right side */}
        <div className="flex items-center gap-3 shrink-0">
          {/* Usage bar — visible for Seeker/Scholar */}
          {showUsage && (
            <div className="hidden sm:flex flex-col gap-1 items-end">
              <div className="flex items-center gap-2">
                <span className="font-mono text-[10px] text-text-muted uppercase tracking-wider">
                  {limits.label}
                </span>
                <span className="font-mono text-[10px] text-text-muted">
                  {minutesUsed}/{limits.dailyMinutes}m
                </span>
              </div>
              <div className="w-24 h-1 bg-surface-raised rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${usagePct}%`,
                    background:
                      usagePct > 80
                        ? "#EF4444"
                        : usagePct > 60
                        ? "#D97706"
                        : "#22C55E",
                  }}
                />
              </div>
            </div>
          )}

          {user ? (
            <div className="flex items-center gap-2">
              <Link href="/dashboard" className="gnosis-btn-secondary text-sm py-1.5 px-3 hidden sm:inline-flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5" />
                Dashboard
              </Link>
              <form action={signOut}>
                <button
                  type="submit"
                  className="gnosis-btn-ghost text-sm py-1.5 px-3 flex items-center gap-1.5 text-text-muted"
                  title="Sign out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </form>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link href="/auth/login" className="gnosis-btn-ghost text-sm py-1.5 px-3">
                Sign In
              </Link>
              <Link href="/auth/signup" className="gnosis-btn-primary text-sm py-1.5 px-4">
                Get Started
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
