"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Phase, LearningPlan } from "@/types";

const LEVEL_COLORS: Record<
  string,
  { fill: string; stroke: string; text: string }
> = {
  Beginner:     { fill: "#14532d", stroke: "#22c55e", text: "#dcfce7" },
  Intermediate: { fill: "#1e3a5f", stroke: "#3b82f6", text: "#dbeafe" },
  Advanced:     { fill: "#78350f", stroke: "#f59e0b", text: "#fef3c7" },
  Expert:       { fill: "#4a1d6e", stroke: "#a855f7", text: "#f3e8ff" },
};

function splitTitle(title: string): string[] {
  if (title.length <= 14) return [title];
  const words = title.split(" ");
  const lines: string[] = [];
  let cur = "";
  for (const w of words) {
    if (cur && (cur + " " + w).length > 14) {
      lines.push(cur);
      cur = w;
    } else {
      cur = cur ? cur + " " + w : w;
    }
    if (lines.length === 1 && cur.length > 14) {
      lines.push(cur.slice(0, 13) + "…");
      cur = "";
      break;
    }
  }
  if (cur) lines.push(cur);
  return lines.slice(0, 2);
}

interface Props {
  plan: LearningPlan;
  phases: Phase[];
}

export default function PlanMindMap({ plan, phases }: Props) {
  const router = useRouter();
  const [hovered, setHovered] = useState<number | null>(null);

  const N = phases.length;
  const CX = 480, CY = 270;
  const R = 195;

  const nodes = phases.map((phase, i) => {
    const angle = (i / N) * 2 * Math.PI - Math.PI / 2;
    return {
      phase,
      i,
      x: CX + R * Math.cos(angle),
      y: CY + R * Math.sin(angle),
      angle,
    };
  });

  return (
    <div className="aref-card overflow-hidden">
      {/* Header */}
      <div className="px-5 pt-4 pb-2 flex items-center justify-between border-b border-border">
        <span className="aref-label">Learning Map</span>
        <span className="font-mono text-[10px] text-text-muted">
          {N} phases · {plan.total_hours}h total · click to open
        </span>
      </div>

      {/* Desktop SVG mind map */}
      <div className="hidden sm:block overflow-x-auto">
        <svg
          viewBox="0 0 960 540"
          style={{ minWidth: 600, width: "100%", height: "auto", maxHeight: 440 }}
        >
          <defs>
            <radialGradient id="mm-center-glow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#b8960c" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#b8960c" stopOpacity="0" />
            </radialGradient>
          </defs>

          {/* Connection lines */}
          {nodes.map(({ phase, i, x, y, angle }) => {
            const c = LEVEL_COLORS[phase.level] ?? LEVEL_COLORS.Beginner;
            const isHov = hovered === i;
            return (
              <line
                key={`l${i}`}
                x1={CX + 58 * Math.cos(angle)}
                y1={CY + 58 * Math.sin(angle)}
                x2={x - 48 * Math.cos(angle)}
                y2={y - 48 * Math.sin(angle)}
                stroke={c.stroke}
                strokeWidth={isHov ? 2 : 1.5}
                strokeOpacity={isHov ? 0.7 : 0.3}
                strokeDasharray={isHov ? "none" : "5 3"}
                style={{ transition: "stroke-opacity 0.2s, stroke-width 0.2s" }}
              />
            );
          })}

          {/* Center glow */}
          <circle cx={CX} cy={CY} r={90} fill="url(#mm-center-glow)" />

          {/* Central node */}
          <circle
            cx={CX}
            cy={CY}
            r={58}
            fill="#0c0c1a"
            stroke="#b8960c"
            strokeWidth={2}
          />
          <text
            x={CX}
            y={CY - 20}
            textAnchor="middle"
            fill="#b8960c"
            fontSize={18}
            fontFamily="serif"
          >
            {plan.approach_icon}
          </text>
          <text
            x={CX}
            y={CY - 4}
            textAnchor="middle"
            fill="#b8960c"
            fontSize={9}
            fontFamily="monospace"
            fontWeight="bold"
            letterSpacing={1}
          >
            AREF
          </text>
          {splitTitle(
            plan.goal.length > 22 ? plan.goal.slice(0, 20) + "…" : plan.goal
          ).map((line, li) => (
            <text
              key={li}
              x={CX}
              y={CY + 10 + li * 13}
              textAnchor="middle"
              fill="#c9bfa5"
              fontSize={9}
              fontFamily="system-ui"
            >
              {line}
            </text>
          ))}

          {/* Phase nodes */}
          {nodes.map(({ phase, i, x, y }) => {
            const c = LEVEL_COLORS[phase.level] ?? LEVEL_COLORS.Beginner;
            const isHov = hovered === i;
            const lines = splitTitle(phase.title);

            return (
              <g
                key={`n${i}`}
                className="cursor-pointer"
                onClick={() => router.push(`/plan/${plan.id}/phase/${i}`)}
                onMouseEnter={() => setHovered(i)}
                onMouseLeave={() => setHovered(null)}
              >
                {/* Hover glow */}
                {isHov && (
                  <circle
                    cx={x}
                    cy={y}
                    r={66}
                    fill={c.stroke}
                    fillOpacity={0.1}
                  />
                )}

                {/* Node */}
                <circle
                  cx={x}
                  cy={y}
                  r={isHov ? 48 : 44}
                  fill={c.fill}
                  fillOpacity={isHov ? 0.6 : 0.3}
                  stroke={c.stroke}
                  strokeWidth={isHov ? 2.5 : 1.5}
                  style={{ transition: "r 0.15s, fill-opacity 0.15s" }}
                />

                {/* Phase index */}
                <text
                  x={x}
                  y={y - (lines.length > 1 ? 16 : 10)}
                  textAnchor="middle"
                  fill={c.stroke}
                  fontSize={9}
                  fontFamily="monospace"
                  fontWeight="bold"
                >
                  {String(i + 1).padStart(2, "0")}
                </text>

                {/* Phase title */}
                {lines.map((line, li) => (
                  <text
                    key={li}
                    x={x}
                    y={y + (lines.length > 1 ? -3 + li * 13 : 5)}
                    textAnchor="middle"
                    fill={isHov ? c.text : "#c9bfa5"}
                    fontSize={9}
                    fontFamily="system-ui"
                    style={{ transition: "fill 0.15s" }}
                  >
                    {line}
                  </text>
                ))}

                {/* Hours */}
                <text
                  x={x}
                  y={y + (lines.length > 1 ? 25 : 22)}
                  textAnchor="middle"
                  fill={c.stroke}
                  fontSize={8}
                  fontFamily="monospace"
                  fillOpacity={0.75}
                >
                  {phase.estimatedHours}h
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* Mobile: phase list */}
      <div className="sm:hidden divide-y divide-border">
        {phases.map((phase, i) => {
          const c = LEVEL_COLORS[phase.level] ?? LEVEL_COLORS.Beginner;
          return (
            <button
              key={i}
              onClick={() => router.push(`/plan/${plan.id}/phase/${i}`)}
              className="w-full flex items-center gap-3 px-5 py-3 hover:bg-surface-raised transition-colors text-left"
            >
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center font-mono text-xs font-bold shrink-0"
                style={{
                  backgroundColor: c.fill,
                  color: c.text,
                  border: `1.5px solid ${c.stroke}`,
                }}
              >
                {String(i + 1).padStart(2, "0")}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-text-primary text-sm font-medium truncate">
                  {phase.title}
                </p>
                <p className="text-text-muted text-xs">
                  {phase.level} · {phase.estimatedHours}h
                </p>
              </div>
              <span className="text-text-muted text-xs shrink-0">→</span>
            </button>
          );
        })}
      </div>

      {/* Legend */}
      <div className="hidden sm:flex items-center gap-5 px-5 pb-4 pt-2 flex-wrap border-t border-border">
        {Object.entries(LEVEL_COLORS).map(([level, c]) => (
          <div key={level} className="flex items-center gap-1.5">
            <div
              className="w-2.5 h-2.5 rounded-full"
              style={{ backgroundColor: c.stroke }}
            />
            <span className="font-mono text-[10px] text-text-muted">{level}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
