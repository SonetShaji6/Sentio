"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { getAccessToken, API_URL } from "@/lib/auth";
import {
  X,
  Clock,
  Radio,
  FileText,
  Bookmark,
  Calendar,
  Layers,
  Users,
  Play,
  Download,
  Edit,
  Sparkles,
  ExternalLink,
  ChevronRight,
  CheckCircle2,
  AlertCircle,
  Filter,
} from "lucide-react";

interface TimelineEvent {
  id: string;
  type: "created" | "version" | "session" | "report" | "updated";
  title: string;
  description: string;
  timestamp: string;
  badge: string;
  status?: string;
  meta?: any;
}

interface TimelineData {
  presentation: {
    _id: string;
    title: string;
    description: string;
    status: string;
    category: string;
    visibility?: string;
    coverImage?: string;
    createdAt: string;
    updatedAt: string;
  };
  stats: {
    slidesCount: number;
    sessionsCount: number;
    participantsCount: number;
    reportsCount: number;
    versionsCount: number;
  };
  slides: Array<{
    _id: string;
    order: number;
    type: string;
    title: string;
  }>;
  events: TimelineEvent[];
}

interface PresentationTimelineModalProps {
  presentationId: string;
  presentationTitle: string;
  isOpen: boolean;
  onClose: () => void;
}

