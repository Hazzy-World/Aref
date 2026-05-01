import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireAuth, apiError } from "@/lib/api-helpers";
import { PLAN_LIMITS } from "@/types";
import type { Plan } from "@/types";

// GET /api/plans — fetch all plans for the authenticated user
export async function GET() {
  const { user, error } = await requireAuth();
  if (error) return error;

  const supabase = await createClient();
  const { data, error: dbError } = await supabase
    .from("learning_plans")
    .select("*")
    .eq("user_id", user.id)
    .order("last_accessed", { ascending: false });

  if (dbError) return apiError(dbError.message, 500);

  return NextResponse.json(data ?? []);
}

// POST /api/plans — save a chosen approach as a new learning plan
export async function POST(req: Request) {
  const { user, error } = await requireAuth();
  if (error) return error;

  const supabase = await createClient();

  const body = await req.json();
  const { goal, approach, totalHours } = body;

  if (!goal || !approach) {
    return apiError("goal and approach are required");
  }

  // Fetch user profile to check plan limits
  const { data: profile } = await supabase
    .from("users")
    .select("plan")
    .eq("id", user.id)
    .single();

  const userPlan = (profile?.plan ?? "seeker") as Plan;
  const limits = PLAN_LIMITS[userPlan];

  if (limits.maxPlans !== Infinity) {
    const { count } = await supabase
      .from("learning_plans")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id);

    if ((count ?? 0) >= limits.maxPlans) {
      return apiError(
        `Your ${limits.label} plan allows ${limits.maxPlans} active plan(s). Upgrade to add more.`,
        403
      );
    }
  }

  const { data: plan, error: insertError } = await supabase
    .from("learning_plans")
    .insert({
      user_id: user.id,
      goal: goal.trim(),
      approach_id: approach.id,
      approach_name: approach.name,
      approach_icon: approach.icon ?? "📚",
      phases: approach.phases,
      total_hours: totalHours ?? 0,
    })
    .select()
    .single();

  if (insertError) return apiError(insertError.message, 500);

  return NextResponse.json({ planId: plan.id }, { status: 201 });
}
