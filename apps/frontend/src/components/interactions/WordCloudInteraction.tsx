"use client";

import React, { useState } from "react";
import { Send, Cloud } from "lucide-react";

interface WordCloudInteractionProps {
  slideId: string;
  hasSubmitted: boolean;
  responseLocked: boolean;
  onSubmit: (word: string) => void;
  results?: {
    words: { word: string; displayWord: string; count: number }[];
  } | null;
}

export function WordCloudInteraction({
  slideId,
  hasSubmitted: _initialSubmitted,
  responseLocked,
  onSubmit,
  results,
}: WordCloudInteractionProps) {
  const [input, setInput] = useState("");
  const [submittedWords, setSubmittedWords] = useState<string[]>([]);

  const handleSubmit = () => {
    const trimmed = input.trim();
    if (!trimmed || responseLocked) return;
    if (trimmed.length > 50) return;
    onSubmit(trimmed);
    setSubmittedWords((prev) => [...prev, trimmed]);
    setInput("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSubmit();
    }
  };

  // Determine font size based on frequency
  const maxCount = results?.words?.[0]?.count || 1;

  return (
    <div className="w-full space-y-6">
      {/* Word Cloud Visualization */}
      {results && results.words.length > 0 && (
        <div className="bg-gray-50 dark:bg-gray-800/50 rounded-2xl p-6 min-h-[200px] flex flex-wrap items-center justify-center gap-3">
          {results.words.slice(0, 50).map((w, i) => {
            const sizeScale = Math.max(0.7, (w.count / maxCount) * 2);
            return (
              <span
                key={`${w.word}-${i}`}
                className="transition-all duration-300 text-blue-600 dark:text-blue-400 font-semibold hover:text-blue-800 dark:hover:text-blue-200 cursor-default"
                style={{
                  fontSize: `${sizeScale}rem`,
                  opacity: Math.max(0.5, w.count / maxCount),
                }}
              >
                {w.displayWord}
              </span>
            );
          })}
        </div>
      )}

      {results && results.words.length === 0 && (
        <div className="bg-gray-50 dark:bg-gray-800/50 rounded-2xl p-8 flex flex-col items-center justify-center text-gray-400">
          <Cloud className="w-12 h-12 mb-3 opacity-50" />
          <p>Be the first to submit a word!</p>
        </div>
      )}

      {/* Input */}
      {!responseLocked && (
        <div className="flex gap-3">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            maxLength={50}
            placeholder="Type a word or phrase..."
            className="flex-1 px-5 py-4 bg-gray-50 dark:bg-gray-800 border-2 border-transparent focus:border-blue-500 rounded-2xl outline-none text-lg font-medium text-gray-900 dark:text-white placeholder-gray-400 transition-all"
          />
          <button
            onClick={handleSubmit}
            disabled={!input.trim()}
            className="px-6 py-4 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white rounded-2xl transition-all"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* Submitted words */}
      {submittedWords.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {submittedWords.map((w, i) => (
            <span
              key={i}
              className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full text-sm font-medium"
            >
              {w}
            </span>
          ))}
        </div>
      )}

      {responseLocked && (
        <p className="text-center text-amber-500 font-medium">
          Responses are currently locked
        </p>
      )}
    </div>
  );
}
