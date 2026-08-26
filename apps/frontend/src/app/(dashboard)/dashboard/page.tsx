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
import {
  Sparkles,
  Presentation,
  FileText,
  Building2,
  Radio,
  Play,
  Edit,
  Trash2,
  Plus,
  ArrowRight,
  Upload,
  Clock,
  CheckCircle2,
  ExternalLink,
  Loader2,
  Search,
  Zap,
} from "lucide-react";

export default function DashboardPage() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [presentations, setPresentations] = useState<any[]>([]);
  const [files, setFiles] = useState<any[]>([]);
  const [organizations, setOrganizations] = useState<any[]>([]);
  const [totalPresentations, setTotalPresentations] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [joinCode, setJoinCode] = useState("");
  const [joining, setJoining] = useState(false);
  const router = useRouter();

  const fetchDashboardData = async () => {
    const token = getAccessToken();
    if (!token) return;

    try {
      const [presRes, filesRes, orgsRes] = await Promise.all([
        fetch(`${API_URL}/api/presentations?limit=4`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${API_URL}/api/files`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${API_URL}/api/organizations`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      if (presRes.ok) {
        const presData = await presRes.json();
        setPresentations(presData.presentations || []);
        setTotalPresentations(presData.pagination?.total || 0);
      }

      if (filesRes.ok) {
        const filesData = await filesRes.json();
        setFiles(Array.isArray(filesData) ? filesData.slice(0, 4) : []);
      }

      if (orgsRes.ok) {
        const orgsData = await orgsRes.json();
        setOrganizations(Array.isArray(orgsData) ? orgsData : []);
      }
    } catch (error) {
      console.error("Failed to fetch dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCurrentUser().then(setUser);
    fetchDashboardData();
  }, []);

  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  };

  const handleCreatePresentation = async () => {
    setIsCreating(true);
    const token = getAccessToken();
    if (!token) return;

    try {
      const res = await fetch(`${API_URL}/api/presentations`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: "Untitled Presentation",
        }),
      });

      if (res.ok) {
        const data = await res.json();
        router.push(`/presentations/${data._id}/edit`);
      } else {
        const errData = await res.json().catch(() => ({}));
        alert(
          errData.error || errData.message || "Failed to create presentation",
        );
      }
    } catch (error) {
      console.error("Failed to create presentation:", error);
      alert("Failed to create presentation");
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeletePresentation = async (id: string, title: string) => {
    if (!confirm(`Are you sure you want to delete "${title}"?`)) return;
    try {
      const token = getAccessToken();
      if (!token) return;
      const res = await fetch(`${API_URL}/api/presentations/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setPresentations((prev) => prev.filter((p) => p._id !== id));
        setTotalPresentations((prev) => Math.max(0, prev - 1));
      } else {
        const err = await res.json().catch(() => ({}));
        alert(err.error || err.message || "Failed to delete presentation");
      }
    } catch (error) {
      console.error("Delete presentation error:", error);
      alert("Failed to delete presentation");
    }
  };

  const handleJoinSession = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCode = joinCode.trim().toUpperCase();
    if (!cleanCode) return;
    setJoining(true);
    router.push(`/join/${cleanCode}`);
  };

  const totalExtractedWords = files.reduce(
    (acc, f) => acc + (f.extractedMetadata?.wordCount || 0),
    0,
  );

  return (
    <div className="min-h-screen bg-zinc-50/50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 p-6 md:p-8 animate-fade-in">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* ── 1. Hero Greeting Banner ── */}
        <section className="relative overflow-hidden bg-white dark:bg-zinc-900/90 border border-zinc-200/80 dark:border-zinc-800/80 rounded-3xl p-6 sm:p-8 shadow-xs hover-lift transition-all">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
            <div>
              <div className="flex items-center gap-2.5 mb-2">
                <span className="px-2.5 py-0.5 bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-700 text-[11px] font-bold rounded-full uppercase tracking-wider">
                  {user?.role || "Presenter"}
                </span>
                <span className="text-xs text-zinc-400 font-mono">
                  {new Date().toLocaleDateString(undefined, {
                    weekday: "long",
                    month: "short",
                    day: "numeric",
                  })}
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-zinc-950 dark:text-white tracking-tight">
                {greeting()}, {user?.name?.split(" ")[0] || "there"} 👋
              </h1>
              <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mt-1 max-w-xl leading-relaxed">
                Welcome to your Sentio studio. Create AI-powered presentations,
                convert documents, or run live interactive audience sessions.
              </p>
            </div>

            {/* Header Action Buttons */}
            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={handleCreatePresentation}
                disabled={isCreating}
                className="px-4 py-2.5 bg-zinc-950 hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-200 text-white dark:text-zinc-950 rounded-xl font-bold text-xs flex items-center gap-2 shadow-xs transition-all active-press disabled:opacity-50 cursor-pointer"
              >
                {isCreating ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Plus className="w-4 h-4" />
                )}
                <span>New Presentation</span>
              </button>

              <Link
                href="/files"
                className="px-4 py-2.5 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-900 dark:text-zinc-100 rounded-xl font-bold text-xs flex items-center gap-2 border border-zinc-200 dark:border-zinc-700/80 transition-all active-press"
              >
                <Upload className="w-4 h-4" />
                <span>Upload Document</span>
              </Link>
            </div>
          </div>
        </section>

        {/* ── 2. Interactive Metrics Grid ── */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link
            href="/presentations"
            className="group bg-white dark:bg-zinc-900/80 border border-zinc-200/80 dark:border-zinc-800/80 rounded-3xl p-5 shadow-xs hover-lift transition-all"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                Presentations
              </span>
              <div className="p-2.5 bg-zinc-100 dark:bg-zinc-800 rounded-xl text-zinc-900 dark:text-white group-hover:scale-105 transition-transform">
                <Presentation className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-extrabold font-mono text-zinc-950 dark:text-white">
              {totalPresentations}
            </div>
            <p className="text-[11px] text-zinc-400 mt-1 flex items-center gap-1 font-medium">
              <span>View all decks</span>
              <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
            </p>
          </Link>

          <Link
            href="/files"
            className="group bg-white dark:bg-zinc-900/80 border border-zinc-200/80 dark:border-zinc-800/80 rounded-3xl p-5 shadow-xs hover-lift transition-all"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                Knowledge Base
              </span>
              <div className="p-2.5 bg-zinc-100 dark:bg-zinc-800 rounded-xl text-zinc-900 dark:text-white group-hover:scale-105 transition-transform">
                <FileText className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-extrabold font-mono text-zinc-950 dark:text-white">
              {files.length}
            </div>
            <p className="text-[11px] text-zinc-400 mt-1 flex items-center gap-1 font-medium">
              <span>
                {totalExtractedWords > 0
                  ? `${totalExtractedWords.toLocaleString()} words indexed`
                  : "Manage files"}
              </span>
              <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
            </p>
          </Link>

          <Link
            href="/organizations"
            className="group bg-white dark:bg-zinc-900/80 border border-zinc-200/80 dark:border-zinc-800/80 rounded-3xl p-5 shadow-xs hover-lift transition-all"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                Organizations
              </span>
              <div className="p-2.5 bg-zinc-100 dark:bg-zinc-800 rounded-xl text-zinc-900 dark:text-white group-hover:scale-105 transition-transform">
                <Building2 className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-extrabold font-mono text-zinc-950 dark:text-white">
              {organizations.length}
            </div>
            <p className="text-[11px] text-zinc-400 mt-1 flex items-center gap-1 font-medium">
              <span>Team workspaces</span>
              <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
            </p>
          </Link>

          <div className="bg-white dark:bg-zinc-900/80 border border-zinc-200/80 dark:border-zinc-800/80 rounded-3xl p-5 shadow-xs hover-lift transition-all flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                  Live Hub
                </span>
                <div className="p-2.5 bg-zinc-100 dark:bg-zinc-800 rounded-xl text-emerald-500">
                  <Radio className="w-4 h-4 animate-pulse" />
                </div>
              </div>
              <div className="text-2xl font-extrabold font-mono text-zinc-950 dark:text-white">
                Online
              </div>
            </div>

            <form onSubmit={handleJoinSession} className="mt-2 flex gap-1.5">
              <input
                type="text"
                placeholder="Code (e.g. A3F8)"
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                maxLength={8}
                className="w-full px-2.5 py-1.5 bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs font-mono font-bold uppercase focus:ring-1 focus:ring-zinc-950 dark:focus:ring-white outline-none"
              />
              <button
                type="submit"
                disabled={!joinCode.trim() || joining}
                className="px-2.5 py-1.5 bg-zinc-950 hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-200 text-white dark:text-zinc-950 rounded-xl text-xs font-bold transition-all disabled:opacity-50 active-press cursor-pointer"
              >
                Join
              </button>
            </form>
          </div>
        </section>

        {/* ── 3. Recent Presentations ── */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-zinc-950 dark:text-white tracking-tight">
                Recent Presentations
              </h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Continue editing or launch your interactive sessions.
              </p>
            </div>

            <Link
              href="/presentations"
              className="text-xs font-bold text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-white flex items-center gap-1 transition-colors"
            >
              <span>View all ({totalPresentations})</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {loading ? (
            <div className="flex justify-center py-16">
              <Loader2 className="w-8 h-8 animate-spin text-zinc-950 dark:text-white" />
            </div>
          ) : presentations.length === 0 ? (
            <div className="text-center py-16 border border-dashed border-zinc-200 dark:border-zinc-800 rounded-3xl bg-white/40 dark:bg-zinc-900/40">
              <div className="w-12 h-12 bg-zinc-100 dark:bg-zinc-800 rounded-2xl flex items-center justify-center mx-auto mb-3 text-zinc-400">
                <Presentation className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold text-zinc-950 dark:text-white">
                No presentations yet
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 max-w-xs mx-auto mb-4">
                Create your first AI deck or upload a document to get started.
              </p>
              <button
                onClick={handleCreatePresentation}
                className="px-4 py-2 bg-zinc-950 hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-200 text-white dark:text-zinc-950 rounded-xl font-bold text-xs transition-all active-press cursor-pointer"
              >
                Create Presentation
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
              {presentations.map((p) => (
                <div
                  key={p._id}
                  className="group bg-white dark:bg-zinc-900/80 border border-zinc-200/80 dark:border-zinc-800/80 rounded-3xl p-5 shadow-xs hover-lift transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase border ${
                          p.status === "live"
                            ? "bg-emerald-100 text-emerald-600 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-400 dark:border-emerald-800"
                            : "bg-zinc-100 text-zinc-700 border-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:border-zinc-700"
                        }`}
                      >
                        {p.status}
                      </span>
                      <span className="text-[10px] text-zinc-400 font-mono">
                        {new Date(p.updatedAt).toLocaleDateString()}
                      </span>
                    </div>

                    <h3
                      className="font-bold text-zinc-950 dark:text-white text-sm line-clamp-1 group-hover:text-zinc-600 dark:group-hover:text-zinc-300 transition-colors"
                      title={p.title}
                    >
                      {p.title}
                    </h3>
                    <p className="text-xs text-zinc-400 mt-1 line-clamp-2 min-h-8">
                      {p.description || "No description provided."}
                    </p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-zinc-100 dark:border-zinc-800/80 flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <Link
                        href={`/presentations/${p._id}/host`}
                        className="px-3 py-1.5 bg-zinc-950 hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-200 text-white dark:text-zinc-950 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all active-press"
                        title="Present Live"
                      >
                        <Play className="w-3 h-3 fill-current" />
                        <span>Present</span>
                      </Link>

                      <Link
                        href={`/presentations/${p._id}/edit`}
                        className="p-1.5 text-zinc-500 hover:text-zinc-950 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl transition-colors"
                        title="Edit Presentation"
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </Link>
                    </div>

                    <button
                      onClick={() => handleDeletePresentation(p._id, p.title)}
                      className="p-1.5 text-zinc-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-xl transition-colors cursor-pointer"
                      title="Delete Presentation"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* ── 4. Knowledge Base & Documents Snapshot ── */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-zinc-950 dark:text-white tracking-tight">
                Knowledge Base Documents
              </h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Uploaded reference documents and AI-ready materials.
              </p>
            </div>

            <Link
              href="/files"
              className="text-xs font-bold text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-white flex items-center gap-1 transition-colors"
            >
              <span>Manage files ({files.length})</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {files.length === 0 ? (
            <div className="p-6 border border-zinc-200/80 dark:border-zinc-800/80 rounded-3xl bg-white dark:bg-zinc-900/80 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-zinc-100 dark:bg-zinc-800 rounded-2xl text-zinc-600 dark:text-zinc-300">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-xs text-zinc-950 dark:text-white">
                    Build your Knowledge Base
                  </h4>
                  <p className="text-[11px] text-zinc-400 mt-0.5">
                    Upload PDF, PowerPoint, or Word documents to extract
                    insights and generate instant decks.
                  </p>
                </div>
              </div>

              <Link
                href="/files"
                className="px-4 py-2 bg-zinc-950 hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-200 text-white dark:text-zinc-950 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all active-press"
              >
                <Upload className="w-3.5 h-3.5" /> Upload File
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {files.map((file) => (
                <div
                  key={file._id}
                  className="bg-white dark:bg-zinc-900/80 border border-zinc-200/80 dark:border-zinc-800/80 rounded-3xl p-4 shadow-xs hover-lift transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className="px-2 py-0.5 bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700 text-[9px] font-bold rounded-full uppercase">
                        {file.category || "doc"}
                      </span>
                      <span className="text-[10px] text-zinc-400 font-mono">
                        {(file.size / (1024 * 1024)).toFixed(1)} MB
                      </span>
                    </div>

                    <h4
                      className="font-bold text-xs text-zinc-950 dark:text-white truncate"
                      title={file.originalName}
                    >
                      {file.originalName}
                    </h4>

                    {file.extractedMetadata?.wordCount ? (
                      <div className="mt-2 text-[10px] text-zinc-600 dark:text-zinc-400 flex items-center gap-1 font-medium">
                        <Sparkles className="w-3 h-3 text-amber-500" />
                        <span>
                          {file.extractedMetadata.wordCount} words indexed
                        </span>
                      </div>
                    ) : null}
                  </div>

                  <div className="mt-3 pt-2.5 border-t border-zinc-100 dark:border-zinc-800/80 flex items-center justify-between text-xs">
                    {file.presentationId ? (
                      <Link
                        href={`/presentations/${file.presentationId}/edit`}
                        className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1 hover:underline"
                      >
                        <CheckCircle2 className="w-3 h-3" /> View Deck
                      </Link>
                    ) : (
                      <Link
                        href="/files"
                        className="text-[11px] font-bold text-zinc-900 dark:text-white flex items-center gap-1 hover:underline"
                      >
                        <Sparkles className="w-3 h-3 text-amber-400" /> Convert
                        Deck
                      </Link>
                    )}

                    <Link
                      href="/files"
                      className="text-[11px] text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200"
                    >
                      Inspect
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
