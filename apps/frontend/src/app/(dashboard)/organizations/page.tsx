"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { getAccessToken, API_URL } from "@/lib/auth";
import {
  Building2,
  Plus,
  UserPlus,
  Trash2,
  Mail,
  Users,
  ShieldCheck,
  X,
  Loader2,
  CheckCircle2,
  Presentation as PresentationIcon,
  Edit3,
  Play,
  FolderPlus,
  Layers,
  Calendar,
  ExternalLink,
  Search,
} from "lucide-react";

export default function OrganizationsPage() {
  const [orgs, setOrgs] = useState<any[]>([]);
  const [selectedOrg, setSelectedOrg] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  // Active tab inside selected organization: "presentations" | "members" | "invites"
  const [activeTab, setActiveTab] = useState<
    "presentations" | "members" | "invites"
  >("presentations");

  // Presentations list for the selected organization
  const [orgPresentations, setOrgPresentations] = useState<any[]>([]);
  const [loadingPres, setLoadingPres] = useState(false);

  // Modals
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [orgName, setOrgName] = useState("");
  const [orgDesc, setOrgDesc] = useState("");
  const [creating, setCreating] = useState(false);

  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<"admin" | "member">("member");
  const [inviting, setInviting] = useState(false);

  // Add Presentation to Org Modal
  const [isAddPresOpen, setIsAddPresOpen] = useState(false);
  const [availablePres, setAvailablePres] = useState<any[]>([]);
  const [loadingAvailable, setLoadingAvailable] = useState(false);
  const [addingPresId, setAddingPresId] = useState<string | null>(null);
  const [presSearch, setPresSearch] = useState("");

  const fetchOrgs = async () => {
    setLoading(true);
    try {
      const token = getAccessToken();
      const res = await fetch(`${API_URL}/api/organizations`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setOrgs(data);
        if (data.length > 0 && !selectedOrg) {
          fetchOrgDetails(data[0]._id);
        }
      }
    } catch (err) {
      console.error("Failed to fetch orgs:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchOrgDetails = async (id: string) => {
    try {
      const token = getAccessToken();
      const res = await fetch(`${API_URL}/api/organizations/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setSelectedOrg(data);
        fetchOrgPresentations(id);
      }
    } catch (err) {
      console.error("Fetch org details error:", err);
    }
  };

  const fetchOrgPresentations = async (orgId: string) => {
    setLoadingPres(true);
    try {
      const token = getAccessToken();
      const res = await fetch(
        `${API_URL}/api/organizations/${orgId}/presentations`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      if (res.ok) {
        const data = await res.json();
        setOrgPresentations(data);
      }
    } catch (err) {
      console.error("Fetch org presentations error:", err);
    } finally {
      setLoadingPres(false);
    }
  };

  const fetchAvailablePresentations = async (orgId: string) => {
    setLoadingAvailable(true);
    try {
      const token = getAccessToken();
      const res = await fetch(
        `${API_URL}/api/organizations/${orgId}/available-presentations`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      if (res.ok) {
        const data = await res.json();
        setAvailablePres(data);
      }
    } catch (err) {
      console.error("Fetch available presentations error:", err);
    } finally {
      setLoadingAvailable(false);
    }
  };

  const openAddPresModal = () => {
    if (!selectedOrg) return;
    setPresSearch("");
    setIsAddPresOpen(true);
    fetchAvailablePresentations(selectedOrg.org._id);
  };

  const handleAddPresentationToOrg = async (presentationId: string) => {
    if (!selectedOrg) return;
    setAddingPresId(presentationId);
    try {
      const token = getAccessToken();
      const res = await fetch(
        `${API_URL}/api/organizations/${selectedOrg.org._id}/presentations`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ presentationId }),
        },
      );

      if (res.ok) {
        // Refresh presentations and available list
        fetchOrgPresentations(selectedOrg.org._id);
        fetchAvailablePresentations(selectedOrg.org._id);
      } else {
        const err = await res.json();
        alert(err.message || "Failed to add presentation");
      }
    } catch (err) {
      alert("Failed to add presentation to organization");
    } finally {
      setAddingPresId(null);
    }
  };

  const handleRemovePresentationFromOrg = async (presentationId: string) => {
    if (!selectedOrg) return;
    if (
      !confirm(
        "Are you sure you want to remove this presentation from the organization?",
      )
    )
      return;

    try {
      const token = getAccessToken();
      const res = await fetch(
        `${API_URL}/api/organizations/${selectedOrg.org._id}/presentations/${presentationId}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      if (res.ok) {
        fetchOrgPresentations(selectedOrg.org._id);
      } else {
        const err = await res.json();
        alert(err.message || "Failed to remove presentation");
      }
    } catch (err) {
      alert("Failed to remove presentation");
    }
  };

  useEffect(() => {
    fetchOrgs();
  }, []);

  const handleCreateOrg = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orgName) return;

    setCreating(true);
    try {
      const token = getAccessToken();
      const res = await fetch(`${API_URL}/api/organizations`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name: orgName, description: orgDesc }),
      });

      if (res.ok) {
        const created = await res.json();
        setIsCreateOpen(false);
        setOrgName("");
        setOrgDesc("");
        fetchOrgs();
        fetchOrgDetails(created._id);
      }
    } catch (err) {
      alert("Failed to create organization");
    } finally {
      setCreating(false);
    }
  };

  const handleInviteMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail || !selectedOrg) return;

    setInviting(true);
    try {
      const token = getAccessToken();
      const res = await fetch(
        `${API_URL}/api/organizations/${selectedOrg.org._id}/invite`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ email: inviteEmail, role: inviteRole }),
        },
      );

      if (res.ok) {
        setIsInviteOpen(false);
        setInviteEmail("");
        alert(`Invitation sent to ${inviteEmail}`);
        fetchOrgDetails(selectedOrg.org._id);
      } else {
        const data = await res.json();
        alert(data.message || "Failed to send invitation");
      }
    } catch (err) {
      alert("Failed to send invitation");
    } finally {
      setInviting(false);
    }
  };

  const handleRemoveMember = async (userId: string) => {
    if (!confirm("Are you sure you want to remove this member?")) return;
    try {
      const token = getAccessToken();
      const res = await fetch(
        `${API_URL}/api/organizations/${selectedOrg.org._id}/members/${userId}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      if (res.ok) fetchOrgDetails(selectedOrg.org._id);
    } catch (err) {
      alert("Failed to remove member");
    }
  };

  const filteredAvailable = availablePres.filter((p) =>
    p.title?.toLowerCase().includes(presSearch.toLowerCase()),
  );

  return (
    <div className="min-h-screen bg-zinc-50/50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 p-6 md:p-8 animate-fade-in">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2 text-zinc-950 dark:text-white tracking-tight">
              <Building2 className="w-6 h-6 text-zinc-900 dark:text-zinc-100" />{" "}
              Organization Management
            </h1>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
              Create workspace teams, share presentations with co-presenters,
              and collaborate seamlessly.
            </p>
          </div>

          <button
            onClick={() => setIsCreateOpen(true)}
            className="px-4 py-2.5 bg-zinc-900 hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-200 text-white dark:text-zinc-950 font-bold text-sm rounded-xl transition-all shadow-xs flex items-center gap-2 w-fit cursor-pointer active-press"
          >
            <Plus className="w-4 h-4" /> Create Organization
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-zinc-900 dark:text-zinc-100" />
          </div>
        ) : orgs.length === 0 ? (
          <div className="bg-white dark:bg-zinc-900/80 border border-zinc-200/80 dark:border-zinc-800/80 rounded-3xl p-12 text-center shadow-sm">
            <Building2 className="w-12 h-12 text-zinc-300 dark:text-zinc-700 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
              No Organizations Found
            </h3>
            <p className="text-sm text-zinc-500 mt-1 max-w-sm mx-auto">
              Create your first team organization to collaborate with colleagues
              on presentations.
            </p>
            <button
              onClick={() => setIsCreateOpen(true)}
              className="mt-4 px-4 py-2 bg-zinc-900 hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-200 text-white dark:text-zinc-950 text-xs font-bold rounded-xl transition-all inline-flex items-center gap-2 active-press shadow-xs"
            >
              <Plus className="w-4 h-4" /> Create Organization
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {/* Sidebar list of user's Orgs */}
            <div className="space-y-3">
              <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
                Your Organizations ({orgs.length})
              </span>
              {orgs.map((o) => (
                <button
                  key={o._id}
                  onClick={() => {
                    fetchOrgDetails(o._id);
                    setActiveTab("presentations");
                  }}
                  className={`w-full text-left p-4 rounded-2xl border transition-all flex items-center justify-between cursor-pointer hover-lift ${
                    selectedOrg?.org?._id === o._id
                      ? "bg-zinc-900 text-white dark:bg-white dark:text-zinc-950 border-zinc-900 dark:border-white font-bold shadow-sm"
                      : "bg-white dark:bg-zinc-900/70 border-zinc-200 dark:border-zinc-800 text-zinc-800 dark:text-zinc-200 hover:bg-zinc-100/80 dark:hover:bg-zinc-800/80"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`p-2 rounded-xl ${
                        selectedOrg?.org?._id === o._id
                          ? "bg-white/20 dark:bg-zinc-900/20 text-current"
                          : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400"
                      }`}
                    >
                      <Building2 className="w-4 h-4" />
                    </div>
                    <span className="text-sm line-clamp-1">{o.name}</span>
                  </div>
                  <span
                    className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                      selectedOrg?.org?._id === o._id
                        ? "bg-white/20 dark:bg-black/20 text-current"
                        : "bg-zinc-100 dark:bg-zinc-800 text-zinc-500"
                    }`}
                  >
                    {o.myRole}
                  </span>
                </button>
              ))}
            </div>

            {/* Selected Org Details */}
            {selectedOrg && (
              <div className="md:col-span-3 space-y-6 animate-fade-in">
                {/* Org Summary Card */}
                <div className="bg-white dark:bg-zinc-900/80 border border-zinc-200/80 dark:border-zinc-800/80 rounded-3xl p-6 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div>
                    <div className="flex items-center gap-2.5">
                      <h2 className="text-xl font-bold text-zinc-950 dark:text-white">
                        {selectedOrg.org.name}
                      </h2>
                      <span className="px-2.5 py-0.5 bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-700 text-xs font-bold rounded-full capitalize">
                        {selectedOrg.myRole}
                      </span>
                    </div>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                      Slug: {selectedOrg.org.slug} •{" "}
                      {selectedOrg.org.description || "No description provided"}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 w-full md:w-auto">
                    <button
                      onClick={openAddPresModal}
                      className="flex-1 md:flex-initial px-4 py-2 bg-zinc-900 hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-200 text-white dark:text-zinc-950 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-xs transition-all cursor-pointer active-press hover-lift"
                    >
                      <FolderPlus className="w-4 h-4" /> Add Presentation
                    </button>

                    {["owner", "admin"].includes(selectedOrg.myRole) && (
                      <button
                        onClick={() => setIsInviteOpen(true)}
                        className="flex-1 md:flex-initial px-4 py-2 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-750 text-zinc-900 dark:text-zinc-100 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer border border-zinc-200 dark:border-zinc-700/80 active-press hover-lift"
                      >
                        <UserPlus className="w-4 h-4" /> Invite Member
                      </button>
                    )}
                  </div>
                </div>

                {/* Tabs Switcher */}
                <div className="flex items-center gap-1.5 bg-zinc-100/80 dark:bg-zinc-900 p-1.5 rounded-2xl border border-zinc-200/80 dark:border-zinc-800 w-fit">
                  <button
                    onClick={() => setActiveTab("presentations")}
                    className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
                      activeTab === "presentations"
                        ? "bg-zinc-900 text-white dark:bg-white dark:text-zinc-950 shadow-xs scale-100"
                        : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-white"
                    }`}
                  >
                    <PresentationIcon className="w-4 h-4" /> Shared
                    Presentations ({orgPresentations.length})
                  </button>
                  <button
                    onClick={() => setActiveTab("members")}
                    className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
                      activeTab === "members"
                        ? "bg-zinc-900 text-white dark:bg-white dark:text-zinc-950 shadow-xs scale-100"
                        : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-white"
                    }`}
                  >
                    <Users className="w-4 h-4" /> Members (
                    {(selectedOrg.members || []).length})
                  </button>
                  {(selectedOrg.pendingInvites?.length || 0) > 0 && (
                    <button
                      onClick={() => setActiveTab("invites")}
                      className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
                        activeTab === "invites"
                          ? "bg-zinc-900 text-white dark:bg-white dark:text-zinc-950 shadow-xs scale-100"
                          : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-white"
                      }`}
                    >
                      <Mail className="w-4 h-4" /> Pending Invites (
                      {selectedOrg.pendingInvites.length})
                    </button>
                  )}
                </div>

                {/* ── TAB 1: Presentations ── */}
                {activeTab === "presentations" && (
                  <div className="space-y-4 animate-fade-in">
                    {loadingPres ? (
                      <div className="flex justify-center py-16">
                        <Loader2 className="w-6 h-6 animate-spin text-zinc-900 dark:text-zinc-100" />
                      </div>
                    ) : orgPresentations.length === 0 ? (
                      <div className="bg-white dark:bg-zinc-900/80 border border-zinc-200/80 dark:border-zinc-800/80 rounded-3xl p-10 text-center shadow-sm">
                        <PresentationIcon className="w-10 h-10 text-zinc-300 dark:text-zinc-700 mx-auto mb-2" />
                        <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                          No presentations shared yet
                        </h4>
                        <p className="text-xs text-zinc-500 mt-1 max-w-sm mx-auto">
                          Add your personal presentations to this organization
                          so team members can view, edit, and present them
                          together.
                        </p>
                        <button
                          onClick={openAddPresModal}
                          className="mt-4 px-4 py-2 bg-zinc-900 hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-200 text-white dark:text-zinc-950 text-xs font-bold rounded-xl transition-all inline-flex items-center gap-2 cursor-pointer shadow-xs active-press hover-lift"
                        >
                          <FolderPlus className="w-4 h-4" /> Add Presentation
                        </button>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                        {orgPresentations.map((p) => {
                          const themeBg = p.theme?.bg || "#18181b";

                          return (
                            <div
                              key={p._id}
                              className="bg-white dark:bg-zinc-900/80 border border-zinc-200/80 dark:border-zinc-800/80 rounded-3xl overflow-hidden shadow-sm hover-lift hover:border-zinc-300 dark:hover:border-zinc-700 transition-all flex flex-col group"
                            >
                              {/* Top Banner / Theme Preview */}
                              <div
                                className="h-28 p-3.5 relative flex items-end justify-between border-b border-zinc-100 dark:border-zinc-800"
                                style={{ backgroundColor: themeBg }}
                              >
                                <div className="flex items-center gap-1.5 bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-lg text-[10px] font-bold text-white shadow-xs">
                                  <Layers className="w-3 h-3" />
                                  <span>{p.slideCount || 0} slides</span>
                                </div>

                                <span className="px-2.5 py-1 bg-white/20 backdrop-blur-md text-white text-[10px] font-bold rounded-lg capitalize">
                                  {p.category || "General"}
                                </span>
                              </div>

                              {/* Content */}
                              <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                                <div>
                                  <h4 className="font-bold text-sm text-zinc-950 dark:text-white line-clamp-1 group-hover:text-zinc-600 dark:group-hover:text-zinc-300 transition-colors">
                                    {p.title || "Untitled Presentation"}
                                  </h4>
                                  <p className="text-xs text-zinc-500 dark:text-zinc-400 line-clamp-2 mt-1">
                                    {p.description || "No description provided"}
                                  </p>
                                </div>

                                <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800/80 flex items-center justify-between text-[11px] text-zinc-400">
                                  <span>
                                    By{" "}
                                    <strong className="text-zinc-700 dark:text-zinc-300 font-bold">
                                      {p.owner?.name || "Author"}
                                    </strong>
                                  </span>
                                  <span>
                                    {new Date(p.updatedAt).toLocaleDateString()}
                                  </span>
                                </div>

                                {/* Action Buttons */}
                                <div className="grid grid-cols-2 gap-2 pt-1">
                                  <Link
                                    href={`/presentations/${p._id}/edit`}
                                    className="px-3.5 py-2 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-900 dark:text-zinc-100 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-all active-press"
                                  >
                                    <Edit3 className="w-3.5 h-3.5" /> Edit
                                  </Link>

                                  <Link
                                    href={`/presentations/${p._id}/host`}
                                    className="px-3.5 py-2 bg-zinc-950 hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-200 text-white dark:text-zinc-950 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-all shadow-xs active-press"
                                  >
                                    <Play className="w-3.5 h-3.5 fill-current" />{" "}
                                    Present
                                  </Link>
                                </div>

                                <button
                                  onClick={() =>
                                    handleRemovePresentationFromOrg(p._id)
                                  }
                                  className="w-full text-center text-[10px] text-zinc-400 hover:text-red-500 hover:underline pt-1 transition-colors cursor-pointer"
                                >
                                  Remove from Organization
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}

                {/* ── TAB 2: Members Roster ── */}
                {activeTab === "members" && (
                  <div className="bg-white dark:bg-zinc-900/80 border border-zinc-200/80 dark:border-zinc-800/80 rounded-3xl overflow-hidden shadow-sm animate-fade-in">
                    <div className="p-5 border-b border-zinc-200 dark:border-zinc-800 flex justify-between items-center">
                      <h3 className="font-bold text-sm flex items-center gap-2 text-zinc-900 dark:text-zinc-100">
                        <Users className="w-4 h-4 text-zinc-900 dark:text-zinc-100" />{" "}
                        Member Roster ({(selectedOrg.members || []).length})
                      </h3>
                      {["owner", "admin"].includes(selectedOrg.myRole) && (
                        <button
                          onClick={() => setIsInviteOpen(true)}
                          className="px-3.5 py-1.5 bg-zinc-900 hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-200 text-white dark:text-zinc-950 text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-xs transition-all active-press cursor-pointer"
                        >
                          <UserPlus className="w-3.5 h-3.5" /> Invite
                        </button>
                      )}
                    </div>

                    <table className="w-full text-left text-sm">
                      <thead className="bg-zinc-50 dark:bg-zinc-800/50 text-xs text-zinc-500 uppercase border-b border-zinc-200 dark:border-zinc-800">
                        <tr>
                          <th className="px-6 py-3.5">Member</th>
                          <th className="px-6 py-3.5">Role</th>
                          <th className="px-6 py-3.5">Joined</th>
                          <th className="px-6 py-3.5 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                        {(selectedOrg.members || []).map((m: any) => (
                          <tr
                            key={m._id}
                            className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30 transition-colors"
                          >
                            <td className="px-6 py-4 font-semibold">
                              {m.user?.name}
                              <span className="block text-xs font-normal text-zinc-400">
                                {m.user?.email}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <span className="px-2.5 py-0.5 bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 border border-zinc-200 dark:border-zinc-700 text-xs font-bold rounded-md capitalize">
                                {m.role}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-xs text-zinc-400">
                              {new Date(m.joinedAt).toLocaleDateString()}
                            </td>
                            <td className="px-6 py-4 text-right">
                              {["owner", "admin"].includes(
                                selectedOrg.myRole,
                              ) &&
                                m.role !== "owner" && (
                                  <button
                                    onClick={() =>
                                      handleRemoveMember(m.user._id)
                                    }
                                    className="p-1.5 text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg cursor-pointer transition-colors"
                                    title="Remove member"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* ── TAB 3: Pending Invitations ── */}
                {activeTab === "invites" &&
                  selectedOrg.pendingInvites?.length > 0 && (
                    <div className="bg-white dark:bg-zinc-900/80 border border-zinc-200/80 dark:border-zinc-800/80 rounded-3xl p-6 shadow-sm animate-fade-in">
                      <h3 className="font-bold text-sm mb-3 flex items-center gap-2 text-zinc-900 dark:text-zinc-100">
                        <Mail className="w-4 h-4 text-zinc-500" /> Pending Email
                        Invitations
                      </h3>
                      <div className="space-y-2">
                        {selectedOrg.pendingInvites.map((inv: any) => (
                          <div
                            key={inv._id}
                            className="p-3 bg-zinc-50 dark:bg-zinc-800/70 border border-zinc-200/70 dark:border-zinc-700/70 rounded-2xl flex items-center justify-between text-xs"
                          >
                            <div>
                              <span className="font-bold text-zinc-800 dark:text-zinc-200">
                                {inv.email}
                              </span>
                              <span className="ml-2 text-zinc-400">
                                Role: {inv.role}
                              </span>
                            </div>
                            <span className="text-[10px] font-bold text-zinc-600 dark:text-zinc-300 bg-zinc-200/80 dark:bg-zinc-700 px-2 py-0.5 rounded-full">
                              Pending
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modal 1: Add Presentation to Organization */}
      {isAddPresOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl max-w-lg w-full p-6 shadow-2xl relative flex flex-col max-h-[85vh] animate-scale-in">
            <button
              onClick={() => setIsAddPresOpen(false)}
              className="absolute top-5 right-5 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 p-1 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="mb-4">
              <h3 className="text-lg font-bold flex items-center gap-2 text-zinc-950 dark:text-white">
                <FolderPlus className="w-5 h-5 text-zinc-950 dark:text-white" />{" "}
                Add Presentations to {selectedOrg?.org?.name}
              </h3>
              <p className="text-xs text-zinc-500 mt-0.5">
                Select your presentations to share with members in this
                organization.
              </p>
            </div>

            {/* Search Input */}
            <div className="relative mb-4">
              <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={presSearch}
                onChange={(e) => setPresSearch(e.target.value)}
                placeholder="Search your presentations..."
                className="w-full pl-10 pr-3.5 py-2.5 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs bg-zinc-50 dark:bg-zinc-800/80 outline-none focus:border-zinc-950 dark:focus:border-white transition-colors"
              />
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto space-y-2 pr-1">
              {loadingAvailable ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="w-6 h-6 animate-spin text-zinc-900 dark:text-zinc-100" />
                </div>
              ) : filteredAvailable.length === 0 ? (
                <div className="text-center py-10 text-zinc-400 text-xs">
                  {presSearch
                    ? "No matching presentations found."
                    : "No other presentations available to add."}
                </div>
              ) : (
                filteredAvailable.map((p) => (
                  <div
                    key={p._id}
                    className="p-3.5 bg-zinc-50 dark:bg-zinc-800/60 hover:bg-zinc-100 dark:hover:bg-zinc-800 border border-zinc-200/80 dark:border-zinc-700/60 rounded-2xl flex items-center justify-between transition-all"
                  >
                    <div className="min-w-0 pr-3">
                      <h4 className="text-xs font-bold text-zinc-900 dark:text-zinc-100 truncate">
                        {p.title || "Untitled Presentation"}
                      </h4>
                      <p className="text-[11px] text-zinc-400 mt-0.5">
                        Category: {p.category || "General"} • Updated{" "}
                        {new Date(p.updatedAt).toLocaleDateString()}
                      </p>
                    </div>

                    <button
                      onClick={() => handleAddPresentationToOrg(p._id)}
                      disabled={addingPresId === p._id}
                      className="px-3.5 py-1.5 bg-zinc-900 hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-200 text-white dark:text-zinc-950 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 shrink-0 disabled:opacity-50 cursor-pointer shadow-xs active-press"
                    >
                      {addingPresId === p._id ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Plus className="w-3.5 h-3.5" />
                      )}
                      <span>Add</span>
                    </button>
                  </div>
                ))
              )}
            </div>

            <div className="pt-4 border-t border-zinc-100 dark:border-zinc-800 flex justify-end mt-4">
              <button
                onClick={() => setIsAddPresOpen(false)}
                className="px-5 py-2 text-xs font-bold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl transition-colors active-press"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal 2: Create Org Modal */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl max-w-md w-full p-6 shadow-2xl relative animate-scale-in">
            <button
              onClick={() => setIsCreateOpen(false)}
              className="absolute top-5 right-5 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 p-1 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-bold mb-4 flex items-center gap-2 text-zinc-950 dark:text-white">
              <Building2 className="w-5 h-5 text-zinc-950 dark:text-white" />{" "}
              Create Organization
            </h3>

            <form onSubmit={handleCreateOrg} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-500 mb-1">
                  Organization Name
                </label>
                <input
                  type="text"
                  value={orgName}
                  onChange={(e) => setOrgName(e.target.value)}
                  placeholder="e.g. Engineering Team, Marketing Group..."
                  className="w-full p-3 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm bg-zinc-50 dark:bg-zinc-800/80 outline-none focus:border-zinc-950 dark:focus:border-white transition-colors"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-500 mb-1">
                  Description (Optional)
                </label>
                <textarea
                  value={orgDesc}
                  onChange={(e) => setOrgDesc(e.target.value)}
                  placeholder="Brief overview of team workspace..."
                  className="w-full p-3 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm bg-zinc-50 dark:bg-zinc-800/80 outline-none h-20 focus:border-zinc-950 dark:focus:border-white transition-colors"
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-4 border-t border-zinc-100 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="px-4 py-2.5 text-xs font-bold text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating || !orgName}
                  className="px-5 py-2.5 text-xs font-bold text-white bg-zinc-900 hover:bg-zinc-800 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-200 rounded-xl flex items-center gap-2 disabled:opacity-50 cursor-pointer shadow-xs active-press transition-all"
                >
                  {creating ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    "Create Team"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 3: Invite Member Modal */}
      {isInviteOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl max-w-md w-full p-6 shadow-2xl relative animate-scale-in">
            <button
              onClick={() => setIsInviteOpen(false)}
              className="absolute top-5 right-5 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 p-1 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-bold mb-4 flex items-center gap-2 text-zinc-950 dark:text-white">
              <UserPlus className="w-5 h-5 text-zinc-950 dark:text-white" />{" "}
              Invite Co-Presenter
            </h3>

            <form onSubmit={handleInviteMember} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-500 mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="colleague@company.com"
                  className="w-full p-3 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm bg-zinc-50 dark:bg-zinc-800/80 outline-none focus:border-zinc-950 dark:focus:border-white transition-colors"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-500 mb-1">
                  Role in Organization
                </label>
                <select
                  value={inviteRole}
                  onChange={(e: any) => setInviteRole(e.target.value)}
                  className="w-full p-3 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm bg-zinc-50 dark:bg-zinc-800/80 outline-none focus:border-zinc-950 dark:focus:border-white transition-colors"
                >
                  <option value="member">
                    Member (Can view, edit & present presentations)
                  </option>
                  <option value="admin">
                    Admin (Can manage roster, presentations & invite
                    co-presenters)
                  </option>
                </select>
              </div>

              <div className="flex justify-end gap-2.5 pt-4 border-t border-zinc-100 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={() => setIsInviteOpen(false)}
                  className="px-4 py-2.5 text-xs font-bold text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={inviting || !inviteEmail}
                  className="px-5 py-2.5 text-xs font-bold text-white bg-zinc-900 hover:bg-zinc-800 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-200 rounded-xl flex items-center gap-2 disabled:opacity-50 cursor-pointer shadow-xs active-press transition-all"
                >
                  {inviting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    "Send Email Invitation"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
