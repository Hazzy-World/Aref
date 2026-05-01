import { createClient } from "@/lib/supabase/server";
import { requireAuth, apiError } from "@/lib/api-helpers";
import { anthropic, AREF_MODEL, buildCoachSystemPrompt } from "@/lib/anthropic";
import type { ChatMessage, Plan } from "@/types";
import { PLAN_LIMITS } from "@/types";

export async function POST(req: Request) {
  const { user, error } = await requireAuth();
  if (error) return error;

  const supabase = await createClient();

  const { messages, goal, phaseTitle, level, topics } = await req.json() as {
    messages: ChatMessage[];
    goal: string;
    phaseTitle: string;
    level: string;
    topics: string[];
  };

  if (!messages?.length || !goal || !phaseTitle) {
    return apiError("messages, goal, and phaseTitle are required");
  }

  // Check daily usage limits
  const { data: profile } = await supabase
    .from("users")
    .select("plan, daily_minutes_used, daily_reset_at")
    .eq("id", user.id)
    .single();

  if (profile) {
    const userPlan = (profile.plan ?? "seeker") as Plan;
    const limits = PLAN_LIMITS[userPlan];

    // Reset if past reset time
    const resetAt = new Date(profile.daily_reset_at);
    if (resetAt < new Date()) {
      await supabase
        .from("users")
        .update({
          daily_minutes_used: 0,
          daily_reset_at: new Date(
            Date.UTC(
              new Date().getUTCFullYear(),
              new Date().getUTCMonth(),
              new Date().getUTCDate() + 1
            )
          ).toISOString(),
        })
        .eq("id", user.id);
    } else if (
      limits.dailyMinutes !== Infinity &&
      profile.daily_minutes_used >= limits.dailyMinutes
    ) {
      return apiError(
        `Daily limit reached (${limits.dailyMinutes} minutes for ${limits.label} plan). Resets at midnight UTC.`,
        429
      );
    }
  }

  const systemPrompt = buildCoachSystemPrompt(
    goal,
    phaseTitle,
    level ?? "Intermediate",
    topics ?? []
  );

  // Stream the response
  const stream = anthropic.messages.stream({
    model: AREF_MODEL,
    max_tokens: 1024,
    system: systemPrompt,
    messages: messages.map((m) => ({
      role: m.role,
      content: m.content,
    })),
  });

  const readableStream = new ReadableStream({
    async start(controller) {
      try {
        for await (const chunk of stream) {
          if (
            chunk.type === "content_block_delta" &&
            chunk.delta.type === "text_delta"
          ) {
            controller.enqueue(
              new TextEncoder().encode(chunk.delta.text)
            );
          }
        }
      } finally {
        controller.close();
      }
    },
  });

  return new Response(readableStream, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
