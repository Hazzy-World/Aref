import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/api-helpers";
import { anthropic, AREF_MODEL } from "@/lib/anthropic";
import type { ChatMessage } from "@/types";

export async function POST(req: Request) {
  const { user, error } = await requireAuth();
  if (error) return error;
  void user;

  const { messages, phaseTitle, topics, level } = await req.json();

  if (!messages?.length || !phaseTitle) {
    return NextResponse.json({ understanding: 0, feedback: "No data to estimate from." });
  }

  try {
    const conversation = (messages as ChatMessage[])
      .map((m) => `${m.role === "user" ? "Student" : "Coach"}: ${m.content}`)
      .join("\n\n");

    const msg = await anthropic.messages.create({
      model: AREF_MODEL,
      max_tokens: 200,
      messages: [
        {
          role: "user",
          content: `You are an expert learning coach. Estimate a student's understanding of a topic based on their conversation.

Phase: "${phaseTitle}" (${level})
Topics: ${(topics ?? []).join(", ")}

Conversation:
${conversation}

Respond with ONLY valid JSON:
{"understanding": <number 0-100>, "feedback": "<1-2 sentence assessment>"}

Base the score on: depth of questions asked, accuracy of responses, ability to connect concepts, and signs of genuine comprehension vs surface-level familiarity.`,
        },
      ],
    });

    const text =
      msg.content[0].type === "text" ? msg.content[0].text.trim() : "{}";

    const jsonMatch = text.match(/\{[\s\S]*\}/);
    const result = jsonMatch ? JSON.parse(jsonMatch[0]) : { understanding: 50, feedback: "Keep going!" };

    return NextResponse.json({
      understanding: Math.min(100, Math.max(0, result.understanding ?? 50)),
      feedback: result.feedback ?? "Keep practicing!",
    });
  } catch {
    return NextResponse.json({ understanding: 50, feedback: "Keep practicing!" });
  }
}
