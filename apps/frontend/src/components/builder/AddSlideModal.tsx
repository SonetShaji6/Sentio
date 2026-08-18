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
} from "lucide-react";

interface AddSlideModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddSlide: (type: SlideType) => void;
  onOpenAIGenerator?: () => void;
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
}: AddSlideModalProps) {
  if (!isOpen) return null;

  const categories = Array.from(new Set(slideTypes.map((s) => s.category)));

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-zinc-200 dark:border-zinc-800 shrink-0">
          <div>
            <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
              Add New Slide
            </h2>
            <p className="text-xs text-zinc-500">
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
              className="p-5 rounded-2xl bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 text-white cursor-pointer shadow-lg hover:shadow-xl transition-all transform hover:scale-[1.01] flex items-center justify-between group"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white shrink-0">
                  <Sparkles className="w-6 h-6 animate-pulse" />
                </div>
                <div>
                  <h3 className="text-sm font-bold flex items-center gap-2">
                    <span>Generate Slides with Sentio AI</span>
                    <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-white/20 backdrop-blur-sm">
                      Smart Creator
                    </span>
                  </h3>
                  <p className="text-xs text-purple-100 mt-0.5">
                    Generate multi-slide quizzes, polls, icebreakers, or entire
                    presentations on any topic.
                  </p>
                </div>
              </div>

              <div className="hidden sm:flex items-center gap-1.5 text-xs font-bold bg-white text-purple-950 px-3.5 py-2 rounded-xl shadow-xs group-hover:bg-purple-50 transition-colors shrink-0">
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
                      className="flex flex-col items-center justify-center p-4 bg-zinc-50 dark:bg-zinc-800/50 hover:bg-blue-50/80 dark:hover:bg-blue-950/30 border-2 border-zinc-200/80 dark:border-zinc-800 hover:border-blue-500 rounded-2xl transition-all group cursor-pointer text-center"
                    >
                      <div className="p-3 rounded-xl bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-500 group-hover:text-blue-600 group-hover:border-blue-300 dark:group-hover:border-blue-700 mb-2.5 transition-colors shadow-2xs">
                        {slide.icon}
                      </div>
                      <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200 group-hover:text-blue-700 dark:group-hover:text-blue-400">
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
