"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Play,
  Edit,
  Clock,
  FileText,
  Trash2,
  Copy,
  MoreVertical,
  BarChart2,
  Layers,
  Users,
  Radio,
  Sparkles,
  Type,
  AlignLeft,
  HelpCircle,
  List,
  Star,
  Cloud,
  MessageSquare,
  Image as ImageIcon,
  Trophy,
  CheckCircle,
  ExternalLink,
  ChevronRight,
  Loader2,
  Share2,
} from "lucide-react";

export interface SlidePreview {
  _id: string;
  order: number;
  type: string;
  title: string;
  isHidden?: boolean;
  themeOverrides?: any;
  config?: any;
}

export interface PresentationItem {
  _id: string;
  title: string;
  description?: string;
  category?: string;
  status: "draft" | "published" | "live" | "completed" | "archived" | string;
  coverImage?: string;
  theme?: any;
  slideCount?: number;
  previewSlides?: SlidePreview[];
  sessionsCount?: number;
  totalParticipants?: number;
  liveSession?: {
    _id: string;
    joinCode: string;
    participantsCount: number;
  } | null;
  recentSession?: {
    _id: string;
    joinCode: string;
    status: string;
    createdAt: string;
    participantsCount: number;
  } | null;
  createdAt: string;
  updatedAt: string;
}

interface PresentationCardProps {
  presentation: PresentationItem;
  onOpenTimeline: (id: string, title: string) => void;
  onGenerateReport: (id: string, title: string) => void;
  onDelete: (id: string, title: string) => void;
  onDuplicate?: (id: string) => void;
  isGeneratingReport?: boolean;
  generatingSeconds?: number;
}

const slideTypeIcons: Record<string, React.ReactNode> = {
  title: <Type className="w-3.5 h-3.5" />,
  teaching: <AlignLeft className="w-3.5 h-3.5" />,
  information: <AlignLeft className="w-3.5 h-3.5" />,
  question: <HelpCircle className="w-3.5 h-3.5" />,
  poll: <BarChart2 className="w-3.5 h-3.5" />,
  quiz: <List className="w-3.5 h-3.5" />,
  rating: <Star className="w-3.5 h-3.5" />,
  wordcloud: <Cloud className="w-3.5 h-3.5" />,
  opentext: <MessageSquare className="w-3.5 h-3.5" />,
  imagepoll: <ImageIcon className="w-3.5 h-3.5" />,
  leaderboard: <Trophy className="w-3.5 h-3.5" />,
  thankyou: <CheckCircle className="w-3.5 h-3.5" />,
};

