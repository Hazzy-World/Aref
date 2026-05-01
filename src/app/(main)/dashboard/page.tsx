import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import PlanCard from "@/components/plan/PlanCard";
import PendingPlanSaver from "@/components/landing/PendingPlanSaver";
import { Plus, BookOpen, Sparkles, Map, Star, Zap } from "lucide-react";
import type { LearningPlan, Plan } from "@/types";
import { PLAN_LIMITS } from "@/types";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/auth/login");

  const [{ data: plansData }, { data: profile }] = await Promise.all([
    supabase
      .from("learning_plans")
      .select("*")
      .eq("user_id", user.id)
      .order("last_accessed", { ascending: false }),
    supabase
      .from("users")
      .select("name, plan, daily_minutes_used")
      .eq("id", user.id)
      .single(),
  ]);

  const plans = (plansData as LearningPlan[]) ?? [];
  const userPlan = (profile?.plan ?? "seeker") as Plan;
  const limits = PLAN_LIMITS[userPlan];
  const canAddPlan =
    limits.maxPlans === Infinity || plans.length < limits.maxPlans;
  const firstName = profile?.name ? profile.name.split(" ")[0] : null;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
      {/* Saves any pending plan generated before signup */}
      <PendingPlanSaver />

      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-10">
        <div>
          <h1 className="font-cinzel text-3xl font-bold text-text-primary tracking-wide">
            My Learning
          </h1>
          <p className="text-text-secondary mt-1">
            {firstName ? `Welcome back, ${firstName}.` : "Welcome back."}{" "}
            {plans.length === 0
              ? "Start your first learning journey."
              : `You have ${plans.length} active plan${plans.length !== 1 ? "s" : ""}.`}
          </p>
        </div>

        {canAddPlan ? (
          <Link href="/" className="aref-btn-primary flex items-center gap-2 shrink-0">
            <Plus className="w-4 h-4" />
            New Plan
          </Link>
        ) : (
          <Link
            href="/pricing"
            className="aref-btn-secondary flex items-center gap-2 shrink-0 text-sm"
          >
            <Sparkles className="w-4 h-4 text-accent" />
            Upgrade for more plans
          </Link>
        )}
      </div>

      {/* Plans grid */}
      {plans.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {plans.map((plan) => (
            <PlanCard key={plan.id} plan={plan} />
          ))}
        </div>
      ) : (
        <EmptyState />
      )}

      {/* Plan limit notice */}
      {!canAddPlan && (
        <div className="mt-8 p-4 aref-card flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-accent/10 border border-accent/30 flex items-center justify-center shrink-0">
            <BookOpen className="w-5 h-5 text-accent" />
          </div>
          <div className="flex-1">
            <p className="text-text-primary text-sm font-medium">
              Plan limit reached ({limits.maxPlans} plan{limits.maxPlans !== 1 ? "s" : ""} on {limits.label})
            </p>
            <p className="text-text-muted text-xs mt-0.5">
              Upgrade to Scholar or Sage to create more learning plans.
            </p>
          </div>
          <Link href="/pricing" className="aref-btn-primary text-sm py-2 px-4 shrink-0">
            Upgrade
          </Link>
        </div>
      )}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-8">
      {/* Illustration */}
      <div className="relative">
        <div className="w-28 h-28 rounded-full bg-accent/5 border border-accent/20 flex items-center justify-center">
          <Map className="w-12 h-12 text-accent/60" />
        </div>
        {/* Orbiting dots */}
        <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-surface-raised border border-border flex items-center justify-center">
          <Star className="w-4 h-4 text-accent" />
        </div>
        <div className="absolute -bottom-2 -left-2 w-8 h-8 rounded-full bg-surface-raised border border-border flex items-center justify-center">
          <Zap className="w-4 h-4 text-amber-400" />
        </div>
        <div className="absolute top-2 -left-3 w-6 h-6 rounded-full bg-success/10 border border-success/30" />
        <div className="absolute bottom-3 -right-3 w-5 h-5 rounded-full bg-purple/10 border border-purple/20" />
      </div>

      <div className="text-center space-y-3 max-w-sm">
        <h2 className="font-cinzel text-2xl font-semibold text-text-primary">
          Your journey starts here
        </h2>
        <p className="text-text-secondary text-sm leading-relaxed">
          Tell AREF what you want to master. Get three personalised learning
          paths — with curated books, videos, and AI-generated course content
          — in seconds.
        </p>
      </div>

      <div className="flex flex-col sm:flex-row items-center gap-3">
        <Link href="/" className="aref-btn-primary flex items-center gap-2 px-6">
          <Sparkles className="w-4 h-4" />
          Generate my first plan
        </Link>
        <Link
          href="/pricing"
          className="aref-btn-ghost text-sm flex items-center gap-1.5"
        >
          View plans & pricing
        </Link>
      </div>

      {/* Feature hints */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full max-w-2xl mt-2">
        {[
          {
            icon: Map,
            title: "Visual Mind Maps",
            desc: "See your entire learning path at a glance",
          },
          {
            icon: Brain,
            title: "AI Understanding Scores",
            desc: "Claude tracks your progress through conversations",
          },
          {
            icon: Sparkles,
            title: "Full Course Content",
            desc: "AI-written lessons for every phase, all plans",
          },
        ].map(({ icon: Icon, title, desc }) => (
          <div
            key={title}
            className="aref-card p-4 flex flex-col items-center text-center gap-2"
          >
            <div className="w-9 h-9 rounded-full bg-accent/10 border border-accent/20 flex items-center justify-center">
              <Icon className="w-4 h-4 text-accent" />
            </div>
            <p className="text-text-primary text-sm font-semibold">{title}</p>
            <p className="text-text-muted text-xs">{desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// Needed for the EmptyState feature hints
function Brain(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96-.46 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.88A2.5 2.5 0 0 1 9.5 2Z" />
      <path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96-.46 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.88A2.5 2.5 0 0 0 14.5 2Z" />
    </svg>
  );
}
