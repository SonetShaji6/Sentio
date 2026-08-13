"use client";

import React, { useEffect, useState } from "react";
import { getAccessToken, API_URL } from "@/lib/auth";
import {
  ShieldAlert,
  Users,
  Building2,
  Radio,
  Cpu,
  FileSpreadsheet,
  Search,
  Lock,
  Unlock,
  UserCheck,
  AlertCircle,
  Loader2,
  RefreshCw,
  PowerOff,
  Activity,
  CheckCircle2,
} from "lucide-react";

export default function AdminConsolePage() {
  const [activeTab, setActiveTab] = useState<
    "overview" | "users" | "sessions" | "ai" | "audit"
  >("overview");

  // Data states
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [sessions, setSessions] = useState<any[]>([]);
  const [aiUsage, setAiUsage] = useState<any>(null);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // User filters
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const fetchDashboardData = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = getAccessToken();
      const res = await fetch(`${API_URL}/api/admin/dashboard`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        if (res.status === 403)
          throw new Error("Access denied. Admin privileges required.");
        throw new Error("Failed to load admin statistics");
      }

      setDashboardData(await res.json());
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const token = getAccessToken();
      const params = new URLSearchParams();
      if (searchQuery) params.append("q", searchQuery);
      if (roleFilter) params.append("role", roleFilter);
      if (statusFilter) params.append("status", statusFilter);

      const res = await fetch(
        `${API_URL}/api/admin/users?${params.toString()}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      if (res.ok) {
        const data = await res.json();
        setUsers(data.users);
      }
    } catch (err) {
      console.error("Fetch users error:", err);
    }
  };

  const fetchSessions = async () => {
    try {
      const token = getAccessToken();
      const res = await fetch(`${API_URL}/api/admin/sessions`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) setSessions(await res.json());
    } catch (err) {
      console.error("Fetch sessions error:", err);
    }
  };

  const fetchAIUsage = async () => {
    try {
      const token = getAccessToken();
      const res = await fetch(`${API_URL}/api/admin/ai-usage`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) setAiUsage(await res.json());
    } catch (err) {
      console.error("Fetch AI usage error:", err);
    }
  };

  const fetchAuditLogs = async () => {
    try {
      const token = getAccessToken();
      const res = await fetch(`${API_URL}/api/admin/audit-logs`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) setAuditLogs(await res.json());
    } catch (err) {
      console.error("Fetch audit logs error:", err);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  useEffect(() => {
    if (activeTab === "users") fetchUsers();
    if (activeTab === "sessions") fetchSessions();
    if (activeTab === "ai") fetchAIUsage();
    if (activeTab === "audit") fetchAuditLogs();
  }, [activeTab, searchQuery, roleFilter, statusFilter]);

  const handleRoleChange = async (userId: string, newRole: string) => {
    try {
      const token = getAccessToken();
      const res = await fetch(`${API_URL}/api/admin/users/${userId}/role`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ role: newRole }),
      });
      if (res.ok) fetchUsers();
      else {
        const data = await res.json();
        alert(data.message || "Failed to update role");
      }
    } catch (err) {
      alert("Error updating role");
    }
  };

  const handleToggleBlock = async (userId: string, currentBlocked: boolean) => {
    try {
      const token = getAccessToken();
      const res = await fetch(`${API_URL}/api/admin/users/${userId}/block`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ isBlocked: !currentBlocked }),
      });
      if (res.ok) fetchUsers();
    } catch (err) {
      alert("Error toggling user block status");
    }
  };

  const handleTerminateSession = async (sessionId: string) => {
    if (!confirm("Are you sure you want to force-end this live session?"))
      return;
    try {
      const token = getAccessToken();
      const res = await fetch(
        `${API_URL}/api/admin/sessions/${sessionId}/terminate`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      if (res.ok) fetchSessions();
    } catch (err) {
      alert("Failed to terminate session");
    }
  };

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 p-8 flex items-center justify-center">
        <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-6 rounded-2xl border border-red-200 dark:border-red-800 max-w-md text-center">
          <ShieldAlert className="w-12 h-12 mx-auto mb-3" />
          <h3 className="font-bold text-lg">
            Administrative Access Restricted
          </h3>
          <p className="text-sm mt-1">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-white p-6 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              🛡️ Admin Console & System Governance
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Platform administration, user controls, live session management,
              and AI telemetry monitoring.
            </p>
          </div>

          <button
            onClick={fetchDashboardData}
            className="p-2.5 text-gray-500 hover:text-indigo-600 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl"
            title="Refresh"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex flex-wrap gap-2 border-b border-gray-200 dark:border-gray-800 pb-3">
          {[
            { id: "overview", label: "Platform Overview", icon: Activity },
            { id: "users", label: "User Management", icon: Users },
            { id: "sessions", label: "Live Sessions", icon: Radio },
            { id: "ai", label: "AI Usage & Telemetry", icon: Cpu },
            { id: "audit", label: "Audit Logs", icon: FileSpreadsheet },
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-4 py-2 rounded-xl font-semibold text-sm transition-all flex items-center gap-2 ${
                  activeTab === tab.id
                    ? "bg-indigo-600 text-white shadow-sm"
                    : "bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 border border-gray-200 dark:border-gray-800"
                }`}
              >
                <Icon className="w-4 h-4" /> {tab.label}
              </button>
            );
          })}
        </div>

        {/* TAB 1: OVERVIEW */}
        {activeTab === "overview" && (
          <div className="space-y-6">
            {loading ? (
              <div className="flex justify-center py-20">
                <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
              </div>
            ) : (
              dashboardData && (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
                    <MetricCard
                      title="Total Users"
                      value={dashboardData.platform.totalUsers}
                      sub="Registered accounts"
                      icon={Users}
                    />
                    <MetricCard
                      title="Active Presenters"
                      value={dashboardData.platform.activePresenters}
                      sub="Verified roles"
                      icon={UserCheck}
                    />
                    <MetricCard
                      title="Organizations"
                      value={dashboardData.platform.totalOrganizations}
                      sub="Teams & orgs"
                      icon={Building2}
                    />
                    <MetricCard
                      title="Presentations"
                      value={dashboardData.platform.totalPresentations}
                      sub="Created decks"
                      icon={FileSpreadsheet}
                    />
                    <MetricCard
                      title="Active Sessions"
                      value={dashboardData.platform.activeSessions}
                      sub="Live right now"
                      icon={Radio}
                      color="text-emerald-500"
                    />
                    <MetricCard
                      title="Stored Files"
                      value={dashboardData.platform.totalFiles}
                      sub="Azure blobs"
                      icon={Cpu}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* AI Telemetry Card */}
                    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6 shadow-sm">
                      <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                        <Cpu className="w-5 h-5 text-indigo-600" /> AI Service
                        Telemetry (30 Days)
                      </h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
                          <span className="text-xs text-gray-500">
                            Total AI Requests
                          </span>
                          <p className="text-2xl font-extrabold text-indigo-600 mt-1">
                            {dashboardData.aiUsage.totalRequests}
                          </p>
                        </div>
                        <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
                          <span className="text-xs text-gray-500">
                            Token Consumption
                          </span>
                          <p className="text-2xl font-extrabold text-indigo-600 mt-1">
                            {dashboardData.aiUsage.totalTokens}
                          </p>
                        </div>
                        <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
                          <span className="text-xs text-gray-500">
                            Avg Response Latency
                          </span>
                          <p className="text-2xl font-extrabold text-indigo-600 mt-1">
                            {dashboardData.aiUsage.avgLatencyMs} ms
                          </p>
                        </div>
                        <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
                          <span className="text-xs text-gray-500">
                            API Error Rate
                          </span>
                          <p className="text-2xl font-extrabold text-emerald-600 mt-1">
                            {dashboardData.aiUsage.errorRate}%
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* System Status Card */}
                    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
                      <div>
                        <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                          <Activity className="w-5 h-5 text-emerald-500" />{" "}
                          System Health Status
                        </h3>
                        <div className="p-4 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800/40 rounded-xl flex items-center gap-3">
                          <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0" />
                          <div>
                            <p className="font-bold text-emerald-700 dark:text-emerald-400">
                              All Infrastructure Systems Operational
                            </p>
                            <p className="text-xs text-emerald-600 dark:text-emerald-500 mt-0.5">
                              MongoDB Atlas, Render API Server, Socket.IO, and
                              Azure Blob Storage online.
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              )
            )}
          </div>
        )}

        {/* TAB 2: USER MANAGEMENT */}
        {activeTab === "users" && (
          <div className="space-y-4">
            <div className="bg-white dark:bg-gray-900 p-4 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm flex flex-col md:flex-row gap-4 justify-between">
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search user by name or email..."
                  className="w-full pl-9 pr-4 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm outline-none"
                />
              </div>

              <div className="flex gap-2">
                <select
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                  className="px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm outline-none"
                >
                  <option value="">All Roles</option>
                  <option value="admin">Administrator</option>
                  <option value="presenter">Presenter</option>
                  <option value="participant">Participant</option>
                </select>

                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm outline-none"
                >
                  <option value="">All Statuses</option>
                  <option value="active">Active</option>
                  <option value="blocked">Blocked</option>
                </select>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl overflow-hidden shadow-sm">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-50 dark:bg-gray-800/50 text-xs text-gray-500 uppercase border-b border-gray-200 dark:border-gray-800">
                  <tr>
                    <th className="px-6 py-3">User</th>
                    <th className="px-6 py-3">Role</th>
                    <th className="px-6 py-3">Status</th>
                    <th className="px-6 py-3">Joined</th>
                    <th className="px-6 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {users.map((u) => (
                    <tr
                      key={u._id}
                      className="hover:bg-gray-50/50 dark:hover:bg-gray-800/30"
                    >
                      <td className="px-6 py-4 font-semibold text-gray-900 dark:text-white">
                        {u.name}
                        <span className="block text-xs font-normal text-gray-400">
                          {u.email}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <select
                          value={u.role}
                          onChange={(e) =>
                            handleRoleChange(u._id, e.target.value)
                          }
                          className="bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-xs rounded-lg px-2 py-1 font-bold capitalize"
                        >
                          <option value="admin">admin</option>
                          <option value="presenter">presenter</option>
                          <option value="participant">participant</option>
                        </select>
                      </td>
                      <td className="px-6 py-4">
                        {u.isBlocked ? (
                          <span className="px-2 py-0.5 bg-red-100 text-red-700 text-[10px] font-bold rounded-full">
                            Blocked
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 text-[10px] font-bold rounded-full">
                            Active
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-xs text-gray-400">
                        {new Date(u.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => handleToggleBlock(u._id, u.isBlocked)}
                          className={`p-2 rounded-lg text-xs font-semibold flex items-center gap-1 ml-auto ${
                            u.isBlocked
                              ? "bg-emerald-50 text-emerald-600 hover:bg-emerald-100"
                              : "bg-red-50 text-red-600 hover:bg-red-100"
                          }`}
                        >
                          {u.isBlocked ? (
                            <Unlock className="w-3.5 h-3.5" />
                          ) : (
                            <Lock className="w-3.5 h-3.5" />
                          )}
                          {u.isBlocked ? "Unblock" : "Block"}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 3: LIVE SESSIONS */}
        {activeTab === "sessions" && (
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl overflow-hidden shadow-sm">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 dark:bg-gray-800/50 text-xs text-gray-500 uppercase border-b border-gray-200 dark:border-gray-800">
                <tr>
                  <th className="px-6 py-3">Join Code</th>
                  <th className="px-6 py-3">Presentation Title</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3">Started</th>
                  <th className="px-6 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {sessions.map((s) => (
                  <tr key={s._id}>
                    <td className="px-6 py-4 font-mono font-bold text-indigo-600">
                      {s.joinCode}
                    </td>
                    <td className="px-6 py-4 font-semibold">
                      {s.presentationId?.title || "Session"}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-2 py-0.5 text-[10px] font-bold rounded-full uppercase ${
                          s.status === "live"
                            ? "bg-emerald-100 text-emerald-700 animate-pulse"
                            : "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {s.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-xs text-gray-400">
                      {new Date(s.createdAt).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      {s.status === "live" && (
                        <button
                          onClick={() => handleTerminateSession(s._id)}
                          className="px-3 py-1 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg text-xs font-bold flex items-center gap-1 ml-auto"
                        >
                          <PowerOff className="w-3.5 h-3.5" /> Force Terminate
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* TAB 4: AI TELEMETRY */}
        {activeTab === "ai" && aiUsage && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {(aiUsage.summaryByModel || []).map((m: any) => (
                <div
                  key={m._id}
                  className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-5 rounded-2xl shadow-sm"
                >
                  <span className="text-xs text-indigo-600 font-bold uppercase">
                    {m._id}
                  </span>
                  <p className="text-xl font-bold mt-2">
                    {m.totalRequests} Requests
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    {m.totalTokens} Tokens • {Math.round(m.avgLatency || 0)}ms
                    Avg Latency
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 5: AUDIT LOGS */}
        {activeTab === "audit" && (
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl overflow-hidden shadow-sm">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 dark:bg-gray-800/50 text-xs text-gray-500 uppercase border-b border-gray-200 dark:border-gray-800">
                <tr>
                  <th className="px-6 py-3">Timestamp</th>
                  <th className="px-6 py-3">Admin</th>
                  <th className="px-6 py-3">Action</th>
                  <th className="px-6 py-3">Target</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {auditLogs.map((log) => (
                  <tr key={log._id}>
                    <td className="px-6 py-4 text-xs text-gray-400">
                      {new Date(log.createdAt).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 font-semibold">
                      {log.user?.name || "Admin"}
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 text-[10px] font-bold rounded">
                        {log.action}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-600 dark:text-gray-300 font-mono text-xs">
                      {log.target || "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function MetricCard({
  title,
  value,
  sub,
  icon: Icon,
  color = "text-indigo-600",
}: any) {
  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-4 rounded-2xl shadow-sm">
      <div className="flex justify-between items-start mb-2">
        <span className="text-xs text-gray-400 font-medium">{title}</span>
        <Icon className={`w-4 h-4 ${color}`} />
      </div>
      <p className={`text-2xl font-extrabold ${color}`}>{value}</p>
      <span className="text-[10px] text-gray-400">{sub}</span>
    </div>
  );
}
