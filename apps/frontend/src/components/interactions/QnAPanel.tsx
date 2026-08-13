"use client";

import React, { useState } from "react";
import { Send, MessageCircle, Pin, CheckCircle, EyeOff } from "lucide-react";

interface QnAQuestion {
  id: string;
  displayName: string;
  questionText: string;
  status: "pending" | "pinned" | "resolved" | "hidden";
  upvotes: number;
  createdAt: string;
}

interface QnAPanelProps {
  questions: QnAQuestion[];
  onSubmit: (questionText: string) => void;
  isPresenter?: boolean;
  onModerate?: (questionId: string, action: "pin" | "resolve" | "hide") => void;
}

const STATUS_BADGES: Record<string, { label: string; className: string }> = {
  pending: {
    label: "Pending",
    className: "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300",
  },
  pinned: {
    label: "Pinned",
    className:
      "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400",
  },
  resolved: {
    label: "Resolved",
    className:
      "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400",
  },
  hidden: {
    label: "Hidden",
    className: "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400",
  },
};

export function QnAPanel({
  questions,
  onSubmit,
  isPresenter = false,
  onModerate,
}: QnAPanelProps) {
  const [input, setInput] = useState("");

  const handleSubmit = () => {
    const trimmed = input.trim();
    if (!trimmed) return;
    onSubmit(trimmed);
    setInput("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const visibleQuestions = isPresenter
    ? questions
    : questions.filter((q) => q.status !== "hidden");

  // Sort: pinned first, then by recency
  const sortedQuestions = [...visibleQuestions].sort((a, b) => {
    if (a.status === "pinned" && b.status !== "pinned") return -1;
    if (b.status === "pinned" && a.status !== "pinned") return 1;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <MessageCircle className="w-5 h-5" />
          Q&A ({visibleQuestions.length})
        </h3>
      </div>

      {/* Questions List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {sortedQuestions.length === 0 && (
          <div className="text-center text-gray-400 py-8">
            <MessageCircle className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="text-sm">No questions yet</p>
          </div>
        )}
        {sortedQuestions.map((q) => (
          <div
            key={q.id}
            className={`p-4 rounded-xl border ${
              q.status === "pinned"
                ? "border-amber-300 dark:border-amber-600 bg-amber-50 dark:bg-amber-900/10"
                : q.status === "hidden"
                  ? "border-gray-200 dark:border-gray-700 opacity-50"
                  : "border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800"
            }`}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-semibold text-sm text-gray-900 dark:text-white">
                    {q.displayName}
                  </span>
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_BADGES[q.status]?.className}`}
                  >
                    {STATUS_BADGES[q.status]?.label}
                  </span>
                </div>
                <p className="text-gray-700 dark:text-gray-300 text-sm">
                  {q.questionText}
                </p>
              </div>
            </div>

            {/* Presenter moderation */}
            {isPresenter && onModerate && (
              <div className="flex gap-2 mt-3 pt-2 border-t border-gray-100 dark:border-gray-700">
                {q.status !== "pinned" && (
                  <button
                    onClick={() => onModerate(q.id, "pin")}
                    className="flex items-center gap-1 text-xs px-2 py-1 rounded-md hover:bg-amber-50 dark:hover:bg-amber-900/20 text-amber-600 font-medium"
                  >
                    <Pin className="w-3 h-3" /> Pin
                  </button>
                )}
                {q.status !== "resolved" && (
                  <button
                    onClick={() => onModerate(q.id, "resolve")}
                    className="flex items-center gap-1 text-xs px-2 py-1 rounded-md hover:bg-emerald-50 dark:hover:bg-emerald-900/20 text-emerald-600 font-medium"
                  >
                    <CheckCircle className="w-3 h-3" /> Resolve
                  </button>
                )}
                {q.status !== "hidden" && (
                  <button
                    onClick={() => onModerate(q.id, "hide")}
                    className="flex items-center gap-1 text-xs px-2 py-1 rounded-md hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 font-medium"
                  >
                    <EyeOff className="w-3 h-3" /> Hide
                  </button>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Submit (for participants) */}
      {!isPresenter && (
        <div className="p-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              maxLength={500}
              placeholder="Ask a question..."
              className="flex-1 px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl outline-none text-sm text-gray-900 dark:text-white focus:border-blue-500 transition-all"
            />
            <button
              onClick={handleSubmit}
              disabled={!input.trim()}
              className="px-4 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-xl transition-all"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
