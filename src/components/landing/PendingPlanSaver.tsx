"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function PendingPlanSaver() {
  const router = useRouter();

  useEffect(() => {
    const raw = localStorage.getItem("aref_pending_plan");
    if (!raw) return;

    let planData: { goal: string; approach: unknown; totalHours: number };
    try {
      planData = JSON.parse(raw);
    } catch {
      localStorage.removeItem("aref_pending_plan");
      return;
    }

    fetch("/api/plans", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(planData),
    })
      .then((r) => r.json())
      .then((data) => {
        localStorage.removeItem("aref_pending_plan");
        if (data.planId) {
          router.push(`/plan/${data.planId}`);
        }
      })
      .catch(() => {
        // Leave in localStorage if network fails — will retry on next visit
      });
  }, [router]);

  return null;
}
