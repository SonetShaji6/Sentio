"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import {
  getAccessToken,
  fetchCurrentUser,
  logout,
  type AuthUser,
} from "@/lib/auth";
import { Logo } from "@/components/Logo";
import { ThemeToggle } from "@/components/ThemeToggle";
import { NotificationCenter } from "@/components/NotificationCenter";
import { UnverifiedEmailGate } from "@/components/UnverifiedEmailGate";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const token = getAccessToken();
    if (!token) {
      router.replace("/login");
      return;
    }

    fetchCurrentUser().then((u) => {
      if (!u) {
        router.replace("/login");
        return;
      }
      setUser(u);
      setLoading(false);
    });
  }, [router]);

  if (loading) {
    return (
      <div className="dashboard-loading flex items-center justify-center h-screen bg-gray-50 dark:bg-gray-950">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  // If user is logged in but hasn't verified their email, gate the dashboard
  if (user && !user.isEmailVerified) {
    return (
      <UnverifiedEmailGate
        user={user}
        onVerified={(verifiedUser) => setUser(verifiedUser)}
      />
    );
  }

  const initials = user
    ? user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "";

  const roleBadgeClass = `role-badge role-${user?.role || "presenter"} text-xs font-medium px-2 py-0.5 rounded-full mt-1 inline-block`;

  const isActive = (path: string) =>
    pathname === path || pathname.startsWith(`${path}/`);

  // Full-screen immersive mode for presentation editor and presenter views
  const isImmersivePresentation =
    pathname?.includes("/presentations/") &&
    (pathname?.includes("/edit") || pathname?.includes("/host"));

  if (isImmersivePresentation) {
    return <>{children}</>;
  }

  return (
    <div className="dashboard-shell flex h-screen overflow-hidden bg-gray-50 dark:bg-gray-950">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="sidebar-overlay fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`sidebar fixed inset-y-0 left-0 z-50 w-64 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 transform transition-transform duration-200 ease-in-out md:translate-x-0 md:static md:flex md:flex-col ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}
      >
        <div className="sidebar-header flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-800">
          <Logo imageClassName="h-8 w-8" className="sidebar-logo" />
          <button
            className="sidebar-close md:hidden p-2 text-gray-500 hover:bg-gray-100 rounded-md"
            onClick={() => setSidebarOpen(false)}
            aria-label="Close sidebar"
          >
            ✕
          </button>
        </div>

        <nav className="sidebar-nav flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
          <Link
            href="/dashboard"
            className={`nav-item flex items-center gap-3 px-3.5 py-2.5 text-sm rounded-xl transition-colors ${isActive("/dashboard") && !pathname.startsWith("/presentations") ? "bg-zinc-100 dark:bg-zinc-900 text-zinc-950 dark:text-white font-bold" : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-900/60 hover:text-zinc-950 dark:hover:text-white font-medium"}`}
          >
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
              <rect x="3" y="3" width="7" height="7" rx="1" />
              <rect x="14" y="3" width="7" height="7" rx="1" />
              <rect x="3" y="14" width="7" height="7" rx="1" />
              <rect x="14" y="14" width="7" height="7" rx="1" />
            </svg>
            Dashboard
          </Link>
          <Link
            href="/presentations"
            className={`nav-item flex items-center gap-3 px-3.5 py-2.5 text-sm rounded-xl transition-colors ${isActive("/presentations") ? "bg-zinc-100 dark:bg-zinc-900 text-zinc-950 dark:text-white font-bold" : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-900/60 hover:text-zinc-950 dark:hover:text-white font-medium"}`}
          >
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
              <rect x="2" y="3" width="20" height="14" rx="2" />
              <line x1="8" y1="21" x2="16" y2="21" />
              <line x1="12" y1="17" x2="12" y2="21" />
            </svg>
            Presentations
          </Link>
          <Link
            href="/files"
            className={`nav-item flex items-center gap-3 px-3.5 py-2.5 text-sm rounded-xl transition-colors ${isActive("/files") ? "bg-zinc-100 dark:bg-zinc-900 text-zinc-950 dark:text-white font-bold" : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-900/60 hover:text-zinc-950 dark:hover:text-white font-medium"}`}
          >
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
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
              <polyline points="10 9 9 9 8 9" />
            </svg>
            Files & Knowledge Base
          </Link>
          <Link
            href="/organizations"
            className={`nav-item flex items-center gap-3 px-3.5 py-2.5 text-sm rounded-xl transition-colors ${isActive("/organizations") ? "bg-zinc-100 dark:bg-zinc-900 text-zinc-950 dark:text-white font-bold" : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-900/60 hover:text-zinc-950 dark:hover:text-white font-medium"}`}
          >
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
              <path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z" />
              <path d="M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2" />
              <path d="M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2" />
              <path d="M10 6h4" />
              <path d="M10 10h4" />
              <path d="M10 14h4" />
              <path d="M10 18h4" />
            </svg>
            Organizations
          </Link>
          {user?.role === "admin" && (
            <Link
              href="/admin"
              className={`nav-item flex items-center gap-3 px-3.5 py-2.5 text-sm rounded-xl transition-colors ${isActive("/admin") ? "bg-zinc-100 dark:bg-zinc-900 text-zinc-950 dark:text-white font-bold" : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-900/60 hover:text-zinc-950 dark:hover:text-white font-medium"}`}
            >
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
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
              Admin Console
            </Link>
          )}
          <Link
            href="/settings"
            className={`nav-item flex items-center gap-3 px-3.5 py-2.5 text-sm rounded-xl transition-colors ${isActive("/settings") ? "bg-zinc-100 dark:bg-zinc-900 text-zinc-950 dark:text-white font-bold" : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-900/60 hover:text-zinc-950 dark:hover:text-white font-medium"}`}
          >
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
              <circle cx="12" cy="12" r="3" />
              <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
            </svg>
            Settings
          </Link>
        </nav>

        {/* User info at bottom */}
        <div className="sidebar-footer">
          <div className="sidebar-user">
            {user?.avatar ? (
              <img
                src={user.avatar}
                alt={user.name}
                className="avatar"
                style={{ objectFit: "cover" }}
              />
            ) : (
              <div className="avatar">{initials}</div>
            )}
            <div className="sidebar-user-info">
              <span className="sidebar-user-name">{user?.name}</span>
              <span className={roleBadgeClass}>{user?.role}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <button onClick={logout} className="btn-logout" title="Sign out">
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
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="dashboard-main flex-1 flex flex-col h-screen overflow-hidden relative">
        {/* Mobile header */}
        <header className="mobile-header flex items-center justify-between p-4 md:hidden border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950">
          <div className="flex items-center gap-4">
            <button
              className="hamburger"
              onClick={() => setSidebarOpen(true)}
              aria-label="Open menu"
            >
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </svg>
            </button>
            <Logo imageClassName="h-6 w-6" className="mobile-logo" />
          </div>
          <NotificationCenter />
        </header>

        {/* Desktop Top Header (hidden on mobile) */}
        <header className="hidden md:flex items-center justify-end p-4 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950">
          <NotificationCenter />
        </header>

        <div className="dashboard-content overflow-y-auto flex-1">
          {children}
        </div>
      </main>
    </div>
  );
}
