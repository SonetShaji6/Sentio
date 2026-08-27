"use client";

import React, { useState } from "react";
import {
  Send,
  MessageCircle,
  Pin,
  CheckCircle,
  EyeOff,
  Reply,
  CornerDownRight,
  X,
} from "lucide-react";

export interface QnAQuestion {
  id: string;
  displayName: string;
  questionText: string;
  answerText?: string;
  answeredBy?: string;
  answeredAt?: string;
  status: "pending" | "pinned" | "resolved" | "hidden";
  upvotes: number;
  createdAt: string;
}

interface QnAPanelProps {
  questions: QnAQuestion[];
  onSubmit: (questionText: string) => void;
  isPresenter?: boolean;
  onModerate?: (
    questionId: string,
    action: "pin" | "resolve" | "hide" | "reply",
    answerText?: string,
  ) => void;
}

const STATUS_BADGES: Record<string, { label: string; className: string }> = {
  pending: {
    label: "Pending",
    className: "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400",
  },
  pinned: {
    label: "Pinned",
    className:
      "bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-700/60",
  },
  resolved: {
    label: "Answered",
    className:
      "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700/60",
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
  const [replyingId, setReplyingId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");

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

  const handleSendReply = (questionId: string) => {
    const trimmed = replyText.trim();
    if (!trimmed || !onModerate) return;
    onModerate(questionId, "reply", trimmed);
    setReplyingId(null);
    setReplyText("");
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
    <div className="flex flex-col h-full bg-white dark:bg-zinc-900">
      <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
        <h3 className="font-bold text-sm text-zinc-950 dark:text-white flex items-center gap-2">
          <MessageCircle className="w-4 h-4 text-zinc-600 dark:text-zinc-300" />
          <span>Live Q&A</span>
          <span className="px-2 py-0.5 bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 text-xs rounded-full">
            {visibleQuestions.length}
          </span>
        </h3>
      </div>

      {/* Questions List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {sortedQuestions.length === 0 && (
          <div className="text-center text-zinc-400 py-10">
            <MessageCircle className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="text-sm font-medium">No questions asked yet</p>
            <p className="text-xs text-zinc-500 mt-1">
              Participants can ask questions anytime during the presentation.
            </p>
          </div>
        )}
        {sortedQuestions.map((q) => (
          <div
            key={q.id}
            className={`p-4 rounded-2xl border transition-all ${
              q.status === "pinned"
                ? "border-amber-300/80 dark:border-amber-600/80 bg-amber-50/40 dark:bg-amber-950/20 shadow-xs"
                : q.status === "hidden"
                  ? "border-zinc-200 dark:border-zinc-800 opacity-50 bg-zinc-50 dark:bg-zinc-900/40"
                  : "border-zinc-200/80 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-850/60"
            }`}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-bold text-xs text-zinc-950 dark:text-white truncate">
                    {q.displayName}
                  </span>
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${STATUS_BADGES[q.status]?.className}`}
                  >
                    {STATUS_BADGES[q.status]?.label}
                  </span>
                  <span className="text-[10px] text-zinc-400 ml-auto">
                    {new Date(q.createdAt).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
                <p className="text-zinc-800 dark:text-zinc-200 text-sm font-medium leading-relaxed">
                  {q.questionText}
                </p>
              </div>
            </div>

            {/* Presenter Answer Card */}
            {q.answerText && (
              <div className="mt-3 p-3.5 rounded-xl bg-emerald-50/80 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 text-xs">
                <div className="flex items-center gap-1.5 font-bold text-emerald-800 dark:text-emerald-300 mb-1">
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Presenter Answer</span>
                  {q.answeredAt && (
                    <span className="text-[10px] text-zinc-400 font-normal ml-auto">
                      {new Date(q.answeredAt).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  )}
                </div>
                <p className="text-zinc-800 dark:text-zinc-200 text-xs leading-relaxed whitespace-pre-wrap pl-5 font-normal">
                  {q.answerText}
                </p>
              </div>
            )}

            {/* Presenter Reply Box (when active) */}
            {isPresenter && replyingId === q.id && (
              <div className="mt-3 p-3 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-300 dark:border-zinc-700 shadow-sm animate-scale-in">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300 flex items-center gap-1">
                    <CornerDownRight className="w-3.5 h-3.5 text-zinc-400" />
                    Reply as Presenter
                  </span>
                  <button
                    onClick={() => {
                      setReplyingId(null);
                      setReplyText("");
                    }}
                    className="p-1 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
                <textarea
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="Type your answer to broadcast to all participants..."
                  className="w-full p-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-xs outline-none focus:border-zinc-950 dark:focus:border-white transition-colors min-h-[60px]"
                  rows={2}
                />
                <div className="flex justify-end gap-2 mt-2">
                  <button
                    onClick={() => {
                      setReplyingId(null);
                      setReplyText("");
                    }}
                    className="px-2.5 py-1 text-xs font-semibold text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handleSendReply(q.id)}
                    disabled={!replyText.trim()}
                    className="px-3 py-1 bg-zinc-950 hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-200 text-white dark:text-zinc-950 font-bold text-xs rounded-lg transition-all disabled:opacity-50 flex items-center gap-1 cursor-pointer"
                  >
                    <Send className="w-3 h-3" />
                    <span>Send Answer</span>
                  </button>
                </div>
              </div>
            )}

            {/* Presenter moderation actions */}
            {isPresenter && onModerate && (
              <div className="flex items-center gap-1.5 mt-3 pt-2.5 border-t border-zinc-100 dark:border-zinc-800/80">
                <button
                  onClick={() => {
                    setReplyingId(q.id);
                    setReplyText(q.answerText || "");
                  }}
                  className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 font-bold transition-colors cursor-pointer"
                  title="Reply / Answer this question"
                >
                  <Reply className="w-3 h-3" />
                  <span>{q.answerText ? "Edit Answer" : "Reply"}</span>
                </button>

                {q.status !== "pinned" && (
                  <button
                    onClick={() => onModerate(q.id, "pin")}
                    className="flex items-center gap-1 text-xs px-2 py-1 rounded-lg hover:bg-amber-50 dark:hover:bg-amber-900/20 text-amber-600 dark:text-amber-400 font-medium transition-colors cursor-pointer"
                  >
                    <Pin className="w-3 h-3" /> Pin
                  </button>
                )}

                {q.status !== "resolved" && !q.answerText && (
                  <button
                    onClick={() => onModerate(q.id, "resolve")}
                    className="flex items-center gap-1 text-xs px-2 py-1 rounded-lg hover:bg-emerald-50 dark:hover:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 font-medium transition-colors cursor-pointer"
                  >
                    <CheckCircle className="w-3 h-3" /> Mark Answered
                  </button>
                )}

                {q.status !== "hidden" && (
                  <button
                    onClick={() => onModerate(q.id, "hide")}
                    className="flex items-center gap-1 text-xs px-2 py-1 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400 font-medium transition-colors cursor-pointer"
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
        <div className="p-4 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50">
          <div className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              maxLength={500}
              placeholder="Ask a question..."
              className="flex-1 px-4 py-2.5 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl outline-none text-xs text-zinc-900 dark:text-white focus:border-zinc-950 dark:focus:border-white transition-all shadow-xs"
            />
            <button
              onClick={handleSubmit}
              disabled={!input.trim()}
              className="px-4 py-2.5 bg-zinc-950 hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-200 text-white dark:text-zinc-950 rounded-xl transition-all disabled:opacity-50 font-bold text-xs shadow-xs cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
