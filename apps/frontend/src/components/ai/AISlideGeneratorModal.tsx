"use client";

import React, { useState } from "react";
import { getAccessToken, API_URL } from "@/lib/auth";
import {
  Sparkles,
  X,
  List,
  BarChart2,
  Presentation,
  Cloud,
  Check,
  CheckCircle2,
  Circle,
  Loader2,
  Sliders,
  HelpCircle,
  Type,
  Layers,
  ArrowRight,
  Plus,
  RefreshCw,
} from "lucide-react";

interface AISlideGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  presentationId: string;
  onAddSlides: (slides: any[]) => void;
  defaultType?: "deck" | "quiz" | "poll" | "icebreaker";
}

const GENERATION_MODES = [
  {
    id: "quiz",
    label: "Quiz Competition",
    description:
      "Multi-choice quiz questions with timers, scoring, and correct answers.",
    icon: <List className="w-5 h-5 text-indigo-500" />,
    badge: "Interactive Quiz",
  },
  {
    id: "poll",
    label: "Audience Polls",
    description: "Engaging single or multi-choice live voting questions.",
    icon: <BarChart2 className="w-5 h-5 text-blue-500" />,
    badge: "Live Polls",
  },
  {
    id: "deck",
    label: "Complete Presentation",
    description:
      "Structured deck with Title, Content, Interactive Poll, and Closing slides.",
    icon: <Presentation className="w-5 h-5 text-purple-500" />,
    badge: "Full Deck",
  },
  {
    id: "icebreaker",
    label: "Icebreakers & Clouds",
    description: "Word cloud and open discussion warmup prompts.",
    icon: <Cloud className="w-5 h-5 text-emerald-500" />,
    badge: "Warmup",
  },
];

const SUGGESTED_TOPICS = [
  "Future of Artificial Intelligence & LLMs",
  "Effective Remote Team Leadership",
  "Cybersecurity Best Practices for 2026",
  "Product Launch & Go-To-Market Strategy",
  "Climate Tech & Clean Energy Transition",
  "Design Systems & Modern UI Architecture",
];

