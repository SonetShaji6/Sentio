import Link from "next/link";
import { Logo } from "@/components/Logo";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div
      className="flex min-h-screen flex-col items-center justify-center px-4 py-12 relative"
      style={{ background: "var(--color-bg-app)" }}
    >
      {/* ── Top Navigation ── */}
      <div className="absolute top-6 left-6 md:top-8 md:left-8">
        <Link
          href="/"
          className="flex items-center gap-2 text-[14px] font-medium text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors"
        >
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
            <line x1="19" y1="12" x2="5" y2="12"></line>
            <polyline points="12 19 5 12 12 5"></polyline>
          </svg>
          Home
        </Link>
      </div>

      <div className="w-full max-w-[420px]">
        {/* ── Logo / Wordmark ── */}
        <div className="mb-8 text-center flex flex-col items-center justify-center">
          <Logo imageClassName="h-16 w-16" />
          <p
            className="mt-2 text-[14px]"
            style={{ color: "var(--color-text-muted)" }}
          >
            Intelligence that drives action.
          </p>
        </div>

        {/* ── Auth Card ── */}
        <div
          className="rounded-[16px] px-8 py-10"
          style={{
            background: "var(--color-bg-surface)",
            border: "1px solid var(--color-border)",
            boxShadow: "var(--shadow-sm)",
          }}
        >
          {children}
        </div>
      </div>
    </div>
  );
}
