import { NextResponse } from "next/server";
import { anthropic, AREF_MODEL, PLAN_SYSTEM_PROMPT } from "@/lib/anthropic";

export async function POST(req: Request) {
  try {
    const { goal } = await req.json();

    if (!goal?.trim()) {
      return NextResponse.json({ error: "Goal is required" }, { status: 400 });
    }

    const message = await anthropic.messages.create({
      model: AREF_MODEL,
      max_tokens: 8192,
      system: PLAN_SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: `Generate 3 distinct learning approaches for this goal: "${goal.trim()}"`,
        },
      ],
    });

    const raw =
      message.content[0].type === "text" ? message.content[0].text : "";

    // Strip markdown code fences if Claude wrapped the JSON
    const cleaned = raw
      .replace(/^```(?:json)?\s*/i, "")
      .replace(/\s*```\s*$/i, "")
      .trim();

    const plan = JSON.parse(cleaned);

    return NextResponse.json(plan);
  } catch (err) {
    console.error("[generate-plan]", err);
    if (err instanceof SyntaxError) {
      return NextResponse.json(
        { error: "Failed to parse AI response. Please try again." },
        { status: 500 }
      );
    }
    return NextResponse.json(
      { error: "Failed to generate plan. Please try again." },
      { status: 500 }
    );
  }
}
