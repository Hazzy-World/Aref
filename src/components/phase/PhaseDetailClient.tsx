"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import {
  BookOpen,
  Video,
  FileText,
  Sparkles,
  MessageSquare,
  LayoutGrid,
  Loader2,
  Send,
  AlertCircle,
  Hammer,
  RefreshCw,
  Download,
  Brain,
  CheckCircle2,
  XCircle,
  ChevronRight,
  HelpCircle,
} from "lucide-react";
import LevelBadge from "@/components/ui/LevelBadge";
import MarkdownContent from "@/components/ui/MarkdownContent";
import { useUsageTracker } from "@/hooks/useUsageTracker";
import { useStreak } from "@/hooks/useStreak";
import type { Phase, LearningPlan, ChatMessage } from "@/types";

type TabId = "overview" | "books" | "videos" | "articles" | "course" | "coach";

const TABS: { id: TabId; label: string; icon: React.ElementType }[] = [
  { id: "overview",  label: "Overview",  icon: LayoutGrid },
  { id: "books",     label: "Books",     icon: BookOpen },
  { id: "videos",    label: "Videos",    icon: Video },
  { id: "articles",  label: "Articles",  icon: FileText },
  { id: "course",    label: "AI Course", icon: Sparkles },
  { id: "coach",     label: "AI Coach",  icon: MessageSquare },
];

interface Props {
  plan: LearningPlan;
  phase: Phase;
  phaseIndex: number;
  userPlan: string;
  initialCourseContent: string | null;
}

interface AiProgress {
  understanding: number;
  feedback: string;
  updatedAt: string;
}

function progressKey(planId: string, phaseIndex: number) {
  return `aref_progress_${planId}_${phaseIndex}`;
}

