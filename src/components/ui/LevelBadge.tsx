type Level = "Beginner" | "Intermediate" | "Advanced" | "Expert";

const classes: Record<Level, string> = {
  Beginner: "level-badge level-beginner",
  Intermediate: "level-badge level-intermediate",
  Advanced: "level-badge level-advanced",
  Expert: "level-badge level-expert",
};

export default function LevelBadge({ level }: { level: Level }) {
  return <span className={classes[level] ?? "level-badge"}>{level}</span>;
}
