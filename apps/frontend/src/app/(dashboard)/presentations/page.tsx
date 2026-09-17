"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getAccessToken, API_URL } from "@/lib/auth";
import {
  Search,
  Plus,
  FileText,
  Loader2,
  Download,
  CheckCircle2,
  Clock,
  X,
  Radio,
  Layers,
  Users,
  LayoutGrid,
  History,
  Sparkles,
  ArrowUpDown,
  Filter,
} from "lucide-react";
import PresentationCard, {
  PresentationItem,
} from "@/components/presentations/PresentationCard";
import PresentationTimelineModal from "@/components/presentations/PresentationTimelineModal";
import PresentationDeleteModal from "@/components/presentations/PresentationDeleteModal";

export default function PresentationsPage() {
  const router = useRouter();
  const [presentations, setPresentations] = useState<PresentationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [sortOption, setSortOption] = useState("updatedAt");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [viewMode, setViewMode] = useState<"grid" | "timeline">("grid");
  const [isCreating, setIsCreating] = useState(false);

  // Timeline modal state
  const [timelineModalData, setTimelineModalData] = useState<{
    id: string;
    title: string;
  } | null>(null);

  // Delete modal state
  const [deleteModalData, setDeleteModalData] = useState<{
    id: string;
    title: string;
  } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Report generation state
  const [generatingReportId, setGeneratingReportId] = useState<string | null>(
    null,
  );
  const [generatingSeconds, setGeneratingSeconds] = useState(0);
  const [generatedReportModal, setGeneratedReportModal] = useState<any | null>(
    null,
  );

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setCurrentPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const fetchPresentations = async () => {
    setLoading(true);
    const token = getAccessToken();
    if (!token) {
      router.replace("/login");
      return;
    }

    try {
      const params = new URLSearchParams();
      if (debouncedSearch) params.append("search", debouncedSearch);
      if (statusFilter !== "all" && statusFilter !== "")
        params.append("status", statusFilter);
      if (categoryFilter !== "All") params.append("category", categoryFilter);
      params.append("sort", sortOption);
      params.append("page", currentPage.toString());
      params.append("limit", "12");

      const res = await fetch(
        `${API_URL}/api/presentations?${params.toString()}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      if (res.ok) {
        const data = await res.json();
        setPresentations(data.presentations || []);
        setTotalPages(data.pagination?.pages || 1);
      }
    } catch (error) {
      console.error("Failed to fetch presentations:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPresentations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch, statusFilter, categoryFilter, sortOption, currentPage]);

  const handleCreate = async () => {
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

  const handleDuplicatePresentation = async (id: string) => {
    try {
      const token = getAccessToken();
      if (!token) return;
      const res = await fetch(`${API_URL}/api/presentations/${id}/duplicate`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        await fetchPresentations();
      } else {
        const err = await res.json().catch(() => ({}));
        alert(err.error || "Failed to duplicate presentation");
      }
    } catch (error) {
      console.error("Duplicate error:", error);
    }
  };

  const handleGenerateReport = async (id: string, title: string) => {
    setGeneratingReportId(id);
    setGeneratingSeconds(0);

    const startTime = Date.now();
    const interval = setInterval(() => {
      setGeneratingSeconds((Date.now() - startTime) / 1000);
    }, 100);

    try {
      const token = getAccessToken();
      if (!token) return;

      const res = await fetch(`${API_URL}/api/reports/presentation/${id}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      clearInterval(interval);
      const data = await res.json();

      if (res.ok) {
        const finalTime = ((Date.now() - startTime) / 1000).toFixed(1);
        setGeneratedReportModal({
          presentationTitle: title,
          elapsed: finalTime,
          report: data.report,
          fileResource: data.fileResource,
          fileUrl: data.fileUrl || data.report?.fileUrl,
        });
      } else {
        alert(data.message || "Failed to generate presentation report");
      }
    } catch (error) {
      clearInterval(interval);
      console.error("Generate report error:", error);
      alert("An error occurred while compiling the presentation report.");
    } finally {
      setGeneratingReportId(null);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteModalData) return;
    setIsDeleting(true);
    try {
      const token = getAccessToken();
      if (!token) return;
      const res = await fetch(
        `${API_URL}/api/presentations/${deleteModalData.id}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      if (res.ok) {
        setPresentations((prev) =>
          prev.filter((p) => p._id !== deleteModalData.id),
        );
        setDeleteModalData(null);
      } else {
        const err = await res.json().catch(() => ({}));
        alert(err.error || err.message || "Failed to delete presentation");
      }
    } catch (error) {
      console.error("Delete presentation error:", error);
      alert("Failed to delete presentation");
    } finally {
      setIsDeleting(false);
    }
  };

  // High-level deck statistics
  const totalDecksCount = presentations.length;
  const liveSessionsCount = presentations.filter(
    (p) => p.status === "live" || p.liveSession,
  ).length;
  const totalSlidesCount = presentations.reduce(
    (acc, p) => acc + (p.slideCount || 0),
    0,
  );
  const totalAudienceCount = presentations.reduce(
    (acc, p) => acc + (p.totalParticipants || 0),
    0,
  );

  return (
    <div className="p-4 sm:p-8 max-w-7xl mx-auto space-y-8">
      {/* ── HEADER & ACTIONS ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
              Interactive Decks
            </span>
            {liveSessionsCount > 0 && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/15 text-emerald-500 border border-emerald-500/30 animate-pulse">
                <Radio className="w-3 h-3" />
                {liveSessionsCount} Live Now
              </span>
            )}
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-zinc-950 dark:text-white tracking-tight">
            Presentations &amp; Deck Studio
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1 max-w-xl">
            Design interactive slides, engage live audiences with real-time
            polls, and review full activity timelines.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleCreate}
            disabled={isCreating}
            className="px-4 py-2.5 bg-zinc-950 hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-200 text-white dark:text-zinc-950 rounded-2xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all shadow-sm hover:shadow-md cursor-pointer disabled:opacity-50"
          >
            {isCreating ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Plus className="w-4 h-4" />
            )}
            <span>New Presentation</span>
          </button>
        </div>
      </div>

      {/* ── QUICK OVERVIEW METRICS BANNER ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-zinc-900/60 border border-zinc-200/80 dark:border-zinc-800/80 shadow-2xs">
          <div className="flex items-center justify-between text-zinc-400 mb-2">
            <span className="text-xs font-semibold">Total Presentations</span>
            <FileText className="w-4 h-4 text-zinc-500" />
          </div>
          <div className="text-2xl font-bold text-zinc-900 dark:text-white">
            {totalDecksCount}
          </div>
          <div className="text-[11px] text-zinc-400 dark:text-zinc-500 mt-0.5">
            Active in workspace
          </div>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-zinc-900/60 border border-zinc-200/80 dark:border-zinc-800/80 shadow-2xs">
          <div className="flex items-center justify-between text-zinc-400 mb-2">
            <span className="text-xs font-semibold">Live Sessions</span>
            <Radio className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-bold text-zinc-900 dark:text-white flex items-center gap-2">
            {liveSessionsCount}
            {liveSessionsCount > 0 && (
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
            )}
          </div>
          <div className="text-[11px] text-zinc-400 dark:text-zinc-500 mt-0.5">
            Broadcasting live
          </div>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-zinc-900/60 border border-zinc-200/80 dark:border-zinc-800/80 shadow-2xs">
          <div className="flex items-center justify-between text-zinc-400 mb-2">
            <span className="text-xs font-semibold">Total Slides</span>
            <Layers className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="text-2xl font-bold text-zinc-900 dark:text-white">
            {totalSlidesCount}
          </div>
          <div className="text-[11px] text-zinc-400 dark:text-zinc-500 mt-0.5">
            Interactive slide steps
          </div>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-zinc-900/60 border border-zinc-200/80 dark:border-zinc-800/80 shadow-2xs">
          <div className="flex items-center justify-between text-zinc-400 mb-2">
            <span className="text-xs font-semibold">Audience Reached</span>
            <Users className="w-4 h-4 text-purple-500" />
          </div>
          <div className="text-2xl font-bold text-zinc-900 dark:text-white">
            {totalAudienceCount}
          </div>
          <div className="text-[11px] text-zinc-400 dark:text-zinc-500 mt-0.5">
            Session participants
          </div>
        </div>
      </div>

      {/* ── CONTROLS & FILTER BAR ── */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pt-2">
        {/* Search & Status */}
        <div className="flex flex-col sm:flex-row items-center gap-3 flex-1">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
            <input
              type="text"
              placeholder="Search presentations..."
              className="w-full pl-10 pr-9 py-2.5 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-xs sm:text-sm text-zinc-900 dark:text-white placeholder:text-zinc-400 focus:outline-hidden focus:ring-2 focus:ring-zinc-950 dark:focus:ring-white transition-all shadow-2xs"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-zinc-400 hover:text-zinc-600 dark:hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Status Dropdown */}
          <select
            className="w-full sm:w-44 py-2.5 px-3 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-xs sm:text-sm text-zinc-700 dark:text-zinc-300 focus:outline-hidden focus:ring-2 focus:ring-zinc-950 dark:focus:ring-white transition-all shadow-2xs cursor-pointer"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">All Statuses</option>
            <option value="live">🔴 Live Now</option>
            <option value="published">Published</option>
            <option value="draft">Drafts</option>
            <option value="completed">Completed</option>
            <option value="archived">Archived</option>
          </select>

          {/* Sort Dropdown */}
          <select
            className="w-full sm:w-44 py-2.5 px-3 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-xs sm:text-sm text-zinc-700 dark:text-zinc-300 focus:outline-hidden focus:ring-2 focus:ring-zinc-950 dark:focus:ring-white transition-all shadow-2xs cursor-pointer"
            value={sortOption}
            onChange={(e) => setSortOption(e.target.value)}
          >
            <option value="updatedAt">Recently Updated</option>
            <option value="createdAt">Newly Created</option>
            <option value="alphabetical">Alphabetical (A-Z)</option>
          </select>
        </div>

        {/* View Switch: Grid vs Timeline Stream */}
        <div className="flex items-center gap-1 p-1 rounded-2xl bg-zinc-100 dark:bg-zinc-800 border border-zinc-200/80 dark:border-zinc-700/80 self-start sm:self-auto shrink-0">
          <button
            onClick={() => setViewMode("grid")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              viewMode === "grid"
                ? "bg-white dark:bg-zinc-900 text-zinc-950 dark:text-white shadow-xs"
                : "text-zinc-500 hover:text-zinc-900 dark:hover:text-white"
            }`}
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            <span>Deck Grid</span>
          </button>
          <button
            onClick={() => setViewMode("timeline")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              viewMode === "timeline"
                ? "bg-white dark:bg-zinc-900 text-zinc-950 dark:text-white shadow-xs"
                : "text-zinc-500 hover:text-zinc-900 dark:hover:text-white"
            }`}
          >
            <History className="w-3.5 h-3.5 text-indigo-500" />
            <span>Activity Timeline</span>
          </button>
        </div>
      </div>

      {/* Category Pills Bar */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar text-xs">
        <span className="text-zinc-400 font-medium mr-1 flex items-center gap-1 shrink-0">
          <Filter className="w-3 h-3" /> Category:
        </span>
        {[
          "All",
          "General",
          "Workshop",
          "Education",
          "Business",
          "Pitch",
          "Tech",
        ].map((cat) => (
          <button
            key={cat}
            onClick={() => setCategoryFilter(cat)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
              categoryFilter === cat
                ? "bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 shadow-2xs font-bold"
                : "bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* ── PRESENTATIONS MAIN CONTENT ── */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-28 gap-3">
          <div className="w-10 h-10 border-2 border-zinc-950 dark:border-white border-t-transparent rounded-full animate-spin"></div>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">
            Loading presentation decks &amp; slide thumbnails...
          </p>
        </div>
      ) : presentations.length === 0 ? (
        <div className="text-center py-20 border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-3xl bg-zinc-50/50 dark:bg-zinc-900/30">
          <div className="w-16 h-16 bg-zinc-100 dark:bg-zinc-800 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-zinc-200 dark:border-zinc-700 shadow-xs">
            <FileText className="w-8 h-8 text-zinc-700 dark:text-zinc-200" />
          </div>
          <h3 className="text-lg font-bold text-zinc-950 dark:text-white">
            No presentations found
          </h3>
          <p className="text-zinc-500 dark:text-zinc-400 mt-1 max-w-sm mx-auto mb-6 text-xs sm:text-sm">
            {debouncedSearch ||
            statusFilter !== "all" ||
            categoryFilter !== "All"
              ? "Try adjusting your search queries or filter pills."
              : "Get started by building your first interactive slide presentation."}
          </p>
          <button
            onClick={handleCreate}
            className="btn btn-primary text-xs sm:text-sm"
          >
            <Plus className="w-4 h-4 mr-1.5" />
            Create Presentation
          </button>
        </div>
      ) : viewMode === "grid" ? (
        /* ── GRID VIEW WITH INTERACTIVE THUMBNAILS & THUMBLINE ── */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {presentations.map((p) => (
            <PresentationCard
              key={p._id}
              presentation={p}
              onOpenTimeline={(id, title) =>
                setTimelineModalData({ id, title })
              }
              onGenerateReport={handleGenerateReport}
              onDelete={(id, title) => setDeleteModalData({ id, title })}
              onDuplicate={handleDuplicatePresentation}
              isGeneratingReport={generatingReportId === p._id}
              generatingSeconds={generatingSeconds}
            />
          ))}
        </div>
      ) : (
        /* ── TIMELINE STREAM VIEW ACROSS ALL PRESENTATIONS ── */
        <div className="bg-white dark:bg-zinc-900/60 border border-zinc-200/80 dark:border-zinc-800/80 rounded-3xl p-6 sm:p-8 shadow-xs">
          <div className="flex items-center justify-between pb-6 mb-6 border-b border-zinc-100 dark:border-zinc-800">
            <div>
              <h3 className="text-lg font-bold text-zinc-950 dark:text-white">
                Workspace Presentation Timeline
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                Chronological timeline of decks, active live sessions, and
                milestone updates.
              </p>
            </div>
            <span className="text-xs font-bold text-zinc-400 font-mono">
              {presentations.length} Decks Listed
            </span>
          </div>

          <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-zinc-200 dark:before:bg-zinc-800">
            {presentations.map((p, idx) => {
              const isLive = p.status === "live" || p.liveSession;
              return (
                <div key={p._id || idx} className="relative group">
                  {/* Timeline dot */}
                  <div
                    className={`absolute -left-6 top-1.5 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all shadow-xs ${
                      isLive
                        ? "bg-emerald-500 border-emerald-400 animate-pulse text-white"
                        : "bg-white dark:bg-zinc-900 border-zinc-300 dark:border-zinc-700 text-zinc-500 group-hover:border-zinc-900 dark:group-hover:border-white"
                    }`}
                  >
                    {isLive ? (
                      <Radio className="w-2.5 h-2.5" />
                    ) : (
                      <Clock className="w-2.5 h-2.5" />
                    )}
                  </div>

                  {/* Timeline Event Card */}
                  <div className="p-4 sm:p-5 rounded-2xl bg-zinc-50 dark:bg-zinc-850/50 border border-zinc-200/70 dark:border-zinc-800/80 hover:border-zinc-300 dark:hover:border-zinc-700 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-1 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span
                          className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                            isLive
                              ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30 font-bold"
                              : "bg-zinc-200/60 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-700"
                          }`}
                        >
                          {isLive ? "Live Session" : p.status || "Deck"}
                        </span>
                        <span className="text-xs text-zinc-400 font-mono">
                          {new Date(p.updatedAt).toLocaleDateString(undefined, {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </span>
                        <span className="text-xs text-zinc-400">
                          • {p.category || "General"}
                        </span>
                      </div>

                      <h4 className="text-base font-bold text-zinc-950 dark:text-white">
                        {p.title}
                      </h4>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400 line-clamp-1">
                        {p.description || "No description provided."}
                      </p>

                      <div className="flex items-center gap-3 pt-1 text-xs text-zinc-400">
                        <span className="flex items-center gap-1">
                          <Layers className="w-3.5 h-3.5" />
                          <span>{p.slideCount || 0} slides</span>
                        </span>
                        <span className="flex items-center gap-1">
                          <Users className="w-3.5 h-3.5" />
                          <span>{p.totalParticipants || 0} attendees</span>
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() =>
                          setTimelineModalData({ id: p._id, title: p.title })
                        }
                        className="px-3 py-1.5 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 rounded-xl text-xs font-bold transition-all border border-zinc-200 dark:border-zinc-700 cursor-pointer flex items-center gap-1.5"
                      >
                        <Clock className="w-3.5 h-3.5 text-indigo-500" />
                        <span>View Timeline</span>
                      </button>

                      <Link
                        href={`/presentations/${p._id}/edit`}
                        className="px-3 py-1.5 bg-zinc-950 hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-200 text-white dark:text-zinc-950 rounded-xl text-xs font-bold transition-all cursor-pointer"
                      >
                        Open Editor
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── PAGINATION CONTROLS ── */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-4">
          <button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="px-3.5 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 text-xs font-bold text-zinc-700 dark:text-zinc-300 disabled:opacity-40 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          >
            Previous
          </button>
          <span className="text-xs font-medium text-zinc-500 px-2 font-mono">
            Page {currentPage} of {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="px-3.5 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 text-xs font-bold text-zinc-700 dark:text-zinc-300 disabled:opacity-40 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          >
            Next
          </button>
        </div>
      )}

      {/* ── TIMELINE MODAL ── */}
      {timelineModalData && (
        <PresentationTimelineModal
          presentationId={timelineModalData.id}
          presentationTitle={timelineModalData.title}
          isOpen={!!timelineModalData}
          onClose={() => setTimelineModalData(null)}
        />
      )}

      {/* ── DELETE CONFIRMATION MODAL ── */}
      {deleteModalData && (
        <PresentationDeleteModal
          isOpen={!!deleteModalData}
          title={deleteModalData.title}
          isDeleting={isDeleting}
          onConfirm={handleConfirmDelete}
          onCancel={() => setDeleteModalData(null)}
        />
      )}

      {/* ── GENERATED REPORT RESULT MODAL ── */}
      {generatedReportModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in"
          onClick={() => setGeneratedReportModal(null)}
        >
          <div
            className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl relative space-y-5 animate-scale-in"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setGeneratedReportModal(null)}
              className="absolute top-4 right-4 p-2 text-zinc-400 hover:text-zinc-600 dark:hover:text-white rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="w-14 h-14 rounded-2xl bg-emerald-500/15 text-emerald-500 border border-emerald-500/30 flex items-center justify-center mx-auto shadow-xs">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div className="text-center space-y-1">
              <h3 className="text-lg sm:text-xl font-bold text-zinc-950 dark:text-white">
                Intelligence Report Ready
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
                Generated in{" "}
                <strong className="font-mono text-zinc-900 dark:text-zinc-100">
                  {generatedReportModal.elapsed}s
                </strong>{" "}
                for &ldquo;{generatedReportModal.presentationTitle}&rdquo;
              </p>
            </div>

            <div className="p-4 bg-zinc-50 dark:bg-zinc-850/60 border border-zinc-200 dark:border-zinc-750 rounded-2xl text-xs space-y-2 text-zinc-600 dark:text-zinc-300">
              <div className="flex items-center justify-between font-medium">
                <span>User-Wise Breakdown</span>
                <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                  Included ✓
                </span>
              </div>
              <div className="flex items-center justify-between font-medium">
                <span>Knowledge Base Indexing</span>
                <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                  Saved ✓
                </span>
              </div>
              <div className="flex items-center justify-between font-medium">
                <span>Format</span>
                <span className="font-mono font-bold uppercase">
                  PDF Document
                </span>
              </div>
            </div>

            <div className="space-y-2 pt-1">
              {generatedReportModal.fileUrl && (
                <a
                  href={generatedReportModal.fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-3 bg-zinc-950 hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-200 text-white dark:text-zinc-950 font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition-all shadow-xs"
                >
                  <Download className="w-4 h-4" />
                  <span>Download PDF Report</span>
                </a>
              )}

              <Link
                href="/files"
                className="w-full py-2.5 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-750 text-zinc-900 dark:text-zinc-100 font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition-all border border-zinc-200 dark:border-zinc-700"
              >
                <FileText className="w-4 h-4 text-zinc-500" />
                <span>Open in Knowledge Base</span>
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
