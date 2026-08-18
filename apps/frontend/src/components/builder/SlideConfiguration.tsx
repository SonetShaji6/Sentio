"use client";

import React, { useState, useRef, useEffect } from "react";
import { ISlide } from "@/types/slide";
import { useAutoSave } from "@/hooks/useAutoSave";
import { getAccessToken, API_URL } from "@/lib/auth";
import {
  Settings,
  Plus,
  Trash2,
  CheckCircle2,
  Circle,
  Timer,
  Award,
  Sparkles,
  Palette,
  Sliders,
  Type,
  Image as ImageIcon,
  Upload,
  Link as LinkIcon,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Columns,
  Maximize2,
  RefreshCw,
  Eye,
  Lock,
  Layers,
  Layout,
  Loader2,
  Move,
  Maximize,
  Sparkle,
  SunMedium,
} from "lucide-react";

interface SlideConfigurationProps {
  presentationId: string;
  slide: ISlide | null;
  onUpdateLocal: (slideId: string, updates: Partial<ISlide>) => void;
  className?: string;
  onClose?: () => void;
}

const STOCK_IMAGES = [
  {
    label: "Modern Tech",
    url: "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1200&q=80",
  },
  {
    label: "Minimal Architecture",
    url: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1200&q=80",
  },
  {
    label: "Abstract Gradient",
    url: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80",
  },
  {
    label: "Team Collaboration",
    url: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=1200&q=80",
  },
];

export function SlideConfiguration({
  presentationId,
  slide,
  onUpdateLocal,
  className = "",
  onClose,
}: SlideConfigurationProps) {
  if (!slide) {
    return (
      <div
        className={`w-full md:w-80 flex flex-col h-full bg-white dark:bg-zinc-900 border-l border-zinc-200 dark:border-zinc-800 shrink-0 items-center justify-center text-zinc-400 p-6 text-center ${className}`}
      >
        <div className="w-12 h-12 rounded-2xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center mb-3">
          <Settings className="w-6 h-6 opacity-40" />
        </div>
        <p className="text-sm font-medium">
          Select a slide to customize its content, design and images
        </p>
      </div>
    );
  }

  return (
    <SlideConfigPanel
      key={slide._id}
      presentationId={presentationId}
      initialSlide={slide}
      onUpdateLocal={onUpdateLocal}
      className={className}
      onClose={onClose}
    />
  );
}

