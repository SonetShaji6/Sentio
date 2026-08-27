"use client";

import React, { useState } from "react";
import { Check } from "lucide-react";

interface PollInteractionProps {
  slideId: string;
  options: string[];
  allowMultiple?: boolean;
  hasSubmitted: boolean;
  responseLocked: boolean;
  allAnswered?: boolean;
  audienceCount?: number;
  onSubmit: (selectedOptions: number[]) => void;
  results?: {
    optionCounts: number[];
    optionPercentages: number[];
    totalResponses: number;
  } | null;
  showResults?: boolean;
}

const OPTION_COLORS = [
  "bg-blue-500",
  "bg-emerald-500",
  "bg-amber-500",
  "bg-rose-500",
  "bg-violet-500",
  "bg-cyan-500",
  "bg-orange-500",
  "bg-pink-500",
];

export function PollInteraction({
  slideId,
  options,
  allowMultiple = false,
  hasSubmitted,
  responseLocked,
  allAnswered = false,
  audienceCount = 0,
  onSubmit,
  results,
  showResults,
}: PollInteractionProps) {
  const [selected, setSelected] = useState<number[]>([]);

  const toggleOption = (index: number) => {
    if (hasSubmitted || responseLocked) return;

    if (allowMultiple) {
      setSelected((prev) =>
        prev.includes(index)
          ? prev.filter((i) => i !== index)
          : [...prev, index],
      );
    } else {
      setSelected([index]);
    }
  };

  const handleSubmit = () => {
    if (selected.length === 0 || hasSubmitted || responseLocked) return;
    onSubmit(selected);
  };

  const shouldShowResults =
    hasSubmitted &&
    showResults &&
    results &&
    (responseLocked ||
      allAnswered ||
      (audienceCount > 0 && results.totalResponses >= audienceCount));

  return (
    <div className="w-full space-y-4">
      <div className="space-y-3">
        {options.map((opt, i) => (
          <button
            key={i}
            onClick={() => toggleOption(i)}
            disabled={hasSubmitted || responseLocked}
            className={`w-full py-4 px-6 text-left rounded-2xl font-medium text-lg transition-all transform hover:scale-[1.01] flex items-center gap-4 ${
              selected.includes(i)
                ? "bg-blue-600 text-white ring-2 ring-blue-400 ring-offset-2 ring-offset-gray-950"
                : "bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white hover:bg-blue-50 dark:hover:bg-blue-900/30 border-2 border-transparent hover:border-blue-500"
            } ${hasSubmitted || responseLocked ? "opacity-70 cursor-not-allowed" : ""}`}
          >
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold shrink-0 ${OPTION_COLORS[i % OPTION_COLORS.length]}`}
            >
              {selected.includes(i) ? (
                <Check className="w-5 h-5" />
              ) : (
                String.fromCharCode(65 + i)
              )}
            </div>
            <span className="flex-1">{opt || `Option ${i + 1}`}</span>

            {shouldShowResults && results && (
              <div className="flex items-center gap-2 shrink-0 animate-fade-in">
                <div className="w-24 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${OPTION_COLORS[i % OPTION_COLORS.length]}`}
                    style={{
                      width: `${results.optionPercentages[i] || 0}%`,
                    }}
                  />
                </div>
                <span className="text-sm font-bold min-w-[3ch] text-right">
                  {results.optionPercentages[i] || 0}%
                </span>
              </div>
            )}
          </button>
        ))}
      </div>

      {!hasSubmitted && !responseLocked && (
        <button
          onClick={handleSubmit}
          disabled={selected.length === 0}
          className="w-full py-4 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-bold text-lg rounded-2xl shadow-lg transition-all active:scale-[0.99] cursor-pointer"
        >
          {selected.length === 0
            ? "Select an Option"
            : allowMultiple && selected.length > 1
              ? `Submit ${selected.length} Votes`
              : "Submit Vote"}
        </button>
      )}

      {/* Waiting for everyone to vote state */}
      {hasSubmitted && !shouldShowResults && (
        <div className="p-5 rounded-2xl text-center bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xs animate-fade-in space-y-2">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 flex items-center justify-center mx-auto">
            <Check className="w-5 h-5 stroke-[3]" />
          </div>
          <h3 className="text-sm font-bold text-zinc-950 dark:text-white">
            Vote Recorded!
          </h3>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-xs mx-auto">
            Poll results will appear once everyone has voted or the presenter
            closes the poll.
          </p>
          {audienceCount > 0 && results?.totalResponses ? (
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-zinc-100 dark:bg-zinc-800 text-xs font-mono font-bold text-zinc-700 dark:text-zinc-300">
              <span>
                {results.totalResponses} / {audienceCount} Voted
              </span>
            </div>
          ) : null}
        </div>
      )}

      {responseLocked && !hasSubmitted && (
        <p className="text-center text-amber-500 font-medium">
          Responses are currently locked
        </p>
      )}
    </div>
  );
}
