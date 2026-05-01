import { useEffect, useState } from "react";

interface StreakData {
  count: number;
  lastStudied: string; // YYYY-MM-DD
}

function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

function yesterdayStr(): string {
  return new Date(Date.now() - 86_400_000).toISOString().slice(0, 10);
}

export function useStreak(touch: boolean = false): number {
  const [streak, setStreak] = useState(0);

  useEffect(() => {
    const today = todayStr();
    const yesterday = yesterdayStr();

    const raw = localStorage.getItem("aref_streak");
    let data: StreakData = raw ? JSON.parse(raw) : { count: 0, lastStudied: "" };

    if (data.lastStudied === today) {
      setStreak(data.count);
      return;
    }

    if (!touch) {
      // Just read — don't extend streak if not actively studying
      setStreak(data.lastStudied === yesterday ? data.count : 0);
      return;
    }

    // User is actively studying today — update streak
    if (data.lastStudied === yesterday) {
      data = { count: data.count + 1, lastStudied: today };
    } else {
      data = { count: 1, lastStudied: today };
    }

    localStorage.setItem("aref_streak", JSON.stringify(data));
    setStreak(data.count);
  }, [touch]);

  return streak;
}
