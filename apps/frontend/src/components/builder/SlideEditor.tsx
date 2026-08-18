"use client";

import React from "react";
import { ISlide } from "@/types/slide";
import { MonitorPlay } from "lucide-react";
import { SlideCanvas } from "./SlideCanvas";

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

  // Render element-based slide
  const renderElements = () => {
    return slide.elements?.map((el) => {
      // Very basic rendering of element block for now, Phase 3 will introduce ElementRenderer
      return (
        <div
          key={el.id}
          className="absolute border border-dashed border-gray-400 flex items-center justify-center bg-gray-50/50"
          style={{
            left: el.x,
            top: el.y,
            width: el.width,
            height: el.height,
            transform: `rotate(${el.rotation}deg)`,
            zIndex: el.zIndex,
            display: el.visible === false ? "none" : "flex",
          }}
        >
          {el.type}
        </div>
      );
    });
  };

  // A generic fallback renderer for legacy slides.
  const renderLegacySlideContent = () => {
    switch (slide.type) {
      case "title":
        return (
          <div className="flex flex-col items-center justify-center h-full text-center px-12">
            <h1 className="text-7xl font-bold mb-8 text-gray-900">
              {slide.title || "Add a title"}
            </h1>
            {slide.description && (
              <p className="text-4xl text-gray-600">{slide.description}</p>
            )}
          </div>
        );
      case "poll":
      case "quiz":
        return (
          <div className="flex flex-col h-full p-24">
            <h1 className="text-6xl font-bold mb-8 text-gray-900">
              {slide.title || "Question"}
            </h1>
            {slide.description && (
              <p className="text-3xl text-gray-600 mb-16">
                {slide.description}
              </p>
            )}
            <div className="grid grid-cols-2 gap-8 flex-1">
              {(slide.config?.options || ["Option 1", "Option 2"]).map(
                (opt: string, i: number) => (
                  <div
                    key={i}
                    className="bg-blue-50 border-4 border-blue-200 rounded-2xl flex items-center justify-center p-8 text-4xl font-medium text-blue-900"
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
          <div className="flex flex-col h-full p-24">
            <h1 className="text-6xl font-bold mb-8 text-gray-900">
              {slide.title || "Slide Title"}
            </h1>
            {slide.description && (
              <p className="text-3xl text-gray-600 mb-12">
                {slide.description}
              </p>
            )}
            <div className="flex-1 border-4 border-dashed border-gray-300 rounded-3xl flex items-center justify-center text-gray-400 text-4xl">
              {slide.type} layout placeholder
            </div>
          </div>
        );
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-gray-100 dark:bg-gray-950 overflow-hidden relative">
      <div className="flex-1 p-4 md:p-8 flex items-center justify-center overflow-hidden">
        <SlideCanvas>
          {/* Render new elements if they exist, otherwise fallback to legacy config */}
          {slide.elements && slide.elements.length > 0
            ? renderElements()
            : renderLegacySlideContent()}

          {/* Presentation UI Overlay Mockup */}
          <div className="absolute bottom-8 left-8 flex items-center gap-3 bg-black/60 backdrop-blur-md text-white px-6 py-3 rounded-full text-xl font-medium z-10">
            <div className="w-3 h-3 rounded-full bg-green-400 animate-pulse"></div>
            Join at sentio.app with code 1234
          </div>
        </SlideCanvas>
      </div>
    </div>
  );
}