export default function PresentationTimelineModal({
  presentationId,
  presentationTitle,
  isOpen,
  onClose,
}: PresentationTimelineModalProps) {
  const [data, setData] = useState<TimelineData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<string>("all");

  useEffect(() => {
    if (!isOpen || !presentationId) return;

    let isMounted = true;
    const fetchTimeline = async () => {
      setLoading(true);
      setError(null);
      try {
        const token = getAccessToken();
        const res = await fetch(
          `${API_URL}/api/presentations/${presentationId}/timeline`,
          {
            headers: { Authorization: `Bearer ${token}` },
          },
        );

        if (!res.ok) {
          throw new Error("Failed to load presentation timeline");
        }

        const json = await res.json();
        if (isMounted) {
          setData(json);
        }
      } catch (err: any) {
        if (isMounted) {
          setError(err.message || "Failed to load timeline");
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchTimeline();

    return () => {
      isMounted = false;
    };
  }, [isOpen, presentationId]);

  if (!isOpen) return null;

  const filteredEvents = (data?.events || []).filter((event) => {
    if (filterType === "all") return true;
    if (filterType === "sessions") return event.type === "session";
    if (filterType === "versions") return event.type === "version";
    if (filterType === "reports") return event.type === "report";
    return true;
  });

  const getEventIcon = (type: string, status?: string) => {
    switch (type) {
      case "session":
        return status === "live" ? (
          <Radio className="w-4 h-4 text-emerald-400 animate-pulse" />
        ) : (
          <Play className="w-4 h-4 text-blue-400" />
        );
      case "version":
        return <Bookmark className="w-4 h-4 text-purple-400" />;
      case "report":
        return <FileText className="w-4 h-4 text-amber-400" />;
      case "created":
        return <Sparkles className="w-4 h-4 text-emerald-400" />;
      case "updated":
      default:
        return <Clock className="w-4 h-4 text-zinc-400" />;
    }
  };

  const getEventBadgeClass = (type: string, status?: string) => {
    if (type === "session" && status === "live") {
      return "bg-emerald-500/10 text-emerald-400 border-emerald-500/30";
    }
    switch (type) {
      case "session":
        return "bg-blue-500/10 text-blue-400 border-blue-500/20";
      case "version":
        return "bg-purple-500/10 text-purple-400 border-purple-500/20";
      case "report":
        return "bg-amber-500/10 text-amber-400 border-amber-500/20";
      case "created":
        return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
      case "updated":
      default:
        return "bg-zinc-800 text-zinc-300 border-zinc-700";
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md animate-fade-in"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 border-b border-zinc-200 dark:border-zinc-800 flex items-start justify-between gap-4 bg-zinc-50/50 dark:bg-zinc-900/50">
          <div>
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
                <Clock className="w-3 h-3" />
                Presentation Timeline
              </span>
              {data?.presentation.status && (
                <span
                  className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold border ${
                    data.presentation.status === "live"
                      ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                      : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-700"
                  }`}
                >
                  {data.presentation.status === "live"
                    ? "🔴 Live Now"
                    : data.presentation.status}
                </span>
              )}
            </div>
            <h2 className="text-xl font-bold text-zinc-900 dark:text-white truncate max-w-md">
              {data?.presentation.title || presentationTitle}
            </h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
              Chronological log of deck milestones, live presentations, and
              compiled reports.
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-zinc-400 hover:text-zinc-600 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition-colors shrink-0"
            aria-label="Close timeline"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Stats Bar */}
        {data && (
          <div className="grid grid-cols-4 gap-2 px-6 py-3.5 bg-zinc-100/60 dark:bg-zinc-850/40 border-b border-zinc-200 dark:border-zinc-800/80 text-center text-xs">
            <div>
              <div className="text-base font-bold text-zinc-900 dark:text-white">
                {data.stats.slidesCount}
              </div>
              <div className="text-[11px] text-zinc-500 dark:text-zinc-400">
                Slides
              </div>
            </div>
            <div>
              <div className="text-base font-bold text-zinc-900 dark:text-white">
                {data.stats.sessionsCount}
              </div>
              <div className="text-[11px] text-zinc-500 dark:text-zinc-400">
                Live Sessions
              </div>
            </div>
            <div>
              <div className="text-base font-bold text-zinc-900 dark:text-white">
                {data.stats.participantsCount}
              </div>
              <div className="text-[11px] text-zinc-500 dark:text-zinc-400">
                Total Attendees
              </div>
            </div>
            <div>
              <div className="text-base font-bold text-zinc-900 dark:text-white">
                {data.stats.reportsCount}
              </div>
              <div className="text-[11px] text-zinc-500 dark:text-zinc-400">
                Reports
              </div>
            </div>
          </div>
        )}

        {/* Filter Controls */}
        <div className="px-6 py-2.5 flex items-center gap-1.5 border-b border-zinc-100 dark:border-zinc-800/80 overflow-x-auto text-xs">
          <Filter className="w-3.5 h-3.5 text-zinc-400 mr-1 shrink-0" />
          {[
            { id: "all", label: "All Events" },
            { id: "sessions", label: "Sessions Hosted" },
            { id: "versions", label: "Snapshots" },
            { id: "reports", label: "Reports" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilterType(tab.id)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-all shrink-0 cursor-pointer ${
                filterType === tab.id
                  ? "bg-zinc-900 text-white dark:bg-white dark:text-zinc-950 font-bold shadow-xs"
                  : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Timeline Content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <div className="w-8 h-8 rounded-full border-2 border-zinc-900 dark:border-white border-t-transparent animate-spin"></div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Loading presentation timeline...
              </p>
            </div>
          ) : error ? (
            <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-500 text-center text-xs">
              <AlertCircle className="w-6 h-6 mx-auto mb-2 opacity-80" />
              <p className="font-semibold">{error}</p>
            </div>
          ) : filteredEvents.length === 0 ? (
            <div className="text-center py-12 text-zinc-400">
              <Clock className="w-8 h-8 mx-auto mb-2 opacity-40" />
              <p className="text-sm font-medium">
                No activity events found for this filter.
              </p>
            </div>
          ) : (
            <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-zinc-200 dark:before:bg-zinc-800">
              {filteredEvents.map((event, idx) => (
                <div key={event.id || idx} className="relative group">
                  {/* Timeline Node Dot */}
                  <div className="absolute -left-6 top-1.5 w-5 h-5 rounded-full bg-white dark:bg-zinc-900 border-2 border-zinc-300 dark:border-zinc-700 flex items-center justify-center group-hover:border-zinc-900 dark:group-hover:border-white transition-all shadow-xs">
                    <div className="scale-75">
                      {getEventIcon(event.type, event.status)}
                    </div>
                  </div>

                  {/* Event Card */}
                  <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-850/60 border border-zinc-200/80 dark:border-zinc-800/80 hover:border-zinc-300 dark:hover:border-zinc-700 transition-all shadow-xs">
                    <div className="flex items-center justify-between gap-2 flex-wrap mb-1">
                      <span
                        className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${getEventBadgeClass(
                          event.type,
                          event.status,
                        )}`}
                      >
                        {event.badge}
                      </span>
                      <span className="text-[11px] text-zinc-400 font-mono">
                        {new Date(event.timestamp).toLocaleString(undefined, {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>

                    <h4 className="font-bold text-sm text-zinc-900 dark:text-white">
                      {event.title}
                    </h4>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 leading-relaxed">
                      {event.description}
                    </p>

                    {/* Metadata pill/actions */}
                    {event.type === "session" && event.meta && (
                      <div className="mt-3 pt-3 border-t border-zinc-200/60 dark:border-zinc-800 flex items-center justify-between gap-2 flex-wrap">
                        <div className="flex items-center gap-3 text-xs text-zinc-500">
                          <span className="flex items-center gap-1 font-mono">
                            <span className="font-semibold">Code:</span>{" "}
                            {event.meta.joinCode}
                          </span>
                          {event.meta.durationMin && (
                            <span>• {event.meta.durationMin} mins</span>
                          )}
                        </div>
                        <Link
                          href={`/presentations/${presentationId}/analytics`}
                          className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
                        >
                          View Analytics <ChevronRight className="w-3 h-3" />
                        </Link>
                      </div>
                    )}

                    {event.type === "report" && event.meta?.fileUrl && (
                      <div className="mt-3 pt-3 border-t border-zinc-200/60 dark:border-zinc-800 flex items-center justify-end">
                        <a
                          href={event.meta.fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-2.5 py-1 bg-zinc-900 hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-200 text-white dark:text-zinc-900 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all"
                        >
                          <Download className="w-3 h-3" />
                          <span>Download Report</span>
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Modal Footer Quick Actions */}
        <div className="p-4 px-6 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-900/80 flex items-center justify-between gap-3">
          <Link
            href={`/presentations/${presentationId}/edit`}
            className="px-4 py-2 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 text-xs font-bold rounded-xl flex items-center gap-2 transition-all border border-zinc-200 dark:border-zinc-700"
          >
            <Edit className="w-3.5 h-3.5" />
            Open Editor
          </Link>

          <Link
            href={`/presentations/${presentationId}/host`}
            className="px-4 py-2 bg-zinc-950 hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-200 text-white dark:text-zinc-950 text-xs font-bold rounded-xl flex items-center gap-2 transition-all shadow-sm"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            Start Live Presentation
          </Link>
        </div>
      </div>
    </div>
  );
}