export default function PhaseDetailClient({
  plan,
  phase,
  phaseIndex,
  initialCourseContent,
}: Props) {
  const [activeTab, setActiveTab] = useState<TabId>("overview");

  // AI Course state
  const [courseContent, setCourseContent] = useState<string | null>(initialCourseContent);
  const [courseLoading, setCourseLoading] = useState(false);
  const [courseError, setCourseError] = useState<string | null>(null);

  // AI Coach state
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [chatError, setChatError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null) as React.RefObject<HTMLDivElement>;

  // AI Progress state
  const [aiProgress, setAiProgress] = useState<AiProgress | null>(null);
  const [estimating, setEstimating] = useState(false);

  // Touch streak when user is actively on coach/course tab
  useStreak(activeTab === "coach" || activeTab === "course");
  useUsageTracker(activeTab === "coach" || activeTab === "course");

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Load persisted AI progress
  useEffect(() => {
    const raw = localStorage.getItem(progressKey(plan.id, phaseIndex));
    if (raw) {
      try {
        setAiProgress(JSON.parse(raw));
      } catch {
        /* ignore */
      }
    }
  }, [plan.id, phaseIndex]);

  const estimateProgress = useCallback(
    async (msgs: ChatMessage[]) => {
      if (msgs.length < 4) return; // need at least 2 exchanges
      setEstimating(true);
      try {
        const res = await fetch("/api/estimate-progress", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: msgs,
            phaseTitle: phase.title,
            topics: phase.topics,
            level: phase.level,
          }),
        });
        if (res.ok) {
          const data = await res.json();
          const prog: AiProgress = { ...data, updatedAt: new Date().toISOString() };
          setAiProgress(prog);
          localStorage.setItem(progressKey(plan.id, phaseIndex), JSON.stringify(prog));
        }
      } finally {
        setEstimating(false);
      }
    },
    [phase, plan.id, phaseIndex]
  );

  async function generateCourse() {
    setCourseLoading(true);
    setCourseError(null);
    try {
      const res = await fetch("/api/generate-course", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId: plan.id, phaseIndex }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Generation failed");
      setCourseContent(data.content);
    } catch (err) {
      setCourseError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setCourseLoading(false);
    }
  }

  async function sendMessage() {
    const content = input.trim();
    if (!content || chatLoading) return;

    const newMessages: ChatMessage[] = [...messages, { role: "user", content }];
    setMessages(newMessages);
    setInput("");
    setChatLoading(true);
    setChatError(null);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: newMessages,
          goal: plan.goal,
          phaseTitle: phase.title,
          level: phase.level,
          topics: phase.topics,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Chat failed");
      }

      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let reply = "";

      setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        reply += decoder.decode(value, { stream: true });
        setMessages((prev) => [
          ...prev.slice(0, -1),
          { role: "assistant", content: reply },
        ]);
      }

      const finalMessages: ChatMessage[] = [
        ...newMessages,
        { role: "assistant", content: reply },
      ];

      // Auto-estimate understanding after a real conversation
      await estimateProgress(finalMessages);
    } catch (err) {
      setChatError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setChatLoading(false);
    }
  }

  function downloadPhaseGuide() {
    const books = phase.books
      .map((b) => `  - ${b.title} by ${b.author}\n    ${b.why}`)
      .join("\n");
    const videos = phase.videos
      .map((v) => `  - ${v.title} by ${v.creator} (${v.duration})\n    ${v.why}`)
      .join("\n");

    const content = [
      `# ${phase.title}`,
      `**Level:** ${phase.level} · **Estimated Time:** ${phase.estimatedHours} hours`,
      "",
      `## Overview`,
      phase.description,
      "",
      `## Topics`,
      phase.topics.map((t) => `- ${t}`).join("\n"),
      "",
      phase.project ? `## Hands-On Project\n${phase.project}` : "",
      "",
      phase.books.length ? `## Recommended Books\n${books}` : "",
      "",
      phase.videos.length ? `## Recommended Videos\n${videos}` : "",
      "",
      courseContent ? `## AI Course Content\n\n${courseContent}` : "",
    ]
      .filter(Boolean)
      .join("\n");

    const blob = new Blob([content], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${phase.title.toLowerCase().replace(/\s+/g, "-")}-guide.md`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-6">
      {/* Phase header */}
      <div className="aref-card p-5">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-full border-2 border-accent bg-accent/10 flex items-center justify-center font-mono text-sm font-bold text-accent shrink-0">
            {String(phaseIndex + 1).padStart(2, "0")}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <h1 className="font-cinzel text-xl font-semibold text-text-primary">
                {phase.title}
              </h1>
              <LevelBadge level={phase.level} />
            </div>
            <p className="text-text-secondary text-sm leading-relaxed">
              {phase.description}
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-border overflow-x-auto">
        <div className="flex gap-0 min-w-max">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 px-4 py-3 text-sm font-medium border-b-2 transition-all whitespace-nowrap ${
                  isActive
                    ? "border-accent text-accent"
                    : "border-transparent text-text-muted hover:text-text-secondary hover:border-border"
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab content */}
      <div className="min-h-[400px]">
        {activeTab === "overview" && (
          <OverviewTab
            phase={phase}
            aiProgress={aiProgress}
            estimating={estimating}
            onProgressUpdate={(p) => {
              setAiProgress(p);
              localStorage.setItem(progressKey(plan.id, phaseIndex), JSON.stringify(p));
            }}
          />
        )}
        {activeTab === "books" && <BooksTab phase={phase} />}
        {activeTab === "videos" && <VideosTab phase={phase} />}
        {activeTab === "articles" && <ArticlesTab phase={phase} />}
        {activeTab === "course" && (
          <CourseTab
            content={courseContent}
            loading={courseLoading}
            error={courseError}
            onGenerate={generateCourse}
            onDownload={downloadPhaseGuide}
          />
        )}
        {activeTab === "coach" && (
          <CoachTab
            messages={messages}
            input={input}
            loading={chatLoading}
            error={chatError}
            estimating={estimating}
            messagesEndRef={messagesEndRef}
            onInputChange={setInput}
            onSend={sendMessage}
          />
        )}
      </div>
    </div>
  );
}

// ─── Tab: Overview ────────────────────────────────────────────────

const LEVEL_RING_COLOR: Record<string, string> = {
  Beginner:     "#22c55e",
  Intermediate: "#3b82f6",
  Advanced:     "#f59e0b",
  Expert:       "#a855f7",
};

interface QuizQuestion {
  question: string;
  options: string[];
  correct: number;
  explanation: string;
}

function ProgressRing({
  pct,
  color,
  size = 96,
}: {
  pct: number;
  color: string;
  size?: number;
}) {
  const r = (size - 8) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (pct / 100) * circ;

  return (
    <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#27272a" strokeWidth={6} />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke={color}
        strokeWidth={6}
        strokeLinecap="round"
        strokeDasharray={circ}
        strokeDashoffset={offset}
        style={{ transition: "stroke-dashoffset 0.8s ease" }}
      />
    </svg>
  );
}

function OverviewTab({
  phase,
  aiProgress,
  estimating,
  onProgressUpdate,
}: {
  phase: Phase;
  aiProgress: AiProgress | null;
  estimating: boolean;
  onProgressUpdate: (p: AiProgress) => void;
}) {
  const [quiz, setQuiz] = useState<QuizQuestion[] | null>(null);
  const [quizLoading, setQuizLoading] = useState(false);
  const [answers, setAnswers] = useState<(number | null)[]>([]);
  const [submitted, setSubmitted] = useState(false);
  const color = LEVEL_RING_COLOR[phase.level] ?? "#b8960c";
  const pct = aiProgress?.understanding ?? 0;

  async function startQuiz() {
    setQuizLoading(true);
    setSubmitted(false);
    setAnswers([]);
    try {
      const res = await fetch("/api/generate-quiz", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phaseTitle: phase.title,
          topics: phase.topics,
          level: phase.level,
        }),
      });
      const data = await res.json();
      setQuiz(data.questions ?? []);
      setAnswers(new Array((data.questions ?? []).length).fill(null));
    } finally {
      setQuizLoading(false);
    }
  }

  function submitQuiz() {
    if (!quiz) return;
    setSubmitted(true);

    const correct = quiz.filter((q, i) => answers[i] === q.correct).length;
    const score = Math.round((correct / quiz.length) * 100);
    const bonus = score >= 75 ? 20 : score >= 50 ? 10 : 0;
    const newPct = Math.min(100, pct + bonus);

    if (bonus > 0) {
      const prog: AiProgress = {
        understanding: newPct,
        feedback: `Quiz score: ${score}%. +${bonus}% progress added.`,
        updatedAt: new Date().toISOString(),
      };
      onProgressUpdate(prog);
    }
  }

  return (
    <div className="space-y-6">
      {/* AI Progress Card */}
      <div className="aref-card p-6">
        <div className="flex items-center gap-2 mb-4">
          <Brain className="w-4 h-4 text-accent" />
          <h3 className="font-cinzel text-base font-semibold text-text-primary">
            AI Understanding Score
          </h3>
          {estimating && (
            <span className="flex items-center gap-1 text-xs text-text-muted ml-auto">
              <Loader2 className="w-3 h-3 animate-spin" />
              Estimating…
            </span>
          )}
        </div>

        <div className="flex items-center gap-6">
          <div className="relative shrink-0">
            <ProgressRing pct={pct} color={color} size={96} />
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="font-mono text-xl font-bold text-text-primary">
                {pct}
              </span>
              <span className="font-mono text-[9px] text-text-muted">%</span>
            </div>
          </div>

          <div className="flex-1 space-y-2">
            <p className="text-text-secondary text-sm leading-relaxed">
              {aiProgress?.feedback ??
                "Chat with the AI Coach or take a quiz to get your understanding score."}
            </p>
            {aiProgress?.updatedAt && (
              <p className="text-text-muted text-xs font-mono">
                Last updated:{" "}
                {new Date(aiProgress.updatedAt).toLocaleDateString()}
              </p>
            )}
            <button
              onClick={startQuiz}
              disabled={quizLoading}
              className="aref-btn-secondary flex items-center gap-2 text-sm py-2 px-3"
            >
              {quizLoading ? (
                <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Generating quiz…</>
              ) : (
                <><HelpCircle className="w-3.5 h-3.5" /> Take Understanding Quiz</>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Quiz */}
      {quiz && quiz.length > 0 && (
        <div className="aref-card p-6 space-y-6">
          <div className="flex items-center gap-2">
            <HelpCircle className="w-4 h-4 text-accent" />
            <h3 className="font-cinzel text-base font-semibold text-text-primary">
              Understanding Quiz
            </h3>
          </div>

          {quiz.map((q, qi) => (
            <div key={qi} className="space-y-3">
              <p className="text-text-primary text-sm font-medium">
                {qi + 1}. {q.question}
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {q.options.map((opt, oi) => {
                  const isSelected = answers[qi] === oi;
                  const isCorrect = oi === q.correct;
                  const showResult = submitted;

                  let cls =
                    "p-3 rounded-lg border text-sm text-left transition-all cursor-pointer ";
                  if (showResult) {
                    if (isCorrect) cls += "border-success/50 bg-success/10 text-success";
                    else if (isSelected) cls += "border-red-500/50 bg-red-500/10 text-red-400";
                    else cls += "border-border text-text-muted cursor-default opacity-50";
                  } else {
                    cls += isSelected
                      ? "border-accent bg-accent/10 text-text-primary"
                      : "border-border bg-surface-raised text-text-secondary hover:border-accent/40";
                  }

                  return (
                    <button
                      key={oi}
                      disabled={submitted}
                      onClick={() => {
                        if (submitted) return;
                        const next = [...answers];
                        next[qi] = oi;
                        setAnswers(next);
                      }}
                      className={cls}
                    >
                      <span className="font-mono text-xs mr-2 opacity-60">
                        {["A", "B", "C", "D"][oi]}.
                      </span>
                      {opt}
                    </button>
                  );
                })}
              </div>
              {submitted && (
                <div className="flex items-start gap-2 bg-surface-raised border border-border rounded-lg px-3 py-2 text-xs text-text-secondary">
                  {answers[qi] === q.correct ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-success shrink-0 mt-0.5" />
                  ) : (
                    <XCircle className="w-3.5 h-3.5 text-red-400 shrink-0 mt-0.5" />
                  )}
                  {q.explanation}
                </div>
              )}
            </div>
          ))}

          {!submitted ? (
            <button
              onClick={submitQuiz}
              disabled={answers.some((a) => a === null)}
              className="aref-btn-primary flex items-center gap-2 disabled:opacity-50"
            >
              Submit Quiz
              <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <div className="flex items-center justify-between pt-2">
              <p className="text-sm text-text-secondary">
                Score:{" "}
                <span className="font-semibold text-text-primary">
                  {quiz.filter((q, i) => answers[i] === q.correct).length}/{quiz.length}
                </span>
              </p>
              <button
                onClick={startQuiz}
                className="aref-btn-ghost text-sm flex items-center gap-1.5"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                New Quiz
              </button>
            </div>
          )}
        </div>
      )}

      {/* Topics curriculum */}
      <div className="aref-card p-6 space-y-4">
        <h3 className="font-cinzel text-base font-semibold text-text-primary">
          Topics in this Phase
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {(phase.topics ?? []).map((topic, i) => (
            <div
              key={i}
              className="flex items-center gap-3 p-3 rounded-lg border border-border bg-surface-raised"
            >
              <span
                className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-mono font-bold shrink-0"
                style={{ backgroundColor: color + "22", color }}
              >
                {i + 1}
              </span>
              <span className="text-text-secondary text-sm">{topic}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Hands-on project */}
      {phase.project && (
        <div className="aref-card p-6 space-y-3">
          <div className="flex items-center gap-2">
            <Hammer className="w-4 h-4 text-accent" />
            <h3 className="font-cinzel text-base font-semibold text-text-primary">
              Hands-On Project
            </h3>
          </div>
          <p className="text-text-secondary leading-relaxed">{phase.project}</p>
        </div>
      )}
    </div>
  );
}

// ─── Tab: Books ───────────────────────────────────────────────────

function BooksTab({ phase }: { phase: Phase }) {
  if (!phase.books?.length)
    return <EmptyTabState icon={BookOpen} message="No books curated for this phase." />;
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {phase.books.map((book, i) => (
        <div key={i} className="aref-card p-5 flex flex-col gap-3 hover:border-accent/30 transition-colors">
          <div className="flex items-start gap-3">
            <div className="w-12 h-16 rounded bg-gradient-to-br from-accent/20 to-purple/20 border border-accent/30 flex items-center justify-center shrink-0">
              <BookOpen className="w-5 h-5 text-accent" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-text-primary font-semibold text-sm leading-snug">
                {book.title}
              </p>
              <p className="text-accent/80 text-xs mt-1 font-outfit">{book.author}</p>
            </div>
          </div>
          <p className="text-text-secondary text-sm leading-relaxed border-t border-border pt-3">
            {book.why}
          </p>
        </div>
      ))}
    </div>
  );
}

// ─── Tab: Videos ──────────────────────────────────────────────────

function VideosTab({ phase }: { phase: Phase }) {
  if (!phase.videos?.length)
    return <EmptyTabState icon={Video} message="No videos curated for this phase." />;
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {phase.videos.map((video, i) => (
        <div key={i} className="aref-card p-5 flex flex-col gap-3 hover:border-red-500/20 transition-colors">
          <div className="flex items-start gap-3">
            <div className="w-12 h-10 rounded bg-red-500/10 border border-red-500/30 flex items-center justify-center shrink-0">
              <Video className="w-5 h-5 text-red-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-text-primary font-semibold text-sm leading-snug">
                {video.title}
              </p>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-text-muted text-xs">{video.creator}</span>
                {video.duration && (
                  <>
                    <span className="text-border text-xs">·</span>
                    <span className="font-mono text-[10px] text-text-muted bg-surface-raised px-1.5 py-0.5 rounded">
                      {video.duration}
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>
          <p className="text-text-secondary text-sm leading-relaxed border-t border-border pt-3">
            {video.why}
          </p>
        </div>
      ))}
    </div>
  );
}

// ─── Tab: Articles ────────────────────────────────────────────────

function ArticlesTab({ phase }: { phase: Phase }) {
  if (!phase.articles?.length)
    return <EmptyTabState icon={FileText} message="No articles curated for this phase." />;
  return (
    <div className="grid grid-cols-1 gap-3">
      {phase.articles.map((article, i) => (
        <div key={i} className="aref-card p-4 flex items-start gap-4 hover:border-blue-500/20 transition-colors">
          <div className="w-9 h-9 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center shrink-0">
            <FileText className="w-4 h-4 text-blue-400" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <p className="text-text-primary font-medium text-sm">{article.title}</p>
              <span className="font-mono text-[10px] text-text-muted bg-surface-raised px-2 py-0.5 rounded whitespace-nowrap shrink-0">
                {article.source}
              </span>
            </div>
            <p className="text-text-secondary text-sm mt-1 leading-relaxed">
              {article.why}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Tab: AI Course ───────────────────────────────────────────────

function CourseTab({
  content,
  loading,
  error,
  onGenerate,
  onDownload,
}: {
  content: string | null;
  loading: boolean;
  error: string | null;
  onGenerate: () => void;
  onDownload: () => void;
}) {
  if (content) {
    return (
      <div className="aref-card p-6 sm:p-8 space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-accent" />
            <span className="aref-label">AI-Generated Course Module</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onDownload}
              className="flex items-center gap-1.5 text-xs text-text-muted hover:text-text-secondary border border-border hover:border-accent/30 px-3 py-1.5 rounded-lg transition-all"
            >
              <Download className="w-3.5 h-3.5" />
              Download Guide
            </button>
            <button
              onClick={onGenerate}
              disabled={loading}
              className="flex items-center gap-1.5 text-xs text-text-muted hover:text-text-secondary transition-colors"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
              Regenerate
            </button>
          </div>
        </div>
        <MarkdownContent content={content} />
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center py-20 gap-6 text-center">
      {error && (
        <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/30 text-red-400 rounded-lg px-4 py-3 text-sm">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {error}
        </div>
      )}

      {/* Illustration */}
      <div className="relative">
        <div className="w-20 h-20 rounded-full border-2 border-dashed border-accent/40 flex items-center justify-center">
          <Sparkles className="w-8 h-8 text-accent" />
        </div>
        <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-accent/20 border border-accent/40 flex items-center justify-center">
          <span className="text-accent text-xs font-bold">AI</span>
        </div>
      </div>

      <div className="space-y-2 max-w-sm">
        <h3 className="font-cinzel text-lg font-semibold text-text-primary">
          Generate AI Course
        </h3>
        <p className="text-text-secondary text-sm">
          AREF will write a complete, structured course module for this phase —
          covering all topics with exercises and explanations.
        </p>
        <p className="text-text-muted text-xs font-mono">
          Available on all plans · cached after first generation
        </p>
      </div>

      <button
        onClick={onGenerate}
        disabled={loading}
        className="aref-btn-primary flex items-center gap-2 disabled:opacity-60"
      >
        {loading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Generating course…
          </>
        ) : (
          <>
            <Sparkles className="w-4 h-4" />
            Generate Course
          </>
        )}
      </button>
    </div>
  );
}

// ─── Tab: AI Coach ────────────────────────────────────────────────

function CoachTab({
  messages,
  input,
  loading,
  error,
  estimating,
  messagesEndRef,
  onInputChange,
  onSend,
}: {
  messages: ChatMessage[];
  input: string;
  loading: boolean;
  error: string | null;
  estimating: boolean;
  messagesEndRef: React.RefObject<HTMLDivElement>;
  onInputChange: (v: string) => void;
  onSend: () => void;
}) {
  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") onSend();
  }

  return (
    <div className="aref-card flex flex-col h-[580px]">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full gap-4 text-center">
            <div className="w-14 h-14 rounded-full border-2 border-accent/30 bg-accent/5 flex items-center justify-center">
              <MessageSquare className="w-6 h-6 text-accent" />
            </div>
            <div>
              <p className="text-text-secondary text-sm font-semibold">AREF AI Coach</p>
              <p className="text-text-muted text-xs mt-1 max-w-xs">
                Ask anything about this phase. Your conversations help estimate your understanding.
              </p>
            </div>
            <div className="flex flex-wrap gap-2 justify-center">
              {[
                "Explain the key concepts",
                "Give me a practical exercise",
                "What should I study first?",
              ].map((q) => (
                <button
                  key={q}
                  onClick={() => onInputChange(q)}
                  className="text-xs bg-surface-raised border border-border hover:border-accent/30 text-text-secondary px-3 py-1.5 rounded-full transition-colors"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
          >
            {msg.role === "assistant" && (
              <div className="w-7 h-7 rounded-full bg-accent/10 border border-accent/30 flex items-center justify-center shrink-0 mr-2 mt-1">
                <Sparkles className="w-3.5 h-3.5 text-accent" />
              </div>
            )}
            <div
              className={`max-w-[80%] rounded-xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap ${
                msg.role === "user"
                  ? "bg-accent text-background font-medium"
                  : "bg-surface-raised border border-border text-text-secondary"
              }`}
            >
              {msg.content}
              {msg.role === "assistant" && loading && i === messages.length - 1 && (
                <span className="inline-block w-1.5 h-4 bg-accent/60 ml-1 animate-pulse align-text-bottom" />
              )}
            </div>
          </div>
        ))}

        {estimating && messages.length > 0 && (
          <div className="flex items-center gap-2 text-text-muted text-xs font-mono justify-center">
            <Loader2 className="w-3 h-3 animate-spin" />
            Updating understanding score…
          </div>
        )}

        {error && (
          <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/30 text-red-400 rounded-lg px-3 py-2 text-xs">
            <AlertCircle className="w-4 h-4 shrink-0" />
            {error}
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t border-border p-3 flex gap-2 items-end">
        <textarea
          value={input}
          onChange={(e) => onInputChange(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={loading}
          placeholder="Ask your coach anything… (⌘↵ to send)"
          rows={2}
          className="flex-1 aref-input resize-none text-sm py-2.5 disabled:opacity-50"
        />
        <button
          onClick={onSend}
          disabled={!input.trim() || loading}
          className="aref-btn-primary p-2.5 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
        >
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Send className="w-4 h-4" />
          )}
        </button>
      </div>
    </div>
  );
}

function EmptyTabState({
  icon: Icon,
  message,
}: {
  icon: React.ElementType;
  message: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
      <div className="w-14 h-14 rounded-full border-2 border-dashed border-border flex items-center justify-center">
        <Icon className="w-6 h-6 text-text-muted" />
      </div>
      <p className="text-text-muted text-sm">{message}</p>
    </div>
  );
}