export function AISlideGeneratorModal({
  isOpen,
  onClose,
  presentationId,
  onAddSlides,
  defaultType = "quiz",
}: AISlideGeneratorModalProps) {
  const [mode, setMode] = useState<string>(defaultType);
  const [topic, setTopic] = useState("");
  const [count, setCount] = useState<number>(4);
  const [difficulty, setDifficulty] = useState<string>("medium");
  const [audience, setAudience] = useState<string>("general");
  const [tone, setTone] = useState<string>("engaging");
  const [context, setContext] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Review step state
  const [generatedSlides, setGeneratedSlides] = useState<any[]>([]);
  const [selectedSlideIndices, setSelectedSlideIndices] = useState<Set<number>>(
    new Set(),
  );

  if (!isOpen) return null;

  const handleGenerate = async () => {
    if (!topic.trim()) {
      setError("Please enter a topic or prompt.");
      return;
    }

    setLoading(true);
    setError(null);
    setGeneratedSlides([]);

    try {
      const token = getAccessToken();
      const res = await fetch(`${API_URL}/api/ai/generate-slides`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          type: mode,
          topic: topic.trim(),
          count,
          difficulty,
          audience,
          tone,
          context: context.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok || !Array.isArray(data)) {
        throw new Error(data.message || "Failed to generate slides.");
      }

      setGeneratedSlides(data);
      // Select all by default
      setSelectedSlideIndices(new Set(data.map((_, i) => i)));
    } catch (err: any) {
      console.error("AI Generation error:", err);
      setError(
        err.message ||
          "Something went wrong while communicating with Sentio AI.",
      );
    } finally {
      setLoading(false);
    }
  };

  const toggleSelectSlide = (index: number) => {
    setSelectedSlideIndices((prev) => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  };

  const handleSelectAll = () => {
    if (selectedSlideIndices.size === generatedSlides.length) {
      setSelectedSlideIndices(new Set());
    } else {
      setSelectedSlideIndices(new Set(generatedSlides.map((_, i) => i)));
    }
  };

  const handleInsertSelected = () => {
    const slidesToInsert = generatedSlides.filter((_, idx) =>
      selectedSlideIndices.has(idx),
    );
    if (slidesToInsert.length === 0) return;
    onAddSlides(slidesToInsert);
    onClose();
    // Reset
    setGeneratedSlides([]);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl sm:rounded-3xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between bg-zinc-50/50 dark:bg-zinc-900/50 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-purple-100 dark:bg-purple-950/60 text-purple-600 dark:text-purple-300">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                Sentio AI Slide Generator
              </h2>
              <p className="text-xs text-zinc-500">
                Generate interactive quizzes, polls, icebreakers, or full
                presentations in seconds
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {generatedSlides.length === 0 ? (
            /* Config View */
            <div className="space-y-6">
              {/* Generation Mode Selector */}
              <div>
                <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2.5">
                  1. Choose Generation Type
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {GENERATION_MODES.map((m) => {
                    const isSelected = mode === m.id;
                    return (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => setMode(m.id)}
                        className={`p-4 rounded-2xl border-2 text-left transition-all flex items-start gap-3.5 cursor-pointer ${
                          isSelected
                            ? "border-purple-600 bg-purple-50/50 dark:bg-purple-950/30 shadow-xs ring-2 ring-purple-500/20"
                            : "border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 bg-white dark:bg-zinc-850"
                        }`}
                      >
                        <div className="p-2 rounded-xl bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 shadow-2xs">
                          {m.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-bold text-zinc-900 dark:text-zinc-100 flex items-center justify-between">
                            <span>{m.label}</span>
                            {isSelected && (
                              <div className="w-4 h-4 rounded-full bg-purple-600 text-white flex items-center justify-center">
                                <Check className="w-2.5 h-2.5 stroke-[3]" />
                              </div>
                            )}
                          </div>
                          <p className="text-xs text-zinc-500 mt-1 leading-relaxed">
                            {m.description}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Topic & Suggestions */}
              <div>
                <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">
                  2. Presentation Topic or Questions Focus
                </label>
                <input
                  type="text"
                  value={topic}
                  onChange={(e) => {
                    setTopic(e.target.value);
                    if (error) setError(null);
                  }}
                  placeholder="e.g. Modern Web Development with Next.js & React 19..."
                  className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm text-zinc-900 dark:text-zinc-100 outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all font-medium"
                />

                {/* Suggestions Chips */}
                <div className="flex items-center gap-1.5 flex-wrap mt-2.5">
                  <span className="text-[11px] text-zinc-400 font-semibold mr-1">
                    Try:
                  </span>
                  {SUGGESTED_TOPICS.slice(0, 4).map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setTopic(t)}
                      className="text-[11px] px-2.5 py-1 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 hover:bg-purple-50 hover:text-purple-600 dark:hover:bg-purple-950/40 dark:hover:text-purple-300 transition-colors"
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              {/* Detailed Configuration Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 border-t border-zinc-100 dark:border-zinc-800">
                {/* Count Slider */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">
                      Slide Count
                    </label>
                    <span className="text-xs font-mono font-bold text-purple-600 dark:text-purple-400">
                      {count} Slides
                    </span>
                  </div>
                  <input
                    type="range"
                    min={1}
                    max={10}
                    value={count}
                    onChange={(e) => setCount(Number(e.target.value))}
                    className="w-full h-2 bg-zinc-200 dark:bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-purple-600"
                  />
                  <div className="flex justify-between text-[10px] text-zinc-400 font-mono mt-1">
                    <span>1</span>
                    <span>5</span>
                    <span>10</span>
                  </div>
                </div>

                {/* Difficulty / Tone */}
                {mode === "quiz" ? (
                  <div>
                    <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">
                      Difficulty Level
                    </label>
                    <select
                      value={difficulty}
                      onChange={(e) => setDifficulty(e.target.value)}
                      className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs text-zinc-900 dark:text-zinc-100 outline-none"
                    >
                      <option value="easy">Beginner / Easy</option>
                      <option value="medium">Medium / Standard</option>
                      <option value="hard">Advanced / Hard</option>
                    </select>
                  </div>
                ) : (
                  <div>
                    <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">
                      Tone of Deck
                    </label>
                    <select
                      value={tone}
                      onChange={(e) => setTone(e.target.value)}
                      className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs text-zinc-900 dark:text-zinc-100 outline-none"
                    >
                      <option value="engaging">Engaging & Dynamic</option>
                      <option value="professional">Professional & Clean</option>
                      <option value="educational">
                        Educational & Instructive
                      </option>
                      <option value="fun">Casual & Fun</option>
                    </select>
                  </div>
                )}

                {/* Target Audience */}
                <div>
                  <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">
                    Target Audience
                  </label>
                  <select
                    value={audience}
                    onChange={(e) => setAudience(e.target.value)}
                    className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs text-zinc-900 dark:text-zinc-100 outline-none"
                  >
                    <option value="general">General Audience</option>
                    <option value="students">Students / Learners</option>
                    <option value="engineers">Developers & Tech</option>
                    <option value="executives">Business & Executives</option>
                    <option value="teammates">Internal Team</option>
                  </select>
                </div>
              </div>

              {/* Error Alert */}
              {error && (
                <div className="p-3.5 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800/60 rounded-xl text-xs text-red-600 dark:text-red-400 font-medium">
                  {error}
                </div>
              )}
            </div>
          ) : (
            /* Review & Selection View */
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                    Generated {generatedSlides.length} Slides for: &ldquo;
                    {topic}&rdquo;
                  </h3>
                  <p className="text-xs text-zinc-500">
                    Select which slides you want to add into your presentation
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleSelectAll}
                    className="text-xs text-purple-600 dark:text-purple-400 hover:underline font-bold px-2 py-1"
                  >
                    {selectedSlideIndices.size === generatedSlides.length
                      ? "Deselect All"
                      : "Select All"}
                  </button>
                  <button
                    onClick={() => setGeneratedSlides([])}
                    className="text-xs text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800"
                  >
                    <RefreshCw className="w-3 h-3" /> Adjust Inputs
                  </button>
                </div>
              </div>

              {/* Generated Slides Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {generatedSlides.map((slide, idx) => {
                  const isSelected = selectedSlideIndices.has(idx);
                  return (
                    <div
                      key={idx}
                      onClick={() => toggleSelectSlide(idx)}
                      className={`p-4 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between h-48 relative overflow-hidden ${
                        isSelected
                          ? "border-purple-600 bg-purple-50/40 dark:bg-purple-950/20 shadow-sm"
                          : "border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-850 opacity-70"
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[10px] uppercase font-mono font-bold tracking-wider px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300">
                            Slide {idx + 1} • {slide.type}
                          </span>
                          <div className="text-purple-600 dark:text-purple-400">
                            {isSelected ? (
                              <CheckCircle2 className="w-5 h-5 fill-current text-white dark:text-zinc-900" />
                            ) : (
                              <Circle className="w-5 h-5 text-zinc-300 dark:text-zinc-600" />
                            )}
                          </div>
                        </div>

                        <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 line-clamp-2">
                          {slide.title}
                        </h4>
                        {slide.description && (
                          <p className="text-xs text-zinc-500 mt-1 line-clamp-2">
                            {slide.description}
                          </p>
                        )}
                      </div>

                      {/* Content preview */}
                      <div className="mt-2 pt-2 border-t border-zinc-100 dark:border-zinc-800/60 text-[11px] text-zinc-500">
                        {slide.config?.options ? (
                          <div className="flex items-center gap-1.5 truncate">
                            <span className="font-bold">Choices:</span>{" "}
                            {slide.config.options.join(", ")}
                          </div>
                        ) : slide.config?.bulletPoints ? (
                          <div className="truncate">
                            <span className="font-bold">Points:</span>{" "}
                            {slide.config.bulletPoints.join(" • ")}
                          </div>
                        ) : (
                          <span>Interactive slide format</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 flex items-center justify-between shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100"
          >
            Cancel
          </button>

          {generatedSlides.length === 0 ? (
            <button
              onClick={handleGenerate}
              disabled={loading || !topic.trim()}
              className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white text-xs font-bold rounded-xl shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Generating {count} Slides...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Generate {count} Slides with AI</span>
                </>
              )}
            </button>
          ) : (
            <button
              onClick={handleInsertSelected}
              disabled={selectedSlideIndices.size === 0}
              className="flex items-center gap-2 px-6 py-2.5 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-xl shadow-md transition-all disabled:opacity-50 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>
                Insert {selectedSlideIndices.size} Selected Slide
                {selectedSlideIndices.size > 1 ? "s" : ""}
              </span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
