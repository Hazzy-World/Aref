import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import PhaseCard from "@/components/plan/PhaseCard";
import ProgressBar from "@/components/ui/ProgressBar";
import PlanCard from "@/components/plan/PlanCard";
import { ArrowLeft, Clock, Layers, Trophy } from "lucide-react";
import type { LearningPlan, Phase } from "@/types";

export const dynamic = "force-dynamic";

function calcOverallProgress(plan: LearningPlan): number {
  const total = (plan.phases as Phase[]).reduce(
    (sum, p) => sum + (p.topics?.length ?? 0),
    0
  );
  if (!total) return 0;
  const done = Object.values(
    plan.completed_topics as Record<string, string[]>
  ).flat().length;
  return Math.round((done / total) * 100);
}

export default async function PlanPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/auth/login");

  const [{ data: plan }, { data: otherPlans }] = await Promise.all([
    supabase
      .from("learning_plans")
      .select("*")
      .eq("id", id)
      .eq("user_id", user.id)
      .single(),
    supabase
      .from("learning_plans")
      .select("*")
      .eq("user_id", user.id)
      .neq("id", id)
      .order("last_accessed", { ascending: false })
      .limit(3),
  ]);

  if (!plan) notFound();

  const typedPlan = plan as LearningPlan;
  const phases = typedPlan.phases as Phase[];
  const completedTopics = typedPlan.completed_topics as Record<string, string[]>;
  const overallPct = calcOverallProgress(typedPlan);
  const completedPhases = phases.filter(
    (p) =>
      (p.topics?.length ?? 0) > 0 &&
      (completedTopics[p.id]?.length ?? 0) >= (p.topics?.length ?? 0)
  ).length;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      {/* Back */}
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-2 text-text-muted hover:text-text-primary text-sm transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Dashboard
      </Link>

      {/* Plan header */}
      <div className="aref-card p-6 space-y-5">
        <div className="flex items-start gap-4">
          <span className="text-4xl">{typedPlan.approach_icon}</span>
          <div className="flex-1 min-w-0">
            <p className="text-text-muted text-xs font-mono uppercase tracking-widest mb-1">
              {typedPlan.approach_name}
            </p>
            <h1 className="font-cinzel text-2xl font-bold text-text-primary leading-tight">
              {typedPlan.goal}
            </h1>
          </div>
        </div>

        {/* Stats row */}
        <div className="flex flex-wrap items-center gap-6 text-sm">
          <div className="flex items-center gap-2 text-text-secondary">
            <Clock className="w-4 h-4 text-text-muted" />
            <span>
              <span className="text-text-primary font-medium">
                {typedPlan.total_hours}
              </span>{" "}
              total hours
            </span>
          </div>
          <div className="flex items-center gap-2 text-text-secondary">
            <Layers className="w-4 h-4 text-text-muted" />
            <span>
              <span className="text-text-primary font-medium">
                {phases.length}
              </span>{" "}
              phases
            </span>
          </div>
          <div className="flex items-center gap-2 text-text-secondary">
            <Trophy className="w-4 h-4 text-text-muted" />
            <span>
              <span className="text-text-primary font-medium">
                {completedPhases}
              </span>{" "}
              phases complete
            </span>
          </div>
        </div>

        {/* Overall progress */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="aref-label">Overall Progress</span>
            <span className="font-mono text-sm text-text-primary font-semibold">
              {overallPct}%
            </span>
          </div>
          <ProgressBar value={overallPct} />
        </div>
      </div>

      {/* Phases grid */}
      <div>
        <h2 className="font-cinzel text-lg font-semibold text-text-primary mb-4">
          Learning Phases
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {phases.map((phase, idx) => (
            <PhaseCard
              key={phase.id}
              phase={phase}
              index={idx}
              planId={typedPlan.id}
              completedTopics={completedTopics[phase.id] ?? []}
            />
          ))}
        </div>
      </div>

      {/* Other plans */}
      {(otherPlans ?? []).length > 0 && (
        <div>
          <h2 className="font-cinzel text-lg font-semibold text-text-primary mb-4">
            Other Plans
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {(otherPlans as LearningPlan[]).map((p) => (
              <PlanCard key={p.id} plan={p} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
