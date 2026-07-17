"use client";

import React, { useState, useEffect } from "react";
import { ISlide } from "@/types/slide";
import { useAutoSave } from "@/hooks/useAutoSave";
import {
  Settings,
  Eye,
  Lock,
  Image as ImageIcon,
  Plus,
  Trash2,
} from "lucide-react";

interface SlideConfigurationProps {
  presentationId: string;
  slide: ISlide | null;
  onUpdateLocal: (slideId: string, updates: Partial<ISlide>) => void;
}

export function SlideConfiguration({
  presentationId,
  slide,
  onUpdateLocal,
}: SlideConfigurationProps) {
  if (!slide) {
    return (
      <div className="w-full md:w-80 flex flex-col h-full bg-white dark:bg-gray-900 border-l border-gray-200 dark:border-gray-800 shrink-0 items-center justify-center text-gray-500">
        <Settings className="w-12 h-12 mb-4 opacity-20" />
        <p>Select a slide to configure</p>
      </div>
    );
  }

  return (
    <SlideConfigPanel
      key={slide._id}
      presentationId={presentationId}
      initialSlide={slide}
      onUpdateLocal={onUpdateLocal}
    />
  );
}

function SlideConfigPanel({
  presentationId,
  initialSlide,
  onUpdateLocal,
}: {
  presentationId: string;
  initialSlide: ISlide;
  onUpdateLocal: (id: string, updates: Partial<ISlide>) => void;
}) {
  const {
    data: slide,
    updateData,
    saveState,
  } = useAutoSave<ISlide>(
    `/api/presentations/${presentationId}/slides/${initialSlide._id}`,
    initialSlide,
    1000,
  );

  // Create a wrapper to update data locally in parent as well as useAutoSave
  const handleUpdate = (updates: Partial<ISlide>) => {
    updateData(updates);
    onUpdateLocal(slide._id, updates);
  };

  const handleConfigChange = (key: string, value: any) => {
    handleUpdate({ config: { ...slide.config, [key]: value } });
  };

  const renderSpecificConfig = () => {
    switch (slide.type) {
      case "poll":
      case "quiz":
      case "wordcloud":
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Options
              </label>
              <div className="space-y-2">
                {(slide.config?.options || []).map((opt: string, i: number) => (
                  <div key={i} className="flex gap-2">
                    <input
                      type="text"
                      value={opt}
                      onChange={(e) => {
                        const newOpts = [...(slide.config?.options || [])];
                        newOpts[i] = e.target.value;
                        handleConfigChange("options", newOpts);
                      }}
                      className="flex-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-md px-3 py-2 text-sm text-gray-900 dark:text-gray-100"
                      placeholder={`Option ${i + 1}`}
                    />
                    <button
                      onClick={() => {
                        const newOpts = [...(slide.config?.options || [])];
                        newOpts.splice(i, 1);
                        handleConfigChange("options", newOpts);
                      }}
                      className="p-2 text-gray-400 hover:text-red-500 rounded-md hover:bg-red-50 dark:hover:bg-red-900/20"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
                <button
                  onClick={() => {
                    const newOpts = [...(slide.config?.options || []), ""];
                    handleConfigChange("options", newOpts);
                  }}
                  className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 font-medium px-2 py-1"
                >
                  <Plus className="w-4 h-4" /> Add Option
                </button>
              </div>
            </div>
          </div>
        );

      case "rating":
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Scale
              </label>
              <select
                value={slide.config?.ratingRange?.max || 5}
                onChange={(e) =>
                  handleConfigChange("ratingRange", {
                    min: 1,
                    max: Number(e.target.value),
                  })
                }
                className="w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-md px-3 py-2 text-sm text-gray-900 dark:text-gray-100"
              >
                <option value="5">1 to 5</option>
                <option value="10">1 to 10</option>
              </select>
            </div>
          </div>
        );

      // Add other cases as needed
      default:
        return null;
    }
  };

  return (
    <div className="hidden md:flex w-full md:w-80 flex-col h-full bg-white dark:bg-gray-900 border-l border-gray-200 dark:border-gray-800 shrink-0">
      <div className="p-4 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
        <h2 className="font-semibold text-gray-900 dark:text-gray-100">
          Configuration
        </h2>
        <div className="text-xs text-gray-500">
          {saveState === "saving" && "Saving..."}
          {saveState === "saved" && "Saved"}
          {saveState === "error" && (
            <span className="text-red-500">Save failed</span>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Slide Title
            </label>
            <input
              type="text"
              value={slide.title}
              onChange={(e) => handleUpdate({ title: e.target.value })}
              className="w-full px-3 py-2 bg-white dark:bg-gray-950 border border-gray-300 dark:border-gray-700 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
              placeholder="Enter slide title..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Description (Optional)
            </label>
            <textarea
              value={slide.description}
              onChange={(e) => handleUpdate({ description: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 bg-white dark:bg-gray-950 border border-gray-300 dark:border-gray-700 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all resize-none text-sm"
              placeholder="Add some context..."
            />
          </div>
        </div>

        <div className="border-t border-gray-200 dark:border-gray-800 pt-6">
          {renderSpecificConfig()}
        </div>

        <div className="border-t border-gray-200 dark:border-gray-800 pt-6 space-y-3">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
            Settings
          </h3>

          <label className="flex items-center gap-3 p-3 border border-gray-200 dark:border-gray-700 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
            <input
              type="checkbox"
              checked={slide.isHidden}
              onChange={(e) => handleUpdate({ isHidden: e.target.checked })}
              className="w-4 h-4 text-blue-600 rounded"
            />
            <div className="flex-1">
              <div className="text-sm font-medium">Hide Slide</div>
              <div className="text-xs text-gray-500">
                Skip this slide during presentation
              </div>
            </div>
          </label>

          <label className="flex items-center gap-3 p-3 border border-gray-200 dark:border-gray-700 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
            <input
              type="checkbox"
              checked={slide.isLocked}
              onChange={(e) => handleUpdate({ isLocked: e.target.checked })}
              className="w-4 h-4 text-blue-600 rounded"
            />
            <div className="flex-1">
              <div className="text-sm font-medium">Lock Interaction</div>
              <div className="text-xs text-gray-500">
                Prevent audience submissions
              </div>
            </div>
          </label>
        </div>
      </div>
    </div>
  );
}
