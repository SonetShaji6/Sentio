"use client";

import React, { useEffect, useState } from "react";
import { getAccessToken, API_URL } from "@/lib/auth";
import {
  FileText,
  Upload,
  Search,
  Download,
  Trash2,
  Eye,
  History,
  FileCode,
  Image as ImageIcon,
  Presentation as PresentationIcon,
  X,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Clock,
  Sparkles,
} from "lucide-react";

export default function FileLibraryPage() {
  const [files, setFiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");

  // Modal states
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadCategory, setUploadCategory] = useState<string>("document");
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Preview Drawer state
  const [selectedFileForPreview, setSelectedFileForPreview] = useState<
    any | null
  >(null);

  // Version History state
  const [selectedFileForVersion, setSelectedFileForVersion] = useState<
    any | null
  >(null);
  const [versionHistory, setVersionHistory] = useState<any[]>([]);
  const [versionFile, setVersionFile] = useState<File | null>(null);
  const [uploadingVersion, setUploadingVersion] = useState(false);

  const fetchFiles = async () => {
    setLoading(true);
    try {
      const token = getAccessToken();
      let url = `${API_URL}/api/files`;
      if (searchQuery.trim()) {
        url = `${API_URL}/api/files/search?q=${encodeURIComponent(searchQuery)}`;
      } else if (categoryFilter !== "all") {
        url = `${API_URL}/api/files?category=${categoryFilter}`;
      }

      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        const data = await res.json();
        setFiles(data);
      }
    } catch (err) {
      console.error("Failed to load files:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchFiles();
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery, categoryFilter]);

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadFile) return;

    setUploading(true);
    setUploadError(null);

    try {
      const token = getAccessToken();
      const formData = new FormData();
      formData.append("file", uploadFile);
      formData.append("category", uploadCategory);

      const res = await fetch(`${API_URL}/api/files/upload`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Failed to upload file");
      }

      setIsUploadOpen(false);
      setUploadFile(null);
      fetchFiles();
    } catch (err: any) {
      setUploadError(err.message || "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const handleUploadVersionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!versionFile || !selectedFileForVersion) return;

    setUploadingVersion(true);
    try {
      const token = getAccessToken();
      const formData = new FormData();
      formData.append("file", versionFile);

      const res = await fetch(
        `${API_URL}/api/files/${selectedFileForVersion._id}/version`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
          body: formData,
        },
      );

      if (res.ok) {
        setVersionFile(null);
        fetchVersionHistory(selectedFileForVersion._id);
        fetchFiles();
      }
    } catch (err) {
      console.error("Failed to upload new version:", err);
    } finally {
      setUploadingVersion(false);
    }
  };

  const fetchVersionHistory = async (fileId: string) => {
    try {
      const token = getAccessToken();
      const res = await fetch(`${API_URL}/api/files/${fileId}/versions`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setVersionHistory(await res.json());
      }
    } catch (err) {
      console.error("Failed to fetch version history", err);
    }
  };

  const handleDelete = async (fileId: string) => {
    if (!confirm("Are you sure you want to delete this file?")) return;
    try {
      const token = getAccessToken();
      const res = await fetch(`${API_URL}/api/files/${fileId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setFiles((prev) => prev.filter((f) => f._id !== fileId));
      }
    } catch (err) {
      console.error("Failed to delete file", err);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-white p-6 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              📁 File Management & Knowledge Base
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Store presentation materials, extract document knowledge, and
              manage versioned files.
            </p>
          </div>

          <button
            onClick={() => setIsUploadOpen(true)}
            className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm rounded-xl transition-colors shadow-sm flex items-center gap-2 w-fit"
          >
            <Upload className="w-4 h-4" /> Upload File
          </button>
        </div>

        {/* Search & Category Filter Bar */}
        <div className="bg-white dark:bg-gray-900 p-4 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm flex flex-col md:flex-row gap-4 justify-between items-center">
          <div className="relative w-full md:w-96">
            <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search filenames or extracted text content..."
              className="w-full pl-9 pr-4 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="flex flex-wrap gap-2 w-full md:w-auto">
            {["all", "presentation", "document", "image", "reference"].map(
              (cat) => (
                <button
                  key={cat}
                  onClick={() => setCategoryFilter(cat)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all ${
                    categoryFilter === cat
                      ? "bg-indigo-600 text-white"
                      : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700"
                  }`}
                >
                  {cat}
                </button>
              ),
            )}
          </div>
        </div>

        {/* Files Grid */}
        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
          </div>
        ) : files.length === 0 ? (
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-12 text-center">
            <FileText className="w-12 h-12 text-gray-300 dark:text-gray-700 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-gray-800 dark:text-gray-200">
              No Files Found
            </h3>
            <p className="text-sm text-gray-500 mt-1 max-w-sm mx-auto">
              Upload PDF, PowerPoint, Word, or reference documents to build your
              Knowledge Base.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {files.map((file) => (
              <div
                key={file._id}
                className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="p-3 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-xl">
                      {getFileIcon(file.mimeType)}
                    </div>

                    <div className="flex items-center gap-1.5">
                      <span className="px-2 py-0.5 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 text-[10px] font-bold rounded-md uppercase">
                        v{file.version}
                      </span>
                      <ExtractionBadge status={file.extractionStatus} />
                    </div>
                  </div>

                  <h4
                    className="font-bold text-gray-900 dark:text-white text-sm line-clamp-1"
                    title={file.originalName}
                  >
                    {file.originalName}
                  </h4>

                  <p className="text-xs text-gray-400 mt-1">
                    {(file.size / (1024 * 1024)).toFixed(2)} MB •{" "}
                    {new Date(file.createdAt).toLocaleDateString()}
                  </p>

                  {file.extractedMetadata?.wordCount ? (
                    <div className="mt-3 text-xs text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/20 px-2.5 py-1 rounded-md w-fit flex items-center gap-1">
                      <Sparkles className="w-3 h-3" /> Extracted{" "}
                      {file.extractedMetadata.wordCount} words
                    </div>
                  ) : null}
                </div>

                <div className="flex items-center justify-between pt-4 mt-4 border-t border-gray-100 dark:border-gray-800 text-xs">
                  <div className="flex items-center gap-2">
                    {file.extractedText && (
                      <button
                        onClick={() => setSelectedFileForPreview(file)}
                        className="p-1.5 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg flex items-center gap-1 font-medium"
                        title="View Extracted Knowledge"
                      >
                        <Eye className="w-3.5 h-3.5" /> Text
                      </button>
                    )}

                    <button
                      onClick={() => {
                        setSelectedFileForVersion(file);
                        fetchVersionHistory(file._id);
                      }}
                      className="p-1.5 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg flex items-center gap-1 font-medium"
                      title="Version History"
                    >
                      <History className="w-3.5 h-3.5" /> Versions
                    </button>
                  </div>

                  <div className="flex items-center gap-1">
                    <a
                      href={file.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1.5 text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-lg font-medium flex items-center gap-1"
                      title="Download"
                    >
                      <Download className="w-3.5 h-3.5" />
                    </a>

                    <button
                      onClick={() => handleDelete(file._id)}
                      className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg"
                      title="Delete"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Upload File Modal */}
      {isUploadOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl max-w-md w-full p-6 shadow-2xl relative">
            <button
              onClick={() => setIsUploadOpen(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
              <Upload className="w-5 h-5 text-indigo-600" /> Upload Material
            </h3>

            {uploadError && (
              <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-lg text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4" /> {uploadError}
              </div>
            )}

            <form onSubmit={handleUploadSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">
                  Select File (Max 25MB)
                </label>
                <input
                  type="file"
                  onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                  className="w-full p-2 border border-gray-200 dark:border-gray-700 rounded-xl text-sm bg-gray-50 dark:bg-gray-800"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">
                  Category
                </label>
                <select
                  value={uploadCategory}
                  onChange={(e) => setUploadCategory(e.target.value)}
                  className="w-full p-2.5 border border-gray-200 dark:border-gray-700 rounded-xl text-sm bg-gray-50 dark:bg-gray-800 outline-none"
                >
                  <option value="document">Document (PDF, Word, TXT)</option>
                  <option value="presentation">Presentation (PPTX)</option>
                  <option value="image">Image (PNG, JPG)</option>
                  <option value="reference">Reference Material</option>
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 dark:border-gray-800">
                <button
                  type="button"
                  onClick={() => setIsUploadOpen(false)}
                  className="px-4 py-2 text-sm text-gray-500 hover:bg-gray-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={uploading || !uploadFile}
                  className="px-5 py-2 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg flex items-center gap-2 disabled:opacity-50"
                >
                  {uploading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    "Upload & Ingest"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Extracted Text Preview Drawer */}
      {selectedFileForPreview && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-xs">
          <div className="bg-white dark:bg-gray-900 border-l border-gray-200 dark:border-gray-800 w-full max-w-xl h-full p-6 flex flex-col shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-gray-200 dark:border-gray-800">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-indigo-600" />
                <h3 className="font-bold text-lg line-clamp-1">
                  {selectedFileForPreview.originalName}
                </h3>
              </div>
              <button
                onClick={() => setSelectedFileForPreview(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="py-3 text-xs text-gray-500 border-b border-gray-100 dark:border-gray-800 flex gap-4">
              <span>
                Status:{" "}
                <strong>{selectedFileForPreview.extractionStatus}</strong>
              </span>
              <span>
                Word Count:{" "}
                <strong>
                  {selectedFileForPreview.extractedMetadata?.wordCount || 0}
                </strong>
              </span>
            </div>

            <div className="flex-1 overflow-y-auto mt-4 p-4 bg-gray-50 dark:bg-gray-950 rounded-xl font-mono text-xs text-gray-800 dark:text-gray-200 whitespace-pre-wrap leading-relaxed">
              {selectedFileForPreview.extractedText ||
                "No text content was extracted from this file."}
            </div>
          </div>
        </div>
      )}

      {/* Version History Modal */}
      {selectedFileForVersion && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl relative">
            <button
              onClick={() => setSelectedFileForVersion(null)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-bold mb-1 flex items-center gap-2">
              <History className="w-5 h-5 text-indigo-600" /> Version History
            </h3>
            <p className="text-xs text-gray-500 mb-4">
              {selectedFileForVersion.originalName}
            </p>

            {/* Upload new version */}
            <form
              onSubmit={handleUploadVersionSubmit}
              className="mb-6 p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl border border-indigo-100 dark:border-indigo-900/40"
            >
              <label className="block text-xs font-bold text-indigo-900 dark:text-indigo-300 mb-2">
                Upload New Version
              </label>
              <div className="flex gap-2">
                <input
                  type="file"
                  onChange={(e) => setVersionFile(e.target.files?.[0] || null)}
                  className="flex-1 text-xs bg-white dark:bg-gray-800 p-2 rounded-lg border border-gray-200 dark:border-gray-700"
                  required
                />
                <button
                  type="submit"
                  disabled={uploadingVersion || !versionFile}
                  className="px-3 py-2 bg-indigo-600 text-white font-bold text-xs rounded-lg disabled:opacity-50"
                >
                  {uploadingVersion
                    ? "Uploading..."
                    : "Save v" + (selectedFileForVersion.version + 1)}
                </button>
              </div>
            </form>

            <div className="space-y-3 max-h-60 overflow-y-auto">
              {versionHistory.map((v) => (
                <div
                  key={v._id}
                  className="p-3 bg-gray-50 dark:bg-gray-800 rounded-xl flex items-center justify-between text-xs"
                >
                  <div>
                    <span className="font-bold text-indigo-600 dark:text-indigo-400">
                      v{v.version}
                    </span>
                    <span className="ml-2 text-gray-700 dark:text-gray-300">
                      {v.originalName}
                    </span>
                    {v.isLatestVersion && (
                      <span className="ml-2 px-1.5 py-0.5 bg-emerald-100 text-emerald-700 text-[10px] font-bold rounded">
                        Current
                      </span>
                    )}
                  </div>
                  <a
                    href={v.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-indigo-600 hover:underline"
                  >
                    Download
                  </a>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function getFileIcon(mimeType: string) {
  if (mimeType.includes("presentation"))
    return <PresentationIcon className="w-5 h-5" />;
  if (mimeType.startsWith("image/")) return <ImageIcon className="w-5 h-5" />;
  if (mimeType.includes("pdf")) return <FileText className="w-5 h-5" />;
  return <FileCode className="w-5 h-5" />;
}

function ExtractionBadge({ status }: { status: string }) {
  if (status === "COMPLETED") {
    return (
      <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 text-[10px] font-bold rounded-full flex items-center gap-1">
        <CheckCircle2 className="w-3 h-3" /> Ingested
      </span>
    );
  }
  if (status === "PENDING") {
    return (
      <span className="px-2 py-0.5 bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 text-[10px] font-bold rounded-full flex items-center gap-1 animate-pulse">
        <Clock className="w-3 h-3" /> Processing
      </span>
    );
  }
  return (
    <span className="px-2 py-0.5 bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400 text-[10px] font-bold rounded-full">
      No Text
    </span>
  );
}
