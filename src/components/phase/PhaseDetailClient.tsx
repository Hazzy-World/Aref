"use client";

import { useState, useRef, useEffect } from "react";
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
  CheckSquare,
  Square,
  Hammer,
  Lock,
  RefreshCw,
} from "lucide-react";
import LevelBadge from "@/components/ui/LevelBadge";
import MarkdownContent from "@/components/ui/MarkdownContent";
import { useUsageTracker } from "@/hooks/useUsageTracker";
import type { Phase, LearningPlan, ChatMessage } from "@/types";

type TabId = "overview" | "books" | "videos" | "articles" | "course" | "coach";

const TABS: { id: TabId; label: string; icon: React.ElementType }[] = [
  { id: "overview", label: "Overview", icon: LayoutGrid },
  { id: "books", label: "Books", icon: BookOpen },
  { id: "videos", label: "Videos", icon: Video },
  { id: "articles", label: "Articles", icon: FileText },
  { id: "course", label: "AI Course", icon: Sparkles },
  { id: "coach", label: "AI Coach", icon: MessageSquare },
];

interface Props {
  plan: LearningPlan;
  phase: Phase;
  phaseIndex: number;
  userPlan: string;
  initialCourseContent: string | null;
}

export default function PhaseDetailClient({
  plan,
  phase,
  phaseIndex,
  userPlan,
  initialCourseContent,
}: Props) {
  const [activeTab, setActiveTab] = useState<TabId>("overview");
  const [completedTopics, setCompletedTopics] = useState<string[]>(
    (plan.completed_topics as Record<string, string[]>)[phase.id] ?? []
  );

  // AI Course state
  const [courseContent, setCourseContent] = useState<string | null>(
    initialCourseContent
  );
  const [courseLoading, setCourseLoading] = useState(false);
  const [courseError, setCourseError] = useState<string | null>(null);

  // AI Coach state
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [chatError, setChatError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null) as React.RefObject<HTMLDivElement>;

  const isScholarOrSage = userPlan === "scholar" || userPlan === "sage";

  useUsageTracker(activeTab === "coach" || activeTab === "course");

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function toggleTopic(topic: string) {
    const newTopics = completedTopics.includes(topic)
      ? completedTopics.filter((t) => t !== topic)
      : [...completedTopics, topic];

    setCompletedTopics(newTopics);

    const updated = {
      ...(plan.completed_topics as Record<string, string[]>),
      [phase.id]: newTopics,
    };

    await fetch(`/api/plans/${plan.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ completed_topics: updated }),
    });
  }

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

    const newMessages: ChatMessage[] = [
      ...messages,
      { role: "user", content },
    ];
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
    } catch (err) {
      setChatError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setChatLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Phase header */}
      <div className="gnosis-card p-5">
        <div className="flex items-start gap-3">
          <div className="flex flex-col items-center gap-1 shrink-0">
            <div className="w-10 h-10 rounded-full border-2 border-accent bg-accent/10 flex items-center justify-center font-mono text-sm font-bold text-accent">
              {String(phaseIndex + 1).padStart(2, "0")}
            </div>
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
            const isLocked =
              (tab.id === "course") && !isScholarOrSage;
            return (
              <button
                key={tab.id}
                onClick={() => !isLocked && setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 px-4 py-3 text-sm font-medium border-b-2 transition-all whitespace-nowrap ${
                  isActive
                    ? "border-accent text-accent"
                    : isLocked
                    ? "border-transparent text-text-muted cursor-not-allowed"
                    : "border-transparent text-text-muted hover:text-text-secondary hover:border-border"
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
                {isLocked && <Lock className="w-3 h-3 ml-0.5 text-text-muted" />}
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
            completedTopics={completedTopics}
            onToggle={toggleTopic}
          />
        )}
        {activeTab === "books" && <BooksTab phase={phase} />}
        {activeTab === "videos" && <VideosTab phase={phase} />}
        {activeTab === "articles" && <ArticlesTab phase={phase} />}
        {activeTab === "course" && (
          <CourseTab
            isScholarOrSage={isScholarOrSage}
            content={courseContent}
            loading={courseLoading}
            error={courseError}
            onGenerate={generateCourse}
          />
        )}
        {activeTab === "coach" && (
          <CoachTab
            messages={messages}
            input={input}
            loading={chatLoading}
            error={chatError}
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

function OverviewTab({
  phase,
  completedTopics,
  onToggle,
}: {
  phase: Phase;
  completedTopics: string[];
  onToggle: (t: string) => void;
}) {
  const pct = phase.topics?.length
    ? Math.round((completedTopics.length / phase.topics.length) * 100)
    : 0;

  return (
    <div className="space-y-6">
      {/* Topics */}
      <div className="gnosis-card p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-cinzel text-base font-semibold text-text-primary">
            Topics
          </h3>
          <span className="font-mono text-xs text-text-secondary">
            {completedTopics.length}/{phase.topics?.length ?? 0} · {pct}%
          </span>
        </div>
        <div className="h-1 bg-surface rounded-full overflow-hidden">
          <div
            className="h-full bg-accent rounded-full transition-all duration-500"
            style={{ width: `${pct}%` }}
          />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {(phase.topics ?? []).map((topic) => {
            const done = completedTopics.includes(topic);
            return (
              <button
                key={topic}
                onClick={() => onToggle(topic)}
                className={`flex items-center gap-3 p-3 rounded-lg border text-left transition-all duration-150 ${
                  done
                    ? "border-success/30 bg-success/5 text-text-secondary"
                    : "border-border bg-surface-raised hover:border-accent/30 text-text-secondary"
                }`}
              >
                {done ? (
                  <CheckSquare className="w-4 h-4 text-success shrink-0" />
                ) : (
                  <Square className="w-4 h-4 text-text-muted shrink-0" />
                )}
                <span className={`text-sm ${done ? "line-through opacity-60" : ""}`}>
                  {topic}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Project */}
      {phase.project && (
        <div className="gnosis-card p-6 space-y-3">
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
    return <EmptyTabState message="No books for this phase." />;
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {phase.books.map((book, i) => (
        <div key={i} className="gnosis-card p-5 space-y-2">
          <div className="flex items-start gap-3">
            <div className="w-10 h-14 rounded bg-accent/20 border border-accent/30 flex items-center justify-center shrink-0">
              <BookOpen className="w-4 h-4 text-accent" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-text-primary font-medium text-sm leading-snug">
                {book.title}
              </p>
              <p className="text-text-muted text-xs mt-0.5">{book.author}</p>
            </div>
          </div>
          <p className="text-text-secondary text-sm leading-relaxed border-t border-border pt-2">
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
    return <EmptyTabState message="No videos for this phase." />;
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {phase.videos.map((video, i) => (
        <div key={i} className="gnosis-card p-5 space-y-2">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded bg-red-500/10 border border-red-500/30 flex items-center justify-center shrink-0">
              <Video className="w-4 h-4 text-red-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-text-primary font-medium text-sm leading-snug">
                {video.title}
              </p>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-text-muted text-xs">{video.creator}</span>
                {video.duration && (
                  <>
                    <span className="text-border">·</span>
                    <span className="font-mono text-[10px] text-text-muted">
                      {video.duration}
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>
          <p className="text-text-secondary text-sm leading-relaxed border-t border-border pt-2">
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
    return <EmptyTabState message="No articles for this phase." />;
  return (
    <div className="grid grid-cols-1 gap-3">
      {phase.articles.map((article, i) => (
        <div
          key={i}
          className="gnosis-card p-4 flex items-start gap-4"
        >
          <div className="w-8 h-8 rounded bg-info/10 border border-info/30 flex items-center justify-center shrink-0">
            <FileText className="w-4 h-4 text-info" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <p className="text-text-primary font-medium text-sm">
                {article.title}
              </p>
              <span className="font-mono text-[10px] text-text-muted whitespace-nowrap shrink-0">
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
  isScholarOrSage,
  content,
  loading,
  error,
  onGenerate,
}: {
  isScholarOrSage: boolean;
  content: string | null;
  loading: boolean;
  error: string | null;
  onGenerate: () => void;
}) {
  if (!isScholarOrSage) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-5 text-center">
        <div className="w-16 h-16 rounded-full border-2 border-accent/30 bg-accent/5 flex items-center justify-center">
          <Lock className="w-7 h-7 text-accent" />
        </div>
        <div className="space-y-2">
          <h3 className="font-cinzel text-lg font-semibold text-text-primary">
            Scholar & Sage Feature
          </h3>
          <p className="text-text-secondary text-sm max-w-xs">
            AI Course generation creates a full, structured lesson for this
            phase — powered by Claude.
          </p>
        </div>
        <a href="/pricing" className="gnosis-btn-primary flex items-center gap-2">
          <Sparkles className="w-4 h-4" />
          Upgrade to unlock
        </a>
      </div>
    );
  }

  if (content) {
    return (
      <div className="gnosis-card p-6 sm:p-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-accent" />
            <span className="gnosis-label">AI-Generated Course Module</span>
          </div>
          <button
            onClick={onGenerate}
            disabled={loading}
            className="flex items-center gap-1.5 text-xs text-text-muted hover:text-text-secondary transition-colors"
            title="Regenerate"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            Regenerate
          </button>
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
      <div className="w-16 h-16 rounded-full border-2 border-dashed border-accent/40 flex items-center justify-center">
        <Sparkles className="w-7 h-7 text-accent" />
      </div>
      <div className="space-y-2">
        <h3 className="font-cinzel text-lg font-semibold text-text-primary">
          Generate AI Course
        </h3>
        <p className="text-text-secondary text-sm max-w-xs">
          GNOSIS will write a complete, structured course module for this phase
          — covering all topics with exercises and explanations.
        </p>
      </div>
      <button
        onClick={onGenerate}
        disabled={loading}
        className="gnosis-btn-primary flex items-center gap-2 disabled:opacity-60"
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
  messagesEndRef,
  onInputChange,
  onSend,
}: {
  messages: ChatMessage[];
  input: string;
  loading: boolean;
  error: string | null;
  messagesEndRef: React.RefObject<HTMLDivElement>;
  onInputChange: (v: string) => void;
  onSend: () => void;
}) {
  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") onSend();
  }

  return (
    <div className="gnosis-card flex flex-col h-[560px]">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full gap-3 text-center">
            <div className="w-12 h-12 rounded-full border-2 border-accent/30 bg-accent/5 flex items-center justify-center">
              <MessageSquare className="w-5 h-5 text-accent" />
            </div>
            <div>
              <p className="text-text-secondary text-sm font-medium">
                GNOSIS AI Coach
              </p>
              <p className="text-text-muted text-xs mt-1 max-w-xs">
                Ask anything about this phase. Get specific explanations, examples, and guidance.
              </p>
            </div>
            <div className="flex flex-wrap gap-2 justify-center mt-2">
              {[
                "Explain the key concepts",
                "Give me a practical exercise",
                "What should I focus on first?",
              ].map((q) => (
                <button
                  key={q}
                  onClick={() => {
                    onInputChange(q);
                  }}
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
          className="flex-1 gnosis-input resize-none text-sm py-2.5 disabled:opacity-50"
        />
        <button
          onClick={onSend}
          disabled={!input.trim() || loading}
          className="gnosis-btn-primary p-2.5 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
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

function EmptyTabState({ message }: { message: string }) {
  return (
    <div className="flex items-center justify-center py-16 text-text-muted text-sm">
      {message}
    </div>
  );
}
