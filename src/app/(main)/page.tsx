import { createClient } from "@/lib/supabase/server";
import GeneratePlanFlow from "@/components/landing/GeneratePlanFlow";
import SavedPlans from "@/components/landing/SavedPlans";
import type { LearningPlan } from "@/types";

export const dynamic = "force-dynamic";

export default async function LandingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let savedPlans: LearningPlan[] = [];

  if (user) {
    const { data } = await supabase
      .from("learning_plans")
      .select("*")
      .eq("user_id", user.id)
      .order("last_accessed", { ascending: false })
      .limit(6);
    savedPlans = (data as LearningPlan[]) ?? [];
  }

  return (
    <>
      <GeneratePlanFlow isLoggedIn={!!user} />
      {user && <SavedPlans plans={savedPlans} />}

      {/* Footer */}
      <footer className="border-t border-border px-4 py-8 text-center">
        <p className="font-cinzel text-sm text-text-muted tracking-widest mb-1">AREF</p>
        <p className="font-mono text-xs text-text-muted">
          AI-Powered Learning · Built for mastery
        </p>
      </footer>
    </>
  );
}
