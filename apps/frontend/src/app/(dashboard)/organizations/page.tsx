"use client";

import React, { useEffect, useState } from "react";
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
} from "lucide-react";

export default function OrganizationsPage() {
  const [orgs, setOrgs] = useState<any[]>([]);
  const [selectedOrg, setSelectedOrg] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  // Modals
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [orgName, setOrgName] = useState("");
  const [orgDesc, setOrgDesc] = useState("");
  const [creating, setCreating] = useState(false);

  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<"admin" | "member">("member");
  const [inviting, setInviting] = useState(false);

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
        setSelectedOrg(await res.json());
      }
    } catch (err) {
      console.error("Fetch org details error:", err);
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

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-white p-6 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              🏢 Organization Management
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Create workspace teams, invite co-presenters, and manage
              organization membership rosters.
            </p>
          </div>

          <button
            onClick={() => setIsCreateOpen(true)}
            className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm rounded-xl transition-colors shadow-sm flex items-center gap-2 w-fit"
          >
            <Plus className="w-4 h-4" /> Create Organization
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
          </div>
        ) : orgs.length === 0 ? (
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-12 text-center">
            <Building2 className="w-12 h-12 text-gray-300 dark:text-gray-700 mx-auto mb-3" />
            <h3 className="text-lg font-bold">No Organizations Found</h3>
            <p className="text-sm text-gray-500 mt-1 max-w-sm mx-auto">
              Create your first team organization to collaborate with colleagues
              on presentations.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {/* Sidebar list of user's Orgs */}
            <div className="space-y-3">
              <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                Your Organizations
              </span>
              {orgs.map((o) => (
                <button
                  key={o._id}
                  onClick={() => fetchOrgDetails(o._id)}
                  className={`w-full text-left p-4 rounded-xl border transition-all flex items-center justify-between ${
                    selectedOrg?.org?._id === o._id
                      ? "bg-indigo-50 dark:bg-indigo-900/30 border-indigo-500 text-indigo-600 dark:text-indigo-400 font-bold"
                      : "bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 text-gray-800 dark:text-gray-200 hover:bg-gray-100"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-indigo-100 dark:bg-indigo-900/50 rounded-lg">
                      <Building2 className="w-4 h-4" />
                    </div>
                    <span className="text-sm line-clamp-1">{o.name}</span>
                  </div>
                  <span className="text-[10px] font-bold uppercase px-2 py-0.5 bg-gray-100 dark:bg-gray-800 rounded text-gray-500">
                    {o.myRole}
                  </span>
                </button>
              ))}
            </div>

            {/* Selected Org Details */}
            {selectedOrg && (
              <div className="md:col-span-3 space-y-6">
                {/* Org Summary Card */}
                <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                      {selectedOrg.org.name}
                    </h2>
                    <p className="text-xs text-gray-400 mt-1">
                      Slug: {selectedOrg.org.slug} • Created{" "}
                      {new Date(selectedOrg.org.createdAt).toLocaleDateString()}
                    </p>
                  </div>

                  {["owner", "admin"].includes(selectedOrg.myRole) && (
                    <button
                      onClick={() => setIsInviteOpen(true)}
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-xl flex items-center gap-1.5 shadow-sm"
                    >
                      <UserPlus className="w-4 h-4" /> Invite Co-Presenter
                    </button>
                  )}
                </div>

                {/* Members Roster Table */}
                <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl overflow-hidden shadow-sm">
                  <div className="p-4 border-b border-gray-200 dark:border-gray-800 flex justify-between items-center">
                    <h3 className="font-bold text-sm flex items-center gap-2">
                      <Users className="w-4 h-4 text-indigo-600" /> Member
                      Roster ({(selectedOrg.members || []).length})
                    </h3>
                  </div>

                  <table className="w-full text-left text-sm">
                    <thead className="bg-gray-50 dark:bg-gray-800/50 text-xs text-gray-500 uppercase border-b border-gray-200 dark:border-gray-800">
                      <tr>
                        <th className="px-6 py-3">Member</th>
                        <th className="px-6 py-3">Role</th>
                        <th className="px-6 py-3">Joined</th>
                        <th className="px-6 py-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                      {(selectedOrg.members || []).map((m: any) => (
                        <tr key={m._id}>
                          <td className="px-6 py-4 font-semibold">
                            {m.user?.name}
                            <span className="block text-xs font-normal text-gray-400">
                              {m.user?.email}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <span className="px-2 py-0.5 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 text-xs font-bold rounded-md capitalize">
                              {m.role}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-xs text-gray-400">
                            {new Date(m.joinedAt).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 text-right">
                            {["owner", "admin"].includes(selectedOrg.myRole) &&
                              m.role !== "owner" && (
                                <button
                                  onClick={() => handleRemoveMember(m.user._id)}
                                  className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg"
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

                {/* Pending Invitations */}
                {selectedOrg.pendingInvites?.length > 0 && (
                  <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6 shadow-sm">
                    <h3 className="font-bold text-sm mb-3 flex items-center gap-2">
                      <Mail className="w-4 h-4 text-amber-500" /> Pending Email
                      Invitations
                    </h3>
                    <div className="space-y-2">
                      {selectedOrg.pendingInvites.map((inv: any) => (
                        <div
                          key={inv._id}
                          className="p-3 bg-gray-50 dark:bg-gray-800 rounded-xl flex items-center justify-between text-xs"
                        >
                          <div>
                            <span className="font-bold text-gray-800 dark:text-gray-200">
                              {inv.email}
                            </span>
                            <span className="ml-2 text-gray-400">
                              Role: {inv.role}
                            </span>
                          </div>
                          <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded">
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

      {/* Create Org Modal */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl max-w-md w-full p-6 shadow-2xl relative">
            <button
              onClick={() => setIsCreateOpen(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
              <Building2 className="w-5 h-5 text-indigo-600" /> Create
              Organization
            </h3>

            <form onSubmit={handleCreateOrg} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">
                  Organization Name
                </label>
                <input
                  type="text"
                  value={orgName}
                  onChange={(e) => setOrgName(e.target.value)}
                  placeholder="e.g. Acme Corp Education"
                  className="w-full p-2.5 border border-gray-200 dark:border-gray-700 rounded-xl text-sm bg-gray-50 dark:bg-gray-800 outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">
                  Description (Optional)
                </label>
                <textarea
                  value={orgDesc}
                  onChange={(e) => setOrgDesc(e.target.value)}
                  placeholder="Brief overview of team workspace..."
                  className="w-full p-2.5 border border-gray-200 dark:border-gray-700 rounded-xl text-sm bg-gray-50 dark:bg-gray-800 outline-none h-20"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 dark:border-gray-800">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="px-4 py-2 text-sm text-gray-500 hover:bg-gray-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating || !orgName}
                  className="px-5 py-2 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg flex items-center gap-2 disabled:opacity-50"
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

      {/* Invite Member Modal */}
      {isInviteOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl max-w-md w-full p-6 shadow-2xl relative">
            <button
              onClick={() => setIsInviteOpen(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-indigo-600" /> Invite
              Co-Presenter
            </h3>

            <form onSubmit={handleInviteMember} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="colleague@company.com"
                  className="w-full p-2.5 border border-gray-200 dark:border-gray-700 rounded-xl text-sm bg-gray-50 dark:bg-gray-800 outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">
                  Role in Organization
                </label>
                <select
                  value={inviteRole}
                  onChange={(e: any) => setInviteRole(e.target.value)}
                  className="w-full p-2.5 border border-gray-200 dark:border-gray-700 rounded-xl text-sm bg-gray-50 dark:bg-gray-800 outline-none"
                >
                  <option value="member">
                    Member (Can create & present presentations)
                  </option>
                  <option value="admin">
                    Admin (Can manage roster & invite co-presenters)
                  </option>
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 dark:border-gray-800">
                <button
                  type="button"
                  onClick={() => setIsInviteOpen(false)}
                  className="px-4 py-2 text-sm text-gray-500 hover:bg-gray-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={inviting || !inviteEmail}
                  className="px-5 py-2 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg flex items-center gap-2 disabled:opacity-50"
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
