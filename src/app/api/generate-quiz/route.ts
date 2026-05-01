import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/api-helpers";
import { anthropic, AREF_MODEL } from "@/lib/anthropic";

export interface QuizQuestion {
  question: string;
  options: string[];
  correct: number;
  explanation: string;
}

export async function POST(req: Request) {
  const { user, error } = await requireAuth();
  if (error) return error;
  void user;

  const { phaseTitle, topics, level } = await req.json();

  if (!phaseTitle) {
    return NextResponse.json({ questions: [] });
  }

  try {
    const msg = await anthropic.messages.create({
      model: AREF_MODEL,
      max_tokens: 1200,
      messages: [
        {
          role: "user",
          content: `Generate 4 multiple-choice quiz questions for this learning phase.

Phase: "${phaseTitle}" (${level})
Topics: ${(topics ?? []).join(", ")}

Rules:
- Questions must test genuine understanding, not just definitions
- Mix difficulty: 1 easy, 2 medium, 1 hard
- Each question has exactly 4 options (A-D), only one correct
- Explanation reveals WHY the answer is correct

Respond with ONLY a valid JSON array:
[
  {
    "question": "...",
    "options": ["...", "...", "...", "..."],
    "correct": 0,
    "explanation": "..."
  }
]`,
        },
      ],
    });

    const text =
      msg.content[0].type === "text" ? msg.content[0].text.trim() : "[]";

    const jsonMatch = text.match(/\[[\s\S]*\]/);
    const questions: QuizQuestion[] = jsonMatch ? JSON.parse(jsonMatch[0]) : [];

    return NextResponse.json({ questions: questions.slice(0, 4) });
  } catch {
    return NextResponse.json({ questions: [] });
  }
}
