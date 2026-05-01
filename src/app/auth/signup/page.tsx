"use client";

import { useState } from "react";
import Link from "next/link";
import { Loader2, Mail, Lock, User, AlertCircle, CheckCircle2 } from "lucide-react";
import { signUp } from "../actions";

export default function SignupPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const formData = new FormData(e.currentTarget);
    const result = await signUp(null, formData);
    if (result?.error) {
      setError(result.error);
      setLoading(false);
    }
  }

  return (
    <div className="w-full max-w-md animate-fade-in">
      <div className="text-center mb-8">
        <h1 className="font-cinzel text-3xl font-bold text-text-primary tracking-wider mb-2">
          Begin Your Journey
        </h1>
        <p className="text-text-secondary font-outfit">
          Create your AREF account — it&apos;s free
        </p>
      </div>

      <div className="aref-card p-8 space-y-6">
        {error && (
          <div className="flex items-center gap-3 bg-red-500/10 border border-red-500/30 text-red-400 rounded-lg px-4 py-3 text-sm">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="aref-label block">Full Name</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
              <input
                name="name"
                type="text"
                required
                autoComplete="name"
                placeholder="Your name"
                className="aref-input pl-10"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="aref-label block">Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
              <input
                name="email"
                type="email"
                required
                autoComplete="email"
                placeholder="you@example.com"
                className="aref-input pl-10"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="aref-label block">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
              <input
                name="password"
                type="password"
                required
                minLength={8}
                autoComplete="new-password"
                placeholder="Min. 8 characters"
                className="aref-input pl-10"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full aref-btn-primary flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Creating account…
              </>
            ) : (
              "Create Free Account"
            )}
          </button>
        </form>

        <div className="pt-2 border-t border-border space-y-2">
          <p className="aref-label">Free plan includes</p>
          <ul className="space-y-1.5">
            {[
              "1 active learning plan",
              "AI-generated learning paths",
              "AI course content for every phase",
              "1 hour of AI coaching per day",
            ].map((item) => (
              <li key={item} className="flex items-center gap-2 text-sm text-text-secondary">
                <CheckCircle2 className="w-3.5 h-3.5 text-success shrink-0" />
                {item}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <p className="text-center mt-6 text-text-secondary text-sm font-outfit">
        Already have an account?{" "}
        <Link
          href="/auth/login"
          className="text-accent hover:text-accent-light transition-colors font-medium"
        >
          Sign in
        </Link>
      </p>

      <p className="text-center mt-3 text-text-muted text-xs font-outfit">
        By creating an account you agree to our Terms of Service and Privacy Policy.
      </p>
    </div>
  );
}
