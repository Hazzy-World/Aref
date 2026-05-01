interface Props {
  value: number; // 0–100
  className?: string;
  color?: "amber" | "green" | "blue" | "purple";
}

const colorMap = {
  amber: "bg-accent",
  green: "bg-success",
  blue: "bg-info",
  purple: "bg-purple",
};

export default function ProgressBar({
  value,
  className = "",
  color = "amber",
}: Props) {
  const pct = Math.min(Math.max(value, 0), 100);
  return (
    <div
      className={`h-1.5 bg-surface rounded-full overflow-hidden ${className}`}
    >
      <div
        className={`h-full ${colorMap[color]} rounded-full transition-all duration-500`}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}
