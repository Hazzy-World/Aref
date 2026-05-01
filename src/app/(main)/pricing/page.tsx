"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  CheckCircle2,
  Sparkles,
  Loader2,
  Zap,
  Crown,
  BookOpen,
} from "lucide-react";

interface PlanDef {
  id: "seeker" | "scholar" | "sage";
  name: string;
  greek: string;
  price: string;
  period: string;
  tagline: string;
  icon: React.ElementType;
  highlight: boolean;
  features: string[];
  cta: string;
  ctaHref?: string;
}

const PLANS: PlanDef[] = [
  {
    id: "seeker",
    name: "Seeker",
    greek: "Ζητητής",
    price: "Free",
    period: "forever",
    tagline: "Begin the journey",
    icon: BookOpen,
    highlight: false,
    cta: "Get Started Free",
    ctaHref: "/auth/signup",
    features: [
      "1 active learning plan",
      "AI-generated learning paths",
      "Curated books & video resources",
      "Topic progress tracking",
      "1 hour of AI coaching per day",
      "Community access",
    ],
  },
  {
    id: "scholar",
    name: "Scholar",
    greek: "Σχολαστικός",
    price: "$12",
    period: "per month",
    tagline: "Accelerate mastery",
    icon: Sparkles,
    highlight: true,
    cta: "Start with Scholar",
    features: [
      "Up to 5 active learning plans",
      "AI-generated learning paths",
      "Curated books & video resources",
      "Topic progress tracking",
      "8 hours of AI coaching per day",
      "AI Course generation per phase",
      "Full resource library access",
      "Priority support",
    ],
  },
  {
    id: "sage",
    name: "Sage",
    greek: "Σοφός",
    price: "$39",
    period: "per month",
    tagline: "Infinite knowledge",
    icon: Crown,
    highlight: false,
    cta: "Become a Sage",
    features: [
      "Unlimited learning plans",
      "Unlimited AI coaching",
      "AI Course generation per phase",
      "Full course builder",
      "Team workspaces",
      "API access",
      "Advanced analytics",
      "Dedicated support",
    ],
  },
];

export default function PricingPage() {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleUpgrade(planId: "scholar" | "sage") {
    setLoading(planId);
    setError(null);

    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: planId }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (res.status === 401) {
          router.push(`/auth/login?redirectTo=/pricing`);
          return;
        }
        throw new Error(data.error ?? "Checkout failed");
      }

      if (data.url) {
        window.location.href = data.url;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setLoading(null);
    }
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-16 space-y-12">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="inline-flex items-center gap-2 bg-accent/10 border border-accent/30 text-accent rounded-full px-4 py-1.5">
          <Zap className="w-3.5 h-3.5" />
          <span className="font-mono text-xs tracking-wider">PLANS & PRICING</span>
        </div>
        <h1 className="font-cinzel text-4xl sm:text-5xl font-bold text-text-primary tracking-wide">
          Invest in your{" "}
          <span className="gradient-gold">mastery</span>
        </h1>
        <p className="text-text-secondary text-lg max-w-xl mx-auto">
          Every plan includes AI-powered learning paths. Upgrade for deeper tools and unlimited access.
        </p>
      </div>

      {/* Error */}
      {error && (
        <div className="max-w-md mx-auto bg-red-500/10 border border-red-500/30 text-red-400 rounded-lg px-4 py-3 text-sm text-center">
          {error}
        </div>
      )}

      {/* Plans */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
        {PLANS.map((plan) => {
          const Icon = plan.icon;
          const isLoading = loading === plan.id;

          return (
            <div
              key={plan.id}
              className={`relative gnosis-card flex flex-col ${
                plan.highlight
                  ? "border-accent/50 bg-surface-raised ring-1 ring-accent/20"
                  : ""
              }`}
            >
              {plan.highlight && (
                <div className="absolute -top-3.5 inset-x-0 flex justify-center">
                  <span className="bg-accent text-background font-mono text-[10px] font-bold px-4 py-1 rounded-full tracking-wider">
                    MOST POPULAR
                  </span>
                </div>
              )}

              <div className="p-6 space-y-5 flex-1">
                {/* Header */}
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                        plan.highlight
                          ? "bg-accent/20 border border-accent/40"
                          : "bg-surface border border-border"
                      }`}
                    >
                      <Icon
                        className={`w-4 h-4 ${plan.highlight ? "text-accent" : "text-text-muted"}`}
                      />
                    </div>
                  </div>
                  <h2 className="font-cinzel text-xl font-bold text-text-primary">
                    {plan.name}
                  </h2>
                  <p className="font-mono text-xs text-text-muted">{plan.greek}</p>
                  <p className="text-text-secondary text-sm">{plan.tagline}</p>
                </div>

                {/* Price */}
                <div className="flex items-baseline gap-1.5">
                  <span
                    className={`text-4xl font-bold font-outfit ${
                      plan.highlight ? "text-accent" : "text-text-primary"
                    }`}
                  >
                    {plan.price}
                  </span>
                  <span className="text-text-muted text-sm">{plan.period}</span>
                </div>

                {/* Divider */}
                <div className="h-px bg-border" />

                {/* Features */}
                <ul className="space-y-2.5">
                  {plan.features.map((feat) => (
                    <li key={feat} className="flex items-start gap-2.5 text-sm">
                      <CheckCircle2
                        className={`w-4 h-4 shrink-0 mt-0.5 ${
                          plan.highlight ? "text-accent" : "text-success"
                        }`}
                      />
                      <span className="text-text-secondary">{feat}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* CTA */}
              <div className="p-6 pt-0">
                {plan.ctaHref ? (
                  <Link
                    href={plan.ctaHref}
                    className={`w-full block text-center py-3 rounded-lg font-semibold transition-all ${
                      plan.highlight
                        ? "gnosis-btn-primary"
                        : "gnosis-btn-secondary"
                    }`}
                  >
                    {plan.cta}
                  </Link>
                ) : (
                  <button
                    onClick={() =>
                      handleUpgrade(plan.id as "scholar" | "sage")
                    }
                    disabled={!!loading}
                    className={`w-full py-3 rounded-lg font-semibold transition-all flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed ${
                      plan.highlight
                        ? "gnosis-btn-primary"
                        : "gnosis-btn-secondary"
                    }`}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Redirecting…
                      </>
                    ) : (
                      plan.cta
                    )}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* FAQ / trust section */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-center pt-4">
        {[
          { title: "Cancel anytime", body: "No lock-in. Cancel your subscription at any time, no questions asked." },
          { title: "Secure payments", body: "Payments processed securely by Stripe. We never store card details." },
          { title: "Instant access", body: "Your plan upgrades immediately after payment. No waiting." },
        ].map((item) => (
          <div key={item.title} className="gnosis-card p-5 space-y-2">
            <p className="font-cinzel text-sm font-semibold text-text-primary">{item.title}</p>
            <p className="text-text-muted text-xs leading-relaxed">{item.body}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
