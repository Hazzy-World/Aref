import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import PlanCard from "@/components/plan/PlanCard";
import { Plus, BookOpen, Sparkles } from "lucide-react";
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

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-10">
        <div>
          <h1 className="font-cinzel text-3xl font-bold text-text-primary tracking-wide">
            My Learning
          </h1>
          <p className="text-text-secondary mt-1">
            {profile?.name ? `Welcome back, ${profile.name.split(" ")[0]}.` : "Welcome back."}{" "}
            {plans.length === 0
              ? "Start your first learning journey."
              : `You have ${plans.length} active plan${plans.length !== 1 ? "s" : ""}.`}
          </p>
        </div>

        {canAddPlan ? (
          <Link href="/" className="gnosis-btn-primary flex items-center gap-2 shrink-0">
            <Plus className="w-4 h-4" />
            New Plan
          </Link>
        ) : (
          <Link href="/pricing" className="gnosis-btn-secondary flex items-center gap-2 shrink-0 text-sm">
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
        <div className="mt-8 p-4 gnosis-card flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-accent/10 border border-accent/30 flex items-center justify-center shrink-0">
            <BookOpen className="w-5 h-5 text-accent" />
          </div>
          <div className="flex-1">
            <p className="text-text-primary text-sm font-medium">
              Plan limit reached ({limits.maxPlans} plans on {limits.label})
            </p>
            <p className="text-text-muted text-xs mt-0.5">
              Upgrade to Scholar or Sage to add unlimited learning plans.
            </p>
          </div>
          <Link href="/pricing" className="gnosis-btn-primary text-sm py-2 px-4 shrink-0">
            Upgrade
          </Link>
        </div>
      )}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-24 gap-6">
      <div className="w-20 h-20 rounded-full border-2 border-dashed border-border flex items-center justify-center">
        <BookOpen className="w-8 h-8 text-text-muted" />
      </div>
      <div className="text-center space-y-2">
        <h2 className="font-cinzel text-xl font-semibold text-text-primary">
          No learning plans yet
        </h2>
        <p className="text-text-secondary text-sm max-w-xs">
          Tell GNOSIS what you want to master and get a personalised path in seconds.
        </p>
      </div>
      <Link href="/" className="gnosis-btn-primary flex items-center gap-2">
        <Sparkles className="w-4 h-4" />
        Generate my first plan
      </Link>
    </div>
  );
}
