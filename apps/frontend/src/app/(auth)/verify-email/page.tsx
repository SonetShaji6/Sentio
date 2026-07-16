"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

function VerifyEmailForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const email = searchParams.get("email"); // Assume email might be passed, or we just need token and email from user. But backend expects email.

  const [inputEmail, setInputEmail] = useState(email || "");
  const [status, setStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");
  const [message, setMessage] = useState("");

  async function handleVerify(e?: React.FormEvent) {
    if (e) e.preventDefault();
    if (!token) {
      setStatus("error");
      setMessage("Missing verification token.");
      return;
    }
    if (!inputEmail) {
      setStatus("error");
      setMessage("Please provide your email address.");
      return;
    }

    setStatus("loading");
    try {
      const API_URL =
        process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
      const res = await fetch(`${API_URL}/api/auth/verify-email`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, email: inputEmail }),
      });

      const data = await res.json();
      if (!res.ok) {
        setStatus("error");
        setMessage(data.message || "Verification failed");
        return;
      }

      setStatus("success");
      setMessage(
        "Email verified successfully! You can now access all features.",
      );
    } catch {
      setStatus("error");
      setMessage("Network error. Please try again.");
    }
  }

  return (
    <>
      <div className="mb-8 text-center">
        <h2 className="text-[22px] font-semibold tracking-tight text-gray-900 dark:text-white mb-2">
          Email Verification
        </h2>
        <p className="text-[14px] text-gray-500">
          Verify your email address to secure your account.
        </p>
      </div>

      {status === "success" ? (
        <div className="text-center py-4">
          <div className="alert-success mb-6 p-4 bg-green-50 text-green-700 rounded-md border border-green-200">
            {message}
          </div>
          <Link
            href="/login"
            className="btn btn-primary w-full inline-block text-center"
          >
            Go to Dashboard / Sign In
          </Link>
        </div>
      ) : (
        <form onSubmit={handleVerify} className="space-y-5">
          {status === "error" && (
            <div className="alert-error mb-4">{message}</div>
          )}

          <div>
            <label htmlFor="email" className="label">
              Confirm Email Address
            </label>
            <input
              id="email"
              type="email"
              className="input-field"
              placeholder="you@example.com"
              value={inputEmail}
              onChange={(e) => setInputEmail(e.target.value)}
              disabled={status === "loading" || !token}
              required
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary w-full mt-2"
            disabled={status === "loading" || !token}
          >
            {status === "loading" ? "Verifying…" : "Verify Email"}
          </button>
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
