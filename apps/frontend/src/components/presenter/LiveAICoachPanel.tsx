"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Sparkles,
  RefreshCw,
  Plus,
  Play,
  CheckCircle2,
  AlertTriangle,
  HelpCircle,
  BarChart2,
  TrendingUp,
  Clock,
  Layers,
  Check,
  ArrowRight,
  BookOpen,
  MessageSquare,
  Cloud,
  List,
  Type,
  Loader2,
  Volume2,
  Zap,
} from "lucide-react";
import { getAccessToken, API_URL } from "@/lib/auth";

export interface LiveAICoachData {
  verdict: string;
  sentiment: string;
  summary: string;
  pacingAdvice: string;
  accuracyAnalysis?: string;
  participationRate: number;
  accuracyRate: number | null;
  isEveryoneCorrect: boolean;
  totalResponses: number;
  audienceCount: number;
  questionImprovements?: Array<{
    original: string;
    improved: string;
    reason: string;
  }>;
  suggestedSlides?: Array<{
    title: string;
    type: string;
    description: string;
    config: any;
  }>;
  slideUpdates?: {
    suggestedTitle?: string;
    clarificationNote?: string;
  };
  generatedAt: string;
  slideId?: string;
}

interface LiveAICoachPanelProps {
  presentationId: string;
  sessionId?: string;
  deckTitle?: string;
  currentSlide: any;
  currentSlideIndex: number;
  results: any;
  audienceCount: number;
  onInsertSlide: (slide: any, presentImmediately?: boolean) => Promise<void>;
  onUpdateSlide?: (slideId: string, updates: any) => Promise<void>;
}

