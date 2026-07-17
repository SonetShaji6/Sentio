"use client";

import React from "react";
import { X, Check } from "lucide-react";
import { useAutoSave } from "@/hooks/useAutoSave";

interface ThemeSettingsProps {
  isOpen: boolean;
  onClose: () => void;
  presentationId: string;
  initialTheme: any;
  onThemeUpdate: (theme: any) => void;
}

const presetThemes = [
  {
    id: "light",
    name: "Light Mode",
    bg: "#ffffff",
    text: "#111827",
    primary: "#3b82f6",
  },
  {
    id: "dark",
    name: "Dark Mode",
    bg: "#111827",
    text: "#ffffff",
    primary: "#60a5fa",
  },
  {
    id: "sentio",
    name: "Sentio Brand",
    bg: "#f8fafc",
    text: "#0f172a",
    primary: "#2563eb",
  },
  {
    id: "midnight",
    name: "Midnight Blue",
    bg: "#0f172a",
    text: "#f8fafc",
    primary: "#38bdf8",
  },
];

export function ThemeSettings({
  isOpen,
  onClose,
  presentationId,
  initialTheme,
  onThemeUpdate,
}: ThemeSettingsProps) {
  const { data, updateData, saveState } = useAutoSave(
    `/api/presentations/${presentationId}`,
    { theme: initialTheme || presetThemes[0] },
    1000,
  );

  if (!isOpen) return null;

  const currentThemeId = data.theme?.id || "light";

  const handleThemeSelect = (theme: (typeof presetThemes)[0]) => {
    updateData({ theme });
    onThemeUpdate(theme);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/20 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-900 w-full max-w-sm h-full shadow-2xl flex flex-col animate-in slide-in-from-right">
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-800">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Presentation Theme
          </h2>
          <div className="flex items-center gap-4">
            <span className="text-xs text-gray-500">
              {saveState === "saving" && "Saving..."}
              {saveState === "saved" && "Saved"}
            </span>
            <button
              onClick={onClose}
              className="p-1.5 text-gray-500 hover:text-gray-900 dark:hover:text-gray-100 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="p-6 overflow-y-auto">
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">
            Preset Themes
          </h3>

          <div className="grid grid-cols-2 gap-4">
            {presetThemes.map((theme) => (
              <button
                key={theme.id}
                onClick={() => handleThemeSelect(theme)}
                className={`relative flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all ${
                  currentThemeId === theme.id
                    ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                    : "border-gray-200 dark:border-gray-700 hover:border-blue-300"
                }`}
              >
                <div
                  className="w-12 h-12 rounded-full mb-3 shadow-sm flex items-center justify-center"
                  style={{
                    backgroundColor: theme.bg,
                    border: `2px solid ${theme.primary}`,
                  }}
                >
                  <span
                    className="text-xl font-bold"
                    style={{ color: theme.text }}
                  >
                    A
                  </span>
                </div>
                <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  {theme.name}
                </span>

                {currentThemeId === theme.id && (
                  <div className="absolute top-2 right-2 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center text-white">
                    <Check className="w-3 h-3" />
                  </div>
                )}
              </button>
            ))}
          </div>

          <div className="mt-8">
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">
              Custom Colors
            </h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-sm text-gray-600 dark:text-gray-400">
                  Background
                </label>
                <input
                  type="color"
                  value={data.theme?.bg || "#ffffff"}
                  onChange={(e) =>
                    handleThemeSelect({
                      ...data.theme,
                      id: "custom",
                      bg: e.target.value,
                    })
                  }
                  className="w-8 h-8 rounded cursor-pointer"
                />
              </div>
              <div className="flex items-center justify-between">
                <label className="text-sm text-gray-600 dark:text-gray-400">
                  Text
                </label>
                <input
                  type="color"
                  value={data.theme?.text || "#000000"}
                  onChange={(e) =>
                    handleThemeSelect({
                      ...data.theme,
                      id: "custom",
                      text: e.target.value,
                    })
                  }
                  className="w-8 h-8 rounded cursor-pointer"
                />
              </div>
              <div className="flex items-center justify-between">
                <label className="text-sm text-gray-600 dark:text-gray-400">
                  Primary (Accent)
                </label>
                <input
                  type="color"
                  value={data.theme?.primary || "#3b82f6"}
                  onChange={(e) =>
                    handleThemeSelect({
                      ...data.theme,
                      id: "custom",
                      primary: e.target.value,
                    })
                  }
                  className="w-8 h-8 rounded cursor-pointer"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
