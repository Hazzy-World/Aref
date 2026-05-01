"use client";

import { useEffect, useRef } from "react";

export function useUsageTracker(enabled: boolean) {
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!enabled) return;

    timerRef.current = setInterval(async () => {
      try {
        await fetch("/api/usage", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ minutes: 1 }),
        });
      } catch {
        // Silent fail — usage tracking is best-effort
      }
    }, 60_000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [enabled]);
}
