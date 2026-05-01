export type Plan = "seeker" | "scholar" | "sage";

export interface User {
  id: string;
  email: string;
  name: string;
  plan: Plan;
  daily_minutes_used: number;
  daily_reset_at: string;
  created_at: string;
  stripe_customer_id?: string;
  stripe_subscription_id?: string;
}

export interface Phase {
  id: string;
  title: string;
  description: string;
  estimatedHours: number;
  level: "Beginner" | "Intermediate" | "Advanced" | "Expert";
  topics: string[];
  books: { title: string; author: string; why: string }[];
  videos: { title: string; creator: string; duration: string; why: string }[];
  articles: { title: string; source: string; why: string }[];
  project: string;
}

export interface Approach {
  id: "systematic" | "project-based" | "immersive-sprint";
  name: string;
  icon: string;
  tagline: string;
  style: string;
  phases: Phase[];
}

export interface GeneratedPlan {
  topic: string;
  totalEstimatedHours: number;
  approaches: Approach[];
}

export interface LearningPlan {
  id: string;
  user_id: string;
  goal: string;
  approach_id: string;
  approach_name: string;
  approach_icon: string;
  phases: Phase[];
  total_hours: number;
  current_phase: number;
  completed_topics: Record<string, string[]>;
  created_at: string;
  last_accessed: string;
}

export interface GeneratedCourse {
  id: string;
  plan_id: string;
  phase_id: string;
  content: string;
  created_at: string;
}

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export const PLAN_LIMITS: Record<
  Plan,
  { dailyMinutes: number; maxPlans: number; label: string; price: string }
> = {
  seeker:  { dailyMinutes: 60,       maxPlans: 1,        label: "Seeker",  price: "Free" },
  scholar: { dailyMinutes: 480,      maxPlans: 5,        label: "Scholar", price: "$12/mo" },
  sage:    { dailyMinutes: Infinity, maxPlans: Infinity, label: "Sage",    price: "$39/mo" },
};
