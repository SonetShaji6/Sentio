"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { setTokens } from "@/lib/auth";

interface FieldError {
  field: string;
  message: string;
}

export default function RegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [fieldErrors, setFieldErrors] = useState<FieldError[]>([]);
  const [globalError, setGlobalError] = useState("");
  const [loading, setLoading] = useState(false);

  function getError(field: string): string | undefined {
    return fieldErrors.find((e) => e.field === field)?.message;
  }

  // Client-side validation
  function validateClient(): FieldError[] {
    const errs: FieldError[] = [];
    if (!name.trim())
      errs.push({ field: "name", message: "Full name is required" });
    if (!email.trim()) {
      errs.push({ field: "email", message: "Email is required" });
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errs.push({ field: "email", message: "Enter a valid email address" });
    }
    if (password.length < 8)
      errs.push({
        field: "password",
        message: "Must be at least 8 characters",
      });
    else if (!/[A-Z]/.test(password))
      errs.push({
        field: "password",
        message: "Must contain an uppercase letter",
      });
    else if (!/[0-9]/.test(password))
      errs.push({ field: "password", message: "Must contain a number" });
    if (confirmPassword !== password)
      errs.push({
        field: "confirmPassword",
        message: "Passwords do not match",
      });
    return errs;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setGlobalError("");
    setFieldErrors([]);

    const clientErrors = validateClient();
    if (clientErrors.length > 0) {
      setFieldErrors(clientErrors);
      return;
    }

    setLoading(true);
    try {
      const API_URL =
        process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
      const res = await fetch(`${API_URL}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, confirmPassword }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.errors) {
          setFieldErrors(data.errors);
        } else {
          setGlobalError(data.message || "Registration failed");
        }
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
          Create your account
        </h2>
        <p className="text-[14px] text-gray-500">
          Start transforming your data into actionable intelligence.
        </p>
      </div>

      {globalError && <div className="alert-error mb-6">{globalError}</div>}

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Full Name */}
        <div>
          <label htmlFor="name" className="label">
            Full Name
          </label>
          <input
            id="name"
            type="text"
            className={`input-field ${getError("name") ? "input-error" : ""}`}
            placeholder="John Doe"
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={loading}
            autoComplete="name"
            required
          />
          {getError("name") && (
            <p className="field-error">{getError("name")}</p>
          )}
        </div>

        {/* Email */}
        <div>
          <label htmlFor="email" className="label">
            Email Address
          </label>
          <input
            id="email"
            type="email"
            className={`input-field ${getError("email") ? "input-error" : ""}`}
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={loading}
            autoComplete="email"
            required
          />
          {getError("email") && (
            <p className="field-error">{getError("email")}</p>
          )}
        </div>

        {/* Password */}
        <div>
          <label htmlFor="password" className="label">
            Password
          </label>
          <input
            id="password"
            type="password"
            className={`input-field ${getError("password") ? "input-error" : ""}`}
            placeholder="Min 8 chars, 1 uppercase, 1 number"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={loading}
            autoComplete="new-password"
            required
          />
          {getError("password") && (
            <p className="field-error">{getError("password")}</p>
          )}
        </div>

        {/* Confirm Password */}
        <div>
          <label htmlFor="confirmPassword" className="label">
            Confirm Password
          </label>
          <input
            id="confirmPassword"
            type="password"
            className={`input-field ${getError("confirmPassword") ? "input-error" : ""}`}
            placeholder="Re-enter your password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            disabled={loading}
            autoComplete="new-password"
            required
          />
          {getError("confirmPassword") && (
            <p className="field-error">{getError("confirmPassword")}</p>
          )}
        </div>

        {/* Submit */}
        <button
          type="submit"
          className="btn btn-primary w-full mt-2"
          disabled={loading}
        >
          {loading ? "Creating account…" : "Create Account"}
        </button>
      </form>

      <p className="mt-8 text-center text-[14px] text-gray-500">
        Already have an account?{" "}
        <Link
          href="/login"
          className="font-medium text-gray-900 hover:underline decoration-gray-300 underline-offset-4"
        >
          Sign in
        </Link>
      </p>
    </>
  );
}
