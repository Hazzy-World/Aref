import Link from "next/link";
import { Clock, BookOpen, ChevronRight, Layers } from "lucide-react";
import ProgressBar from "@/components/ui/ProgressBar";
import type { LearningPlan } from "@/types";

function calcProgress(plan: LearningPlan): number {
  const totalTopics = plan.phases.reduce(
    (sum, p) => sum + (p.topics?.length ?? 0),
    0
  );
  if (!totalTopics) return 0;
  const done = Object.values(
    plan.completed_topics as Record<string, string[]>
  ).flat().length;
  return Math.round((done / totalTopics) * 100);
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function PlanCard({ plan }: { plan: LearningPlan }) {
  const pct = calcProgress(plan);

  return (
    <Link
      href={`/plan/${plan.id}`}
      className="gnosis-card p-6 flex flex-col gap-4 hover:border-accent/40 transition-all duration-200 group"
    >
      {/* Header */}
      <div className="flex items-start gap-3">
        <span className="text-3xl leading-none mt-0.5">{plan.approach_icon}</span>
        <div className="flex-1 min-w-0">
          <p className="text-text-primary font-medium leading-snug group-hover:text-accent transition-colors line-clamp-2">
            {plan.goal}
          </p>
          <p className="text-text-muted text-xs font-mono mt-1 uppercase tracking-wider">
            {plan.approach_name}
          </p>
        </div>
        <ChevronRight className="w-4 h-4 text-text-muted group-hover:text-accent transition-colors shrink-0 mt-0.5" />
      </div>

      {/* Progress */}
      <div className="space-y-1.5">
        <div className="flex justify-between">
          <span className="gnosis-label">Progress</span>
          <span className="font-mono text-xs text-text-secondary">{pct}%</span>
        </div>
        <ProgressBar value={pct} />
      </div>

      {/* Meta */}
      <div className="flex items-center justify-between text-xs text-text-muted">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1">
            <Layers className="w-3.5 h-3.5" />
            {plan.phases.length} phases
          </span>
          <span className="flex items-center gap-1">
            <BookOpen className="w-3.5 h-3.5" />
            {plan.total_hours}h
          </span>
        </div>
        <span className="flex items-center gap-1">
          <Clock className="w-3.5 h-3.5" />
          {timeAgo(plan.last_accessed)}
        </span>
      </div>
    </Link>
  );
}
