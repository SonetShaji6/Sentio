"use client";

import { Suspense, useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

function VerifyEmailForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const emailParam = searchParams.get("email");

  const [inputEmail, setInputEmail] = useState(emailParam || "");
  const [inputToken, setInputToken] = useState(token || "");
  const [status, setStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");
  const [message, setMessage] = useState("");
  const [resending, setResending] = useState(false);
  const [resendMessage, setResendMessage] = useState("");

  useEffect(() => {
    if (token && emailParam && status === "idle") {
      executeVerify(token, emailParam);
    }
  }, [token, emailParam]);

  async function executeVerify(verifyToken: string, verifyEmail: string) {
    setStatus("loading");
    setMessage("");
    try {
      const API_URL =
        process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
      const res = await fetch(`${API_URL}/api/auth/verify-email`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: verifyToken, email: verifyEmail }),
      });

      const data = await res.json();
      if (!res.ok) {
        setStatus("error");
        setMessage(
          data.message || "Verification token is invalid or has expired.",
        );
        return;
      }

      setStatus("success");
      setMessage(
        "Email verified successfully! You can now access your dashboard and use all platform features.",
      );
    } catch {
      setStatus("error");
      setMessage("Network error. Please try again.");
    }
  }

  async function handleManualSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!inputToken.trim()) {
      setStatus("error");
      setMessage("Please enter the verification token.");
      return;
    }
    if (!inputEmail.trim()) {
      setStatus("error");
      setMessage("Please enter your email address.");
      return;
    }
    await executeVerify(inputToken.trim(), inputEmail.trim());
  }

  async function handleResend() {
    if (!inputEmail.trim()) {
      setResendMessage("Please enter your email address first.");
      return;
    }
    setResending(true);
    setResendMessage("");
    try {
      const API_URL =
        process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
      const res = await fetch(`${API_URL}/api/auth/resend-verification`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: inputEmail.trim() }),
      });
      const data = await res.json();
      setResendMessage(
        data.message || "Verification email sent. Please check your inbox.",
      );
    } catch {
      setResendMessage("Failed to send verification email. Please try again.");
    } finally {
      setResending(false);
    }
  }

  return (
    <>
      <div className="mb-8 text-center">
        <h2 className="text-[22px] font-semibold tracking-tight text-gray-900 dark:text-white mb-2">
          Email Verification
        </h2>
        <p className="text-[14px] text-gray-500">
          Verify your email address to unlock your account and platform
          features.
        </p>
      </div>

      {status === "success" ? (
        <div className="text-center py-4 space-y-6">
          <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 rounded-xl border border-emerald-200 dark:border-emerald-800/60 flex items-center gap-3 text-left">
            <svg
              className="w-6 h-6 text-emerald-600 dark:text-emerald-400 flex-shrink-0"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <polyline points="20 6 9 17 4 12" />
            </svg>
            <span className="text-sm font-medium">{message}</span>
          </div>
          <Link
            href="/dashboard"
            className="btn btn-primary w-full inline-block text-center py-2.5"
          >
            Continue to Dashboard
          </Link>
        </div>
      ) : (
        <form onSubmit={handleManualSubmit} className="space-y-5">
          {status === "error" && (
            <div className="p-3.5 rounded-xl text-sm border bg-rose-50 text-rose-800 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800/60">
              {message}
            </div>
          )}

          <div>
            <label htmlFor="email" className="label">
              Email Address
            </label>
            <input
              id="email"
              type="email"
              className="input-field"
              placeholder="you@example.com"
              value={inputEmail}
              onChange={(e) => setInputEmail(e.target.value)}
              disabled={status === "loading"}
              required
            />
          </div>

          {!token && (
            <div>
              <label htmlFor="token" className="label">
                Verification Token
              </label>
              <input
                id="token"
                type="text"
                className="input-field"
                placeholder="Paste your verification token"
                value={inputToken}
                onChange={(e) => setInputToken(e.target.value)}
                disabled={status === "loading"}
                required
              />
            </div>
          )}

          <button
            type="submit"
            className="btn btn-primary w-full mt-2"
            disabled={status === "loading"}
          >
            {status === "loading" ? "Verifying…" : "Verify Email"}
          </button>

          {status === "error" && (
            <div className="pt-4 border-t border-gray-100 dark:border-gray-800 text-center space-y-2">
              <button
                type="button"
                onClick={handleResend}
                disabled={resending}
                className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline font-medium"
              >
                {resending
                  ? "Sending new link…"
                  : "Request a new verification link"}
              </button>
              {resendMessage && (
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {resendMessage}
                </p>
              )}
            </div>
          )}
        </form>
      )}
    </>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center">Loading...</div>}>
      <VerifyEmailForm />
    </Suspense>
  );
}
