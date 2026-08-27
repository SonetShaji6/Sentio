"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [globalError, setGlobalError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setGlobalError("");
    setSuccessMsg("");

    if (!email.trim()) {
      setGlobalError("Please enter your email.");
      return;
    }

    setLoading(true);
    try {
      const API_URL =
        process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
      const res = await fetch(`${API_URL}/api/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (!res.ok) {
        setGlobalError(data.message || "Request failed");
        return;
      }

      setSuccessMsg(data.message || "Reset link sent!");
    } catch {
      setGlobalError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <div className="mb-8">
        <h2 className="text-[22px] font-semibold tracking-tight text-slate-900 dark:text-white mb-2">
          Forgot Password
        </h2>
        <p className="text-[14px] text-slate-500 dark:text-slate-400">
          Enter your email address and we'll send you a link to reset your
          password.
        </p>
      </div>

      {globalError && <div className="alert-error mb-6">{globalError}</div>}
      {successMsg && (
        <div className="alert-success mb-6 p-3 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-sm rounded-xl border border-emerald-500/20">
          {successMsg}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label
            htmlFor="email"
            className="label text-slate-900 dark:text-slate-200"
          >
            Email Address
          </label>
          <input
            id="email"
            type="email"
            className="input-field"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={loading}
            required
          />
        </div>

        <button
          type="submit"
          className="btn btn-primary w-full mt-2"
          disabled={loading}
        >
          {loading ? "Sending link…" : "Send Reset Link"}
        </button>
      </form>

      <p className="mt-8 text-center text-[14px] text-slate-500 dark:text-slate-400">
        Remember your password?{" "}
        <Link
          href="/login"
          className="font-semibold text-slate-900 dark:text-white hover:underline decoration-slate-300 dark:decoration-slate-600 underline-offset-4"
        >
          Sign in
        </Link>
      </p>
    </>
  );
}
