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
} from "lucide-react";

interface AddSlideModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddSlide: (type: SlideType) => void;
}

const slideTypes: {
  type: SlideType;
  label: string;
  icon: React.ReactNode;
  category: string;
}[] = [
  {
    type: "title",
    label: "Title",
    icon: <Type className="w-6 h-6" />,
    category: "Content",
  },
  {
    type: "information",
    label: "Information",
    icon: <AlignLeft className="w-6 h-6" />,
    category: "Content",
  },
  {
    type: "poll",
    label: "Multiple Choice",
    icon: <BarChart2 className="w-6 h-6" />,
    category: "Interactive",
  },
  {
    type: "wordcloud",
    label: "Word Cloud",
    icon: <Cloud className="w-6 h-6" />,
    category: "Interactive",
  },
  {
    type: "opentext",
    label: "Open Text",
    icon: <MessageSquare className="w-6 h-6" />,
    category: "Interactive",
  },
  {
    type: "rating",
    label: "Rating",
    icon: <Star className="w-6 h-6" />,
    category: "Interactive",
  },
  {
    type: "quiz",
    label: "Quiz Question",
    icon: <List className="w-6 h-6" />,
    category: "Quiz",
  },
  {
    type: "leaderboard",
    label: "Leaderboard",
    icon: <Trophy className="w-6 h-6" />,
    category: "Quiz",
  },
  {
    type: "thankyou",
    label: "Thank You",
    icon: <CheckCircle className="w-6 h-6" />,
    category: "Content",
  },
];

export function AddSlideModal({
  isOpen,
  onClose,
  onAddSlide,
}: AddSlideModalProps) {
  if (!isOpen) return null;

  const categories = Array.from(new Set(slideTypes.map((s) => s.category)));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-800">
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
            Add New Slide
          </h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto">
          {categories.map((category) => (
            <div key={category} className="mb-8 last:mb-0">
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">
                {category}
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {slideTypes
                  .filter((s) => s.category === category)
                  .map((slide) => (
                    <button
                      key={slide.type}
                      onClick={() => onAddSlide(slide.type)}
                      className="flex flex-col items-center justify-center p-6 bg-gray-50 dark:bg-gray-800/50 hover:bg-blue-50 dark:hover:bg-blue-900/20 border-2 border-transparent hover:border-blue-500 rounded-xl transition-all group"
                    >
                      <div className="text-gray-400 group-hover:text-blue-500 mb-3 transition-colors">
                        {slide.icon}
                      </div>
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300 group-hover:text-blue-700 dark:group-hover:text-blue-400 text-center">
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