function SlideConfigPanel({
  presentationId,
  initialSlide,
  onUpdateLocal,
  className = "",
  onClose,
}: {
  presentationId: string;
  initialSlide: ISlide;
  onUpdateLocal: (id: string, updates: Partial<ISlide>) => void;
  className?: string;
  onClose?: () => void;
}) {
  const [activeTab, setActiveTab] = useState<
    "content" | "design" | "media" | "settings"
  >("content");
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imageError, setImageError] = useState<string | null>(null);
  const [urlInput, setUrlInput] = useState(initialSlide.config?.mediaUrl ?? "");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    data: slide,
    updateData,
    saveState,
  } = useAutoSave<ISlide>(
    `/api/presentations/${presentationId}/slides/${initialSlide._id}`,
    initialSlide,
    800,
  );

  useEffect(() => {
    setUrlInput(slide.config?.mediaUrl ?? "");
  }, [slide.config?.mediaUrl]);

  const handleUpdate = (updates: Partial<ISlide>) => {
    updateData(updates);
    onUpdateLocal(slide._id, updates);
  };

  const handleConfigChange = (key: string, value: any) => {
    handleUpdate({ config: { ...slide.config, [key]: value } });
  };

  const handleResetColors = () => {
    const updated = { ...slide.config };
    delete updated.textColor;
    delete updated.textMutedColor;
    delete updated.bgColor;
    delete updated.cardBgColor;
    delete updated.accentColor;
    handleUpdate({ config: updated });
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    setImageError(null);

    try {
      const token = getAccessToken();
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch(
        `${API_URL}/api/presentations/${presentationId}/slides/${slide._id}/image`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        },
      );

      const data = await res.json();
      if (!res.ok) {
        throw new Error(
          data.error || data.message || "Failed to upload image.",
        );
      }

      if (data.url) {
        handleConfigChange("mediaUrl", data.url);
        setActiveTab("media");
      }
    } catch (err: any) {
      console.error("Image upload failed:", err);
      setImageError(err.message || "Failed to upload image.");
    } finally {
      setUploadingImage(false);
    }
  };

  const renderSpecificConfig = () => {
    switch (slide.type) {
      case "title":
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-zinc-600 dark:text-zinc-400 uppercase tracking-wider mb-1.5">
                Kicker / Category Tag
              </label>
              <input
                type="text"
                value={slide.config?.kicker ?? ""}
                onChange={(e) => handleConfigChange("kicker", e.target.value)}
                disabled={Boolean(slide.isLocked)}
                placeholder="e.g. Keynote, Product Update, Workshop"
                className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs text-zinc-900 dark:text-zinc-100 outline-none focus:border-blue-500 transition-all disabled:opacity-50"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-600 dark:text-zinc-400 uppercase tracking-wider mb-1.5">
                Presenter Name
              </label>
              <input
                type="text"
                value={slide.config?.author ?? ""}
                onChange={(e) => handleConfigChange("author", e.target.value)}
                disabled={Boolean(slide.isLocked)}
                placeholder="e.g. Jane Doe"
                className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs text-zinc-900 dark:text-zinc-100 outline-none focus:border-blue-500 transition-all disabled:opacity-50"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-600 dark:text-zinc-400 uppercase tracking-wider mb-1.5">
                Presenter Subtitle / Role
              </label>
              <input
                type="text"
                value={slide.config?.authorRole ?? ""}
                onChange={(e) =>
                  handleConfigChange("authorRole", e.target.value)
                }
                disabled={Boolean(slide.isLocked)}
                placeholder="e.g. Head of Product, Sentio"
                className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs text-zinc-900 dark:text-zinc-100 outline-none focus:border-blue-500 transition-all disabled:opacity-50"
              />
            </div>
          </div>
        );

      case "information":
        const bullets: string[] = slide.config?.bulletPoints || [];
        return (
          <div className="space-y-3">
            <label className="block text-xs font-bold text-zinc-600 dark:text-zinc-400 uppercase tracking-wider">
              Key Takeaway Points
            </label>
            <div className="space-y-2">
              {bullets.map((point: string, idx: number) => (
                <div key={idx} className="flex gap-2 items-center">
                  <input
                    type="text"
                    value={point ?? ""}
                    onChange={(e) => {
                      const updated = [...bullets];
                      updated[idx] = e.target.value;
                      handleConfigChange("bulletPoints", updated);
                    }}
                    disabled={Boolean(slide.isLocked)}
                    placeholder={`Point ${idx + 1}`}
                    className="flex-1 px-3 py-2 bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs text-zinc-900 dark:text-zinc-100 outline-none focus:border-blue-500 transition-all disabled:opacity-50"
                  />
                  <button
                    onClick={() => {
                      const updated = [...bullets];
                      updated.splice(idx, 1);
                      handleConfigChange("bulletPoints", updated);
                    }}
                    disabled={Boolean(slide.isLocked)}
                    className="p-2 text-zinc-400 hover:text-red-500 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
              <button
                onClick={() => {
                  handleConfigChange("bulletPoints", [...bullets, ""]);
                }}
                disabled={Boolean(slide.isLocked)}
                className="flex items-center gap-1.5 text-xs text-blue-600 dark:text-blue-400 font-bold py-1 px-2 hover:underline"
              >
                <Plus className="w-3.5 h-3.5" /> Add Point
              </button>
            </div>
          </div>
        );

      case "poll":
      case "imagepoll":
        const pollOptions = slide.config?.options || [];
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-zinc-600 dark:text-zinc-400 uppercase tracking-wider mb-2">
                Poll Options
              </label>
              <div className="space-y-2">
                {pollOptions.map((opt: string, i: number) => (
                  <div key={i} className="flex gap-2 items-center">
                    <span className="w-6 h-6 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-500 text-[11px] font-bold flex items-center justify-center shrink-0">
                      {String.fromCharCode(65 + i)}
                    </span>
                    <input
                      type="text"
                      value={opt ?? ""}
                      onChange={(e) => {
                        const newOpts = [...pollOptions];
                        newOpts[i] = e.target.value;
                        handleConfigChange("options", newOpts);
                      }}
                      className="flex-1 bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 rounded-xl px-3 py-2 text-xs text-zinc-900 dark:text-zinc-100 outline-none focus:border-blue-500 transition-all disabled:opacity-50"
                      placeholder={`Option ${i + 1}`}
                      disabled={Boolean(slide.isLocked)}
                    />
                    <button
                      onClick={() => {
                        const newOpts = [...pollOptions];
                        newOpts.splice(i, 1);
                        handleConfigChange("options", newOpts);
                      }}
                      disabled={Boolean(slide.isLocked)}
                      className="p-2 text-zinc-400 hover:text-red-500 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
                <button
                  onClick={() => {
                    handleConfigChange("options", [...pollOptions, ""]);
                  }}
                  disabled={Boolean(slide.isLocked)}
                  className="flex items-center gap-1.5 text-xs text-blue-600 dark:text-blue-400 font-bold py-1 px-2 hover:underline"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Option
                </button>
              </div>
            </div>

            <label className="flex items-center gap-3 p-3 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700/80 rounded-xl cursor-pointer">
              <input
                type="checkbox"
                checked={Boolean(slide.config?.allowMultiple)}
                onChange={(e) =>
                  handleConfigChange("allowMultiple", e.target.checked)
                }
                disabled={Boolean(slide.isLocked)}
                className="w-4 h-4 text-blue-600 rounded"
              />
              <div className="flex-1">
                <div className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                  Multiple Selection
                </div>
                <div className="text-[11px] text-zinc-500">
                  Allow participants to pick more than one option
                </div>
              </div>
            </label>
          </div>
        );

      case "quiz":
        const quizOpts = slide.config?.options || [];
        const correctAnswers = slide.config?.correctAnswers || [];

        return (
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-zinc-600 dark:text-zinc-400 uppercase tracking-wider mb-2">
                Quiz Answers (Click circle to set correct)
              </label>
              <div className="space-y-2">
                {quizOpts.map((opt: string, i: number) => {
                  const isCorrect = correctAnswers.includes(i);
                  return (
                    <div key={i} className="flex gap-2 items-center">
                      <button
                        type="button"
                        onClick={() => {
                          if (slide.isLocked) return;
                          let updated: number[] = [];
                          if (isCorrect) {
                            updated = correctAnswers.filter(
                              (idx: number) => idx !== i,
                            );
                          } else {
                            updated = [i];
                          }
                          handleConfigChange("correctAnswers", updated);
                        }}
                        className="p-1 text-zinc-400 hover:text-emerald-500 transition-colors"
                        title={
                          isCorrect
                            ? "Marked as correct answer"
                            : "Click to mark as correct answer"
                        }
                      >
                        {isCorrect ? (
                          <CheckCircle2 className="w-5 h-5 text-emerald-500 fill-emerald-500/20" />
                        ) : (
                          <Circle className="w-5 h-5 text-zinc-300 dark:text-zinc-600" />
                        )}
                      </button>
                      <input
                        type="text"
                        value={opt ?? ""}
                        onChange={(e) => {
                          const newOpts = [...quizOpts];
                          newOpts[i] = e.target.value;
                          handleConfigChange("options", newOpts);
                        }}
                        className={`flex-1 bg-zinc-50 dark:bg-zinc-800/80 border rounded-xl px-3 py-2 text-xs text-zinc-900 dark:text-zinc-100 outline-none focus:border-blue-500 transition-all ${
                          isCorrect
                            ? "border-emerald-500 ring-1 ring-emerald-500/30 font-medium"
                            : "border-zinc-200 dark:border-zinc-700"
                        }`}
                        placeholder={`Answer choice ${i + 1}`}
                        disabled={Boolean(slide.isLocked)}
                      />
                      <button
                        onClick={() => {
                          const newOpts = [...quizOpts];
                          newOpts.splice(i, 1);
                          handleConfigChange("options", newOpts);
                        }}
                        disabled={Boolean(slide.isLocked)}
                        className="p-2 text-zinc-400 hover:text-red-500 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  );
                })}
                <button
                  onClick={() => {
                    handleConfigChange("options", [...quizOpts, ""]);
                  }}
                  disabled={Boolean(slide.isLocked)}
                  className="flex items-center gap-1.5 text-xs text-blue-600 dark:text-blue-400 font-bold py-1 px-2 hover:underline"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Choice
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <div>
                <label className="block text-xs font-bold text-zinc-600 dark:text-zinc-400 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                  <Timer className="w-3.5 h-3.5" /> Timer
                </label>
                <select
                  value={slide.config?.timer ?? 30}
                  onChange={(e) =>
                    handleConfigChange("timer", Number(e.target.value))
                  }
                  disabled={Boolean(slide.isLocked)}
                  className="w-full bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 rounded-xl px-3 py-2 text-xs text-zinc-900 dark:text-zinc-100 outline-none"
                >
                  <option value="10">10 Seconds</option>
                  <option value="20">20 Seconds</option>
                  <option value="30">30 Seconds</option>
                  <option value="45">45 Seconds</option>
                  <option value="60">60 Seconds</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-600 dark:text-zinc-400 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                  <Award className="w-3.5 h-3.5" /> Points
                </label>
                <select
                  value={slide.config?.points ?? 1000}
                  onChange={(e) =>
                    handleConfigChange("points", Number(e.target.value))
                  }
                  disabled={Boolean(slide.isLocked)}
                  className="w-full bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 rounded-xl px-3 py-2 text-xs text-zinc-900 dark:text-zinc-100 outline-none"
                >
                  <option value="500">500 pts</option>
                  <option value="1000">1,000 pts</option>
                  <option value="2000">2,000 pts</option>
                </select>
              </div>
            </div>
          </div>
        );

      case "rating":
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-zinc-600 dark:text-zinc-400 uppercase tracking-wider mb-1.5">
                Rating Scale Max
              </label>
              <select
                value={slide.config?.ratingRange?.max ?? 5}
                onChange={(e) =>
                  handleConfigChange("ratingRange", {
                    min: 1,
                    max: Number(e.target.value),
                  })
                }
                disabled={Boolean(slide.isLocked)}
                className="w-full bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 rounded-xl px-3 py-2 text-xs text-zinc-900 dark:text-zinc-100 outline-none"
              >
                <option value="5">1 to 5 Stars</option>
                <option value="10">1 to 10 Scale</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-zinc-600 dark:text-zinc-400 uppercase tracking-wider mb-1.5">
                  Low Label
                </label>
                <input
                  type="text"
                  value={slide.config?.lowLabel ?? "Needs Work"}
                  onChange={(e) =>
                    handleConfigChange("lowLabel", e.target.value)
                  }
                  disabled={Boolean(slide.isLocked)}
                  className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-zinc-600 dark:text-zinc-400 uppercase tracking-wider mb-1.5">
                  High Label
                </label>
                <input
                  type="text"
                  value={slide.config?.highLabel ?? "Outstanding"}
                  onChange={(e) =>
                    handleConfigChange("highLabel", e.target.value)
                  }
                  disabled={Boolean(slide.isLocked)}
                  className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs"
                />
              </div>
            </div>
          </div>
        );

      case "opentext":
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-zinc-600 dark:text-zinc-400 uppercase tracking-wider mb-1.5">
                Character Limit
              </label>
              <select
                value={slide.config?.charLimit ?? 500}
                onChange={(e) =>
                  handleConfigChange("charLimit", Number(e.target.value))
                }
                disabled={Boolean(slide.isLocked)}
                className="w-full bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 rounded-xl px-3 py-2 text-xs text-zinc-900 dark:text-zinc-100 outline-none"
              >
                <option value="150">150 characters (Short & snappy)</option>
                <option value="300">300 characters (Standard)</option>
                <option value="500">500 characters (Detailed)</option>
                <option value="1000">1000 characters (Long form)</option>
              </select>
            </div>
          </div>
        );

      case "thankyou":
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-zinc-600 dark:text-zinc-400 uppercase tracking-wider mb-1.5">
                Call To Action / Link
              </label>
              <input
                type="text"
                value={slide.config?.callToAction ?? ""}
                onChange={(e) =>
                  handleConfigChange("callToAction", e.target.value)
                }
                disabled={Boolean(slide.isLocked)}
                placeholder="e.g. sentio.app or contact@example.com"
                className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs text-zinc-900 dark:text-zinc-100 outline-none focus:border-blue-500 transition-all"
              />
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div
      className={`w-full md:w-80 flex flex-col h-full bg-white dark:bg-zinc-900 border-l border-zinc-200 dark:border-zinc-800 shrink-0 select-none ${className}`}
    >
      {/* Header */}
      <div className="p-3 border-b border-zinc-200 dark:border-zinc-800 shrink-0 bg-zinc-50/60 dark:bg-zinc-950/60">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400">
              <Sliders className="w-4 h-4" />
            </div>
            <h2 className="font-bold text-xs sm:text-sm text-zinc-900 dark:text-zinc-100">
              Slide Editor & Style
            </h2>
          </div>
          <div className="text-[11px] font-mono text-zinc-400">
            {saveState === "saving" && "Saving..."}
            {saveState === "saved" && "Saved"}
            {saveState === "error" && (
              <span className="text-red-500">Save failed</span>
            )}
          </div>
        </div>

        {/* 4-Way Tab Bar */}
        <div className="grid grid-cols-4 gap-1 bg-zinc-200/80 dark:bg-zinc-800 p-0.5 rounded-xl text-[11px] font-semibold">
          <button
            onClick={() => setActiveTab("content")}
            className={`py-1 rounded-lg transition-all text-center ${
              activeTab === "content"
                ? "bg-white dark:bg-zinc-900 text-blue-600 dark:text-blue-400 shadow-xs font-bold"
                : "text-zinc-500 hover:text-zinc-900 dark:hover:text-white"
            }`}
          >
            Content
          </button>
          <button
            onClick={() => setActiveTab("design")}
            className={`py-1 rounded-lg transition-all text-center ${
              activeTab === "design"
                ? "bg-white dark:bg-zinc-900 text-blue-600 dark:text-blue-400 shadow-xs font-bold"
                : "text-zinc-500 hover:text-zinc-900 dark:hover:text-white"
            }`}
          >
            Style
          </button>
          <button
            onClick={() => setActiveTab("media")}
            className={`py-1 rounded-lg transition-all text-center ${
              activeTab === "media"
                ? "bg-white dark:bg-zinc-900 text-blue-600 dark:text-blue-400 shadow-xs font-bold"
                : "text-zinc-500 hover:text-zinc-900 dark:hover:text-white"
            }`}
          >
            Media {slide.config?.mediaUrl ? "•" : ""}
          </button>
          <button
            onClick={() => setActiveTab("settings")}
            className={`py-1 rounded-lg transition-all text-center ${
              activeTab === "settings"
                ? "bg-white dark:bg-zinc-900 text-blue-600 dark:text-blue-400 shadow-xs font-bold"
                : "text-zinc-500 hover:text-zinc-900 dark:hover:text-white"
            }`}
          >
            Settings
          </button>
        </div>
      </div>

      {/* Body Tab Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-5">
        {/* ── TAB 1: CONTENT ── */}
        {activeTab === "content" && (
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-zinc-600 dark:text-zinc-400 uppercase tracking-wider mb-1">
                Slide Headline
              </label>
              <input
                type="text"
                value={slide.title ?? ""}
                onChange={(e) => handleUpdate({ title: e.target.value })}
                disabled={Boolean(slide.isLocked)}
                className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-xs font-semibold text-zinc-900 dark:text-white transition-all disabled:opacity-50"
                placeholder="Enter slide title..."
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-600 dark:text-zinc-400 uppercase tracking-wider mb-1">
                Subtitle / Description
              </label>
              <textarea
                value={slide.description ?? ""}
                onChange={(e) => handleUpdate({ description: e.target.value })}
                rows={3}
                disabled={Boolean(slide.isLocked)}
                className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-xs text-zinc-800 dark:text-zinc-200 resize-none transition-all disabled:opacity-50"
                placeholder="Add optional description or instructions..."
              />
            </div>

            {renderSpecificConfig() && (
              <div className="border-t border-zinc-200 dark:border-zinc-800 pt-4">
                {renderSpecificConfig()}
              </div>
            )}
          </div>
        )}

        {/* ── TAB 2: DESIGN & STYLE (FONTS, COLORS, ALIGNMENT, LAYOUT) ── */}
        {activeTab === "design" && (
          <div className="space-y-5">
            {/* Font Family Picker */}
            <div>
              <label className="block text-xs font-bold text-zinc-600 dark:text-zinc-400 uppercase tracking-wider mb-2">
                Font Family
              </label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: "sans", label: "Inter (Sans)", font: "font-sans" },
                  {
                    id: "serif",
                    label: "Editorial (Serif)",
                    font: "font-serif",
                  },
                  {
                    id: "display",
                    label: "Outfit (Display)",
                    font: "font-sans font-bold",
                  },
                  { id: "mono", label: "JetBrains (Mono)", font: "font-mono" },
                ].map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => handleConfigChange("fontFamily", f.id)}
                    className={`p-2.5 rounded-xl border text-xs text-left transition-all ${
                      (slide.config?.fontFamily || "sans") === f.id
                        ? "border-blue-600 bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 font-bold shadow-xs"
                        : "border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:border-zinc-300"
                    }`}
                  >
                    <span className={f.font}>{f.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Headline Size & Text Alignment */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-zinc-600 dark:text-zinc-400 uppercase tracking-wider mb-1.5">
                  Headline Size
                </label>
                <select
                  value={slide.config?.fontSize ?? "normal"}
                  onChange={(e) =>
                    handleConfigChange("fontSize", e.target.value)
                  }
                  className="w-full bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 rounded-xl px-3 py-2 text-xs text-zinc-900 dark:text-zinc-100 outline-none"
                >
                  <option value="small">Small</option>
                  <option value="normal">Standard</option>
                  <option value="large">Large</option>
                  <option value="huge">Extra Bold / Huge</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-600 dark:text-zinc-400 uppercase tracking-wider mb-1.5">
                  Text Alignment
                </label>
                <div className="flex items-center bg-zinc-100 dark:bg-zinc-800 p-1 rounded-xl border border-zinc-200 dark:border-zinc-700">
                  <button
                    type="button"
                    onClick={() => handleConfigChange("align", "left")}
                    className={`flex-1 p-1.5 rounded-lg flex items-center justify-center transition-colors ${
                      (slide.config?.align || "left") === "left"
                        ? "bg-white dark:bg-zinc-900 text-blue-600 dark:text-blue-400 shadow-xs"
                        : "text-zinc-500 hover:text-zinc-900"
                    }`}
                    title="Align Left"
                  >
                    <AlignLeft className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleConfigChange("align", "center")}
                    className={`flex-1 p-1.5 rounded-lg flex items-center justify-center transition-colors ${
                      slide.config?.align === "center"
                        ? "bg-white dark:bg-zinc-900 text-blue-600 dark:text-blue-400 shadow-xs"
                        : "text-zinc-500 hover:text-zinc-900"
                    }`}
                    title="Align Center"
                  >
                    <AlignCenter className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleConfigChange("align", "right")}
                    className={`flex-1 p-1.5 rounded-lg flex items-center justify-center transition-colors ${
                      slide.config?.align === "right"
                        ? "bg-white dark:bg-zinc-900 text-blue-600 dark:text-blue-400 shadow-xs"
                        : "text-zinc-500 hover:text-zinc-900"
                    }`}
                    title="Align Right"
                  >
                    <AlignRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Layout Style */}
            <div>
              <label className="block text-xs font-bold text-zinc-600 dark:text-zinc-400 uppercase tracking-wider mb-2">
                Slide Layout Structure
              </label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  {
                    id: "standard",
                    label: "Standard Stack",
                    icon: <Layout className="w-3.5 h-3.5" />,
                  },
                  {
                    id: "split",
                    label: "Split 2-Column",
                    icon: <Columns className="w-3.5 h-3.5" />,
                  },
                  {
                    id: "centered",
                    label: "Centered Hero",
                    icon: <AlignCenter className="w-3.5 h-3.5" />,
                  },
                  {
                    id: "card",
                    label: "Glass Card",
                    icon: <Layers className="w-3.5 h-3.5" />,
                  },
                ].map((l) => (
                  <button
                    key={l.id}
                    type="button"
                    onClick={() => handleConfigChange("layoutStyle", l.id)}
                    className={`p-2.5 rounded-xl border text-xs flex items-center gap-2 transition-all ${
                      (slide.config?.layoutStyle || "standard") === l.id
                        ? "border-blue-600 bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 font-bold shadow-xs"
                        : "border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:border-zinc-300"
                    }`}
                  >
                    {l.icon}
                    <span>{l.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Slide Colors Override */}
            <div className="border-t border-zinc-200 dark:border-zinc-800 pt-4 space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-zinc-600 dark:text-zinc-400 uppercase tracking-wider">
                  Slide Color Overrides
                </label>
                <button
                  type="button"
                  onClick={handleResetColors}
                  className="text-[11px] text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 font-bold"
                >
                  <RefreshCw className="w-3 h-3" /> Reset Colors
                </button>
              </div>

              <div className="space-y-2.5">
                {[
                  {
                    label: "Headline Text Color",
                    key: "textColor",
                    fallback: "#0F172A",
                  },
                  {
                    label: "Subtitle / Muted Text",
                    key: "textMutedColor",
                    fallback: "#64748B",
                  },
                  {
                    label: "Primary Accent Color",
                    key: "accentColor",
                    fallback: "#2563EB",
                  },
                  {
                    label: "Slide Background Color",
                    key: "bgColor",
                    fallback: "#FFFFFF",
                  },
                  {
                    label: "Card / Element Background",
                    key: "cardBgColor",
                    fallback: "#F8FAFC",
                  },
                ].map((c) => (
                  <div
                    key={c.key}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-750 text-xs"
                  >
                    <span className="font-medium text-zinc-700 dark:text-zinc-300">
                      {c.label}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-zinc-400 text-[11px] uppercase">
                        {slide.config?.[c.key] ?? "Theme Default"}
                      </span>
                      <input
                        type="color"
                        value={slide.config?.[c.key] ?? c.fallback}
                        onChange={(e) =>
                          handleConfigChange(c.key, e.target.value)
                        }
                        className="w-6 h-6 rounded-lg cursor-pointer border-0 bg-transparent p-0"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── TAB 3: MEDIA, IMAGE POSITIONING & RESIZING ── */}
        {activeTab === "media" && (
          <div className="space-y-5">
            <div>
              <label className="block text-xs font-bold text-zinc-600 dark:text-zinc-400 uppercase tracking-wider mb-2">
                Slide Image / Illustration
              </label>

              {slide.config?.mediaUrl ? (
                /* Active Image Settings & Layout Controls */
                <div className="space-y-4">
                  {/* Thumbnail Banner with Quick Actions */}
                  <div className="relative rounded-2xl overflow-hidden border border-zinc-200 dark:border-zinc-700 shadow-sm group">
                    <img
                      src={slide.config.mediaUrl}
                      alt="Slide graphic"
                      className="w-full h-32 object-cover"
                    />
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 backdrop-blur-2xs">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="px-3 py-1.5 bg-white text-black font-bold text-xs rounded-xl shadow-md hover:bg-zinc-100"
                      >
                        Replace
                      </button>
                      <button
                        type="button"
                        onClick={() => handleConfigChange("mediaUrl", "")}
                        className="px-3 py-1.5 bg-red-600 text-white font-bold text-xs rounded-xl shadow-md hover:bg-red-700"
                      >
                        Remove
                      </button>
                    </div>
                  </div>

                  {/* 1. Placement Mode Selector */}
                  <div>
                    <label className="block text-xs font-bold text-zinc-600 dark:text-zinc-400 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                      <Layout className="w-3.5 h-3.5" /> Layout Placement
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { id: "right", label: "Right Split", icon: "◨" },
                        { id: "left", label: "Left Split", icon: "◧" },
                        { id: "top", label: "Top Banner", icon: "⬒" },
                        { id: "card", label: "Hero Card", icon: "▣" },
                        {
                          id: "custom",
                          label: "Floating (Movable)",
                          icon: "✥",
                        },
                        { id: "background", label: "Full Backdrop", icon: "▦" },
                      ].map((pos) => (
                        <button
                          key={pos.id}
                          type="button"
                          onClick={() =>
                            handleConfigChange("mediaPosition", pos.id)
                          }
                          className={`p-2 rounded-xl border text-xs text-left font-medium flex items-center gap-2 transition-all ${
                            (slide.config?.mediaPosition || "right") === pos.id
                              ? "border-blue-600 bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 font-bold shadow-xs"
                              : "border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:border-zinc-300"
                          }`}
                        >
                          <span className="font-mono text-sm">{pos.icon}</span>
                          <span>{pos.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* 2. Image Width / Size Slider */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-xs font-bold text-zinc-600 dark:text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                        <Maximize className="w-3.5 h-3.5" /> Image Size / Width
                      </label>
                      <span className="text-xs font-mono font-bold text-blue-600 dark:text-blue-400">
                        {slide.config?.mediaWidth ??
                          (slide.config?.mediaPosition === "top" ? 100 : 45)}
                        %
                      </span>
                    </div>
                    <input
                      type="range"
                      min="20"
                      max="100"
                      step="5"
                      value={
                        slide.config?.mediaWidth ??
                        (slide.config?.mediaPosition === "top" ? 100 : 45)
                      }
                      onChange={(e) =>
                        handleConfigChange("mediaWidth", Number(e.target.value))
                      }
                      className="w-full h-1.5 bg-zinc-200 dark:bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-blue-600"
                    />
                    <div className="flex justify-between gap-1 mt-1.5">
                      {[30, 45, 60, 100].map((w) => (
                        <button
                          key={w}
                          type="button"
                          onClick={() => handleConfigChange("mediaWidth", w)}
                          className="px-2 py-0.5 rounded-md bg-zinc-100 dark:bg-zinc-800 text-[10px] font-mono text-zinc-500 hover:text-zinc-900 dark:hover:text-white"
                        >
                          {w}%
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* 3. Floating Positioning (X and Y offsets) */}
                  {slide.config?.mediaPosition === "custom" && (
                    <div className="p-3 bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800/60 rounded-2xl space-y-3">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-blue-700 dark:text-blue-300">
                        <Move className="w-3.5 h-3.5" /> Free Move Coordinates
                      </div>

                      <div>
                        <div className="flex items-center justify-between text-[11px] mb-1 text-zinc-600 dark:text-zinc-400">
                          <span>Horizontal (X Axis):</span>
                          <span className="font-mono font-bold">
                            {slide.config?.mediaX ?? 55}%
                          </span>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="80"
                          step="2"
                          value={slide.config?.mediaX ?? 55}
                          onChange={(e) =>
                            handleConfigChange("mediaX", Number(e.target.value))
                          }
                          className="w-full h-1.5 bg-zinc-200 dark:bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-blue-600"
                        />
                      </div>

                      <div>
                        <div className="flex items-center justify-between text-[11px] mb-1 text-zinc-600 dark:text-zinc-400">
                          <span>Vertical (Y Axis):</span>
                          <span className="font-mono font-bold">
                            {slide.config?.mediaY ?? 20}%
                          </span>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="80"
                          step="2"
                          value={slide.config?.mediaY ?? 20}
                          onChange={(e) =>
                            handleConfigChange("mediaY", Number(e.target.value))
                          }
                          className="w-full h-1.5 bg-zinc-200 dark:bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-blue-600"
                        />
                      </div>
                    </div>
                  )}

                  {/* 4. Backdrop Opacity slider (if background) */}
                  {slide.config?.mediaPosition === "background" && (
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="text-xs font-bold text-zinc-600 dark:text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                          <SunMedium className="w-3.5 h-3.5" /> Backdrop
                          Visibility
                        </label>
                        <span className="text-xs font-mono font-bold text-blue-600 dark:text-blue-400">
                          {slide.config?.mediaOpacity ?? 40}%
                        </span>
                      </div>
                      <input
                        type="range"
                        min="10"
                        max="100"
                        step="5"
                        value={slide.config?.mediaOpacity ?? 40}
                        onChange={(e) =>
                          handleConfigChange(
                            "mediaOpacity",
                            Number(e.target.value),
                          )
                        }
                        className="w-full h-1.5 bg-zinc-200 dark:bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-blue-600"
                      />
                    </div>
                  )}

                  {/* 5. Image Fit / Aspect Ratio */}
                  <div>
                    <label className="block text-xs font-bold text-zinc-600 dark:text-zinc-400 uppercase tracking-wider mb-1.5">
                      Aspect Ratio & Fit
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { id: "cover", label: "Fill (Cover)" },
                        { id: "contain", label: "Fit (Contain)" },
                        { id: "fill", label: "Stretch" },
                      ].map((fit) => (
                        <button
                          key={fit.id}
                          type="button"
                          onClick={() => handleConfigChange("mediaFit", fit.id)}
                          className={`p-2 rounded-xl border text-xs text-center transition-all ${
                            (slide.config?.mediaFit || "cover") === fit.id
                              ? "border-blue-600 bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 font-bold"
                              : "border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300"
                          }`}
                        >
                          {fit.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* 6. Corner Radius & Elevation Shadow */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-zinc-600 dark:text-zinc-400 uppercase tracking-wider mb-1.5">
                        Corner Radius
                      </label>
                      <select
                        value={slide.config?.mediaRadius ?? "2xl"}
                        onChange={(e) =>
                          handleConfigChange("mediaRadius", e.target.value)
                        }
                        className="w-full bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 rounded-xl px-3 py-2 text-xs text-zinc-900 dark:text-zinc-100 outline-none"
                      >
                        <option value="none">Sharp (0px)</option>
                        <option value="md">Slight (8px)</option>
                        <option value="xl">Rounded (16px)</option>
                        <option value="2xl">Smooth (24px)</option>
                        <option value="3xl">Large (32px)</option>
                        <option value="full">Circle / Pill</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-zinc-600 dark:text-zinc-400 uppercase tracking-wider mb-1.5">
                        3D Shadow
                      </label>
                      <select
                        value={slide.config?.mediaShadow ?? "2xl"}
                        onChange={(e) =>
                          handleConfigChange("mediaShadow", e.target.value)
                        }
                        className="w-full bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 rounded-xl px-3 py-2 text-xs text-zinc-900 dark:text-zinc-100 outline-none"
                      >
                        <option value="none">Flat (No Shadow)</option>
                        <option value="sm">Subtle Soft</option>
                        <option value="lg">Medium Depth</option>
                        <option value="2xl">Deep Float (3D)</option>
                        <option value="glow">Accent Glow</option>
                      </select>
                    </div>
                  </div>
                </div>
              ) : (
                /* Upload or URL Prompt when no image is present */
                <div className="space-y-4">
                  {/* File Upload Box */}
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="p-6 border-2 border-dashed border-zinc-300 dark:border-zinc-700 hover:border-blue-500 dark:hover:border-blue-500 rounded-2xl flex flex-col items-center justify-center text-center cursor-pointer bg-zinc-50/50 dark:bg-zinc-800/40 hover:bg-blue-50/40 transition-all group"
                  >
                    <div className="w-11 h-11 rounded-2xl bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform shadow-xs">
                      {uploadingImage ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <Upload className="w-5 h-5" />
                      )}
                    </div>
                    <div className="text-xs font-bold text-zinc-800 dark:text-zinc-200">
                      {uploadingImage
                        ? "Uploading to Cloud..."
                        : "Click to Upload Image"}
                    </div>
                    <p className="text-[10px] text-zinc-400 mt-0.5">
                      PNG, JPG, WebP or SVG up to 10MB
                    </p>
                  </div>

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />

                  {/* Or Enter Web URL */}
                  <div>
                    <label className="block text-xs font-bold text-zinc-600 dark:text-zinc-400 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                      <LinkIcon className="w-3 h-3" /> Or Paste Image URL
                    </label>
                    <input
                      type="url"
                      placeholder="https://images.unsplash.com/..."
                      value={urlInput}
                      onChange={(e) => {
                        setUrlInput(e.target.value);
                        if (e.target.value.trim().startsWith("http")) {
                          handleConfigChange("mediaUrl", e.target.value.trim());
                        }
                      }}
                      className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs text-zinc-900 dark:text-zinc-100 outline-none focus:border-blue-500 transition-all"
                    />
                  </div>

                  {/* Stock Quick Suggestions */}
                  <div>
                    <label className="block text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-1.5">
                      Quick Stock Presets
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {STOCK_IMAGES.map((s) => (
                        <button
                          key={s.label}
                          type="button"
                          onClick={() => handleConfigChange("mediaUrl", s.url)}
                          className="p-2 rounded-xl border border-zinc-200 dark:border-zinc-800 hover:border-blue-400 bg-white dark:bg-zinc-850 text-left text-xs font-medium text-zinc-700 dark:text-zinc-300 transition-colors flex items-center gap-2"
                        >
                          <img
                            src={s.url}
                            alt=""
                            className="w-5 h-5 rounded-md object-cover"
                          />
                          <span className="truncate text-[11px]">
                            {s.label}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {imageError && (
                <div className="p-2.5 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-xl text-xs text-red-600 dark:text-red-400 mt-2">
                  {imageError}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── TAB 4: SETTINGS & VISIBILITY ── */}
        {activeTab === "settings" && (
          <div className="space-y-3">
            <label className="block text-xs font-bold text-zinc-600 dark:text-zinc-400 uppercase tracking-wider mb-1">
              Slide Visibility & Permissions
            </label>

            <label className="flex items-center gap-3 p-3 border border-zinc-200 dark:border-zinc-750 rounded-xl cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-800/60 transition-colors">
              <input
                type="checkbox"
                checked={Boolean(slide.isHidden)}
                onChange={(e) => handleUpdate({ isHidden: e.target.checked })}
                disabled={Boolean(slide.isLocked)}
                className="w-4 h-4 text-blue-600 rounded"
              />
              <div className="flex-1">
                <div className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                  Hide Slide
                </div>
                <div className="text-[11px] text-zinc-500">
                  Skip this slide during presentation
                </div>
              </div>
            </label>

            <label className="flex items-center gap-3 p-3 border border-zinc-200 dark:border-zinc-750 rounded-xl cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-800/60 transition-colors">
              <input
                type="checkbox"
                checked={Boolean(slide.isLocked)}
                onChange={(e) => handleUpdate({ isLocked: e.target.checked })}
                className="w-4 h-4 text-blue-600 rounded"
              />
              <div className="flex-1">
                <div className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                  Lock Slide
                </div>
                <div className="text-[11px] text-zinc-500">
                  Prevent accidental edits and deletion
                </div>
              </div>
            </label>
          </div>
        )}
      </div>
    </div>
  );
}