export function LiveAICoachPanel({
  presentationId,
  sessionId,
  deckTitle = "Presentation",
  currentSlide,
  currentSlideIndex,
  results,
  audienceCount,
  onInsertSlide,
  onUpdateSlide,
}: LiveAICoachPanelProps) {
  const [data, setData] = useState<LiveAICoachData | null>(null);
  const [loading, setLoading] = useState(false);
  const [insertingIndex, setInsertingIndex] = useState<number | null>(null);
  const [insertedIndices, setInsertedIndices] = useState<number[]>([]);
  const [updatedSlide, setUpdatedSlide] = useState(false);
  const [autoAnalyze, setAutoAnalyze] = useState(true);

  const prevSlideIdRef = useRef<string | null>(null);
  const prevResponsesCountRef = useRef<number>(0);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  const totalResponses =
    results?.totalResponses ??
    results?.totalSubmissions ??
    (Array.isArray(results?.responses) ? results.responses.length : 0);

  // Fetch live AI recommendation
  const fetchRecommendation = async (isManual = false) => {
    if (!currentSlide) return;
    setLoading(true);
    try {
      const token = getAccessToken();
      const res = await fetch(`${API_URL}/api/ai/live-recommendation`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          sessionId,
          presentationId,
          currentSlide,
          results,
          audienceCount,
          deckTitle,
        }),
      });

      if (res.ok) {
        const json = await res.json();
        setData(json);
        setInsertedIndices([]);
        setUpdatedSlide(false);
      }
    } catch (err) {
      console.error("Live AI recommendation fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  // Trigger when current slide changes
  useEffect(() => {
    if (!currentSlide) return;

    if (prevSlideIdRef.current !== currentSlide._id) {
      prevSlideIdRef.current = currentSlide._id;
      prevResponsesCountRef.current = totalResponses;
      if (autoAnalyze) {
        fetchRecommendation();
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentSlide?._id, autoAnalyze]);

  // Debounced auto-refresh when responses come in
  useEffect(() => {
    if (!autoAnalyze || !currentSlide) return;

    // If new responses came in (at least 1 new response, or all answered)
    if (totalResponses > prevResponsesCountRef.current) {
      prevResponsesCountRef.current = totalResponses;
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);

      debounceTimerRef.current = setTimeout(() => {
        fetchRecommendation();
      }, 1500); // 1.5s debounce to allow batch submissions
    }

    return () => {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [totalResponses, autoAnalyze]);

  const handleInsert = async (
    slide: any,
    index: number,
    presentImmediately = false,
  ) => {
    setInsertingIndex(index);
    try {
      await onInsertSlide(slide, presentImmediately);
      setInsertedIndices((prev) => [...prev, index]);
    } catch (err) {
      console.error("Insert slide error:", err);
    } finally {
      setInsertingIndex(null);
    }
  };

  const handleApplyUpdate = async () => {
    if (
      !onUpdateSlide ||
      !currentSlide?._id ||
      !data?.slideUpdates?.suggestedTitle
    )
      return;
    try {
      await onUpdateSlide(currentSlide._id, {
        title: data.slideUpdates.suggestedTitle,
      });
      setUpdatedSlide(true);
    } catch (err) {
      console.error("Update slide error:", err);
    }
  };

  const getVerdictBadge = (verdict: string) => {
    switch (verdict) {
      case "Knowledge Gap Detected":
        return {
          bg: "bg-amber-500/15 text-amber-400 border-amber-500/30",
          icon: <AlertTriangle className="w-3.5 h-3.5" />,
        };
      case "High Mastery":
        return {
          bg: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
          icon: <CheckCircle2 className="w-3.5 h-3.5" />,
        };
      case "Low Participation":
        return {
          bg: "bg-rose-500/15 text-rose-400 border-rose-500/30",
          icon: <HelpCircle className="w-3.5 h-3.5" />,
        };
      case "Active Discussion":
        return {
          bg: "bg-blue-500/15 text-blue-400 border-blue-500/30",
          icon: <MessageSquare className="w-3.5 h-3.5" />,
        };
      default:
        return {
          bg: "bg-indigo-500/15 text-indigo-400 border-indigo-500/30",
          icon: <Sparkles className="w-3.5 h-3.5" />,
        };
    }
  };

  const slideTypeIcon = (type: string) => {
    switch (type) {
      case "poll":
        return <BarChart2 className="w-3.5 h-3.5 text-blue-400" />;
      case "quiz":
        return <List className="w-3.5 h-3.5 text-emerald-400" />;
      case "wordcloud":
        return <Cloud className="w-3.5 h-3.5 text-purple-400" />;
      case "teaching":
        return <BookOpen className="w-3.5 h-3.5 text-amber-400" />;
      case "opentext":
        return <MessageSquare className="w-3.5 h-3.5 text-indigo-400" />;
      default:
        return <Type className="w-3.5 h-3.5 text-zinc-400" />;
    }
  };

  return (
    <div className="flex flex-col h-full bg-zinc-950 text-zinc-100 select-none overflow-hidden">
      {/* ── HEADER ── */}
      <div className="p-4 border-b border-zinc-800/80 flex items-center justify-between gap-3 bg-zinc-900/60 shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-white shadow-xs">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-sm text-white">Live AI Coach</h3>
              <span
                className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"
                title="Active real-time analysis"
              />
            </div>
            <p className="text-[10px] text-zinc-400 font-mono">
              Slide #{currentSlideIndex + 1} &bull;{" "}
              {currentSlide?.type?.toUpperCase()}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => fetchRecommendation(true)}
            disabled={loading}
            className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white transition-all disabled:opacity-50 cursor-pointer"
            title="Refresh AI Analysis"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 ${loading ? "animate-spin text-indigo-400" : ""}`}
            />
          </button>
        </div>
      </div>

      {/* ── BODY ── */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
        {loading && !data && (
          <div className="py-12 flex flex-col items-center justify-center text-center gap-2.5">
            <Loader2 className="w-7 h-7 text-indigo-400 animate-spin" />
            <p className="font-semibold text-zinc-300">
              Analyzing audience responses...
            </p>
            <p className="text-[11px] text-zinc-500 max-w-xs">
              Evaluating correctness, participation rate, and calculating live
              coaching recommendations.
            </p>
          </div>
        )}

        {data && (
          <>
            {/* 1. REAL-TIME AUDIENCE PULSE CARDS */}
            <div className="p-3.5 rounded-2xl bg-zinc-900/80 border border-zinc-800 space-y-3 shadow-xs">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                {(() => {
                  const badge = getVerdictBadge(data.verdict);
                  return (
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border ${badge.bg}`}
                    >
                      {badge.icon}
                      <span>{data.verdict}</span>
                    </span>
                  );
                })()}

                <span className="text-[11px] font-mono text-zinc-400">
                  Mood:{" "}
                  <strong className="text-zinc-200">{data.sentiment}</strong>
                </span>
              </div>

              {/* Progress & Correctness Meters */}
              <div className="grid grid-cols-2 gap-2 pt-1">
                {/* Participation Meter */}
                <div className="p-2.5 rounded-xl bg-zinc-950/70 border border-zinc-800/80">
                  <div className="text-[10px] text-zinc-400 flex items-center justify-between mb-1">
                    <span>Participation</span>
                    <span className="font-mono font-bold text-zinc-200">
                      {data.participationRate}%
                    </span>
                  </div>
                  <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        data.participationRate >= 70
                          ? "bg-emerald-500"
                          : data.participationRate >= 40
                            ? "bg-blue-500"
                            : "bg-amber-500"
                      }`}
                      style={{
                        width: `${Math.min(100, data.participationRate)}%`,
                      }}
                    />
                  </div>
                  <div className="text-[10px] text-zinc-500 mt-1 font-mono">
                    {data.totalResponses} of {data.audienceCount} answered
                  </div>
                </div>

                {/* Correctness Meter (if quiz) */}
                {data.accuracyRate !== null ? (
                  <div className="p-2.5 rounded-xl bg-zinc-950/70 border border-zinc-800/80">
                    <div className="text-[10px] text-zinc-400 flex items-center justify-between mb-1">
                      <span>Correctness</span>
                      <span
                        className={`font-mono font-bold ${
                          data.accuracyRate >= 70
                            ? "text-emerald-400"
                            : data.accuracyRate >= 50
                              ? "text-amber-400"
                              : "text-rose-400"
                        }`}
                      >
                        {data.accuracyRate}%
                      </span>
                    </div>
                    <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          data.accuracyRate >= 70
                            ? "bg-emerald-500"
                            : data.accuracyRate >= 50
                              ? "bg-amber-500"
                              : "bg-rose-500"
                        }`}
                        style={{
                          width: `${Math.min(100, data.accuracyRate)}%`,
                        }}
                      />
                    </div>
                    <div className="text-[10px] text-zinc-500 mt-1">
                      {data.isEveryoneCorrect
                        ? "🎉 100% Correct!"
                        : `${data.accuracyRate}% got it right`}
                    </div>
                  </div>
                ) : (
                  <div className="p-2.5 rounded-xl bg-zinc-950/70 border border-zinc-800/80 flex flex-col justify-between">
                    <div className="text-[10px] text-zinc-400">
                      Audience Status
                    </div>
                    <div className="text-sm font-bold text-zinc-200 mt-0.5">
                      {data.totalResponses > 0
                        ? "Responses Live"
                        : "Awaiting Input"}
                    </div>
                    <div className="text-[10px] text-zinc-500">
                      Active online: {data.audienceCount}
                    </div>
                  </div>
                )}
              </div>

              {/* 1-sentence diagnostic */}
              <p className="text-xs text-zinc-300 leading-relaxed font-medium">
                {data.summary}
              </p>
            </div>

            {/* 2. LIVE PACING & VERBAL TIP */}
            {data.pacingAdvice && (
              <div className="p-3.5 rounded-2xl bg-indigo-950/30 border border-indigo-500/20 text-indigo-200 space-y-1.5 shadow-2xs">
                <div className="flex items-center gap-1.5 font-bold text-[11px] text-indigo-400 uppercase tracking-wider">
                  <Clock className="w-3.5 h-3.5" />
                  <span>Pacing & Speaking Advice</span>
                </div>
                <p className="text-xs text-zinc-200 leading-relaxed">
                  {data.pacingAdvice}
                </p>
              </div>
            )}

            {/* Verbal Clarification Hint */}
            {data.slideUpdates?.clarificationNote && (
              <div className="p-3.5 rounded-2xl bg-amber-950/30 border border-amber-500/20 text-amber-200 space-y-1.5 shadow-2xs">
                <div className="flex items-center gap-1.5 font-bold text-[11px] text-amber-400 uppercase tracking-wider">
                  <Volume2 className="w-3.5 h-3.5" />
                  <span>Say This to Audience Now</span>
                </div>
                <p className="text-xs text-amber-100 italic bg-amber-900/20 p-2 rounded-xl border border-amber-500/10">
                  &ldquo;{data.slideUpdates.clarificationNote}&rdquo;
                </p>
              </div>
            )}

            {/* 3. QUESTION IMPROVEMENTS */}
            {data.questionImprovements &&
              data.questionImprovements.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-zinc-400 font-bold text-[11px] uppercase tracking-wider px-1">
                    <span>Suggested Question Refinement</span>
                  </div>

                  {data.questionImprovements.map((q, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-2xl bg-zinc-900/70 border border-zinc-800 space-y-1.5"
                    >
                      <div className="text-[11px] text-zinc-400 line-through opacity-70">
                        {q.original}
                      </div>
                      <div className="text-xs font-semibold text-emerald-400 flex items-start gap-1.5">
                        <Check className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                        <span>{q.improved}</span>
                      </div>
                      <div className="text-[10px] text-zinc-500">
                        {q.reason}
                      </div>
                    </div>
                  ))}
                </div>
              )}

            {/* 4. SUGGESTED NEW SLIDES TO INSERT */}
            {data.suggestedSlides && data.suggestedSlides.length > 0 && (
              <div className="space-y-2.5 pt-1">
                <div className="flex items-center justify-between text-zinc-400 font-bold text-[11px] uppercase tracking-wider px-1">
                  <span>Suggested New Slides to Add</span>
                  <span className="text-[10px] font-normal text-zinc-500 font-mono">
                    Position #{currentSlideIndex + 2}
                  </span>
                </div>

                {data.suggestedSlides.map((slide, idx) => {
                  const isInserted = insertedIndices.includes(idx);
                  const isBusy = insertingIndex === idx;

                  return (
                    <div
                      key={idx}
                      className="p-3.5 rounded-2xl bg-zinc-900/90 border border-zinc-800 hover:border-zinc-700 transition-all space-y-2.5 shadow-2xs group"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-1.5">
                          <span className="p-1 rounded-lg bg-zinc-800 border border-zinc-700">
                            {slideTypeIcon(slide.type)}
                          </span>
                          <span className="text-[10px] font-mono font-bold uppercase text-zinc-400 tracking-wider">
                            {slide.type}
                          </span>
                        </div>
                        {isInserted && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                            <Check className="w-3 h-3" /> Added to Deck
                          </span>
                        )}
                      </div>

                      <div>
                        <h4 className="font-bold text-xs text-white group-hover:text-indigo-300 transition-colors">
                          {slide.title}
                        </h4>
                        <p className="text-[11px] text-zinc-400 mt-0.5 line-clamp-2">
                          {slide.description}
                        </p>
                      </div>

                      {/* Mini Preview of Options/Bullets */}
                      {slide.config?.options && (
                        <div className="space-y-1 bg-zinc-950/60 p-2 rounded-xl border border-zinc-800/80">
                          {slide.config.options
                            .slice(0, 3)
                            .map((opt: string, optIdx: number) => (
                              <div
                                key={optIdx}
                                className="text-[10px] text-zinc-400 truncate flex items-center gap-1.5"
                              >
                                <span className="w-1.5 h-1.5 rounded-full bg-zinc-600" />
                                <span>{opt}</span>
                              </div>
                            ))}
                        </div>
                      )}

                      {/* Action Buttons */}
                      <div className="flex items-center gap-2 pt-1">
                        <button
                          onClick={() => handleInsert(slide, idx, false)}
                          disabled={isInserted || isBusy}
                          className="flex-1 py-1.5 px-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all border border-zinc-700 disabled:opacity-50 cursor-pointer shadow-xs"
                        >
                          {isBusy ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Plus className="w-3.5 h-3.5 text-indigo-400" />
                          )}
                          <span>{isInserted ? "In Deck" : "Insert Slide"}</span>
                        </button>

                        <button
                          onClick={() => handleInsert(slide, idx, true)}
                          disabled={isBusy}
                          className="py-1.5 px-3 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow-xs disabled:opacity-50 cursor-pointer"
                          title="Insert slide and present it right now"
                        >
                          <Play className="w-3 h-3 fill-current" />
                          <span>Present Now</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>

      {/* ── FOOTER CONTROLS ── */}
      <div className="p-3 px-4 border-t border-zinc-800/80 bg-zinc-900/60 flex items-center justify-between text-[11px] text-zinc-400 shrink-0">
        <label className="flex items-center gap-2 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={autoAnalyze}
            onChange={(e) => setAutoAnalyze(e.target.checked)}
            className="rounded border-zinc-700 bg-zinc-800 text-indigo-600 focus:ring-0 w-3.5 h-3.5 cursor-pointer"
          />
          <span>Auto-analyze on slide &amp; responses</span>
        </label>

        {data?.generatedAt && (
          <span className="font-mono text-[10px] text-zinc-500">
            Updated{" "}
            {new Date(data.generatedAt).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
              second: "2-digit",
            })}
          </span>
        )}
      </div>
    </div>
  );
}
