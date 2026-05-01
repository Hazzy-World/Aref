"use client";

import { useState, useRef } from "react";
import { Sparkles, Loader2, AlertCircle, RotateCcw } from "lucide-react";
import ApproachCard from "./ApproachCard";
import type { GeneratedPlan } from "@/types";

interface Props {
  isLoggedIn: boolean;
}

type Stage = "idle" | "generating" | "results" | "error";

const LOADING_MESSAGES = [
  "Analysing your goal…",
  "Mapping the knowledge landscape…",
  "Curating books and resources…",
  "Designing your learning phases…",
  "Crafting three distinct paths…",
];

export default function GeneratePlanFlow({ isLoggedIn }: Props) {
  const [goal, setGoal] = useState("");
  const [stage, setStage] = useState<Stage>("idle");
  const [generatedPlan, setGeneratedPlan] = useState<GeneratedPlan | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loadingMsg, setLoadingMsg] = useState(LOADING_MESSAGES[0]);
  const loadingInterval = useRef<ReturnType<typeof setInterval> | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  function startLoadingMessages() {
    let i = 0;
    loadingInterval.current = setInterval(() => {
      i = (i + 1) % LOADING_MESSAGES.length;
      setLoadingMsg(LOADING_MESSAGES[i]);
    }, 2200);
  }

  function stopLoadingMessages() {
    if (loadingInterval.current) {
      clearInterval(loadingInterval.current);
      loadingInterval.current = null;
    }
  }

  async function handleGenerate() {
    if (!goal.trim() || stage === "generating") return;

    setStage("generating");
    setError(null);
    setGeneratedPlan(null);
    setLoadingMsg(LOADING_MESSAGES[0]);
    startLoadingMessages();

    try {
      const res = await fetch("/api/generate-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ goal: goal.trim() }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error ?? "Failed to generate plan");
      }

      setGeneratedPlan(data as GeneratedPlan);
      setStage("results");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setStage("error");
    } finally {
      stopLoadingMessages();
    }
  }

  function handleReset() {
    setStage("idle");
    setGeneratedPlan(null);
    setError(null);
    setTimeout(() => textareaRef.current?.focus(), 100);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
      handleGenerate();
    }
  }

  return (
    <div className="w-full">
      {/* ─── Hero ─────────────────────────────────── */}
      <section className="relative min-h-[70vh] flex flex-col items-center justify-center px-4 py-20 overflow-hidden">
        {/* Background glow */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-accent/8 blur-[140px] rounded-full" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[200px] bg-purple/6 blur-[100px] rounded-full" />
        </div>

        {/* Dot grid */}
        <div
          className="absolute inset-0 pointer-events-none opacity-[0.15]"
          style={{
            backgroundImage:
              "radial-gradient(circle, #52525B 1px, transparent 1px)",
            backgroundSize: "32px 32px",
          }}
        />

        <div className="relative z-10 w-full max-w-3xl mx-auto text-center">
          {/* Tag */}
          <div className="inline-flex items-center gap-2 bg-accent/10 border border-accent/30 text-accent rounded-full px-4 py-1.5 mb-6">
            <Sparkles className="w-3.5 h-3.5" />
            <span className="font-mono text-xs tracking-wider">AI-POWERED LEARNING</span>
          </div>

          {/* Headline */}
          <h1 className="font-cinzel text-4xl sm:text-5xl lg:text-6xl font-bold text-text-primary leading-[1.15] tracking-wide mb-4">
            What do you want{" "}
            <span className="gradient-gold">to master?</span>
          </h1>

          <p className="text-text-secondary text-lg max-w-xl mx-auto mb-10 font-outfit">
            AREF builds a complete, personalised learning path with curated books,
            videos, and AI-generated courses — in seconds.
          </p>

          {/* Input area */}
          {stage !== "results" && stage !== "error" && (
            <div className="w-full space-y-4 animate-fade-in">
              <div className="relative">
                <textarea
                  ref={textareaRef}
                  value={goal}
                  onChange={(e) => setGoal(e.target.value)}
                  onKeyDown={handleKeyDown}
                  disabled={stage === "generating"}
                  placeholder="e.g. Learn machine learning from scratch to build real-world models…"
                  rows={3}
                  className="aref-input resize-none text-base leading-relaxed pr-4 disabled:opacity-50 w-full"
                />
                <p className="absolute bottom-3 right-3 font-mono text-[10px] text-text-muted pointer-events-none">
                  ⌘↵ to generate
                </p>
              </div>

              <button
                onClick={handleGenerate}
                disabled={!goal.trim() || stage === "generating"}
                className="aref-btn-primary px-10 py-3.5 text-base flex items-center gap-2 mx-auto disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {stage === "generating" ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Generating…
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5" />
                    Generate Learning Path
                  </>
                )}
              </button>
            </div>
          )}

          {/* Loading state */}
          {stage === "generating" && (
            <div className="mt-12 flex flex-col items-center gap-6 animate-fade-in">
              <div className="relative w-16 h-16">
                <div className="absolute inset-0 rounded-full border-2 border-accent/20" />
                <div className="absolute inset-0 rounded-full border-t-2 border-accent animate-spin" />
                <div className="absolute inset-2 rounded-full border-t border-accent/40 animate-spin-slow" />
                <Sparkles className="absolute inset-0 m-auto w-5 h-5 text-accent animate-pulse" />
              </div>
              <div className="space-y-2 text-center">
                <p className="text-text-primary font-outfit text-lg font-medium transition-all duration-500">
                  {loadingMsg}
                </p>
                <p className="text-text-muted text-sm font-mono">
                  AREF is building your personalised paths
                </p>
              </div>
              <div className="flex gap-1.5">
                {[0, 1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className="w-1.5 h-1.5 rounded-full bg-accent/60 animate-pulse"
                    style={{ animationDelay: `${i * 150}ms` }}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Error state */}
          {stage === "error" && (
            <div className="mt-8 flex flex-col items-center gap-4 animate-fade-in">
              <div className="flex items-center gap-3 bg-red-500/10 border border-red-500/30 text-red-400 rounded-lg px-6 py-4">
                <AlertCircle className="w-5 h-5 shrink-0" />
                <span className="text-sm">{error}</span>
              </div>
              <button onClick={handleReset} className="aref-btn-secondary flex items-center gap-2 text-sm">
                <RotateCcw className="w-4 h-4" />
                Try again
              </button>
            </div>
          )}
        </div>
      </section>

      {/* ─── Results ──────────────────────────────── */}
      {stage === "results" && generatedPlan && (
        <section className="px-4 pb-24 animate-slide-up">
          <div className="max-w-7xl mx-auto space-y-10">
            {/* Header */}
            <div className="text-center space-y-3">
              <div className="inline-flex items-center gap-2 bg-success/10 border border-success/30 text-success rounded-full px-4 py-1.5">
                <span className="font-mono text-xs tracking-wider">3 PATHS GENERATED</span>
              </div>
              <h2 className="font-cinzel text-2xl sm:text-3xl font-semibold text-text-primary">
                Choose your approach to{" "}
                <span className="gradient-gold">{generatedPlan.topic}</span>
              </h2>
              <p className="text-text-secondary text-sm">
                Estimated {generatedPlan.totalEstimatedHours} total hours · Select the style that fits how you learn best
              </p>
            </div>

            {/* Approach cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
              {generatedPlan.approaches.map((approach, i) => (
                <ApproachCard
                  key={approach.id}
                  approach={approach}
                  totalHours={generatedPlan.totalEstimatedHours}
                  goal={goal}
                  isLoggedIn={isLoggedIn}
                  recommended={i === 0}
                />
              ))}
            </div>

            {/* Reset */}
            <div className="text-center">
              <button
                onClick={handleReset}
                className="aref-btn-ghost flex items-center gap-2 text-sm mx-auto"
              >
                <RotateCcw className="w-4 h-4" />
                Start over with a different goal
              </button>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
