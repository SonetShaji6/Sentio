"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { setTokens } from "@/lib/auth";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [globalError, setGlobalError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setGlobalError("");

    if (!email.trim() || !password.trim()) {
      setGlobalError("Please enter your email and password.");
      return;
    }

    setLoading(true);
    try {
      const API_URL =
        process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
      const res = await fetch(`${API_URL}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setGlobalError(data.message || "Login failed");
        return;
      }

      // Store tokens and redirect to dashboard
      setTokens(data.accessToken, data.refreshToken);
      window.location.href = "/dashboard";
    } catch {
      setGlobalError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <div className="mb-8">
        <h2 className="text-[22px] font-semibold tracking-tight text-gray-900 dark:text-white mb-2">
          Welcome back
        </h2>
        <p className="text-[14px] text-gray-500">
          Sign in to your Sentio account to continue.
        </p>
      </div>

      {globalError && <div className="alert-error mb-6">{globalError}</div>}

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Email */}
        <div>
          <label htmlFor="email" className="label">
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
            autoComplete="email"
            required
          />
        </div>

        {/* Password */}
        <div>
          <div className="flex items-center justify-between">
            <label htmlFor="password" className="label">
              Password
            </label>
            {/* Optional: Add forgot password link here in the future */}
          </div>
          <input
            id="password"
            type="password"
            className="input-field"
            placeholder="Enter your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={loading}
            autoComplete="current-password"
            required
          />
        </div>

        {/* Submit */}
        <button
          type="submit"
          className="btn btn-primary w-full mt-2"
          disabled={loading}
        >
          {loading ? "Signing in…" : "Sign In"}
        </button>
      </form>

      <p className="mt-8 text-center text-[14px] text-gray-500">
        Don&apos;t have an account?{" "}
        <Link
          href="/register"
          className="font-medium text-gray-900 hover:underline decoration-gray-300 underline-offset-4"
        >
          Create one
        </Link>
      </p>
    </>
  );
}
