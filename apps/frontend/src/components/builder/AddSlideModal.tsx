"use client";

import React from "react";
import { SlideType } from "@/types/slide";
import {
  Type,
  AlignLeft,
  HelpCircle,
  BarChart2,
  List,
  Star,
  Cloud,
  MessageSquare,
  Image as ImageIcon,
  Trophy,
  CheckCircle,
  X,
  Sparkles,
  ArrowRight,
  BookOpen,
} from "lucide-react";

interface AddSlideModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddSlide: (type: SlideType) => void;
  onOpenAIGenerator?: () => void;
  targetIndex?: number | null;
}

const slideTypes: {
  type: SlideType;
  label: string;
  icon: React.ReactNode;
  category: string;
}[] = [
  {
    type: "title",
    label: "Title Slide",
    icon: <Type className="w-5 h-5" />,
    category: "Content",
  },
  {
    type: "teaching",
    label: "Teaching & Paragraph",
    icon: <BookOpen className="w-5 h-5" />,
    category: "Content",
  },
  {
    type: "information",
    label: "Key Takeaways",
    icon: <AlignLeft className="w-5 h-5" />,
    category: "Content",
  },
  {
    type: "question",
    label: "Discussion Prompt",
    icon: <HelpCircle className="w-5 h-5" />,
    category: "Content",
  },
  {
    type: "poll",
    label: "Multiple Choice Poll",
    icon: <BarChart2 className="w-5 h-5" />,
    category: "Interactive",
  },
  {
    type: "wordcloud",
    label: "Word Cloud",
    icon: <Cloud className="w-5 h-5" />,
    category: "Interactive",
  },
  {
    type: "opentext",
    label: "Open Response",
    icon: <MessageSquare className="w-5 h-5" />,
    category: "Interactive",
  },
  {
    type: "rating",
    label: "Rating Scale",
    icon: <Star className="w-5 h-5" />,
    category: "Interactive",
  },
  {
    type: "quiz",
    label: "Quiz Question",
    icon: <List className="w-5 h-5" />,
    category: "Quiz & Gamification",
  },
  {
    type: "leaderboard",
    label: "Leaderboard Podium",
    icon: <Trophy className="w-5 h-5" />,
    category: "Quiz & Gamification",
  },
  {
    type: "thankyou",
    label: "Thank You & Outro",
    icon: <CheckCircle className="w-5 h-5" />,
    category: "Content",
  },
];

export function AddSlideModal({
  isOpen,
  onClose,
  onAddSlide,
  onOpenAIGenerator,
  targetIndex,
}: AddSlideModalProps) {
  if (!isOpen) return null;

  const categories = Array.from(new Set(slideTypes.map((s) => s.category)));

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl max-w-2xl w-full max-h-[85vh] flex flex-col shadow-2xl overflow-hidden animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2.5">
              <h2 className="text-lg font-bold text-zinc-950 dark:text-white">
                {targetIndex !== undefined && targetIndex !== null
                  ? `Insert Slide at Position #${targetIndex + 1}`
                  : "Add New Slide"}
              </h2>
              {targetIndex !== undefined && targetIndex !== null && (
                <span className="px-2.5 py-0.5 bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 border border-zinc-200 dark:border-zinc-700 text-[10px] font-bold rounded-full">
                  Position {targetIndex + 1}
                </span>
              )}
            </div>
            <p className="text-xs text-zinc-500 mt-0.5">
              Select a blank template or generate tailored content with AI
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto space-y-6">
          {/* AI Generation Banner */}
          {onOpenAIGenerator && (
            <div
              onClick={() => {
                onClose();
                onOpenAIGenerator();
              }}
              className="p-5 rounded-2xl bg-zinc-950 dark:bg-zinc-100 text-white dark:text-zinc-950 cursor-pointer shadow-md hover:shadow-xl transition-all duration-200 hover-lift active-press flex items-center justify-between group"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-white/10 dark:bg-zinc-900/10 backdrop-blur-md flex items-center justify-center text-current shrink-0">
                  <Sparkles className="w-6 h-6 animate-pulse text-amber-400" />
                </div>
                <div>
                  <h3 className="text-sm font-bold flex items-center gap-2">
                    <span>Generate Slides with Sentio AI</span>
                    <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-white/15 dark:bg-zinc-900/15 backdrop-blur-sm">
                      Smart Creator
                    </span>
                  </h3>
                  <p className="text-xs text-zinc-400 dark:text-zinc-600 mt-0.5">
                    Generate multi-slide quizzes, polls, icebreakers, or entire
                    presentations on any topic.
                  </p>
                </div>
              </div>

              <div className="hidden sm:flex items-center gap-1.5 text-xs font-bold bg-white dark:bg-zinc-950 text-zinc-950 dark:text-white px-4 py-2 rounded-xl shadow-xs group-hover:bg-zinc-100 dark:group-hover:bg-zinc-900 transition-colors shrink-0">
                <span>Launch AI</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
              </div>
            </div>
          )}

          {/* Standard Categories Grid */}
          {categories.map((category) => (
            <div key={category}>
              <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-3">
                {category}
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {slideTypes
                  .filter((s) => s.category === category)
                  .map((slide) => (
                    <button
                      key={slide.type}
                      onClick={() => onAddSlide(slide.type)}
                      className="flex flex-col items-center justify-center p-4 bg-zinc-50 dark:bg-zinc-800/50 hover:bg-zinc-100 dark:hover:bg-zinc-800 border border-zinc-200/80 dark:border-zinc-800 hover:border-zinc-400 dark:hover:border-zinc-600 rounded-2xl transition-all duration-150 group cursor-pointer text-center hover-lift active-press"
                    >
                      <div className="p-3 rounded-xl bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300 group-hover:text-zinc-950 dark:group-hover:text-white mb-2.5 transition-colors shadow-2xs">
                        {slide.icon}
                      </div>
                      <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200 group-hover:text-zinc-950 dark:group-hover:text-white">
                        {slide.label}
                      </span>
                    </button>
                  ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
