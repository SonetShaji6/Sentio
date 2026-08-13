"use client";

import React, { useState } from "react";
import { getAccessToken, API_URL } from "@/lib/auth";
import {
  FileText,
  Download,
  Mail,
  X,
  CheckCircle2,
  AlertCircle,
  Loader2,
} from "lucide-react";

interface ReportGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  sessionId: string;
  presentationTitle: string;
  onReportGenerated?: () => void;
}

export default function ReportGeneratorModal({
  isOpen,
  onClose,
  sessionId,
  presentationTitle,
  onReportGenerated,
}: ReportGeneratorModalProps) {
  const [format, setFormat] = useState<"pdf" | "csv" | "json">("pdf");
  const [type, setType] = useState<"full" | "summary" | "analytics">("full");
  const [sendEmail, setSendEmail] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleGenerate = async () => {
    setLoading(true);
    setError(null);
    setSuccessMsg(null);

    try {
      const token = getAccessToken();
      const res = await fetch(`${API_URL}/api/reports/generate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          sessionId,
          format,
          type,
          sendEmail,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Failed to start report generation");
      }

      setSuccessMsg(
        "Report generation started! It will be ready in your Reports list shortly.",
      );
      if (onReportGenerated) onReportGenerated();
      setTimeout(() => {
        onClose();
        setSuccessMsg(null);
      }, 2000);
    } catch (err: any) {
      setError(
        err.message || "An error occurred while starting report generation.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 rounded-xl">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">
              Export Session Report
            </h3>
            <p className="text-xs text-gray-500">{presentationTitle}</p>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg text-sm flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {successMsg && (
          <div className="mb-4 p-3 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 rounded-lg text-sm flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Format Selection */}
        <div className="mb-5">
          <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-2">
            Select File Format
          </label>
          <div className="grid grid-cols-3 gap-3">
            <button
              onClick={() => setFormat("pdf")}
              className={`p-3 rounded-xl border text-center font-medium text-sm transition-all ${
                format === "pdf"
                  ? "border-indigo-600 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 font-bold"
                  : "border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
              }`}
            >
              📄 PDF Report
            </button>

            <button
              onClick={() => setFormat("csv")}
              className={`p-3 rounded-xl border text-center font-medium text-sm transition-all ${
                format === "csv"
                  ? "border-indigo-600 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 font-bold"
                  : "border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
              }`}
            >
              📊 CSV Spreadsheet
            </button>

            <button
              onClick={() => setFormat("json")}
              className={`p-3 rounded-xl border text-center font-medium text-sm transition-all ${
                format === "json"
                  ? "border-indigo-600 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 font-bold"
                  : "border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
              }`}
            >
              {`{ }`} JSON Data
            </button>
          </div>
        </div>

        {/* Type Selection */}
        <div className="mb-5">
          <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-2">
            Report Depth
          </label>
          <select
            value={type}
            onChange={(e: any) => setType(e.target.value)}
            className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="full">
              Comprehensive (Overview, Attendance, Quiz & AI Insights)
            </option>
            <option value="analytics">
              Analytics Only (Metrics & Timeline)
            </option>
            <option value="summary">Executive Summary Only</option>
          </select>
        </div>

        {/* Email checkbox */}
        <div className="mb-6 flex items-center gap-2">
          <input
            type="checkbox"
            id="sendEmail"
            checked={sendEmail}
            onChange={(e) => setSendEmail(e.target.checked)}
            className="w-4 h-4 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500"
          />
          <label
            htmlFor="sendEmail"
            className="text-sm text-gray-700 dark:text-gray-300 flex items-center gap-1.5 cursor-pointer"
          >
            <Mail className="w-4 h-4 text-gray-400" /> Email me the download
            link when generated
          </label>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 dark:border-gray-800">
          <button
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
          >
            Cancel
          </button>

          <button
            onClick={handleGenerate}
            disabled={loading}
            className="px-5 py-2 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors flex items-center gap-2 shadow-sm disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Generating...
              </>
            ) : (
              <>
                <Download className="w-4 h-4" /> Generate & Save Report
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
