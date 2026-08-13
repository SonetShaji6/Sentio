"use client";

import React, { useEffect, useState } from "react";
import { getAccessToken, API_URL } from "@/lib/auth";
import { FileText, Paperclip, Download, Upload, Loader2 } from "lucide-react";

interface PresentationFilesWidgetProps {
  presentationId: string;
}

export default function PresentationFilesWidget({
  presentationId,
}: PresentationFilesWidgetProps) {
  const [files, setFiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  const fetchFiles = async () => {
    setLoading(true);
    try {
      const token = getAccessToken();
      const res = await fetch(
        `${API_URL}/api/files?presentationId=${presentationId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      if (res.ok) {
        setFiles(await res.json());
      }
    } catch (err) {
      console.error("Failed to load presentation files", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (presentationId) fetchFiles();
  }, [presentationId]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const token = getAccessToken();
      const formData = new FormData();
      formData.append("file", file);
      formData.append("presentationId", presentationId);
      formData.append("category", "reference");

      const res = await fetch(`${API_URL}/api/files/upload`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      if (res.ok) {
        fetchFiles();
      }
    } catch (err) {
      console.error("Upload failed", err);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-5 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-sm text-gray-900 dark:text-white flex items-center gap-2">
          <Paperclip className="w-4 h-4 text-indigo-600" /> Attached Reference
          Files
        </h3>

        <label className="px-3 py-1.5 bg-indigo-50 dark:bg-indigo-900/30 hover:bg-indigo-100 text-indigo-600 dark:text-indigo-400 font-semibold text-xs rounded-lg cursor-pointer transition-colors flex items-center gap-1.5">
          {uploading ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Upload className="w-3.5 h-3.5" />
          )}
          <span>{uploading ? "Uploading..." : "Attach File"}</span>
          <input
            type="file"
            onChange={handleFileUpload}
            disabled={uploading}
            className="hidden"
          />
        </label>
      </div>

      {loading ? (
        <div className="py-4 text-center">
          <Loader2 className="w-5 h-5 animate-spin mx-auto text-gray-400" />
        </div>
      ) : files.length === 0 ? (
        <p className="text-xs text-gray-400 italic text-center py-4">
          No reference files attached yet.
        </p>
      ) : (
        <div className="space-y-2">
          {files.map((file) => (
            <div
              key={file._id}
              className="flex items-center justify-between p-2.5 bg-gray-50 dark:bg-gray-800/50 rounded-xl text-xs"
            >
              <div className="flex items-center gap-2 truncate">
                <FileText className="w-4 h-4 text-indigo-500 shrink-0" />
                <span className="font-medium text-gray-800 dark:text-gray-200 truncate">
                  {file.originalName}
                </span>
              </div>

              <a
                href={file.fileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="p-1 text-indigo-600 hover:bg-indigo-100 dark:hover:bg-indigo-900/40 rounded shrink-0"
                title="Download"
              >
                <Download className="w-3.5 h-3.5" />
              </a>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
