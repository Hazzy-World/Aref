"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, ChevronRight, Clock, CheckCircle2 } from "lucide-react";
import LevelBadge from "@/components/ui/LevelBadge";
import type { Approach } from "@/types";

interface Props {
  approach: Approach;
  totalHours: number;
  goal: string;
  isLoggedIn: boolean;
  recommended?: boolean;
}

export default function ApproachCard({
  approach,
  totalHours,
  goal,
  isLoggedIn,
  recommended,
}: Props) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleChoose() {
    if (!isLoggedIn) {
      router.push(`/auth/signup?redirectTo=${encodeURIComponent("/")}`);
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const res = await fetch("/api/plans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ goal, approach, totalHours }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Failed to save plan");
        setSaving(false);
        return;
      }

      router.push(`/plan/${data.planId}`);
    } catch {
      setError("Network error. Please try again.");
      setSaving(false);
    }
  }

  const approachHours = approach.phases.reduce(
    (sum, p) => sum + p.estimatedHours,
    0
  );

  return (
    <div className="relative gnosis-card flex flex-col h-full hover:border-accent/40 transition-all duration-300 group overflow-hidden">
      {/* Recommended badge */}
      {recommended && (
        <div className="absolute top-0 right-0 bg-accent text-background font-mono text-[10px] font-bold px-3 py-1 rounded-bl-lg tracking-wider">
          RECOMMENDED
        </div>
      )}

      {/* Ambient glow on hover */}
      <div className="absolute inset-0 bg-gradient-to-br from-accent/0 to-accent/0 group-hover:from-accent/5 group-hover:to-purple/5 transition-all duration-500 pointer-events-none rounded-xl" />

      <div className="p-6 flex flex-col gap-5 flex-1">
        {/* Header */}
        <div className="flex items-start gap-4">
          <div className="text-4xl leading-none">{approach.icon}</div>
          <div className="flex-1 min-w-0">
            <h3 className="font-cinzel text-lg font-semibold text-text-primary leading-tight">
              {approach.name}
            </h3>
            <p className="text-accent text-sm font-outfit mt-0.5">
              {approach.tagline}
            </p>
          </div>
        </div>

        {/* Style description */}
        <p className="text-text-secondary text-sm leading-relaxed italic">
          &ldquo;{approach.style}&rdquo;
        </p>

        {/* Phases list */}
        <div className="space-y-2">
          <p className="gnosis-label">Learning Phases</p>
          <div className="space-y-1.5">
            {approach.phases.map((phase, i) => (
              <div
                key={phase.id}
                className="flex items-center gap-2 text-sm"
              >
                <span className="font-mono text-[10px] text-text-muted w-5 shrink-0">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span className="text-text-secondary truncate flex-1">
                  {phase.title}
                </span>
                <LevelBadge level={phase.level} />
                <span className="font-mono text-[10px] text-text-muted shrink-0">
                  {phase.estimatedHours}h
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Total hours */}
        <div className="flex items-center gap-2 pt-1 border-t border-border">
          <Clock className="w-4 h-4 text-text-muted" />
          <span className="text-text-secondary text-sm">
            <span className="font-semibold text-text-primary">
              {approachHours}
            </span>{" "}
            total hours
          </span>
          <span className="ml-auto font-mono text-[10px] text-text-muted uppercase tracking-wider">
            {approach.phases.length} phases
          </span>
        </div>
      </div>

      {/* CTA */}
      <div className="px-6 pb-6">
        {error && (
          <p className="text-red-400 text-xs mb-3 text-center">{error}</p>
        )}
        <button
          onClick={handleChoose}
          disabled={saving}
          className="w-full gnosis-btn-primary flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {saving ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Creating plan…
            </>
          ) : isLoggedIn ? (
            <>
              <CheckCircle2 className="w-4 h-4" />
              Choose this Path
              <ChevronRight className="w-4 h-4 ml-auto" />
            </>
          ) : (
            <>
              Sign up to choose
              <ChevronRight className="w-4 h-4 ml-auto" />
            </>
          )}
        </button>
      </div>
    </div>
  );
}
