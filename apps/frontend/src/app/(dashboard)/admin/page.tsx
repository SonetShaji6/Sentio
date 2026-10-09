"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
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
  Loader2,
  RefreshCw,
  PowerOff,
  Activity,
  CheckCircle2,
  Presentation,
  FileText,
  Trash2,
  Eye,
  ExternalLink,
  X,
  Sparkles,
  Download,
  Mail,
  Copy,
  Check,
} from "lucide-react";

export default function AdminConsolePage() {
  const [activeTab, setActiveTab] = useState<
    | "overview"
    | "users"
    | "presentations"
    | "files"
    | "organizations"
    | "sessions"
    | "ai"
    | "audit"
  >("overview");

  // Data states
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [presentations, setPresentations] = useState<any[]>([]);
  const [files, setFiles] = useState<any[]>([]);
  const [organizations, setOrganizations] = useState<any[]>([]);
  const [sessions, setSessions] = useState<any[]>([]);
  const [aiUsage, setAiUsage] = useState<any>(null);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");

  // Inspection states
  const [selectedUserForInspection, setSelectedUserForInspection] = useState<
    any | null
  >(null);
  const [userPresentations, setUserPresentations] = useState<any[]>([]);
  const [userFiles, setUserFiles] = useState<any[]>([]);
  const [userInspectionTab, setUserInspectionTab] = useState<
    "presentations" | "files"
  >("presentations");
  const [loadingUserInspection, setLoadingUserInspection] = useState(false);

  // Organization inspection
  const [selectedOrgDetails, setSelectedOrgDetails] = useState<any | null>(
    null,
  );
  const [loadingOrgDetails, setLoadingOrgDetails] = useState(false);

  // File text preview
  const [previewFile, setPreviewFile] = useState<any | null>(null);

  // Notification modal state
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const [notificationForm, setNotificationForm] = useState({
    title: "",
    message: "",
    targetUsers: "ALL", // "ALL" or "SPECIFIC"
    specificUserIds: [] as string[],
    deliveryMethod: "both", // "portal", "email", "both"
    targetRole: "ALL", // "ALL", "admin", "presenter", "participant"
  });
  const [sendingNotification, setSendingNotification] = useState(false);

  // Presentation participants inspection modal
  const [
    selectedPresentationForParticipants,
    setSelectedPresentationForParticipants,
  ] = useState<any | null>(null);
  const [presentationParticipantsData, setPresentationParticipantsData] =
    useState<any | null>(null);
  const [loadingParticipants, setLoadingParticipants] = useState(false);
  const [participantSearchQuery, setParticipantSearchQuery] = useState("");
  const [copiedParticipantEmail, setCopiedParticipantEmail] = useState<
    string | null
  >(null);

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

  const fetchPresentations = async () => {
    try {
      const token = getAccessToken();
      const params = new URLSearchParams();
      if (searchQuery) params.append("q", searchQuery);
      if (statusFilter) params.append("status", statusFilter);

      const res = await fetch(
        `${API_URL}/api/admin/presentations?${params.toString()}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      if (res.ok) {
        const data = await res.json();
        setPresentations(data.presentations);
      }
    } catch (err) {
      console.error("Fetch presentations error:", err);
    }
  };

  const fetchFiles = async () => {
    try {
      const token = getAccessToken();
      const params = new URLSearchParams();
      if (searchQuery) params.append("q", searchQuery);
      if (categoryFilter) params.append("category", categoryFilter);

      const res = await fetch(
        `${API_URL}/api/admin/files?${params.toString()}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      if (res.ok) {
        const data = await res.json();
        setFiles(data.files);
      }
    } catch (err) {
      console.error("Fetch files error:", err);
    }
  };

  const fetchOrganizations = async () => {
    try {
      const token = getAccessToken();
      const res = await fetch(`${API_URL}/api/admin/organizations`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setOrganizations(await res.json());
      }
    } catch (err) {
      console.error("Fetch organizations error:", err);
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
    if (activeTab === "presentations") fetchPresentations();
    if (activeTab === "files") fetchFiles();
    if (activeTab === "organizations") fetchOrganizations();
    if (activeTab === "sessions") fetchSessions();
    if (activeTab === "ai") fetchAIUsage();
    if (activeTab === "audit") fetchAuditLogs();
  }, [activeTab, searchQuery, roleFilter, statusFilter, categoryFilter]);

  const handleInspectUser = async (user: any) => {
    setSelectedUserForInspection(user);
    setLoadingUserInspection(true);
    try {
      const token = getAccessToken();
      const [presRes, filesRes] = await Promise.all([
        fetch(`${API_URL}/api/admin/users/${user._id}/presentations`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${API_URL}/api/admin/users/${user._id}/files`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      if (presRes.ok) setUserPresentations(await presRes.json());
      if (filesRes.ok) setUserFiles(await filesRes.json());
    } catch (err) {
      console.error("Error inspecting user:", err);
    } finally {
      setLoadingUserInspection(false);
    }
  };

  const handleInspectOrg = async (orgId: string) => {
    setLoadingOrgDetails(true);
    try {
      const token = getAccessToken();
      const res = await fetch(`${API_URL}/api/admin/organizations/${orgId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setSelectedOrgDetails(await res.json());
      }
    } catch (err) {
      console.error("Error fetching org details:", err);
    } finally {
      setLoadingOrgDetails(false);
    }
  };

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
      console.error("Role update error:", err);
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
      console.error("Block toggle error:", err);
    }
  };

  const handleDeleteUserAdmin = async (userId: string, email: string) => {
    if (!confirm(`Are you sure you want to permanently delete user ${email}?`))
      return;
    try {
      const token = getAccessToken();
      const res = await fetch(`${API_URL}/api/admin/users/${userId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setUsers((prev) => prev.filter((u) => u._id !== userId));
      } else {
        const data = await res.json();
        alert(data.message || "Failed to delete user");
      }
    } catch (err) {
      console.error("Delete user error:", err);
    }
  };

  const handleViewPresentationParticipants = async (p: any) => {
    setSelectedPresentationForParticipants(p);
    setLoadingParticipants(true);
    setPresentationParticipantsData(null);
    setParticipantSearchQuery("");
    try {
      const token = getAccessToken();
      const res = await fetch(
        `${API_URL}/api/admin/presentations/${p._id}/participants`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      if (res.ok) {
        const data = await res.json();
        setPresentationParticipantsData(data);
      }
    } catch (err) {
      console.error("Error fetching presentation participants:", err);
    } finally {
      setLoadingParticipants(false);
    }
  };

  const handleBlockPresentationAdmin = async (
    id: string,
    title: string,
    isBlocked: boolean,
  ) => {
    if (
      !confirm(
        `Are you sure you want to ${isBlocked ? "block" : "unblock"} presentation "${title}"?`,
      )
    )
      return;
    try {
      const token = getAccessToken();
      const res = await fetch(
        `${API_URL}/api/admin/presentations/${id}/block`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ isBlocked }),
        },
      );
      if (res.ok) {
        setPresentations((prev) =>
          prev.map((p) => (p._id === id ? { ...p, isBlocked } : p)),
        );
        setUserPresentations((prev) =>
          prev.map((p) => (p._id === id ? { ...p, isBlocked } : p)),
        );
      } else {
        const data = await res.json();
        alert(data.message || "Failed to block presentation");
      }
    } catch (err) {
      console.error("Block presentation error:", err);
    }
  };

  const handleDeleteFileAdmin = async (id: string, originalName: string) => {
    if (
      !confirm(
        `Are you sure you want to permanently delete file "${originalName}"?`,
      )
    )
      return;
    try {
      const token = getAccessToken();
      const res = await fetch(`${API_URL}/api/admin/files/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setFiles((prev) => prev.filter((f) => f._id !== id));
        setUserFiles((prev) => prev.filter((f) => f._id !== id));
      } else {
        const data = await res.json();
        alert(data.message || "Failed to delete file");
      }
    } catch (err) {
      console.error("Delete file error:", err);
    }
  };

  const handleSendNotificationAdmin = () => {
    setShowNotificationModal(true);
  };

  const handleDeletePresentationAdmin = async (id: string, title: string) => {
    if (
      !confirm(
        `Are you sure you want to permanently delete presentation "${title}" as admin?`,
      )
    )
      return;
    try {
      const token = getAccessToken();
      const res = await fetch(`${API_URL}/api/admin/presentations/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setPresentations((prev) => prev.filter((p) => p._id !== id));
        setUserPresentations((prev) => prev.filter((p) => p._id !== id));
      } else {
        const data = await res.json();
        alert(data.message || "Failed to delete presentation");
      }
    } catch (err) {
      console.error("Admin delete presentation error:", err);
    }
  };

  const handleTerminateSession = async (sessionId: string) => {
    if (
      !confirm("Are you sure you want to forcibly terminate this live session?")
    )
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
      console.error("Terminate session error:", err);
    }
  };

  if (error) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex items-center justify-center p-4">
        <div className="bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 p-6 rounded-3xl max-w-md w-full text-center text-red-700 dark:text-red-300">
          <ShieldAlert className="w-12 h-12 mx-auto mb-3 text-red-500" />
          <h3 className="font-bold text-lg">
            Administrative Access Restricted
          </h3>
          <p className="text-sm mt-1">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50/50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 p-6 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2 text-zinc-950 dark:text-white tracking-tight">
              🛡️ Admin Console & System Governance
            </h1>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
              Platform administration, user controls, global presentations,
              knowledge base, and organization management.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleSendNotificationAdmin}
              className="px-4 py-2 bg-zinc-950 hover:bg-zinc-800 text-white dark:bg-white dark:hover:bg-zinc-200 dark:text-zinc-950 rounded-xl text-xs font-bold flex items-center gap-2 transition-transform active:scale-95"
            >
              <Radio className="w-4 h-4" /> Broadcast Notice
            </button>
            <button
              onClick={() => {
                fetchDashboardData();
                if (activeTab === "users") fetchUsers();
                if (activeTab === "presentations") fetchPresentations();
                if (activeTab === "files") fetchFiles();
                if (activeTab === "organizations") fetchOrganizations();
                if (activeTab === "sessions") fetchSessions();
              }}
              className="p-2.5 text-zinc-500 hover:text-zinc-950 dark:hover:text-white bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl"
              title="Refresh Data"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 border-b border-zinc-200 dark:border-zinc-800 pb-3">
          {[
            { id: "overview", label: "Overview", icon: Activity },
            { id: "users", label: "Users", icon: Users },
            {
              id: "presentations",
              label: "All Presentations",
              icon: Presentation,
            },
            { id: "files", label: "Knowledge Base", icon: FileText },
            { id: "organizations", label: "Organizations", icon: Building2 },
            { id: "sessions", label: "Live Sessions", icon: Radio },
            { id: "ai", label: "AI Usage", icon: Cpu },
            { id: "audit", label: "Audit Logs", icon: FileSpreadsheet },
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id as any);
                  setSearchQuery("");
                }}
                className={`px-3.5 py-2 rounded-xl font-bold text-xs transition-all flex items-center gap-2 ${
                  activeTab === tab.id
                    ? "bg-zinc-950 dark:bg-white text-white dark:text-zinc-950"
                    : "bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-zinc-800"
                }`}
              >
                <Icon className="w-3.5 h-3.5" /> {tab.label}
              </button>
            );
          })}
        </div>

        {activeTab === "overview" && (
          <div className="space-y-6">
            {loading ? (
              <div className="flex justify-center py-20">
                <Loader2 className="w-8 h-8 animate-spin text-zinc-950 dark:text-white" />
              </div>
            ) : (
              dashboardData && (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
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
                      icon={Users}
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
                      sub="Total decks"
                      icon={Presentation}
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
                      sub="Knowledge base"
                      icon={FileText}
                    />
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="bg-white dark:bg-zinc-900/80 border border-zinc-200/80 dark:border-zinc-800/80 rounded-3xl p-6 shadow-sm">
                      <h3 className="text-base font-bold flex items-center gap-2 mb-4 text-zinc-950 dark:text-white">
                        <Cpu className="w-5 h-5 text-zinc-900 dark:text-white" />{" "}
                        AI System Health & Telemetry
                      </h3>
                      <div className="space-y-4">
                        <div className="flex justify-between items-center py-2 border-b border-zinc-100 dark:border-zinc-800">
                          <span className="text-xs text-zinc-500">
                            Default Model Engine
                          </span>
                          <span className="text-xs font-bold font-mono">
                            Gemini Flash Lite
                          </span>
                        </div>
                        <div className="flex justify-between items-center py-2 border-b border-zinc-100 dark:border-zinc-800">
                          <span className="text-xs text-zinc-500">
                            30-Day Total AI Requests
                          </span>
                          <span className="text-xs font-bold font-mono">
                            {dashboardData.aiUsage.totalRequests}
                          </span>
                        </div>
                        <div className="flex justify-between items-center py-2 border-b border-zinc-100 dark:border-zinc-800">
                          <span className="text-xs text-zinc-500">
                            Total Tokens Processed
                          </span>
                          <span className="text-xs font-bold font-mono">
                            {dashboardData.aiUsage.totalTokens.toLocaleString()}
                          </span>
                        </div>
                        <div className="flex justify-between items-center py-2">
                          <span className="text-xs text-zinc-500">
                            Average Generation Latency
                          </span>
                          <span className="text-xs font-bold font-mono">
                            {dashboardData.aiUsage.avgLatencyMs} ms
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="bg-white dark:bg-zinc-900/80 border border-zinc-200/80 dark:border-zinc-800/80 rounded-3xl p-6 shadow-sm flex flex-col justify-between">
                      <div>
                        <h3 className="text-base font-bold flex items-center gap-2 mb-4 text-zinc-950 dark:text-white">
                          <Activity className="w-5 h-5 text-zinc-900 dark:text-white" />{" "}
                          Quick Administrative Actions
                        </h3>
                        <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-6">
                          Inspect user accounts, manage organizations, and audit
                          content from dedicated management tabs.
                        </p>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <button
                          onClick={() => setActiveTab("users")}
                          className="p-3 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 rounded-2xl text-xs font-bold text-left transition-all border border-zinc-200 dark:border-zinc-700"
                        >
                          <Users className="w-4 h-4 mb-2 text-zinc-900 dark:text-white" />
                          View All Users
                        </button>
                        <button
                          onClick={() => setActiveTab("organizations")}
                          className="p-3 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 rounded-2xl text-xs font-bold text-left transition-all border border-zinc-200 dark:border-zinc-700"
                        >
                          <Building2 className="w-4 h-4 mb-2 text-zinc-900 dark:text-white" />
                          Manage Organizations
                        </button>
                      </div>
                    </div>
                  </div>
                </>
              )
            )}
          </div>
        )}

        {activeTab === "users" && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                <input
                  type="text"
                  placeholder="Search users by name or email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs outline-none"
                />
              </div>
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="px-3 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs outline-none"
              >
                <option value="">All Roles</option>
                <option value="admin">Admin</option>
                <option value="presenter">Presenter</option>
                <option value="participant">Participant</option>
              </select>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs outline-none"
              >
                <option value="">All Statuses</option>
                <option value="active">Active</option>
                <option value="blocked">Blocked</option>
              </select>
            </div>
            <div className="bg-white dark:bg-zinc-900/80 border border-zinc-200/80 dark:border-zinc-800/80 rounded-3xl overflow-hidden shadow-sm">
              <table className="w-full text-left text-xs">
                <thead className="bg-zinc-100/70 dark:bg-zinc-800/50 border-b border-zinc-200/80 dark:border-zinc-800/80 uppercase font-bold text-zinc-500">
                  <tr>
                    <th className="px-6 py-3.5">User</th>
                    <th className="px-6 py-3.5">Role</th>
                    <th className="px-6 py-3.5 text-center">Decks</th>
                    <th className="px-6 py-3.5 text-center">Files</th>
                    <th className="px-6 py-3.5">Status</th>
                    <th className="px-6 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/80">
                  {users.map((u) => (
                    <tr
                      key={u._id}
                      className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30"
                    >
                      <td className="px-6 py-4">
                        <div className="font-bold text-zinc-950 dark:text-white">
                          {u.name}
                        </div>
                        <div className="text-[11px] text-zinc-400 font-mono">
                          {u.email}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <select
                          value={u.role}
                          onChange={(e) =>
                            handleRoleChange(u._id, e.target.value)
                          }
                          className="bg-zinc-100 dark:bg-zinc-800 rounded-lg px-2 py-1 text-xs font-bold outline-none cursor-pointer"
                        >
                          <option value="admin">admin</option>
                          <option value="presenter">presenter</option>
                          <option value="participant">participant</option>
                        </select>
                      </td>
                      <td className="px-6 py-4 text-center font-bold">
                        {u.presentationsCount || 0}
                      </td>
                      <td className="px-6 py-4 text-center font-bold">
                        {u.filesCount || 0}
                      </td>
                      <td className="px-6 py-4">
                        {u.isBlocked ? (
                          <span className="px-2.5 py-0.5 bg-red-100 text-red-600 border border-red-200 text-[10px] font-bold rounded-full">
                            Blocked
                          </span>
                        ) : (
                          <span className="px-2.5 py-0.5 bg-emerald-100 text-emerald-600 border border-emerald-200 text-[10px] font-bold rounded-full">
                            Active
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right space-x-2">
                        <button
                          onClick={() => handleInspectUser(u)}
                          className="px-3 py-1.5 bg-zinc-950 text-white dark:bg-white dark:text-zinc-950 rounded-xl font-bold text-xs inline-flex items-center gap-1.5"
                        >
                          <Eye className="w-3.5 h-3.5" /> Inspect
                        </button>
                        <button
                          onClick={() => handleToggleBlock(u._id, u.isBlocked)}
                          className={`p-1.5 rounded-xl border ${u.isBlocked ? "bg-emerald-50 text-emerald-600 border-emerald-200" : "bg-red-50 text-red-600 border-red-200"}`}
                          title={u.isBlocked ? "Unblock User" : "Block User"}
                        >
                          {u.isBlocked ? (
                            <Unlock className="w-3.5 h-3.5" />
                          ) : (
                            <Lock className="w-3.5 h-3.5" />
                          )}
                        </button>
                        <button
                          onClick={() => handleDeleteUserAdmin(u._id, u.email)}
                          className="p-1.5 rounded-xl border border-red-200 bg-red-50 text-red-600 hover:bg-red-100 transition-colors"
                          title="Delete User"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 3: ALL PRESENTATIONS */}
        {activeTab === "presentations" && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                <input
                  type="text"
                  placeholder="Search presentations across platform..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs outline-none"
                />
              </div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs outline-none"
              >
                <option value="">All Statuses</option>
                <option value="draft">Draft</option>
                <option value="published">Published</option>
                <option value="live">Live</option>
              </select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {presentations.map((p) => (
                <div
                  key={p._id}
                  className="bg-white dark:bg-zinc-900/80 border border-zinc-200/80 dark:border-zinc-800/80 rounded-3xl p-5 shadow-sm hover-lift flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <span className="px-2.5 py-0.5 bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700 text-[10px] font-bold rounded-full uppercase">
                        {p.status}
                      </span>
                      {p.organization && (
                        <span className="text-[10px] font-bold text-zinc-500 bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded-lg border border-zinc-200 dark:border-zinc-700">
                          🏢 {p.organization.name}
                        </span>
                      )}
                    </div>

                    <h4
                      className="font-bold text-zinc-950 dark:text-white text-sm line-clamp-1"
                      title={p.title}
                    >
                      {p.title}
                    </h4>
                    <p className="text-xs text-zinc-400 mt-1 line-clamp-2 min-h-8">
                      {p.description || "No description provided."}
                    </p>

                    <div className="mt-4 pt-3 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between text-xs text-zinc-400">
                      <span>
                        Owner:{" "}
                        <strong className="text-zinc-700 dark:text-zinc-300">
                          {p.owner?.name || "User"}
                        </strong>
                      </span>
                      <span>{new Date(p.updatedAt).toLocaleDateString()}</span>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <Link
                        href={`/presentations/${p._id}/edit`}
                        className="px-3 py-1.5 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-900 dark:text-zinc-100 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all border border-zinc-200 dark:border-zinc-700 active-press"
                      >
                        <ExternalLink className="w-3.5 h-3.5" /> Open
                      </Link>
                      <button
                        onClick={() => handleViewPresentationParticipants(p)}
                        className="px-3 py-1.5 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-900 dark:text-zinc-100 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all border border-zinc-200 dark:border-zinc-700 cursor-pointer active-press"
                        title="View presentation participants and attendance"
                      >
                        <Users className="w-3.5 h-3.5" /> Participants
                      </button>
                    </div>
                    <div className="flex gap-1">
                      <button
                        onClick={() =>
                          handleBlockPresentationAdmin(
                            p._id,
                            p.title,
                            !p.isBlocked,
                          )
                        }
                        className={`p-2 rounded-xl transition-colors cursor-pointer ${
                          p.isBlocked
                            ? "text-emerald-600 hover:bg-emerald-50 bg-emerald-50/50"
                            : "text-amber-500 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/40"
                        }`}
                        title={
                          p.isBlocked
                            ? "Unblock Presentation"
                            : "Block Presentation"
                        }
                      >
                        {p.isBlocked ? (
                          <CheckCircle2 className="w-4 h-4" />
                        ) : (
                          <Lock className="w-4 h-4" />
                        )}
                      </button>
                      <button
                        onClick={() =>
                          handleDeletePresentationAdmin(p._id, p.title)
                        }
                        className="p-2 text-zinc-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-xl transition-colors cursor-pointer"
                        title="Delete Presentation as Admin"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 4: KNOWLEDGE BASE (ALL FILES) */}
        {activeTab === "files" && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                <input
                  type="text"
                  placeholder="Search files across platform..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs outline-none"
                />
              </div>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="px-3 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs outline-none"
              >
                <option value="all">All Categories</option>
                <option value="document">Documents (PDF/Word)</option>
                <option value="presentation">Presentations (PPTX)</option>
                <option value="image">Images</option>
              </select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {files.map((file) => (
                <div
                  key={file._id}
                  className="bg-white dark:bg-zinc-900/80 border border-zinc-200/80 dark:border-zinc-800/80 rounded-3xl p-5 shadow-sm hover-lift flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <span className="px-2.5 py-0.5 bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700 text-[10px] font-bold rounded-full uppercase">
                        {file.category}
                      </span>
                      <span className="text-[10px] text-zinc-400 font-mono">
                        {(file.size / (1024 * 1024)).toFixed(2)} MB
                      </span>
                    </div>

                    <h4
                      className="font-bold text-zinc-950 dark:text-white text-sm line-clamp-1"
                      title={file.originalName}
                    >
                      {file.originalName}
                    </h4>

                    {file.extractedMetadata?.wordCount ? (
                      <div className="mt-3 text-xs text-zinc-700 dark:text-zinc-300 bg-zinc-100 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700/60 px-2.5 py-1 rounded-xl w-fit flex items-center gap-1.5 font-medium">
                        <Sparkles className="w-3 h-3 text-amber-500" />{" "}
                        Extracted {file.extractedMetadata.wordCount} words
                      </div>
                    ) : null}

                    <div className="mt-4 pt-3 border-t border-zinc-100 dark:border-zinc-800 text-xs text-zinc-400">
                      Uploaded by:{" "}
                      <strong className="text-zinc-700 dark:text-zinc-300">
                        {file.owner?.name || "User"}
                      </strong>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
                    <div className="flex gap-2">
                      {file.extractedText && (
                        <button
                          onClick={() => setPreviewFile(file)}
                          className="px-3 py-1.5 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-900 dark:text-zinc-100 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all border border-zinc-200 dark:border-zinc-700 cursor-pointer active-press"
                        >
                          <Eye className="w-3.5 h-3.5" /> View Text
                        </button>
                      )}
                      {file.fileUrl && (
                        <a
                          href={file.fileUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="px-3 py-1.5 bg-zinc-950 hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-200 text-white dark:text-zinc-950 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all active-press"
                        >
                          <Download className="w-3.5 h-3.5" />
                        </a>
                      )}
                      <button
                        onClick={() =>
                          handleDeleteFileAdmin(file._id, file.originalName)
                        }
                        className="px-3 py-1.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 border border-red-200 dark:border-red-900/50 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all active-press"
                        title="Delete File"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 5: ORGANIZATIONS */}
        {activeTab === "organizations" && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {organizations.map((org) => (
                <div
                  key={org._id}
                  className="bg-white dark:bg-zinc-900/80 border border-zinc-200/80 dark:border-zinc-800/80 rounded-3xl p-6 shadow-sm hover-lift flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 rounded-2xl bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 flex items-center justify-center font-bold text-sm text-zinc-950 dark:text-white">
                        {org.name.charAt(0)}
                      </div>
                      <div>
                        <h4 className="font-bold text-zinc-950 dark:text-white text-base">
                          {org.name}
                        </h4>
                        <p className="text-[11px] text-zinc-400 font-mono">
                          slug: {org.slug}
                        </p>
                      </div>
                    </div>

                    <p className="text-xs text-zinc-500 dark:text-zinc-400 line-clamp-2 mb-4">
                      {org.description ||
                        "No organization description provided."}
                    </p>

                    <div className="grid grid-cols-2 gap-2 py-3 border-y border-zinc-100 dark:border-zinc-800 text-xs">
                      <div>
                        <span className="text-zinc-400 block text-[11px]">
                          Members
                        </span>
                        <strong className="text-zinc-900 dark:text-white text-sm font-mono">
                          {org.memberCount || 0}
                        </strong>
                      </div>
                      <div>
                        <span className="text-zinc-400 block text-[11px]">
                          Presentations
                        </span>
                        <strong className="text-zinc-900 dark:text-white text-sm font-mono">
                          {org.presentationCount || 0}
                        </strong>
                      </div>
                    </div>
                  </div>

                  <div className="mt-5 pt-3">
                    <button
                      onClick={() => handleInspectOrg(org._id)}
                      className="w-full px-3.5 py-2 bg-zinc-950 hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-200 text-white dark:text-zinc-950 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs transition-all active-press cursor-pointer"
                    >
                      <Building2 className="w-3.5 h-3.5" /> Inspect Members &
                      Presentations
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 6: SESSIONS */}
        {activeTab === "sessions" && (
          <div className="space-y-4">
            <div className="bg-white dark:bg-zinc-900/80 border border-zinc-200/80 dark:border-zinc-800/80 rounded-3xl overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-zinc-100/70 dark:bg-zinc-800/50 border-b border-zinc-200/80 dark:border-zinc-800/80 uppercase font-bold text-zinc-500">
                    <tr>
                      <th className="px-6 py-3.5">Join Code</th>
                      <th className="px-6 py-3.5">Presentation</th>
                      <th className="px-6 py-3.5">Status</th>
                      <th className="px-6 py-3.5">Participants</th>
                      <th className="px-6 py-3.5">Started At</th>
                      <th className="px-6 py-3.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/80">
                    {sessions.map((s) => (
                      <tr
                        key={s._id}
                        className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30 transition-colors"
                      >
                        <td className="px-6 py-4 font-mono font-bold text-zinc-950 dark:text-white">
                          {s.joinCode}
                        </td>
                        <td className="px-6 py-4 font-medium text-zinc-800 dark:text-zinc-200">
                          {s.presentationId?.title || "Untitled Presentation"}
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase border ${
                              s.status === "live"
                                ? "bg-emerald-100 text-emerald-600 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-400 dark:border-emerald-800"
                                : "bg-zinc-100 text-zinc-600 border-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:border-zinc-700"
                            }`}
                          >
                            {s.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 font-mono">
                          {s.activeParticipantsCount || 0}
                        </td>
                        <td className="px-6 py-4 text-zinc-400">
                          {new Date(s.createdAt).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </td>
                        <td className="px-6 py-4 text-right">
                          {s.status === "live" && (
                            <button
                              onClick={() => handleTerminateSession(s._id)}
                              className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 ml-auto transition-colors"
                            >
                              <PowerOff className="w-3 h-3" /> Terminate
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 7: AI USAGE */}
        {activeTab === "ai" && aiUsage && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <MetricCard
                title="Total Requests (30d)"
                value={aiUsage.logs?.length || 0}
                sub="Logged generations"
                icon={Cpu}
              />
              <MetricCard
                title="Models Deployed"
                value={aiUsage.summaryByModel?.length || 1}
                sub="Active inference routes"
                icon={Sparkles}
              />
              <MetricCard
                title="Telemetry Status"
                value="ONLINE"
                sub="Real-time capture"
                icon={CheckCircle2}
                color="text-emerald-500"
              />
            </div>

            <div className="bg-white dark:bg-zinc-900/80 border border-zinc-200/80 dark:border-zinc-800/80 rounded-3xl overflow-hidden shadow-sm">
              <div className="p-5 border-b border-zinc-100 dark:border-zinc-800 font-bold text-sm">
                Recent AI Generation Logs
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-zinc-100/70 dark:bg-zinc-800/50 border-b border-zinc-200/80 dark:border-zinc-800/80 uppercase font-bold text-zinc-500">
                    <tr>
                      <th className="px-6 py-3.5">Model</th>
                      <th className="px-6 py-3.5">Task / Action</th>
                      <th className="px-6 py-3.5 text-center">Tokens</th>
                      <th className="px-6 py-3.5 text-center">Latency</th>
                      <th className="px-6 py-3.5">Status</th>
                      <th className="px-6 py-3.5">Time</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/80">
                    {aiUsage.logs?.slice(0, 30).map((log: any) => (
                      <tr
                        key={log._id}
                        className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30 transition-colors"
                      >
                        <td className="px-6 py-4 font-mono font-bold">
                          {log.modelName}
                        </td>
                        <td className="px-6 py-4 text-zinc-700 dark:text-zinc-300 font-medium">
                          {log.taskType || "Generate Slides"}
                        </td>
                        <td className="px-6 py-4 text-center font-mono">
                          {log.totalTokens || 0}
                        </td>
                        <td className="px-6 py-4 text-center font-mono">
                          {log.latencyMs || 0} ms
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                              log.status === "error"
                                ? "bg-red-100 text-red-600 dark:bg-red-950 dark:text-red-400"
                                : "bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400"
                            }`}
                          >
                            {log.status || "success"}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-zinc-400">
                          {new Date(log.createdAt).toLocaleTimeString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 8: AUDIT LOGS */}
        {activeTab === "audit" && (
          <div className="bg-white dark:bg-zinc-900/80 border border-zinc-200/80 dark:border-zinc-800/80 rounded-3xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-zinc-100/70 dark:bg-zinc-800/50 border-b border-zinc-200/80 dark:border-zinc-800/80 uppercase font-bold text-zinc-500">
                  <tr>
                    <th className="px-6 py-3.5">Admin</th>
                    <th className="px-6 py-3.5">Action</th>
                    <th className="px-6 py-3.5">Target</th>
                    <th className="px-6 py-3.5">Timestamp</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/80">
                  {auditLogs.map((log) => (
                    <tr
                      key={log._id}
                      className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30 transition-colors"
                    >
                      <td className="px-6 py-4 font-bold">
                        {log.user?.name || "Admin"}
                      </td>
                      <td className="px-6 py-4 font-mono text-zinc-700 dark:text-zinc-300 font-medium">
                        {log.action}
                      </td>
                      <td className="px-6 py-4 font-mono text-zinc-500">
                        {log.target || "-"}
                      </td>
                      <td className="px-6 py-4 text-zinc-400">
                        {new Date(log.createdAt).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* USER INSPECTION MODAL */}
      {selectedUserForInspection && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl max-w-3xl w-full p-6 shadow-2xl relative animate-scale-in max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between pb-4 border-b border-zinc-100 dark:border-zinc-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-zinc-200 dark:bg-zinc-800 text-zinc-900 dark:text-white flex items-center justify-center font-bold text-sm">
                  {selectedUserForInspection.name?.charAt(0) || "U"}
                </div>
                <div>
                  <h3 className="text-base font-bold text-zinc-950 dark:text-white">
                    {selectedUserForInspection.name}
                  </h3>
                  <p className="text-xs text-zinc-400 font-mono">
                    {selectedUserForInspection.email} • Role:{" "}
                    {selectedUserForInspection.role}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setSelectedUserForInspection(null)}
                className="p-1.5 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Inspection Sub-Tabs */}
            <div className="flex gap-2 my-4">
              <button
                onClick={() => setUserInspectionTab("presentations")}
                className={`px-3.5 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer ${
                  userInspectionTab === "presentations"
                    ? "bg-zinc-950 dark:bg-white text-white dark:text-zinc-950"
                    : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400"
                }`}
              >
                <Presentation className="w-3.5 h-3.5" /> Presentations (
                {userPresentations.length})
              </button>
              <button
                onClick={() => setUserInspectionTab("files")}
                className={`px-3.5 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer ${
                  userInspectionTab === "files"
                    ? "bg-zinc-950 dark:bg-white text-white dark:text-zinc-950"
                    : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400"
                }`}
              >
                <FileText className="w-3.5 h-3.5" /> Knowledge Base Files (
                {userFiles.length})
              </button>
            </div>

            {/* Content List */}
            <div className="flex-1 overflow-y-auto space-y-3 pr-1">
              {loadingUserInspection ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="w-6 h-6 animate-spin text-zinc-500" />
                </div>
              ) : userInspectionTab === "presentations" ? (
                userPresentations.length === 0 ? (
                  <p className="text-center text-xs text-zinc-400 py-8">
                    This user has not created any presentations.
                  </p>
                ) : (
                  userPresentations.map((p) => (
                    <div
                      key={p._id}
                      className="p-3.5 bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200/80 dark:border-zinc-700/60 rounded-2xl flex items-center justify-between gap-3"
                    >
                      <div>
                        <div className="font-bold text-xs text-zinc-950 dark:text-white line-clamp-1">
                          {p.title}
                        </div>
                        <div className="text-[11px] text-zinc-400 mt-0.5">
                          Status:{" "}
                          <strong className="uppercase">{p.status}</strong> •
                          Updated: {new Date(p.updatedAt).toLocaleDateString()}
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <Link
                          href={`/presentations/${p._id}/edit`}
                          className="px-2.5 py-1 bg-zinc-950 hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-200 text-white dark:text-zinc-950 rounded-lg text-xs font-bold flex items-center gap-1"
                        >
                          <ExternalLink className="w-3 h-3" /> Open
                        </Link>
                        <button
                          onClick={() => handleViewPresentationParticipants(p)}
                          className="px-2.5 py-1 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-900 dark:text-zinc-100 rounded-lg text-xs font-bold flex items-center gap-1 border border-zinc-200 dark:border-zinc-700 cursor-pointer"
                          title="View participants"
                        >
                          <Users className="w-3 h-3" /> Participants
                        </button>
                        <button
                          onClick={() =>
                            handleDeletePresentationAdmin(p._id, p.title)
                          }
                          className="p-1.5 text-zinc-400 hover:text-red-500 transition-colors cursor-pointer"
                          title="Delete as Admin"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))
                )
              ) : userFiles.length === 0 ? (
                <p className="text-center text-xs text-zinc-400 py-8">
                  This user has not uploaded any files to the Knowledge Base.
                </p>
              ) : (
                userFiles.map((file) => (
                  <div
                    key={file._id}
                    className="p-3.5 bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200/80 dark:border-zinc-700/60 rounded-2xl flex items-center justify-between gap-3"
                  >
                    <div>
                      <div className="font-bold text-xs text-zinc-950 dark:text-white line-clamp-1">
                        {file.originalName}
                      </div>
                      <div className="text-[11px] text-zinc-400 mt-0.5">
                        Category:{" "}
                        <strong className="uppercase">{file.category}</strong> •
                        Size: {(file.size / (1024 * 1024)).toFixed(2)} MB
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {file.extractedText && (
                        <button
                          onClick={() => setPreviewFile(file)}
                          className="px-2.5 py-1 bg-zinc-200 dark:bg-zinc-700 hover:bg-zinc-300 dark:hover:bg-zinc-600 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer"
                        >
                          <Eye className="w-3 h-3" /> Text
                        </button>
                      )}
                      {file.fileUrl && (
                        <a
                          href={file.fileUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="px-2.5 py-1 bg-zinc-950 hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-200 text-white dark:text-zinc-950 rounded-lg text-xs font-bold flex items-center gap-1"
                        >
                          <Download className="w-3 h-3" /> File
                        </a>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* ORGANIZATION INSPECTION MODAL */}
      {selectedOrgDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl max-w-3xl w-full p-6 shadow-2xl relative animate-scale-in max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between pb-4 border-b border-zinc-100 dark:border-zinc-800">
              <div>
                <h3 className="text-base font-bold text-zinc-950 dark:text-white flex items-center gap-2">
                  🏢 {selectedOrgDetails.organization.name}
                </h3>
                <p className="text-xs text-zinc-400 font-mono">
                  Owner: {selectedOrgDetails.organization.owner?.name} (
                  {selectedOrgDetails.organization.owner?.email})
                </p>
              </div>

              <button
                onClick={() => setSelectedOrgDetails(null)}
                className="p-1.5 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-6 pt-4 pr-1">
              {/* Member Roster */}
              <div>
                <h4 className="font-bold text-xs uppercase tracking-wider text-zinc-500 mb-3">
                  Organization Members ({selectedOrgDetails.members.length})
                </h4>
                <div className="bg-zinc-50 dark:bg-zinc-800/40 rounded-2xl border border-zinc-200/80 dark:border-zinc-700/60 divide-y divide-zinc-200/60 dark:divide-zinc-700/60">
                  {selectedOrgDetails.members.map((m: any) => (
                    <div
                      key={m._id}
                      className="p-3 flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-full bg-zinc-200 dark:bg-zinc-700 text-zinc-900 dark:text-white flex items-center justify-center font-bold text-[11px]">
                          {m.user?.name?.charAt(0) || "U"}
                        </div>
                        <div>
                          <div className="font-bold text-zinc-950 dark:text-white">
                            {m.user?.name}
                          </div>
                          <div className="text-[10px] text-zinc-400 font-mono">
                            {m.user?.email}
                          </div>
                        </div>
                      </div>
                      <span className="px-2 py-0.5 bg-zinc-200 dark:bg-zinc-700 text-zinc-800 dark:text-zinc-200 text-[10px] font-bold rounded-md uppercase font-mono">
                        {m.role}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Organization Presentations */}
              <div>
                <h4 className="font-bold text-xs uppercase tracking-wider text-zinc-500 mb-3">
                  Shared Presentations (
                  {selectedOrgDetails.presentations.length})
                </h4>
                <div className="space-y-2">
                  {selectedOrgDetails.presentations.length === 0 ? (
                    <p className="text-xs text-zinc-400">
                      No presentations shared in this organization yet.
                    </p>
                  ) : (
                    selectedOrgDetails.presentations.map((p: any) => (
                      <div
                        key={p._id}
                        className="p-3 bg-zinc-50 dark:bg-zinc-800/40 rounded-2xl border border-zinc-200/80 dark:border-zinc-700/60 flex items-center justify-between"
                      >
                        <div>
                          <div className="font-bold text-xs text-zinc-950 dark:text-white">
                            {p.title}
                          </div>
                          <div className="text-[10px] text-zinc-400">
                            Creator: {p.owner?.name} • Status: {p.status}
                          </div>
                        </div>
                        <Link
                          href={`/presentations/${p._id}/edit`}
                          className="px-2.5 py-1 bg-zinc-950 hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-200 text-white dark:text-zinc-950 rounded-lg text-xs font-bold flex items-center gap-1"
                        >
                          <ExternalLink className="w-3 h-3" /> Open
                        </Link>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TEXT PREVIEW DRAWER / MODAL */}
      {previewFile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl max-w-2xl w-full p-6 shadow-2xl relative animate-scale-in max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-100 dark:border-zinc-800">
              <h3 className="text-sm font-bold text-zinc-950 dark:text-white truncate pr-4">
                📄 {previewFile.originalName}
              </h3>
              <button
                onClick={() => setPreviewFile(null)}
                className="p-1 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto mt-4 p-4 bg-zinc-50 dark:bg-zinc-950 rounded-2xl font-mono text-xs text-zinc-800 dark:text-zinc-200 whitespace-pre-wrap leading-relaxed border border-zinc-200/60 dark:border-zinc-800/60">
              {previewFile.extractedText || "No text content available."}
            </div>
          </div>
        </div>
      )}

      {/* Notification Modal */}
      {showNotificationModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 rounded-3xl p-6 w-full max-w-lg shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h4 className="font-bold text-lg text-zinc-900 dark:text-white flex items-center gap-2">
                <Radio className="w-5 h-5 text-black dark:text-white" />
                Broadcast Notification
              </h4>
              <button
                onClick={() => setShowNotificationModal(false)}
                className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full"
              >
                <X className="w-5 h-5 text-zinc-500" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1.5">
                  Title
                </label>
                <input
                  type="text"
                  value={notificationForm.title}
                  onChange={(e) =>
                    setNotificationForm((prev) => ({
                      ...prev,
                      title: e.target.value,
                    }))
                  }
                  className="w-full bg-transparent border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white transition-shadow"
                  placeholder="Notification Subject"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1.5">
                  Message
                </label>
                <textarea
                  value={notificationForm.message}
                  onChange={(e) =>
                    setNotificationForm((prev) => ({
                      ...prev,
                      message: e.target.value,
                    }))
                  }
                  className="w-full bg-transparent border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-3 text-sm min-h-[120px] resize-y focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white transition-shadow"
                  placeholder="Enter your message here..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1.5">
                    Delivery Method
                  </label>
                  <select
                    value={notificationForm.deliveryMethod}
                    onChange={(e) =>
                      setNotificationForm((prev) => ({
                        ...prev,
                        deliveryMethod: e.target.value,
                      }))
                    }
                    className="w-full bg-transparent border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white transition-shadow appearance-none"
                  >
                    <option value="both">Portal + Email</option>
                    <option value="portal">Portal Only</option>
                    <option value="email">Email Only</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1.5">
                    Target Audience
                  </label>
                  <select
                    value={notificationForm.targetUsers}
                    onChange={(e) =>
                      setNotificationForm((prev) => ({
                        ...prev,
                        targetUsers: e.target.value,
                      }))
                    }
                    className="w-full bg-transparent border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white transition-shadow appearance-none"
                  >
                    <option value="ALL">All Users</option>
                    <option value="SPECIFIC">Specific Users (By ID)</option>
                  </select>
                </div>
              </div>

              {notificationForm.targetUsers === "ALL" && (
                <div>
                  <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1.5">
                    Filter by Role
                  </label>
                  <select
                    value={notificationForm.targetRole}
                    onChange={(e) =>
                      setNotificationForm((prev) => ({
                        ...prev,
                        targetRole: e.target.value,
                      }))
                    }
                    className="w-full bg-transparent border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white transition-shadow appearance-none"
                  >
                    <option value="ALL">Everyone</option>
                    <option value="presenter">Presenters Only</option>
                    <option value="participant">Participants Only</option>
                    <option value="admin">Admins Only</option>
                  </select>
                </div>
              )}

              {notificationForm.targetUsers === "SPECIFIC" && (
                <div>
                  <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1.5">
                    Select Users
                  </label>
                  <div className="w-full bg-transparent border border-zinc-200 dark:border-zinc-800 rounded-xl p-2 max-h-48 overflow-y-auto space-y-1">
                    {users.map((u) => (
                      <label
                        key={u._id}
                        className="flex items-center gap-3 p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg cursor-pointer transition-colors"
                      >
                        <input
                          type="checkbox"
                          className="w-4 h-4 rounded border-zinc-300 text-black focus:ring-black dark:border-zinc-700 dark:bg-zinc-900"
                          checked={notificationForm.specificUserIds.includes(
                            u._id,
                          )}
                          onChange={(e) => {
                            setNotificationForm((prev) => {
                              if (e.target.checked) {
                                return {
                                  ...prev,
                                  specificUserIds: [
                                    ...prev.specificUserIds,
                                    u._id,
                                  ],
                                };
                              } else {
                                return {
                                  ...prev,
                                  specificUserIds: prev.specificUserIds.filter(
                                    (id) => id !== u._id,
                                  ),
                                };
                              }
                            });
                          }}
                        />
                        <div className="flex flex-col">
                          <span className="text-sm font-bold text-zinc-900 dark:text-white">
                            {u.name}
                          </span>
                          <span className="text-xs text-zinc-500">
                            {u.email}
                          </span>
                        </div>
                      </label>
                    ))}
                    {users.length === 0 && (
                      <div className="p-2 text-xs text-zinc-500">
                        No users found
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setShowNotificationModal(false)}
                className="px-4 py-2 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl font-bold text-sm transition-colors"
                disabled={sendingNotification}
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  if (!notificationForm.title || !notificationForm.message) {
                    alert("Title and message are required.");
                    return;
                  }

                  setSendingNotification(true);
                  try {
                    const token = getAccessToken();

                    let targetUsersVal: any = "ALL";
                    if (notificationForm.targetUsers === "SPECIFIC") {
                      targetUsersVal = notificationForm.specificUserIds;
                      if (targetUsersVal.length === 0) {
                        alert("Please select at least one User");
                        setSendingNotification(false);
                        return;
                      }
                    }

                    const res = await fetch(
                      `${API_URL}/api/admin/notifications/send`,
                      {
                        method: "POST",
                        headers: {
                          "Content-Type": "application/json",
                          Authorization: `Bearer ${token}`,
                        },
                        body: JSON.stringify({
                          title: notificationForm.title,
                          message: notificationForm.message,
                          deliveryMethod: notificationForm.deliveryMethod,
                          targetUsers: targetUsersVal,
                          targetRole: notificationForm.targetRole,
                        }),
                      },
                    );

                    if (res.ok) {
                      const data = await res.json();
                      alert(data.message);
                      setShowNotificationModal(false);
                      setNotificationForm({
                        title: "",
                        message: "",
                        targetUsers: "ALL",
                        specificUserIds: [],
                        deliveryMethod: "both",
                        targetRole: "ALL",
                      });
                      // Only fetch if audit tab is active or just force a refresh
                      fetchDashboardData();
                    } else {
                      const data = await res.json();
                      alert(data.message || "Failed to send notification");
                    }
                  } catch (err) {
                    console.error("Send notification error:", err);
                    alert("An error occurred");
                  } finally {
                    setSendingNotification(false);
                  }
                }}
                className="px-6 py-2 bg-black hover:bg-zinc-800 text-white dark:bg-white dark:hover:bg-zinc-200 dark:text-black rounded-xl font-bold text-sm transition-colors flex items-center gap-2"
                disabled={sendingNotification}
              >
                {sendingNotification ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  "Send"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Presentation Participants Inspection Modal */}
      {selectedPresentationForParticipants && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-3xl w-full max-w-3xl p-6 shadow-2xl flex flex-col max-h-[85vh] animate-scale-up">
            <div className="flex items-start justify-between pb-4 border-b border-zinc-200 dark:border-zinc-800">
              <div>
                <div className="flex items-center gap-2">
                  <span className="p-1.5 bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white rounded-lg">
                    <Users className="w-4 h-4" />
                  </span>
                  <h3 className="text-lg font-bold text-zinc-950 dark:text-white">
                    Participants &amp; Attendance
                  </h3>
                </div>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                  Presentation:{" "}
                  <strong className="text-zinc-900 dark:text-white">
                    {selectedPresentationForParticipants.title}
                  </strong>{" "}
                  &bull; Owner:{" "}
                  {selectedPresentationForParticipants.owner?.name ||
                    "Presenter"}
                </p>
              </div>
              <button
                onClick={() => setSelectedPresentationForParticipants(null)}
                className="p-1.5 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-900 text-zinc-400 hover:text-zinc-950 dark:hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {loadingParticipants ? (
              <div className="flex flex-col items-center justify-center py-16 gap-3">
                <Loader2 className="w-8 h-8 animate-spin text-zinc-950 dark:text-white" />
                <p className="text-xs text-zinc-500">
                  Loading participant records...
                </p>
              </div>
            ) : presentationParticipantsData ? (
              <div className="flex flex-col flex-1 min-h-0 pt-4">
                {/* Metrics header */}
                <div className="grid grid-cols-3 gap-3 mb-4">
                  <div className="p-3 bg-zinc-50 dark:bg-zinc-900/60 rounded-2xl border border-zinc-200 dark:border-zinc-800">
                    <div className="text-[10px] font-bold text-zinc-500 uppercase">
                      Total Participants
                    </div>
                    <div className="text-lg font-bold font-mono text-zinc-900 dark:text-white mt-0.5">
                      {presentationParticipantsData.totalParticipants || 0}
                    </div>
                  </div>
                  <div className="p-3 bg-zinc-50 dark:bg-zinc-900/60 rounded-2xl border border-zinc-200 dark:border-zinc-800">
                    <div className="text-[10px] font-bold text-zinc-500 uppercase">
                      Sessions Hosted
                    </div>
                    <div className="text-lg font-bold font-mono text-zinc-900 dark:text-white mt-0.5">
                      {presentationParticipantsData.sessionsCount || 0}
                    </div>
                  </div>
                  <div className="p-3 bg-zinc-50 dark:bg-zinc-900/60 rounded-2xl border border-zinc-200 dark:border-zinc-800">
                    <div className="text-[10px] font-bold text-zinc-500 uppercase">
                      Current Status
                    </div>
                    <div className="text-xs font-bold uppercase mt-1">
                      <span className="px-2 py-0.5 rounded-full bg-zinc-200 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200">
                        {presentationParticipantsData.presentation?.status ||
                          "Draft"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Filter search bar */}
                <div className="mb-3 relative">
                  <Search className="w-4 h-4 absolute left-3 top-3 text-zinc-400" />
                  <input
                    type="text"
                    value={participantSearchQuery}
                    onChange={(e) => setParticipantSearchQuery(e.target.value)}
                    placeholder="Search by participant name, email or room code..."
                    className="w-full bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 rounded-xl pl-9 pr-4 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white transition-all text-zinc-900 dark:text-white"
                  />
                </div>

                {/* Scrollable list */}
                <div className="flex-1 overflow-y-auto space-y-2 pr-1">
                  {(() => {
                    const filtered = (
                      presentationParticipantsData.participants || []
                    ).filter(
                      (p: any) =>
                        p.displayName
                          ?.toLowerCase()
                          .includes(participantSearchQuery.toLowerCase()) ||
                        p.email
                          ?.toLowerCase()
                          .includes(participantSearchQuery.toLowerCase()) ||
                        p.joinCode
                          ?.toLowerCase()
                          .includes(participantSearchQuery.toLowerCase()),
                    );

                    if (filtered.length === 0) {
                      return (
                        <div className="text-center py-12 text-zinc-500">
                          <Users className="w-8 h-8 mx-auto opacity-30 mb-2" />
                          <p className="text-sm font-medium">
                            No participants found
                          </p>
                          <p className="text-xs text-zinc-400 mt-1">
                            Participants will be logged with their email
                            addresses once they join room sessions.
                          </p>
                        </div>
                      );
                    }

                    return filtered.map((p: any, idx: number) => (
                      <div
                        key={idx}
                        className="p-3.5 bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 rounded-2xl flex items-center justify-between gap-4 hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-9 h-9 rounded-xl bg-zinc-200 dark:bg-zinc-800 text-zinc-900 dark:text-white flex items-center justify-center font-bold text-sm shrink-0 font-mono">
                            {(p.displayName || "P").charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-sm text-zinc-900 dark:text-white truncate">
                                {p.displayName}
                              </span>
                              <span
                                className={`w-2 h-2 rounded-full shrink-0 ${
                                  p.isOnline
                                    ? "bg-emerald-400"
                                    : "bg-zinc-400 dark:bg-zinc-600"
                                }`}
                                title={p.isOnline ? "Online" : "Offline"}
                              />
                            </div>
                            <div className="flex items-center gap-1.5 text-xs text-zinc-500 dark:text-zinc-400 mt-0.5 truncate">
                              <Mail className="w-3 h-3 shrink-0" />
                              <span className="truncate font-medium text-zinc-700 dark:text-zinc-300">
                                {p.email}
                              </span>
                              {p.email && p.email !== "N/A" && (
                                <button
                                  onClick={() => {
                                    navigator.clipboard.writeText(p.email);
                                    setCopiedParticipantEmail(p.email);
                                    setTimeout(
                                      () => setCopiedParticipantEmail(null),
                                      1500,
                                    );
                                  }}
                                  className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 p-0.5 ml-0.5 cursor-pointer"
                                  title="Copy email"
                                >
                                  {copiedParticipantEmail === p.email ? (
                                    <Check className="w-3 h-3 text-emerald-500" />
                                  ) : (
                                    <Copy className="w-3 h-3" />
                                  )}
                                </button>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="text-right shrink-0 flex flex-col items-end gap-1">
                          <div className="flex items-center gap-1.5">
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-zinc-200 dark:bg-zinc-800 font-bold text-zinc-800 dark:text-zinc-200">
                              Room #{p.joinCode}
                            </span>
                            {p.score > 0 && (
                              <span className="text-[10px] font-bold text-amber-500">
                                {p.score} pts
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] text-zinc-400">
                            {p.joinedAt
                              ? new Date(p.joinedAt).toLocaleString([], {
                                  month: "short",
                                  day: "numeric",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })
                              : "Active"}
                          </span>
                        </div>
                      </div>
                    ));
                  })()}
                </div>
              </div>
            ) : (
              <div className="py-12 text-center text-xs text-zinc-500">
                Failed to load participant data.
              </div>
            )}

            <div className="mt-4 pt-3 border-t border-zinc-200 dark:border-zinc-800 flex justify-end">
              <button
                onClick={() => setSelectedPresentationForParticipants(null)}
                className="px-5 py-2 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-900 dark:text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function MetricCard({
  title,
  value,
  sub,
  icon: Icon,
  color = "text-zinc-900 dark:text-white",
}: {
  title: string;
  value: string | number;
  sub: string;
  icon: any;
  color?: string;
}) {
  return (
    <div className="bg-white dark:bg-zinc-900/80 border border-zinc-200/80 dark:border-zinc-800/80 rounded-3xl p-5 shadow-sm hover-lift">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider">
          {title}
        </span>
        <div className="p-2 bg-zinc-100 dark:bg-zinc-800 rounded-xl text-zinc-700 dark:text-zinc-300">
          <Icon className="w-4 h-4" />
        </div>
      </div>
      <div className={`text-2xl font-bold font-mono ${color}`}>{value}</div>
      <p className="text-[11px] text-zinc-400 mt-1">{sub}</p>
    </div>
  );
}
