import Link from "next/link";
import { Clock, ChevronRight, BookOpen } from "lucide-react";
import type { LearningPlan } from "@/types";

function progressPercent(plan: LearningPlan): number {
  const total = plan.phases.length;
  if (!total) return 0;
  const completedTopics = plan.completed_topics as Record<string, string[]>;
  const totalTopics = plan.phases.reduce(
    (sum, p) => sum + (p.topics?.length ?? 0),
    0
  );
  const doneTopics = Object.values(completedTopics).flat().length;
  return totalTopics ? Math.round((doneTopics / totalTopics) * 100) : 0;
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

export default function SavedPlans({ plans }: { plans: LearningPlan[] }) {
  if (!plans.length) return null;

  return (
    <section className="px-4 py-16 border-t border-border">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-cinzel text-xl font-semibold text-text-primary">
              Your Learning Plans
            </h2>
            <p className="text-text-secondary text-sm mt-0.5">
              {plans.length} active plan{plans.length !== 1 ? "s" : ""}
            </p>
          </div>
          <Link href="/dashboard" className="gnosis-btn-ghost text-sm flex items-center gap-1.5">
            View all
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {plans.slice(0, 6).map((plan) => {
            const pct = progressPercent(plan);
            return (
              <Link
                key={plan.id}
                href={`/plan/${plan.id}`}
                className="gnosis-card p-5 hover:border-accent/40 hover:bg-surface-raised transition-all duration-200 group"
              >
                <div className="flex items-start gap-3 mb-4">
                  <span className="text-2xl">{plan.approach_icon}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-text-primary font-medium text-sm line-clamp-2 leading-snug group-hover:text-accent transition-colors">
                      {plan.goal}
                    </p>
                    <p className="text-text-muted text-xs mt-1 font-mono">
                      {plan.approach_name}
                    </p>
                  </div>
                </div>

                {/* Progress */}
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center">
                    <span className="font-mono text-[10px] text-text-muted uppercase">Progress</span>
                    <span className="font-mono text-[10px] text-text-secondary">{pct}%</span>
                  </div>
                  <div className="h-1 bg-surface rounded-full overflow-hidden">
                    <div
                      className="h-full bg-accent rounded-full transition-all duration-500"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between mt-3">
                  <div className="flex items-center gap-1.5 text-text-muted text-xs">
                    <Clock className="w-3 h-3" />
                    {timeAgo(plan.last_accessed)}
                  </div>
                  <div className="flex items-center gap-1 text-text-muted text-xs">
                    <BookOpen className="w-3 h-3" />
                    {plan.total_hours}h
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
