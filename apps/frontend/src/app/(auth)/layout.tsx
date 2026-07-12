import Link from "next/link";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div
      className="flex min-h-screen items-center justify-center px-4 py-12"
      style={{ background: "var(--color-bg-app)" }}
    >
      <div className="w-full max-w-[420px]">
        {/* ── Logo / Wordmark ── */}
        <div className="mb-8 text-center">
          <Link href="/" className="inline-block">
            <h1
              className="text-[28px] font-bold tracking-tight"
              style={{ color: "var(--color-text-primary)" }}
            >
              Sentio
            </h1>
          </Link>
          <p
            className="mt-1 text-[14px]"
            style={{ color: "var(--color-text-muted)" }}
          >
            AI-Powered Audience Engagement
          </p>
        </div>

        {/* ── Card ── */}
        <div
          className="rounded-[20px] px-7 py-8"
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
