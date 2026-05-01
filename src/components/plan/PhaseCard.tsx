import Link from "next/link";
import { Clock, ChevronRight, CheckCircle2, Circle, PlayCircle } from "lucide-react";
import ProgressBar from "@/components/ui/ProgressBar";
import LevelBadge from "@/components/ui/LevelBadge";
import type { Phase } from "@/types";

interface Props {
  phase: Phase;
  index: number;
  planId: string;
  completedTopics: string[];
}

export default function PhaseCard({
  phase,
  index,
  planId,
  completedTopics,
}: Props) {
  const total = phase.topics?.length ?? 0;
  const done = completedTopics.length;
  const pct = total ? Math.round((done / total) * 100) : 0;
  const isComplete = pct === 100;
  const isStarted = done > 0;

  return (
    <Link
      href={`/plan/${planId}/phase/${index}`}
      className="gnosis-card p-5 flex flex-col gap-4 hover:border-accent/40 transition-all duration-200 group"
    >
      {/* Header row */}
      <div className="flex items-start gap-3">
        <div className="flex flex-col items-center gap-1 shrink-0">
          <div
            className={`w-8 h-8 rounded-full border-2 flex items-center justify-center transition-colors ${
              isComplete
                ? "border-success bg-success/10 text-success"
                : isStarted
                ? "border-accent bg-accent/10 text-accent"
                : "border-border text-text-muted"
            }`}
          >
            {isComplete ? (
              <CheckCircle2 className="w-4 h-4" />
            ) : isStarted ? (
              <PlayCircle className="w-4 h-4" />
            ) : (
              <Circle className="w-4 h-4" />
            )}
          </div>
          <span className="font-mono text-[10px] text-text-muted">
            {String(index + 1).padStart(2, "0")}
          </span>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <h3 className="text-text-primary font-medium text-sm group-hover:text-accent transition-colors">
              {phase.title}
            </h3>
            <LevelBadge level={phase.level} />
          </div>
          <p className="text-text-secondary text-xs leading-relaxed line-clamp-2">
            {phase.description}
          </p>
        </div>

        <ChevronRight className="w-4 h-4 text-text-muted group-hover:text-accent transition-colors shrink-0 mt-1" />
      </div>

      {/* Progress */}
      <div className="space-y-1.5">
        <div className="flex justify-between">
          <span className="gnosis-label">
            {done}/{total} topics
          </span>
          <span className="font-mono text-[10px] text-text-secondary">{pct}%</span>
        </div>
        <ProgressBar
          value={pct}
          color={isComplete ? "green" : "amber"}
        />
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between text-xs text-text-muted">
        <span className="flex items-center gap-1">
          <Clock className="w-3.5 h-3.5" />
          {phase.estimatedHours}h estimated
        </span>
        <span
          className={`font-mono text-[10px] uppercase tracking-wider ${
            isComplete
              ? "text-success"
              : isStarted
              ? "text-accent"
              : "text-text-muted"
          }`}
        >
          {isComplete ? "Complete" : isStarted ? "In Progress" : "Not Started"}
        </span>
      </div>
    </Link>
  );
}
