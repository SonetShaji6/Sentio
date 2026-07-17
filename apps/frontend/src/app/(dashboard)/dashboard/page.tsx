"use client";

import { useEffect, useState } from "react";
import {
  fetchCurrentUser,
  getAccessToken,
  API_URL,
  type AuthUser,
} from "@/lib/auth";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function DashboardPage() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [presentations, setPresentations] = useState<any[]>([]);
  const [totalPresentations, setTotalPresentations] = useState(0);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetchCurrentUser().then(setUser);

    const fetchStats = async () => {
      const token = getAccessToken();
      if (!token) return;
      try {
        const res = await fetch(`${API_URL}/api/presentations?limit=3`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          setPresentations(data.presentations);
          setTotalPresentations(data.pagination.total);
        }
      } catch (error) {
        console.error("Failed to fetch dashboard stats", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  };

  const roleBadgeClass = `role-badge role-${user?.role || "presenter"}`;

  const stats = [
    {
      label: "Presentations",
      value: totalPresentations.toString(),
      subtitle: "Created",
      icon: (
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
          <rect x="2" y="3" width="20" height="14" rx="2" />
          <line x1="8" y1="21" x2="16" y2="21" />
          <line x1="12" y1="17" x2="12" y2="21" />
        </svg>
      ),
    },
    {
      label: "Participants",
      value: "0",
      subtitle: "Total reach",
      icon: (
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
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
      ),
    },
    {
      label: "Engagement",
      value: "—",
      subtitle: "Avg. score",
      icon: (
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
          <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
        </svg>
      ),
    },
  ];

  return (
    <div className="dashboard-page">
      {/* ── Welcome Header ── */}
      <section className="welcome-section">
        <div>
          <h1 className="welcome-title">
            {greeting()}, {user?.name?.split(" ")[0] || "there"} 👋
          </h1>
          <p className="welcome-subtitle">
            Here&apos;s an overview of your activity
          </p>
        </div>
        {user && (
          <div className="welcome-meta">
            <span className={roleBadgeClass}>{user.role}</span>
            <span className="welcome-email">{user.email}</span>
          </div>
        )}
      </section>

      {/* ── Stats Cards ── */}
      <section className="stats-grid">
        {stats.map((stat) => (
          <div key={stat.label} className="stat-card">
            <div className="stat-icon">{stat.icon}</div>
            <div className="stat-body">
              <span className="stat-value">{stat.value}</span>
              <span className="stat-label">{stat.label}</span>
              <span className="stat-subtitle">{stat.subtitle}</span>
            </div>
          </div>
        ))}
      </section>

      {/* ── Quick Actions ── */}
      <section className="section-card">
        <h2 className="section-title">Quick Actions</h2>
        <div className="quick-actions">
          <button className="action-card">
            <div className="action-icon action-icon-primary">
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
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
            </div>
            <span className="action-label">New Presentation</span>
            <span className="action-desc">Create an AI-powered session</span>
          </button>
          <button className="action-card">
            <div className="action-icon action-icon-secondary">
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
                <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
                <polyline points="10 17 15 12 10 7" />
                <line x1="15" y1="12" x2="3" y2="12" />
              </svg>
            </div>
            <span className="action-label">Join Session</span>
            <span className="action-desc">
              Enter a session code to participate
            </span>
          </button>
        </div>
      </section>

      {/* ── Recent Activity ── */}
      <section className="section-card">
        <h2 className="section-title">Recent Activity</h2>
        {loading ? (
          <div className="p-8 text-center text-gray-500">Loading...</div>
        ) : presentations.length === 0 ? (
          <div className="empty-state">
            <svg
              width="48"
              height="48"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="empty-icon"
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <p className="empty-title">No activity yet</p>
            <p className="empty-desc">
              Create your first presentation to get started
            </p>
          </div>
        ) : (
          <div className="divide-y border border-gray-200 dark:border-gray-800 rounded-lg overflow-hidden mt-4 bg-white dark:bg-gray-900">
            {presentations.map((p) => (
              <div
                key={p._id}
                className="p-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
              >
                <div>
                  <h3 className="font-medium text-gray-900 dark:text-gray-100">
                    {p.title}
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    Last updated {new Date(p.updatedAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <span
                    className={`text-xs px-2 py-1 rounded-full ${p.status === "live" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300"}`}
                  >
                    {p.status}
                  </span>
                  <Link
                    href={`/presentations/${p._id}/edit`}
                    className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  >
                    Edit
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
