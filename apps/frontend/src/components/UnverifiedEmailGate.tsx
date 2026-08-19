"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  resendVerificationEmail,
  fetchCurrentUser,
  logout,
  type AuthUser,
} from "@/lib/auth";
import { Logo } from "@/components/Logo";
import { ThemeToggle } from "@/components/ThemeToggle";

interface UnverifiedEmailGateProps {
  user: AuthUser;
  onVerified: (user: AuthUser) => void;
}

export function UnverifiedEmailGate({
  user,
  onVerified,
}: UnverifiedEmailGateProps) {
  const [resending, setResending] = useState(false);
  const [checking, setChecking] = useState(false);
  const [feedback, setFeedback] = useState<{
    type: "success" | "error" | "info";
    message: string;
  } | null>(null);
  const [cooldown, setCooldown] = useState(0);

  // Cooldown countdown timer
  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => {
      setCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  async function handleResend() {
    if (cooldown > 0 || resending) return;
    setResending(true);
    setFeedback(null);

    const result = await resendVerificationEmail(user.email);
    setResending(false);

    if (result.isEmailVerified) {
      const refreshed = await fetchCurrentUser();
      if (refreshed?.isEmailVerified) {
        onVerified(refreshed);
        return;
      }
    }

    if (result.success) {
      setFeedback({
        type: "success",
        message: "A new verification email has been sent! Check your inbox.",
      });
      setCooldown(60);
    } else {
      setFeedback({
        type: "error",
        message: result.message || "Failed to resend verification email.",
      });
    }
  }

  async function handleCheckStatus() {
    if (checking) return;
    setChecking(true);
    setFeedback(null);

    try {
      const refreshed = await fetchCurrentUser();
      setChecking(false);

      if (refreshed?.isEmailVerified) {
        setFeedback({
          type: "success",
          message: "Email verified successfully! Unlocking your dashboard…",
        });
        setTimeout(() => {
          onVerified(refreshed);
        }, 500);
      } else {
        setFeedback({
          type: "info",
          message:
            "Your email is not verified yet. Please click the verification link sent to your inbox.",
        });
      }
    } catch {
      setChecking(false);
      setFeedback({
        type: "error",
        message: "Unable to verify status. Please try again.",
      });
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 selection:bg-indigo-500/20 selection:text-indigo-500">
      {/* Top bar */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-zinc-200 dark:border-zinc-800 bg-white/70 dark:bg-zinc-900/70 backdrop-blur-md sticky top-0 z-10">
        <Logo imageClassName="h-8 w-8" />
        <div className="flex items-center gap-3">
          <ThemeToggle />
          <button
            onClick={logout}
            className="text-xs font-medium text-zinc-500 hover:text-zinc-900 dark:hover:text-white px-3 py-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          >
            Sign Out
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8">
        <div className="w-full max-w-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800/80 rounded-2xl shadow-xl shadow-zinc-900/5 dark:shadow-black/40 overflow-hidden">
          {/* Header Visual */}
          <div className="bg-gradient-to-b from-indigo-500/10 via-indigo-500/5 to-transparent dark:from-indigo-500/20 dark:via-indigo-500/5 p-8 text-center border-b border-zinc-100 dark:border-zinc-800/50">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-lg shadow-indigo-600/30">
              <svg
                width="32"
                height="32"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect width="20" height="16" x="2" y="4" rx="2" />
                <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L1 7" />
              </svg>
            </div>

            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300 mb-3 border border-amber-200 dark:border-amber-700/50">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
              Verification Required
            </div>

            <h1 className="text-2xl font-bold text-zinc-900 dark:text-white tracking-tight">
              Verify your email address
            </h1>

            <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400 max-w-sm mx-auto">
              Please verify your email to unlock your workspace, create
              presentations, and use all Sentio features.
            </p>
          </div>

          {/* Body Content */}
          <div className="p-6 sm:p-8 space-y-6">
            {/* Email pill box */}
            <div className="bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700/60 rounded-xl p-4 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 overflow-hidden">
                <div className="w-9 h-9 rounded-lg bg-zinc-200 dark:bg-zinc-700 flex items-center justify-center flex-shrink-0 text-zinc-600 dark:text-zinc-300">
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                </div>
                <div className="truncate">
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    Logged in as
                  </p>
                  <p className="text-sm font-semibold text-zinc-900 dark:text-white truncate">
                    {user.email}
                  </p>
                </div>
              </div>
              <button
                onClick={logout}
                className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline flex-shrink-0 font-medium"
              >
                Change
              </button>
            </div>

            {/* Status alerts */}
            {feedback && (
              <div
                className={`p-3.5 rounded-xl text-sm border flex items-start gap-2.5 transition-all ${
                  feedback.type === "success"
                    ? "bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/60"
                    : feedback.type === "error"
                      ? "bg-rose-50 text-rose-800 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800/60"
                      : "bg-blue-50 text-blue-800 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800/60"
                }`}
              >
                <div className="flex-shrink-0 mt-0.5">
                  {feedback.type === "success" ? (
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  ) : feedback.type === "error" ? (
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <circle cx="12" cy="12" r="10" />
                      <line x1="12" y1="8" x2="12" y2="12" />
                      <line x1="12" y1="16" x2="12.01" y2="16" />
                    </svg>
                  ) : (
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <circle cx="12" cy="12" r="10" />
                      <line x1="12" y1="8" x2="12" y2="12" />
                      <line x1="12" y1="8" x2="12.01" y2="8" />
                    </svg>
                  )}
                </div>
                <span>{feedback.message}</span>
              </div>
            )}

            {/* Action buttons */}
            <div className="space-y-3 pt-2">
              <button
                onClick={handleCheckStatus}
                disabled={checking}
                className="w-full py-2.5 px-4 rounded-xl font-semibold text-sm bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-100 shadow-md transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
              >
                {checking ? (
                  <>
                    <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    <span>Checking Status…</span>
                  </>
                ) : (
                  <>
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M21 2v6h-6" />
                      <path d="M3 12a9 9 0 0 1 15-6.7L21 8" />
                      <path d="M3 22v-6h6" />
                      <path d="M21 12a9 9 0 0 1-15 6.7L3 16" />
                    </svg>
                    <span>I&apos;ve Verified My Email / Refresh</span>
                  </>
                )}
              </button>

              <button
                onClick={handleResend}
                disabled={resending || cooldown > 0}
                className="w-full py-2.5 px-4 rounded-xl font-medium text-sm border border-zinc-300 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-200 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {resending ? (
                  <>
                    <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    <span>Sending email…</span>
                  </>
                ) : cooldown > 0 ? (
                  <span>Resend available in {cooldown}s</span>
                ) : (
                  <>
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <line x1="22" y1="2" x2="11" y2="13" />
                      <polygon points="22 2 15 22 11 13 2 9 22 2" />
                    </svg>
                    <span>Resend Verification Email</span>
                  </>
                )}
              </button>
            </div>

            {/* Footer helper links */}
            <div className="pt-4 border-t border-zinc-100 dark:border-zinc-800/80 flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400">
              <Link
                href={`/verify-email?email=${encodeURIComponent(user.email)}`}
                className="hover:text-indigo-600 dark:hover:text-indigo-400 hover:underline"
              >
                Enter token manually →
              </Link>
              <button
                onClick={logout}
                className="hover:text-rose-600 dark:hover:text-rose-400 transition-colors"
              >
                Log Out
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
