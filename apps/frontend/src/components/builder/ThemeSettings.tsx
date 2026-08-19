"use client";

import React, { useState } from "react";
import { X, Check, Palette, Sparkles, Type, RefreshCw } from "lucide-react";
import {
  PresentationTheme,
  PRESET_THEMES,
  DEFAULT_THEME,
  resolveTheme,
} from "@/types/theme";

interface ThemeSettingsProps {
  isOpen: boolean;
  onClose: () => void;
  presentationId: string;
  initialTheme: any;
  onThemeUpdate: (theme: PresentationTheme) => void;
}

export function ThemeSettings({
  isOpen,
  onClose,
  presentationId,
  initialTheme,
  onThemeUpdate,
}: ThemeSettingsProps) {
  const currentTheme = resolveTheme(initialTheme);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  if (!isOpen) return null;

  const activeTheme = currentTheme;

  const handleApplyTheme = (theme: PresentationTheme) => {
    onThemeUpdate(theme);
  };

  const handleCustomColorChange = (
    key: keyof PresentationTheme,
    val: string,
  ) => {
    const updated: PresentationTheme = {
      ...activeTheme,
      id: "custom",
      name: "Custom Palette",
      [key]: val,
    };
    handleApplyTheme(updated);
  };

  const categories = [
    { id: "all", label: "All Themes" },
    { id: "minimal", label: "Minimal" },
    { id: "dark", label: "Dark" },
    { id: "vibrant", label: "Vibrant" },
    { id: "editorial", label: "Editorial" },
  ];

  const filteredThemes =
    selectedCategory === "all"
      ? PRESET_THEMES
      : PRESET_THEMES.filter((t) => t.category === selectedCategory);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-end bg-black/40 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-zinc-900 w-full max-w-md h-full shadow-2xl flex flex-col border-l border-zinc-200 dark:border-zinc-800 animate-in slide-in-from-right duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-zinc-200 dark:border-zinc-800 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
              <Palette className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                Presentation Theme
              </h2>
              <p className="text-xs text-zinc-500">
                Custom palettes apply to all slides
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="p-1.5 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          {/* Active Theme Preview Card */}
          <div>
            <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2.5">
              Active Theme Preview
            </label>
            <div
              className="p-5 rounded-2xl border shadow-sm flex flex-col justify-between h-32 transition-all relative overflow-hidden"
              style={{
                backgroundColor: activeTheme.bg,
                borderColor: activeTheme.border,
                color: activeTheme.text,
              }}
            >
              <div className="flex items-center justify-between">
                <span
                  className="text-xs font-bold px-2.5 py-1 rounded-full uppercase tracking-wider"
                  style={{
                    backgroundColor: `${activeTheme.primary}20`,
                    color: activeTheme.primary,
                  }}
                >
                  {activeTheme.name}
                </span>
                <div className="flex items-center gap-1.5">
                  <div
                    className="w-3.5 h-3.5 rounded-full"
                    style={{ backgroundColor: activeTheme.primary }}
                  />
                  <div
                    className="w-3.5 h-3.5 rounded-full"
                    style={{ backgroundColor: activeTheme.accent }}
                  />
                </div>
              </div>
              <div>
                <h4 className="text-xl font-extrabold tracking-tight">
                  Sample Headline
                </h4>
                <p className="text-xs" style={{ color: activeTheme.textMuted }}>
                  Minimal, theme-aware responsive typography
                </p>
              </div>
            </div>
          </div>

          {/* Preset Categories Tabs */}
          <div>
            <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2.5">
              Curated Designer Themes
            </label>
            <div className="flex items-center gap-1 overflow-x-auto pb-1 mb-3">
              {categories.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setSelectedCategory(c.id)}
                  className={`px-3 py-1 text-xs font-medium rounded-full whitespace-nowrap transition-colors ${
                    selectedCategory === c.id
                      ? "bg-blue-600 text-white font-bold"
                      : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700"
                  }`}
                >
                  {c.label}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-3">
              {filteredThemes.map((theme) => {
                const isSelected = activeTheme.id === theme.id;
                return (
                  <button
                    key={theme.id}
                    onClick={() => handleApplyTheme(theme)}
                    className={`p-3.5 rounded-xl border-2 text-left transition-all relative flex flex-col justify-between h-28 cursor-pointer ${
                      isSelected
                        ? "border-blue-600 shadow-md ring-2 ring-blue-500/20"
                        : "border-zinc-200 dark:border-zinc-800 hover:border-zinc-400 dark:hover:border-zinc-600"
                    }`}
                    style={{
                      backgroundColor: theme.bg,
                      color: theme.text,
                    }}
                  >
                    <div className="flex items-center justify-between w-full">
                      <div className="flex items-center gap-1.5">
                        <div
                          className="w-3 h-3 rounded-full shadow-sm"
                          style={{ backgroundColor: theme.primary }}
                        />
                        <div
                          className="w-3 h-3 rounded-full shadow-sm"
                          style={{ backgroundColor: theme.accent }}
                        />
                      </div>
                      {isSelected && (
                        <div className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center">
                          <Check className="w-3 h-3 stroke-[3]" />
                        </div>
                      )}
                    </div>
                    <div>
                      <div className="text-xs font-bold truncate">
                        {theme.name}
                      </div>
                      <div
                        className="text-[10px] truncate"
                        style={{ color: theme.textMuted }}
                      >
                        {theme.category}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Typography / Font Selection */}
          <div className="border-t border-zinc-200 dark:border-zinc-800 pt-5">
            <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2.5">
              Typography Style
            </label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { id: "sans", label: "Inter (Modern Sans)", font: "font-sans" },
                { id: "serif", label: "Editorial (Serif)", font: "font-serif" },
                { id: "display", label: "Outfit (Display)", font: "font-sans" },
                { id: "mono", label: "JetBrains (Mono)", font: "font-mono" },
              ].map((f) => (
                <button
                  key={f.id}
                  onClick={() =>
                    handleCustomColorChange("fontFamily", f.id as any)
                  }
                  className={`p-2.5 text-xs rounded-xl border text-left transition-all ${
                    activeTheme.fontFamily === f.id
                      ? "border-blue-600 bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 font-bold"
                      : "border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:border-zinc-300 dark:hover:border-zinc-700"
                  }`}
                >
                  <span className={f.font}>{f.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Custom Color Tuning */}
          <div className="border-t border-zinc-200 dark:border-zinc-800 pt-5">
            <div className="flex items-center justify-between mb-3">
              <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">
                Fine-tune Colors
              </label>
              <button
                onClick={() => handleApplyTheme(DEFAULT_THEME)}
                className="text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400 flex items-center gap-1 font-medium"
              >
                <RefreshCw className="w-3 h-3" /> Reset
              </button>
            </div>

            <div className="space-y-3">
              {[
                { label: "Background", key: "bg" as const },
                { label: "Card / Element Background", key: "cardBg" as const },
                { label: "Primary Accent", key: "primary" as const },
                { label: "Secondary Accent", key: "accent" as const },
                { label: "Headline Text", key: "text" as const },
                { label: "Body / Muted Text", key: "textMuted" as const },
              ].map((item) => (
                <div
                  key={item.key}
                  className="flex items-center justify-between p-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-800 text-xs"
                >
                  <span className="font-medium text-zinc-700 dark:text-zinc-300">
                    {item.label}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-zinc-400 text-[11px] uppercase">
                      {activeTheme[item.key]}
                    </span>
                    <input
                      type="color"
                      value={activeTheme[item.key] || "#000000"}
                      onChange={(e) =>
                        handleCustomColorChange(item.key, e.target.value)
                      }
                      className="w-7 h-7 rounded-lg cursor-pointer border-0 bg-transparent p-0"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-sm transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
