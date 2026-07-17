"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getAccessToken, API_URL } from "@/lib/auth";
import {
  Search,
  Plus,
  MoreVertical,
  FileText,
  Copy,
  Archive,
  Trash2,
  Edit,
} from "lucide-react";

export default function PresentationsPage() {
  const router = useRouter();
  const [presentations, setPresentations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [sortOption, setSortOption] = useState("newest");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isCreating, setIsCreating] = useState(false);

  const fetchPresentations = async () => {
    setLoading(true);
    const token = getAccessToken();
    if (!token) {
      router.replace("/login");
      return;
    }

    try {
      const params = new URLSearchParams();
      if (searchQuery) params.append("search", searchQuery);
      if (statusFilter !== "all" && statusFilter !== "")
        params.append("status", statusFilter);
      if (categoryFilter !== "All") params.append("category", categoryFilter);
      params.append("sort", sortOption);
      params.append("page", currentPage.toString());
      params.append("limit", "10");

      const res = await fetch(
        `${API_URL}/api/presentations?${params.toString()}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      if (res.ok) {
        const data = await res.json();
        setPresentations(data.presentations);
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
  }, [searchQuery, statusFilter, categoryFilter, sortOption, currentPage]);

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
      }
    } catch (error) {
      console.error("Failed to create presentation:", error);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Presentations
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Manage your interactive sessions and content.
          </p>
        </div>
        <button
          onClick={handleCreate}
          className="btn btn-primary flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          New Presentation
        </button>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 mb-8">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search presentations..."
            className="input-field pl-10 w-full"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select
          className="input-field w-full sm:w-48"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="">All Statuses</option>
          <option value="draft">Draft</option>
          <option value="published">Published</option>
          <option value="live">Live</option>
          <option value="completed">Completed</option>
          <option value="archived">Archived</option>
        </select>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : presentations.length === 0 ? (
        <div className="text-center py-20 border-2 border-dashed border-gray-200 dark:border-gray-800 rounded-xl">
          <div className="w-16 h-16 bg-blue-50 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
            <FileText className="w-8 h-8 text-blue-600 dark:text-blue-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            No presentations found
          </h3>
          <p className="text-gray-500 dark:text-gray-400 mt-2 max-w-sm mx-auto mb-6">
            Get started by creating your first interactive presentation.
          </p>
          <button onClick={handleCreate} className="btn btn-primary">
            Create Presentation
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {presentations.map((p) => (
            <div
              key={p._id}
              className="group border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden bg-white dark:bg-gray-900 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="h-40 bg-gray-100 dark:bg-gray-800 relative">
                {p.coverImage ? (
                  <img
                    src={p.coverImage}
                    alt={p.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400">
                    <FileText className="w-12 h-12 opacity-50" />
                  </div>
                )}
                <div className="absolute top-3 right-3 flex gap-2">
                  <span
                    className={`text-xs font-medium px-2.5 py-1 rounded-full shadow-sm backdrop-blur-sm ${
                      p.status === "live"
                        ? "bg-green-100/90 text-green-700"
                        : p.status === "published"
                          ? "bg-blue-100/90 text-blue-700"
                          : "bg-white/90 text-gray-700 dark:bg-gray-900/90 dark:text-gray-300"
                    }`}
                  >
                    {p.status}
                  </span>
                </div>
              </div>
              <div className="p-5">
                <h3
                  className="font-semibold text-gray-900 dark:text-white truncate"
                  title={p.title}
                >
                  {p.title}
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 line-clamp-2 min-h-10">
                  {p.description || "No description provided."}
                </p>
                <div className="mt-6 pt-4 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between">
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    Updated {new Date(p.updatedAt).toLocaleDateString()}
                  </span>
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/presentations/${p._id}/edit`}
                      className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Edit"
                    >
                      <Edit className="w-4 h-4" />
                    </Link>
                    {/* Add dropdown menu here in the future for Delete/Archive/Duplicate */}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
