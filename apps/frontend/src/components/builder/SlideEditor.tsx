"use client";

import React from "react";
import { ISlide } from "@/types/slide";
import { MonitorPlay } from "lucide-react";

interface SlideEditorProps {
  slide: ISlide | null;
}

export function SlideEditor({ slide }: SlideEditorProps) {
  if (!slide) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-100 dark:bg-gray-950 p-8">
        <div className="text-center text-gray-400 dark:text-gray-600">
          <MonitorPlay className="w-16 h-16 mx-auto mb-4 opacity-50" />
          <h2 className="text-xl font-semibold mb-2">No slide selected</h2>
          <p className="text-sm">
            Select a slide from the navigator to start editing
          </p>
        </div>
      </div>
    );
  }

  // A generic fallback renderer. In a real app, you'd map slide.type to specific React components
  const renderSlideContent = () => {
    switch (slide.type) {
      case "title":
        return (
          <div className="flex flex-col items-center justify-center h-full text-center px-12">
            <h1 className="text-5xl font-bold mb-6 text-gray-900">
              {slide.title || "Add a title"}
            </h1>
            {slide.description && (
              <p className="text-2xl text-gray-600">{slide.description}</p>
            )}
          </div>
        );
      case "poll":
      case "quiz":
        return (
          <div className="flex flex-col h-full p-12">
            <h1 className="text-4xl font-bold mb-4 text-gray-900">
              {slide.title || "Question"}
            </h1>
            {slide.description && (
              <p className="text-xl text-gray-600 mb-12">{slide.description}</p>
            )}
            <div className="grid grid-cols-2 gap-4 flex-1">
              {(slide.config?.options || ["Option 1", "Option 2"]).map(
                (opt: string, i: number) => (
                  <div
                    key={i}
                    className="bg-blue-50 border-2 border-blue-200 rounded-xl flex items-center justify-center p-6 text-2xl font-medium text-blue-900"
                  >
                    {opt || `Option ${i + 1}`}
                  </div>
                ),
              )}
            </div>
          </div>
        );
      default:
        return (
          <div className="flex flex-col h-full p-12">
            <h1 className="text-4xl font-bold mb-4 text-gray-900">
              {slide.title || "Slide Title"}
            </h1>
            {slide.description && (
              <p className="text-xl text-gray-600 mb-8">{slide.description}</p>
            )}
            <div className="flex-1 border-2 border-dashed border-gray-300 rounded-xl flex items-center justify-center text-gray-400">
              {slide.type} layout placeholder
            </div>
          </div>
        );
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-gray-100 dark:bg-gray-950 overflow-hidden relative">
      <div className="flex-1 p-4 md:p-8 flex items-center justify-center overflow-auto">
        {/* 16:9 Aspect Ratio Container */}
        <div
          className="relative w-full max-w-5xl bg-white shadow-xl overflow-hidden shrink-0 transition-all duration-300 ring-1 ring-black/5"
          style={{ aspectRatio: "16/9" }}
        >
          {/* Slide Content */}
          <div className="absolute inset-0 w-full h-full">
            {renderSlideContent()}
          </div>

          {/* Presentation UI Overlay Mockup */}
          <div className="absolute bottom-4 left-4 flex items-center gap-2 bg-black/50 backdrop-blur-md text-white px-3 py-1.5 rounded-full text-sm font-medium z-10">
            <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></div>
            Join at sentio.app with code 1234
          </div>
        </div>
      </div>
    </div>
  );
}
