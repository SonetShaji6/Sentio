"use client";

import { Suspense, useState, type FormEvent, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

interface FieldError {
  field: string;
  message: string;
}

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldError[]>([]);
  const [globalError, setGlobalError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!token) {
      setGlobalError("Invalid or missing password reset token.");
    }
  }, [token]);

  function getError(field: string): string | undefined {
    return fieldErrors.find((e) => e.field === field)?.message;
  }

  function validateClient(): FieldError[] {
    const errs: FieldError[] = [];
    if (!email.trim()) {
      errs.push({ field: "email", message: "Email is required" });
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
    setSuccessMsg("");
    setFieldErrors([]);

    if (!token) {
      setGlobalError("Missing token.");
      return;
    }

    const clientErrors = validateClient();
    if (clientErrors.length > 0) {
      setFieldErrors(clientErrors);
      return;
    }

    setLoading(true);
    try {
      const API_URL =
        process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
      const res = await fetch(`${API_URL}/api/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.errors) {
          setFieldErrors(data.errors);
        } else {
          setGlobalError(data.message || "Reset failed");
        }
        return;
      }

      setSuccessMsg(data.message || "Password successfully reset!");
      setTimeout(() => {
        router.push("/login");
      }, 3000);
    } catch {
      setGlobalError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  if (successMsg) {
    return (
      <div className="text-center py-8">
        <h2 className="text-2xl font-semibold text-gray-900 mb-4">Success!</h2>
        <p className="text-gray-600 mb-6">{successMsg}</p>
        <Link href="/login" className="btn btn-primary">
          Go to Sign In
        </Link>
      </div>
    );
  }

  return (
    <>
      <div className="mb-8">
        <h2 className="text-[22px] font-semibold tracking-tight text-gray-900 dark:text-white mb-2">
          Reset Password
        </h2>
        <p className="text-[14px] text-gray-500">
          Enter your new password below.
        </p>
      </div>

      {globalError && <div className="alert-error mb-6">{globalError}</div>}

      <form onSubmit={handleSubmit} className="space-y-5">
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
            disabled={loading || !token}
            required
          />
          {getError("email") && (
            <p className="field-error">{getError("email")}</p>
          )}
        </div>

        <div>
          <label htmlFor="password" className="label">
            New Password
          </label>
          <input
            id="password"
            type="password"
            className={`input-field ${getError("password") ? "input-error" : ""}`}
            placeholder="Min 8 chars, 1 uppercase, 1 number"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={loading || !token}
            required
          />
          {getError("password") && (
            <p className="field-error">{getError("password")}</p>
          )}
        </div>

        <div>
          <label htmlFor="confirmPassword" className="label">
            Confirm New Password
          </label>
          <input
            id="confirmPassword"
            type="password"
            className={`input-field ${getError("confirmPassword") ? "input-error" : ""}`}
            placeholder="Re-enter your password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            disabled={loading || !token}
            required
          />
          {getError("confirmPassword") && (
            <p className="field-error">{getError("confirmPassword")}</p>
          )}
        </div>

        <button
          type="submit"
          className="btn btn-primary w-full mt-2"
          disabled={loading || !token}
        >
          {loading ? "Resetting…" : "Reset Password"}
        </button>
      </form>
    </>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center">Loading...</div>}>
      <ResetPasswordForm />
    </Suspense>
  );
}
