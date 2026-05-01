import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import PhaseDetailClient from "@/components/phase/PhaseDetailClient";
import { ArrowLeft, ChevronLeft, ChevronRight } from "lucide-react";
import type { LearningPlan, Phase, Plan } from "@/types";

export const dynamic = "force-dynamic";

export default async function PhaseDetailPage({
  params,
}: {
  params: Promise<{ id: string; phaseIndex: string }>;
}) {
  const { id, phaseIndex: phaseIndexStr } = await params;
  const phaseIndex = parseInt(phaseIndexStr, 10);

  if (isNaN(phaseIndex)) notFound();

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/auth/login");

  const [{ data: plan }, { data: profile }] = await Promise.all([
    supabase
      .from("learning_plans")
      .select("*")
      .eq("id", id)
      .eq("user_id", user.id)
      .single(),
    supabase.from("users").select("plan").eq("id", user.id).single(),
  ]);

  if (!plan) notFound();

  const typedPlan = plan as LearningPlan;
  const phases = typedPlan.phases as Phase[];

  if (phaseIndex < 0 || phaseIndex >= phases.length) notFound();

  const phase = phases[phaseIndex];
  const userPlan = (profile?.plan ?? "seeker") as Plan;

  // Fetch cached course content (if any) server-side
  const { data: existingCourse } = await supabase
    .from("generated_courses")
    .select("content")
    .eq("plan_id", id)
    .eq("phase_id", phase.id)
    .single();

  // Touch last_accessed
  await supabase
    .from("learning_plans")
    .update({ last_accessed: new Date().toISOString() })
    .eq("id", id);

  const prevIndex = phaseIndex > 0 ? phaseIndex - 1 : null;
  const nextIndex = phaseIndex < phases.length - 1 ? phaseIndex + 1 : null;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      {/* Breadcrumb nav */}
      <div className="flex items-center justify-between gap-4">
        <Link
          href={`/plan/${id}`}
          className="inline-flex items-center gap-1.5 text-text-muted hover:text-text-primary text-sm transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="truncate max-w-[200px]">{typedPlan.goal}</span>
        </Link>

        <div className="flex items-center gap-1 shrink-0">
          {prevIndex !== null && (
            <Link
              href={`/plan/${id}/phase/${prevIndex}`}
              className="gnosis-btn-ghost py-1.5 px-2 flex items-center gap-1 text-sm"
            >
              <ChevronLeft className="w-4 h-4" />
              Prev
            </Link>
          )}
          <span className="font-mono text-xs text-text-muted px-2">
            {phaseIndex + 1} / {phases.length}
          </span>
          {nextIndex !== null && (
            <Link
              href={`/plan/${id}/phase/${nextIndex}`}
              className="gnosis-btn-ghost py-1.5 px-2 flex items-center gap-1 text-sm"
            >
              Next
              <ChevronRight className="w-4 h-4" />
            </Link>
          )}
        </div>
      </div>

      {/* All interactive content */}
      <PhaseDetailClient
        plan={typedPlan}
        phase={phase}
        phaseIndex={phaseIndex}
        userPlan={userPlan}
        initialCourseContent={existingCourse?.content ?? null}
      />
    </div>
  );
}
