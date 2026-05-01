import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireAuth, apiError } from "@/lib/api-helpers";
import { PLAN_LIMITS } from "@/types";
import type { Plan } from "@/types";

// POST /api/usage — increment daily minutes used, returns current usage state
export async function POST(req: Request) {
  const { user, error } = await requireAuth();
  if (error) return error;

  const supabase = await createClient();
  const { minutes = 1 } = await req.json();

  const { data: profile, error: fetchError } = await supabase
    .from("users")
    .select("plan, daily_minutes_used, daily_reset_at")
    .eq("id", user.id)
    .single();

  if (fetchError || !profile) return apiError("User not found", 404);

  const userPlan = (profile.plan ?? "seeker") as Plan;
  const limits = PLAN_LIMITS[userPlan];

  // Reset counter if past reset time
  const resetAt = new Date(profile.daily_reset_at);
  const now = new Date();
  let currentMinutes = profile.daily_minutes_used;

  if (resetAt < now) {
    currentMinutes = 0;
    await supabase
      .from("users")
      .update({
        daily_minutes_used: minutes,
        daily_reset_at: new Date(
          Date.UTC(
            now.getUTCFullYear(),
            now.getUTCMonth(),
            now.getUTCDate() + 1
          )
        ).toISOString(),
      })
      .eq("id", user.id);

    return NextResponse.json({
      minutesUsed: minutes,
      minutesLimit: limits.dailyMinutes,
      allowed: true,
      plan: userPlan,
    });
  }

  // Check if unlimited
  if (limits.dailyMinutes === Infinity) {
    await supabase
      .from("users")
      .update({ daily_minutes_used: currentMinutes + minutes })
      .eq("id", user.id);

    return NextResponse.json({
      minutesUsed: currentMinutes + minutes,
      minutesLimit: null,
      allowed: true,
      plan: userPlan,
    });
  }

  // Check limit
  if (currentMinutes >= limits.dailyMinutes) {
    return NextResponse.json({
      minutesUsed: currentMinutes,
      minutesLimit: limits.dailyMinutes,
      allowed: false,
      plan: userPlan,
    });
  }

  const newMinutes = Math.min(currentMinutes + minutes, limits.dailyMinutes);
  await supabase
    .from("users")
    .update({ daily_minutes_used: newMinutes })
    .eq("id", user.id);

  return NextResponse.json({
    minutesUsed: newMinutes,
    minutesLimit: limits.dailyMinutes,
    allowed: true,
    plan: userPlan,
  });
}

// GET /api/usage — get current usage state without incrementing
export async function GET() {
  const { user, error } = await requireAuth();
  if (error) return error;

  const supabase = await createClient();
  const { data: profile } = await supabase
    .from("users")
    .select("plan, daily_minutes_used, daily_reset_at")
    .eq("id", user.id)
    .single();

  if (!profile) return apiError("User not found", 404);

  const userPlan = (profile.plan ?? "seeker") as Plan;
  const limits = PLAN_LIMITS[userPlan];

  const resetAt = new Date(profile.daily_reset_at);
  const currentMinutes =
    resetAt < new Date() ? 0 : profile.daily_minutes_used;

  return NextResponse.json({
    minutesUsed: currentMinutes,
    minutesLimit: limits.dailyMinutes === Infinity ? null : limits.dailyMinutes,
    allowed:
      limits.dailyMinutes === Infinity ||
      currentMinutes < limits.dailyMinutes,
    plan: userPlan,
  });
}