export default function PresentationCard({
  presentation,
  onOpenTimeline,
  onGenerateReport,
  onDelete,
  onDuplicate,
  isGeneratingReport = false,
  generatingSeconds = 0,
}: PresentationCardProps) {
  const [activeSlideIndex, setActiveSlideIndex] = useState<number | null>(null);
  const [showMenu, setShowMenu] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  const slides = presentation.previewSlides || [];
  const totalSlides = presentation.slideCount ?? slides.length;
  const isLive = presentation.status === "live" || !!presentation.liveSession;

  // Active slide for preview, defaults to slide 0 if no hover
  const activeSlide =
    activeSlideIndex !== null && slides[activeSlideIndex]
      ? slides[activeSlideIndex]
      : slides[0] || null;

  const handleCopyLink = (e: React.MouseEvent) => {
    e.stopPropagation();
    const url = `${window.location.origin}/play/${presentation._id}`;
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
    setShowMenu(false);
  };

  const formatRelativeTime = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMins / 60);
      const diffDays = Math.floor(diffHours / 24);

      if (diffMins < 1) return "Just now";
      if (diffMins < 60) return `${diffMins}m ago`;
      if (diffHours < 24) return `${diffHours}h ago`;
      if (diffDays < 7) return `${diffDays}d ago`;
      return date.toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
      });
    } catch {
      return "Recently";
    }
  };

  return (
    <div className="group flex flex-col bg-white dark:bg-zinc-900/70 border border-zinc-200/80 dark:border-zinc-800/80 hover:border-zinc-300 dark:hover:border-zinc-700 rounded-3xl overflow-hidden shadow-xs hover:shadow-xl transition-all duration-300">
      {/* ── CARD COVER / VISUAL THUMBNAIL CANVAS ── */}
      <div className="relative h-44 sm:h-48 w-full bg-gradient-to-br from-zinc-100 to-zinc-200/60 dark:from-zinc-900 dark:to-zinc-950 overflow-hidden border-b border-zinc-100 dark:border-zinc-800/80">
        {presentation.coverImage && activeSlideIndex === null ? (
          <img
            src={presentation.coverImage}
            alt={presentation.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          /* Dynamic Slide Preview Canvas */
          <div className="w-full h-full p-4 flex flex-col justify-between relative overflow-hidden select-none bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] dark:bg-[radial-gradient(#27272a_1px,transparent_1px)] [background-size:16px_16px]">
            {/* Top Bar inside Canvas */}
            <div className="flex items-center justify-between z-10">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider bg-white/90 dark:bg-zinc-800/90 text-zinc-700 dark:text-zinc-200 border border-zinc-200/80 dark:border-zinc-700 shadow-xs backdrop-blur-md">
                {activeSlide ? (
                  <>
                    <span className="text-zinc-400">
                      #{(activeSlide.order ?? 0) + 1}
                    </span>
                    <span className="capitalize">{activeSlide.type}</span>
                  </>
                ) : (
                  <span>Deck Overview</span>
                )}
              </span>

              {/* Slide Count Pill */}
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-zinc-950/80 dark:bg-zinc-100/90 text-white dark:text-zinc-950 shadow-xs backdrop-blur-md">
                <Layers className="w-3 h-3" />
                <span>
                  {totalSlides} {totalSlides === 1 ? "Slide" : "Slides"}
                </span>
              </span>
            </div>

            {/* Slide Center Graphic / Title Preview */}
            <div className="my-auto text-center px-4 py-2 z-10">
              {activeSlide ? (
                <div className="space-y-1.5">
                  <div className="w-8 h-8 mx-auto rounded-xl bg-zinc-900/5 dark:bg-white/10 flex items-center justify-center text-zinc-700 dark:text-zinc-200 mb-2 border border-zinc-200/50 dark:border-zinc-700/50">
                    {slideTypeIcons[activeSlide.type] || (
                      <Type className="w-4 h-4" />
                    )}
                  </div>
                  <h4 className="text-xs sm:text-sm font-bold text-zinc-900 dark:text-zinc-100 line-clamp-2 max-w-xs mx-auto">
                    {activeSlide.title || `Untitled ${activeSlide.type} Slide`}
                  </h4>
                  {activeSlide.type === "poll" && (
                    <div className="flex items-center justify-center gap-1.5 max-w-[180px] mx-auto pt-1 opacity-70">
                      <div className="h-1.5 bg-blue-500 rounded-full w-2/3"></div>
                      <div className="h-1.5 bg-zinc-300 dark:bg-zinc-700 rounded-full w-1/3"></div>
                    </div>
                  )}
                  {activeSlide.type === "quiz" && (
                    <div className="grid grid-cols-2 gap-1 max-w-[160px] mx-auto pt-1 opacity-70">
                      <div className="h-2 bg-emerald-500/40 rounded-sm border border-emerald-500/50"></div>
                      <div className="h-2 bg-zinc-300 dark:bg-zinc-700 rounded-sm"></div>
                    </div>
                  )}
                  {activeSlide.type === "wordcloud" && (
                    <div className="flex items-center justify-center gap-1 text-[9px] text-purple-600 dark:text-purple-400 font-bold opacity-80 pt-1">
                      <span>#interactive</span>
                      <span>#live</span>
                      <span>#audience</span>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-1">
                  <Layers className="w-8 h-8 mx-auto text-zinc-400 dark:text-zinc-600 opacity-60 mb-2" />
                  <p className="text-xs font-semibold text-zinc-600 dark:text-zinc-300">
                    Empty presentation
                  </p>
                </div>
              )}
            </div>

            {/* Bottom Status / Category in Canvas */}
            <div className="flex items-center justify-between text-[11px] text-zinc-400 z-10">
              <span className="font-medium text-zinc-500 dark:text-zinc-400">
                {presentation.category || "General"}
              </span>
              {activeSlideIndex !== null && (
                <span className="text-[10px] font-mono text-zinc-400 dark:text-zinc-500">
                  Previewing slide {activeSlideIndex + 1}
                </span>
              )}
            </div>

            {/* Subtle Gradient Backdrop */}
            <div className="absolute inset-0 bg-gradient-to-t from-zinc-200/30 via-transparent to-transparent dark:from-zinc-950/60 pointer-events-none"></div>
          </div>
        )}

        {/* Status Badge overlay (Live / Published / Draft) */}
        <div className="absolute top-3 right-3 z-20 flex items-center gap-1.5">
          {isLive ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/90 text-white shadow-sm backdrop-blur-md animate-pulse">
              <Radio className="w-3.5 h-3.5" />
              <span>Live Now</span>
            </span>
          ) : (
            <span
              className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full shadow-xs backdrop-blur-md border ${
                presentation.status === "published"
                  ? "bg-zinc-950/80 text-white border-zinc-700 dark:bg-white/90 dark:text-zinc-950"
                  : "bg-white/90 text-zinc-700 border-zinc-200 dark:bg-zinc-800/90 dark:text-zinc-300 dark:border-zinc-700"
              }`}
            >
              {presentation.status || "Draft"}
            </span>
          )}
        </div>
      </div>

      {/* ── INTERACTIVE THUMBLINE (SLIDE THUMBNAIL STRIP) ── */}
      <div className="px-4 py-2.5 bg-zinc-50/90 dark:bg-zinc-850/40 border-b border-zinc-100 dark:border-zinc-800/80 flex items-center justify-between gap-2 overflow-hidden">
        <div className="flex items-center gap-1.5 overflow-x-auto py-0.5 no-scrollbar scroll-smooth flex-1 min-w-0">
          {slides.length === 0 ? (
            <span className="text-[11px] text-zinc-400 italic">
              No slides added yet
            </span>
          ) : (
            slides.map((s, idx) => {
              const isSelected = activeSlideIndex === idx;
              return (
                <button
                  key={s._id || idx}
                  onMouseEnter={() => setActiveSlideIndex(idx)}
                  onMouseLeave={() => setActiveSlideIndex(null)}
                  onClick={() => setActiveSlideIndex(idx)}
                  title={`Slide ${idx + 1}: ${s.title || s.type}`}
                  className={`h-7 px-2 rounded-lg border flex items-center gap-1.5 shrink-0 transition-all cursor-pointer ${
                    isSelected
                      ? "border-zinc-950 dark:border-white bg-zinc-900 text-white dark:bg-white dark:text-zinc-950 shadow-xs scale-105"
                      : "border-zinc-200 dark:border-zinc-750 bg-white dark:bg-zinc-900/90 text-zinc-600 dark:text-zinc-300 hover:border-zinc-400 dark:hover:border-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                  }`}
                >
                  <span className="text-[10px] font-mono font-bold opacity-70">
                    {idx + 1}
                  </span>
                  <span className="scale-75 shrink-0">
                    {slideTypeIcons[s.type] || <Type className="w-3 h-3" />}
                  </span>
                  <span className="text-[10px] font-medium max-w-[60px] truncate hidden sm:inline">
                    {s.title || s.type}
                  </span>
                </button>
              );
            })
          )}

          {totalSlides > slides.length && (
            <Link
              href={`/presentations/${presentation._id}/edit`}
              className="text-[10px] font-bold text-zinc-500 hover:text-zinc-900 dark:hover:text-white px-2 py-1 rounded-md bg-zinc-200/60 dark:bg-zinc-800 shrink-0 hover:underline"
            >
              +{totalSlides - slides.length} more
            </Link>
          )}
        </div>

        {/* Mini jump to editor icon */}
        <Link
          href={`/presentations/${presentation._id}/edit`}
          className="text-zinc-400 hover:text-zinc-900 dark:hover:text-white p-1 rounded-md hover:bg-zinc-200/50 dark:hover:bg-zinc-800 transition-colors shrink-0"
          title="Open slide deck in editor"
        >
          <ChevronRight className="w-4 h-4" />
        </Link>
      </div>

      {/* ── CARD CONTENT & DETAILS ── */}
      <div className="p-5 flex-1 flex flex-col justify-between">
        <div>
          <div className="flex items-start justify-between gap-2">
            <Link
              href={`/presentations/${presentation._id}/edit`}
              className="font-bold text-zinc-950 dark:text-white text-base hover:underline line-clamp-1 group/title flex-1"
              title={presentation.title}
            >
              {presentation.title}
            </Link>

            {/* Overflow More Menu */}
            <div className="relative">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowMenu((prev) => !prev);
                }}
                className="p-1 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                aria-label="Presentation options"
              >
                <MoreVertical className="w-4 h-4" />
              </button>

              {showMenu && (
                <>
                  <div
                    className="fixed inset-0 z-30"
                    onClick={() => setShowMenu(false)}
                  />
                  <div className="absolute right-0 top-7 w-48 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-xl py-1.5 z-40 animate-scale-in text-xs">
                    {onDuplicate && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowMenu(false);
                          onDuplicate(presentation._id);
                        }}
                        className="w-full px-3 py-2 text-left flex items-center gap-2 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                      >
                        <Copy className="w-3.5 h-3.5" />
                        Duplicate Presentation
                      </button>
                    )}
                    <Link
                      href={`/presentations/${presentation._id}/analytics`}
                      className="w-full px-3 py-2 text-left flex items-center gap-2 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                      onClick={() => setShowMenu(false)}
                    >
                      <BarChart2 className="w-3.5 h-3.5 text-indigo-500" />
                      Session Analytics
                    </Link>
                    <button
                      onClick={handleCopyLink}
                      className="w-full px-3 py-2 text-left flex items-center gap-2 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                    >
                      <Share2 className="w-3.5 h-3.5" />
                      {copiedLink ? "Link Copied!" : "Copy Audience Link"}
                    </button>
                    <div className="my-1 border-t border-zinc-100 dark:border-zinc-800" />
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowMenu(false);
                        onDelete(presentation._id, presentation.title);
                      }}
                      className="w-full px-3 py-2 text-left flex items-center gap-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors cursor-pointer font-medium"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Delete Deck
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>

          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 line-clamp-2 min-h-8 leading-relaxed">
            {presentation.description ||
              "No description provided for this interactive deck."}
          </p>

          {/* Stats Line */}
          <div className="flex items-center gap-4 mt-3 text-xs text-zinc-400 dark:text-zinc-500">
            <span className="flex items-center gap-1.5" title="Total Slides">
              <Layers className="w-3.5 h-3.5" />
              <span>{totalSlides} slides</span>
            </span>
            <span
              className="flex items-center gap-1.5"
              title="Total Sessions Hosted"
            >
              <Users className="w-3.5 h-3.5" />
              <span>{presentation.sessionsCount || 0} sessions</span>
            </span>
            <span
              className="flex items-center gap-1.5 ml-auto text-[11px]"
              title="Last modified"
            >
              <Clock className="w-3 h-3" />
              <span>{formatRelativeTime(presentation.updatedAt)}</span>
            </span>
          </div>
        </div>

        {/* ── CARD ACTION BUTTONS ── */}
        <div className="mt-5 pt-3.5 border-t border-zinc-100 dark:border-zinc-800/80 flex items-center justify-between gap-2 flex-wrap">
          {/* Timeline & Report Quick Triggers */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={() =>
                onOpenTimeline(presentation._id, presentation.title)
              }
              className="px-2.5 py-1.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 hover:bg-zinc-100 dark:bg-zinc-800/80 dark:hover:bg-zinc-750 text-zinc-700 dark:text-zinc-300 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs"
              title="View presentation history & milestones timeline"
            >
              <Clock className="w-3.5 h-3.5 text-indigo-500" />
              <span>Timeline</span>
            </button>

            <button
              onClick={() =>
                onGenerateReport(presentation._id, presentation.title)
              }
              disabled={isGeneratingReport}
              className="px-2.5 py-1.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 hover:bg-zinc-100 dark:bg-zinc-800/80 dark:hover:bg-zinc-750 text-zinc-700 dark:text-zinc-300 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs disabled:opacity-60"
              title="Generate intelligence report"
            >
              {isGeneratingReport ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-zinc-500" />
                  <span className="font-mono">
                    {generatingSeconds.toFixed(1)}s
                  </span>
                </>
              ) : (
                <>
                  <FileText className="w-3.5 h-3.5 text-amber-500" />
                  <span>Report</span>
                </>
              )}
            </button>
          </div>

          {/* Primary Host & Edit Actions */}
          <div className="flex items-center gap-1.5">
            <Link
              href={`/presentations/${presentation._id}/edit`}
              className="p-1.5 text-zinc-600 dark:text-zinc-300 hover:text-zinc-950 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl transition-colors border border-transparent hover:border-zinc-200 dark:hover:border-zinc-700"
              title="Edit slides in deck editor"
            >
              <Edit className="w-4 h-4" />
            </Link>

            <Link
              href={`/presentations/${presentation._id}/host`}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm cursor-pointer ${
                isLive
                  ? "bg-emerald-600 hover:bg-emerald-500 text-white ring-2 ring-emerald-500/20"
                  : "bg-zinc-950 hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-200 text-white dark:text-zinc-950"
              }`}
              title={
                isLive
                  ? "Resume active live presentation"
                  : "Start live presentation"
              }
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>{isLive ? "Resume" : "Present"}</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
