"use client";

import React, { useEffect, useState } from "react";
import { getAccessToken, API_URL } from "@/lib/auth";
import {
  FileText,
  Download,
  Trash2,
  Mail,
  RefreshCw,
  CheckCircle2,
  Clock,
  AlertCircle,
} from "lucide-react";

interface ReportListPanelProps {
  sessionId?: string;
  presentationId?: string;
}

export default function ReportListPanel({
  sessionId,
  presentationId,
}: ReportListPanelProps) {
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [emailingId, setEmailingId] = useState<string | null>(null);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const token = getAccessToken();
      let query = "";
      if (sessionId) query = `?sessionId=${sessionId}`;
      else if (presentationId) query = `?presentationId=${presentationId}`;

      const res = await fetch(`${API_URL}/api/reports${query}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        const data = await res.json();
        setReports(data);
      }
    } catch (err) {
      console.error("Failed to load reports:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [sessionId, presentationId]);

  const handleSendEmail = async (id: string) => {
    setEmailingId(id);
    try {
      const token = getAccessToken();
      await fetch(`${API_URL}/api/reports/${id}/email`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      alert("Report emailed successfully!");
    } catch (err) {
      alert("Failed to send email");
    } finally {
      setEmailingId(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this report?")) return;
    try {
      const token = getAccessToken();
      const res = await fetch(`${API_URL}/api/reports/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setReports((prev) => prev.filter((r) => r._id !== id));
      }
    } catch (err) {
      console.error("Delete report failed", err);
    }
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6 flex justify-center">
        <RefreshCw className="w-6 h-6 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (reports.length === 0) {
    return null;
  }

  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <FileText className="w-5 h-5 text-indigo-600" /> Generated Session
          Reports
        </h3>
        <button
          onClick={fetchReports}
          className="text-xs text-gray-500 hover:text-indigo-600 flex items-center gap-1"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Refresh
        </button>
      </div>

      <div className="space-y-3">
        {reports.map((report) => (
          <div
            key={report._id}
            className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-800 rounded-xl"
          >
            <div className="flex items-center gap-3">
              <span className="text-xl">
                {report.fileFormat === "pdf"
                  ? "📄"
                  : report.fileFormat === "csv"
                    ? "📊"
                    : "⚙️"}
              </span>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-sm text-gray-900 dark:text-white">
                    {report.title} ({report.fileFormat.toUpperCase()})
                  </span>
                  <StatusBadge status={report.status} />
                </div>
                <p className="text-xs text-gray-400 mt-0.5">
                  Generated {new Date(report.createdAt).toLocaleString()} •{" "}
                  {report.fileSize
                    ? `${(report.fileSize / 1024).toFixed(1)} KB`
                    : "Processing..."}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {report.status === "COMPLETED" && report.fileUrl && (
                <>
                  <a
                    href={report.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-lg transition-colors text-xs font-semibold flex items-center gap-1"
                    title="Download Report"
                  >
                    <Download className="w-4 h-4" /> Download
                  </a>

                  <button
                    onClick={() => handleSendEmail(report._id)}
                    disabled={emailingId === report._id}
                    className="p-2 text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors text-xs"
                    title="Email Report"
                  >
                    <Mail className="w-4 h-4" />
                  </button>
                </>
              )}

              <button
                onClick={() => handleDelete(report._id)}
                className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors text-xs"
                title="Delete Report"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  if (status === "COMPLETED") {
    return (
      <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 text-[10px] font-bold rounded-full flex items-center gap-1">
        <CheckCircle2 className="w-3 h-3" /> Ready
      </span>
    );
  }
  if (status === "PROCESSING" || status === "PENDING") {
    return (
      <span className="px-2 py-0.5 bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 text-[10px] font-bold rounded-full flex items-center gap-1 animate-pulse">
        <Clock className="w-3 h-3" /> Processing
      </span>
    );
  }
  return (
    <span className="px-2 py-0.5 bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 text-[10px] font-bold rounded-full flex items-center gap-1">
      <AlertCircle className="w-3 h-3" /> Failed
    </span>
  );
}
