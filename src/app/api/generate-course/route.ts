import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireAuth, apiError } from "@/lib/api-helpers";
import { anthropic, AREF_MODEL, COURSE_SYSTEM_PROMPT } from "@/lib/anthropic";
import type { Phase, Plan } from "@/types";

export async function POST(req: Request) {
  const { user, error } = await requireAuth();
  if (error) return error;

  const supabase = await createClient();

  const { planId, phaseIndex } = await req.json();

  if (!planId || phaseIndex === undefined) {
    return apiError("planId and phaseIndex are required");
  }

  // Fetch user profile — only Scholar/Sage can generate courses
  const { data: profile } = await supabase
    .from("users")
    .select("plan")
    .eq("id", user.id)
    .single();

  const userPlan = (profile?.plan ?? "seeker") as Plan;
  if (userPlan === "seeker") {
    return apiError(
      "AI Course generation requires Scholar or Sage plan. Upgrade to unlock.",
      403
    );
  }

  // Fetch the learning plan
  const { data: plan, error: planError } = await supabase
    .from("learning_plans")
    .select("*")
    .eq("id", planId)
    .eq("user_id", user.id)
    .single();

  if (planError || !plan) return apiError("Plan not found", 404);

  const phases = plan.phases as Phase[];
  const phase = phases[phaseIndex];
  if (!phase) return apiError("Phase not found", 404);

  const phaseId = phase.id;

  // Return cached course if it exists
  const { data: existing } = await supabase
    .from("generated_courses")
    .select("content")
    .eq("plan_id", planId)
    .eq("phase_id", phaseId)
    .single();

  if (existing) {
    return NextResponse.json({ content: existing.content, cached: true });
  }

  // Generate with Claude
  try {
    const message = await anthropic.messages.create({
      model: AREF_MODEL,
      max_tokens: 4096,
      system: COURSE_SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: `Write a full course module for this learning phase:

Learning Goal: ${plan.goal}
Phase Title: ${phase.title}
Level: ${phase.level}
Description: ${phase.description}
Topics to Cover: ${phase.topics.join(", ")}
Hands-on Project: ${phase.project}

Make it thorough, practical, and immediately actionable.`,
        },
      ],
    });

    const content =
      message.content[0].type === "text" ? message.content[0].text : "";

    // Cache in DB (upsert handles any race condition)
    await supabase.from("generated_courses").upsert(
      { plan_id: planId, phase_id: phaseId, content },
      { onConflict: "plan_id,phase_id" }
    );

    return NextResponse.json({ content, cached: false });
  } catch (err) {
    console.error("[generate-course]", err);
    return apiError("Failed to generate course. Please try again.", 500);
  }
}
