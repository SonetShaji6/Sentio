"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
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
  ArrowRight,
} from "lucide-react";

export default function FileLibraryPage() {
  const router = useRouter();
  const [files, setFiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");

  // Modal states
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadCategory, setUploadCategory] = useState<string>("document");
  const [autoConvert, setAutoConvert] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Conversion state
  const [convertingFileId, setConvertingFileId] = useState<string | null>(null);
  const [convertStatus, setConvertStatus] = useState<string | null>(null);

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

  const handleConvertToPresentation = async (fileId: string) => {
    setConvertingFileId(fileId);
    setConvertStatus(
      "Analyzing material & generating Sentio presentation with Gemini AI...",
    );

    try {
      const token = getAccessToken();
      const res = await fetch(
        `${API_URL}/api/files/${fileId}/convert-presentation`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ tone: "engaging" }),
        },
      );

      const data = await res.json();
      if (!res.ok) {
        throw new Error(
          data.message || "Failed to convert file to presentation",
        );
      }

      setConvertStatus(
        "Presentation generated successfully! Opening editor...",
      );
      fetchFiles();
      setTimeout(() => {
        router.push(`/presentations/${data.presentation._id}/edit`);
      }, 1000);
    } catch (err: any) {
      alert(err.message || "Presentation already exists for this file.");
      setConvertingFileId(null);
      setConvertStatus(null);
      fetchFiles();
    }
  };

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

      if (autoConvert && data._id) {
        handleConvertToPresentation(data._id);
      }
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
    <div className="min-h-screen bg-zinc-50/50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 p-6 md:p-8 animate-fade-in">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2 text-zinc-950 dark:text-white tracking-tight">
              <FileText className="w-6 h-6 text-zinc-900 dark:text-zinc-100" />{" "}
              File Library & Knowledge Base
            </h1>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
              Store presentation materials, extract document knowledge, and
              convert files to interactive decks.
            </p>
          </div>

          <button
            onClick={() => setIsUploadOpen(true)}
            className="px-4 py-2.5 bg-zinc-900 hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-200 text-white dark:text-zinc-950 font-bold text-sm rounded-xl transition-all shadow-xs flex items-center gap-2 w-fit cursor-pointer active-press hover-lift"
          >
            <Upload className="w-4 h-4" /> Upload File
          </button>
        </div>

        {/* Search & Category Filter Bar */}
        <div className="bg-white dark:bg-zinc-900/80 p-4 rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 shadow-xs flex flex-col md:flex-row gap-4 justify-between items-center">
          <div className="relative w-full md:w-96">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search filenames or extracted text content..."
              className="w-full pl-9 pr-4 py-2 bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700/80 rounded-xl text-xs outline-none focus:border-zinc-950 dark:focus:border-white transition-colors"
            />
          </div>

          <div className="flex flex-wrap gap-1.5 w-full md:w-auto">
            {["all", "presentation", "document", "image", "reference"].map(
              (cat) => (
                <button
                  key={cat}
                  onClick={() => setCategoryFilter(cat)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold capitalize transition-all cursor-pointer ${
                    categoryFilter === cat
                      ? "bg-zinc-900 text-white dark:bg-white dark:text-zinc-950 shadow-xs scale-100"
                      : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700 hover:text-zinc-900 dark:hover:text-white"
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
            <Loader2 className="w-8 h-8 animate-spin text-zinc-900 dark:text-zinc-100" />
          </div>
        ) : files.length === 0 ? (
          <div className="bg-white dark:bg-zinc-900/80 border border-zinc-200/80 dark:border-zinc-800/80 rounded-3xl p-12 text-center shadow-sm">
            <FileText className="w-12 h-12 text-zinc-300 dark:text-zinc-700 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
              No Files Found
            </h3>
            <p className="text-sm text-zinc-500 mt-1 max-w-sm mx-auto">
              Upload PDF, PowerPoint, Word, or reference documents to build your
              Knowledge Base.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {files.map((file) => (
              <div
                key={file._id}
                className="bg-white dark:bg-zinc-900/80 border border-zinc-200/80 dark:border-zinc-800/80 rounded-3xl p-5 shadow-sm hover-lift hover:border-zinc-300 dark:hover:border-zinc-700 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="p-3 bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 rounded-2xl">
                      {getFileIcon(file.mimeType)}
                    </div>

                    <div className="flex items-center gap-1.5">
                      <span className="px-2 py-0.5 bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700 text-[10px] font-bold rounded-full uppercase">
                        v{file.version}
                      </span>
                      <ExtractionBadge status={file.extractionStatus} />
                    </div>
                  </div>

                  <h4
                    className="font-bold text-zinc-950 dark:text-white text-sm line-clamp-1"
                    title={file.originalName}
                  >
                    {file.originalName}
                  </h4>

                  <p className="text-xs text-zinc-400 mt-1">
                    {(file.size / (1024 * 1024)).toFixed(2)} MB •{" "}
                    {new Date(file.createdAt).toLocaleDateString()}
                  </p>

                  {file.extractedMetadata?.wordCount ? (
                    <div className="mt-3 text-xs text-zinc-700 dark:text-zinc-300 bg-zinc-100 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700/60 px-2.5 py-1 rounded-xl w-fit flex items-center gap-1.5 font-medium">
                      <Sparkles className="w-3 h-3 text-amber-500" /> Extracted{" "}
                      {file.extractedMetadata.wordCount} words
                    </div>
                  ) : null}
                </div>

                <div className="pt-3.5 mt-3.5 border-t border-zinc-100 dark:border-zinc-800/80">
                  {file.extractedText &&
                    (file.presentationId ? (
                      <Link
                        href={`/presentations/${file.presentationId}/edit`}
                        className="w-full mb-3 px-3.5 py-2 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-900 dark:text-zinc-100 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs transition-all border border-zinc-200 dark:border-zinc-700/80 active-press hover-lift"
                        title="Presentation already exists. Click to open presentation in editor."
                      >
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                        <span>Presentation Already Exists</span>
                      </Link>
                    ) : (
                      <button
                        onClick={() => handleConvertToPresentation(file._id)}
                        disabled={convertingFileId === file._id}
                        className="w-full mb-3 px-3.5 py-2 bg-zinc-900 hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-200 text-white dark:text-zinc-950 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs transition-all disabled:opacity-50 active-press cursor-pointer"
                        title="Generate interactive Sentio presentation deck with AI"
                      >
                        {convertingFileId === file._id ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            <span>Generating Deck...</span>
                          </>
                        ) : (
                          <>
                            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                            <span>Convert to Presentation</span>
                          </>
                        )}
                      </button>
                    ))}

                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5">
                      {file.extractedText && (
                        <button
                          onClick={() => setSelectedFileForPreview(file)}
                          className="px-2.5 py-1 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg flex items-center gap-1 font-bold text-xs transition-colors"
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
                        className="px-2.5 py-1 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg flex items-center gap-1 font-bold text-xs transition-colors"
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
                        className="p-1.5 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg font-medium flex items-center gap-1 transition-colors"
                        title="Download"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </a>

                      <button
                        onClick={() => handleDelete(file._id)}
                        className="p-1.5 text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition-colors cursor-pointer"
                        title="Delete"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Converting Progress Overlay */}
      {convertingFileId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl max-w-sm w-full p-6 text-center shadow-2xl space-y-4 animate-scale-in">
            <div className="w-14 h-14 bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 rounded-2xl flex items-center justify-center mx-auto shadow-xs">
              <Sparkles className="w-7 h-7 animate-pulse text-amber-400" />
            </div>
            <div>
              <h3 className="text-base font-bold text-zinc-950 dark:text-white">
                Converting Document
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 leading-relaxed">
                {convertStatus || "Processing with Gemini AI..."}
              </p>
            </div>
            <div className="flex items-center justify-center gap-2 text-xs font-semibold text-zinc-700 dark:text-zinc-300">
              <Loader2 className="w-4 h-4 animate-spin text-zinc-900 dark:text-white" />
              <span>Building slides, quizzes & polls</span>
            </div>
          </div>
        </div>
      )}

      {/* Upload File Modal */}
      {isUploadOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl max-w-md w-full p-6 shadow-2xl relative animate-scale-in">
            <button
              onClick={() => setIsUploadOpen(false)}
              className="absolute top-5 right-5 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 p-1 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-bold mb-4 flex items-center gap-2 text-zinc-950 dark:text-white">
              <Upload className="w-5 h-5 text-zinc-950 dark:text-white" />{" "}
              Upload Material
            </h3>

            {uploadError && (
              <div className="mb-4 p-3 bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 rounded-xl text-xs flex items-center gap-2 border border-red-200 dark:border-red-900/40">
                <AlertCircle className="w-4 h-4 shrink-0" /> {uploadError}
              </div>
            )}

            <form onSubmit={handleUploadSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-500 mb-1">
                  Select File (Max 25MB)
                </label>
                <input
                  type="file"
                  onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                  className="w-full p-2.5 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs bg-zinc-50 dark:bg-zinc-800/80 outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-500 mb-1">
                  Category
                </label>
                <select
                  value={uploadCategory}
                  onChange={(e) => setUploadCategory(e.target.value)}
                  className="w-full p-2.5 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs bg-zinc-50 dark:bg-zinc-800 outline-none focus:border-zinc-950 dark:focus:border-white transition-colors"
                >
                  <option value="document">Document (PDF, Word, TXT)</option>
                  <option value="presentation">Presentation (PPTX)</option>
                  <option value="image">Image (PNG, JPG)</option>
                  <option value="reference">Reference Material</option>
                </select>
              </div>

              <div className="pt-2">
                <label className="flex items-center gap-2 text-xs font-semibold text-zinc-700 dark:text-zinc-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={autoConvert}
                    onChange={(e) => setAutoConvert(e.target.checked)}
                    className="rounded border-zinc-300 text-zinc-900 focus:ring-zinc-900 w-4 h-4"
                  />
                  <span>🪄 Automatically convert to Sentio Presentation</span>
                </label>
              </div>

              <div className="flex justify-end gap-2.5 pt-4 border-t border-zinc-100 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={() => setIsUploadOpen(false)}
                  className="px-4 py-2.5 text-xs font-bold text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={uploading || !uploadFile}
                  className="px-5 py-2.5 text-xs font-bold text-white bg-zinc-900 hover:bg-zinc-800 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-200 rounded-xl flex items-center gap-2 disabled:opacity-50 cursor-pointer shadow-xs active-press transition-all"
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
        <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white dark:bg-zinc-900 border-l border-zinc-200 dark:border-zinc-800 w-full max-w-xl h-full p-6 flex flex-col shadow-2xl animate-scale-in">
            <div className="flex items-center justify-between pb-4 border-b border-zinc-200 dark:border-zinc-800">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-500" />
                <h3 className="font-bold text-base text-zinc-950 dark:text-white line-clamp-1">
                  {selectedFileForPreview.originalName}
                </h3>
              </div>
              <button
                onClick={() => setSelectedFileForPreview(null)}
                className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 p-1 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="py-3 text-xs text-zinc-500 border-b border-zinc-100 dark:border-zinc-800 flex justify-between items-center">
              <div className="flex gap-4">
                <span>
                  Status:{" "}
                  <strong className="text-zinc-800 dark:text-zinc-200">
                    {selectedFileForPreview.extractionStatus}
                  </strong>
                </span>
                <span>
                  Word Count:{" "}
                  <strong className="text-zinc-800 dark:text-zinc-200">
                    {selectedFileForPreview.extractedMetadata?.wordCount || 0}
                  </strong>
                </span>
              </div>

              {selectedFileForPreview.extractedText &&
                (selectedFileForPreview.presentationId ? (
                  <Link
                    href={`/presentations/${selectedFileForPreview.presentationId}/edit`}
                    className="px-3 py-1.5 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-900 dark:text-zinc-100 rounded-xl text-xs font-bold flex items-center gap-1.5 border border-zinc-200 dark:border-zinc-700/80 transition-all active-press"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />{" "}
                    View Deck
                  </Link>
                ) : (
                  <button
                    onClick={() => {
                      const id = selectedFileForPreview._id;
                      setSelectedFileForPreview(null);
                      handleConvertToPresentation(id);
                    }}
                    className="px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-200 text-white dark:text-zinc-950 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all active-press"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" /> Convert
                    to Deck
                  </button>
                ))}
            </div>

            <div className="flex-1 overflow-y-auto mt-4 p-4 bg-zinc-50 dark:bg-zinc-950 rounded-2xl font-mono text-xs text-zinc-800 dark:text-zinc-200 whitespace-pre-wrap leading-relaxed border border-zinc-200/60 dark:border-zinc-800/60">
              {selectedFileForPreview.extractedText ||
                "No text content was extracted from this file."}
            </div>
          </div>
        </div>
      )}

      {/* Version History Modal */}
      {selectedFileForVersion && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl max-w-lg w-full p-6 shadow-2xl relative animate-scale-in">
            <button
              onClick={() => setSelectedFileForVersion(null)}
              className="absolute top-5 right-5 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 p-1 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-bold mb-1 flex items-center gap-2 text-zinc-950 dark:text-white">
              <History className="w-5 h-5 text-zinc-900 dark:text-zinc-100" />{" "}
              Version History
            </h3>
            <p className="text-xs text-zinc-500 mb-4">
              {selectedFileForVersion.originalName}
            </p>

            {/* Upload new version */}
            <form
              onSubmit={handleUploadVersionSubmit}
              className="mb-6 p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl border border-zinc-200/80 dark:border-zinc-700/80"
            >
              <label className="block text-xs font-bold text-zinc-900 dark:text-zinc-100 mb-2">
                Upload New Version
              </label>
              <div className="flex gap-2">
                <input
                  type="file"
                  onChange={(e) => setVersionFile(e.target.files?.[0] || null)}
                  className="flex-1 text-xs bg-white dark:bg-zinc-800 p-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 outline-none"
                  required
                />
                <button
                  type="submit"
                  disabled={uploadingVersion || !versionFile}
                  className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-200 text-white dark:text-zinc-950 font-bold text-xs rounded-xl disabled:opacity-50 active-press transition-all"
                >
                  {uploadingVersion
                    ? "Uploading..."
                    : "Save v" + (selectedFileForVersion.version + 1)}
                </button>
              </div>
            </form>

            <div className="space-y-2.5 max-h-60 overflow-y-auto">
              {versionHistory.map((v) => (
                <div
                  key={v._id}
                  className="p-3 bg-zinc-50 dark:bg-zinc-800/70 border border-zinc-200/80 dark:border-zinc-700/80 rounded-2xl flex items-center justify-between text-xs"
                >
                  <div>
                    <span className="font-bold text-zinc-900 dark:text-zinc-100">
                      v{v.version}
                    </span>
                    <span className="ml-2 text-zinc-600 dark:text-zinc-400">
                      {v.originalName}
                    </span>
                    {v.isLatestVersion && (
                      <span className="ml-2 px-2 py-0.5 bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 text-[10px] font-bold rounded-full">
                        Current
                      </span>
                    )}
                  </div>
                  <a
                    href={v.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-zinc-900 dark:text-zinc-100 font-bold hover:underline"
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
      <span className="px-2.5 py-0.5 bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 text-[10px] font-bold rounded-full flex items-center gap-1 border border-emerald-200 dark:border-emerald-800/50">
        <CheckCircle2 className="w-3 h-3" /> Ingested
      </span>
    );
  }
  if (status === "PENDING") {
    return (
      <span className="px-2.5 py-0.5 bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300 text-[10px] font-bold rounded-full flex items-center gap-1 border border-amber-200 dark:border-amber-800/50 animate-pulse">
        <Clock className="w-3 h-3" /> Processing
      </span>
    );
  }
  return (
    <span className="px-2.5 py-0.5 bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400 text-[10px] font-bold rounded-full border border-zinc-200 dark:border-zinc-700/60">
      No Text
    </span>
  );
}
