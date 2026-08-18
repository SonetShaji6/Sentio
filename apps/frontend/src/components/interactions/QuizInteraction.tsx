"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Check,
  X,
  Clock,
  Trophy,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";

interface QuizInteractionProps {
  slideId: string;
  options: string[];
  timer?: number | null; // seconds
  hasSubmitted: boolean;
  responseLocked: boolean;
  onSubmit: (selectedOptions: number[], responseTimeMs: number) => void;
  feedback?: {
    isCorrect?: boolean;
    scoreAwarded?: number;
    correctAnswers?: number[];
    selectedOptions?: number[];
  } | null;
  revealedCorrectAnswers?: number[];
}

const OPTION_COLORS = [
  "bg-blue-600 dark:bg-blue-500",
  "bg-emerald-600 dark:bg-emerald-500",
  "bg-amber-600 dark:bg-amber-500",
  "bg-rose-600 dark:bg-rose-500",
  "bg-purple-600 dark:bg-purple-500",
  "bg-cyan-600 dark:bg-cyan-500",
];

export function QuizInteraction({
  slideId,
  options,
  timer,
  hasSubmitted,
  responseLocked,
  onSubmit,
  feedback,
  revealedCorrectAnswers = [],
}: QuizInteractionProps) {
  const [selected, setSelected] = useState<number | null>(null);
  const [timeLeft, setTimeLeft] = useState(timer || 0);
  const startTimeRef = useRef<number>(Date.now());
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Reset local state cleanly whenever slideId changes
  useEffect(() => {
    setSelected(null);
    startTimeRef.current = Date.now();
    if (timer && timer > 0) {
      setTimeLeft(timer);
    } else {
      setTimeLeft(0);
    }
  }, [slideId, timer]);

  useEffect(() => {
    if (!timer || timer <= 0 || hasSubmitted || responseLocked) return;

    setTimeLeft(timer);
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [timer, hasSubmitted, responseLocked, slideId]);

  const isTimedOut = Boolean(timer && timer > 0 && timeLeft <= 0);
  const isFinished = hasSubmitted || isTimedOut || responseLocked;

  // Auto-submit if time expires and user had selected an answer
  useEffect(() => {
    if (isTimedOut && !hasSubmitted && !responseLocked && selected !== null) {
      const responseTimeMs = Math.max(0, Date.now() - startTimeRef.current);
      onSubmit([selected], responseTimeMs);
    }
  }, [isTimedOut, hasSubmitted, responseLocked, selected, onSubmit]);

  // Determine correct answer indices
  const correctIndices: number[] =
    feedback?.correctAnswers || revealedCorrectAnswers || [];

  const handleSelect = (index: number) => {
    if (isFinished) return;
    setSelected(index);
  };

  const handleSubmit = () => {
    if (selected === null || isFinished) return;
    const responseTimeMs = Math.max(0, Date.now() - startTimeRef.current);
    if (timerRef.current) clearInterval(timerRef.current);
    onSubmit([selected], responseTimeMs);
  };

  const timerPercent = timer ? (timeLeft / timer) * 100 : 100;

  // Format correct answers label
  const correctLabels = correctIndices
    .map((idx) => {
      const char = String.fromCharCode(65 + idx);
      const text = options[idx];
      return text ? `${char} (${text})` : char;
    })
    .join(", ");

  return (
    <div className="w-full space-y-4">
      {/* Active Timer Bar */}
      {timer &&
        timer > 0 &&
        !hasSubmitted &&
        !responseLocked &&
        timeLeft > 0 && (
          <div className="flex items-center gap-3 mb-2 bg-zinc-100 dark:bg-zinc-800/80 px-4 py-2.5 rounded-2xl border border-zinc-200 dark:border-zinc-700/60">
            <Clock
              className={`w-5 h-5 ${
                timeLeft <= 5 ? "text-red-500 animate-pulse" : "text-blue-500"
              }`}
            />
            <div className="flex-1 h-2.5 bg-zinc-200 dark:bg-zinc-700 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-1000 ${
                  timeLeft <= 5 ? "bg-red-500" : "bg-blue-500"
                }`}
                style={{ width: `${timerPercent}%` }}
              />
            </div>
            <span
              className={`text-lg font-black min-w-[2.5ch] text-right ${
                timeLeft <= 5
                  ? "text-red-500"
                  : "text-zinc-700 dark:text-zinc-200"
              }`}
            >
              {timeLeft}s
            </span>
          </div>
        )}

      {/* Options Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {options.map((opt, i) => {
          const isThisSelected =
            selected === i || feedback?.selectedOptions?.includes(i);
          const isThisCorrect = correctIndices.includes(i);

          let optionStyle = OPTION_COLORS[i % OPTION_COLORS.length];
          let borderRing = "";
          let iconBadge = null;

          if (isFinished && correctIndices.length > 0) {
            if (isThisCorrect) {
              optionStyle =
                "bg-emerald-600 text-white shadow-lg shadow-emerald-500/20";
              borderRing =
                "ring-4 ring-emerald-400 ring-offset-2 dark:ring-offset-zinc-900";
              iconBadge = (
                <span className="flex items-center gap-1 text-xs font-bold bg-emerald-700 text-white px-2 py-0.5 rounded-md ml-auto">
                  <Check className="w-3.5 h-3.5" /> Correct
                </span>
              );
            } else if (isThisSelected && !isThisCorrect) {
              optionStyle = "bg-rose-600 text-white opacity-80";
              borderRing =
                "ring-4 ring-rose-400 ring-offset-2 dark:ring-offset-zinc-900";
              iconBadge = (
                <span className="flex items-center gap-1 text-xs font-bold bg-rose-700 text-white px-2 py-0.5 rounded-md ml-auto">
                  <X className="w-3.5 h-3.5" /> Your Choice
                </span>
              );
            } else {
              optionStyle = "bg-zinc-700/60 text-zinc-400 opacity-40";
            }
          } else if (selected === i) {
            borderRing =
              "ring-4 ring-white ring-offset-2 ring-offset-zinc-950 scale-[1.02]";
          }

          return (
            <button
              key={i}
              onClick={() => handleSelect(i)}
              disabled={isFinished}
              className={`py-4 px-5 rounded-2xl font-semibold text-lg transition-all flex items-center gap-3 text-left ${optionStyle} ${borderRing} ${
                isFinished
                  ? "cursor-default"
                  : "hover:scale-[1.01] active:scale-[0.99] cursor-pointer"
              }`}
            >
              <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center font-bold text-sm shrink-0">
                {String.fromCharCode(65 + i)}
              </div>
              <span className="flex-1 line-clamp-2">
                {opt || `Option ${i + 1}`}
              </span>
              {iconBadge}
            </button>
          );
        })}
      </div>

      {/* Submit Button */}
      {!isFinished && (
        <button
          onClick={handleSubmit}
          disabled={selected === null}
          className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:from-zinc-400 disabled:to-zinc-500 disabled:cursor-not-allowed text-white font-bold text-lg rounded-2xl shadow-md hover:shadow-lg transition-all active:scale-[0.99]"
        >
          {selected === null ? "Select an Answer Above" : "Submit Answer"}
        </button>
      )}

      {/* Result / Feedback Card */}
      {hasSubmitted && feedback && (
        <div
          className={`p-6 rounded-3xl text-center border transition-all ${
            feedback.isCorrect
              ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-950 dark:text-emerald-100"
              : "bg-rose-500/10 border-rose-500/30 text-rose-950 dark:text-rose-100"
          }`}
        >
          <div className="flex justify-center mb-3">
            {feedback.isCorrect ? (
              <div className="w-16 h-16 rounded-2xl bg-emerald-500 flex items-center justify-center shadow-lg shadow-emerald-500/30">
                <Check className="w-9 h-9 text-white stroke-[3]" />
              </div>
            ) : (
              <div className="w-16 h-16 rounded-2xl bg-rose-500 flex items-center justify-center shadow-lg shadow-rose-500/30">
                <X className="w-9 h-9 text-white stroke-[3]" />
              </div>
            )}
          </div>
          <h3
            className={`text-2xl font-black ${
              feedback.isCorrect
                ? "text-emerald-600 dark:text-emerald-400"
                : "text-rose-600 dark:text-rose-400"
            }`}
          >
            {feedback.isCorrect
              ? "Brilliant! That's Correct!"
              : "Oops! Incorrect"}
          </h3>

          {correctLabels && (
            <p className="text-sm font-medium mt-2 text-zinc-600 dark:text-zinc-300">
              Correct Answer:{" "}
              <span className="font-bold text-emerald-600 dark:text-emerald-400">
                {correctLabels}
              </span>
            </p>
          )}

          {typeof feedback.scoreAwarded === "number" &&
            feedback.scoreAwarded > 0 && (
              <div className="inline-flex items-center justify-center gap-2 mt-3 px-4 py-1.5 rounded-full bg-amber-500/20 text-amber-600 dark:text-amber-300 border border-amber-500/30">
                <Trophy className="w-5 h-5 text-amber-500" />
                <span className="font-extrabold text-base">
                  +{feedback.scoreAwarded} Points Earned
                </span>
              </div>
            )}
        </div>
      )}

      {/* Timeout / Response Locked (without submission) */}
      {!hasSubmitted && (isTimedOut || responseLocked) && (
        <div className="p-6 rounded-3xl text-center bg-zinc-100 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700">
          <div className="flex justify-center mb-2">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-500">
              <Clock className="w-6 h-6" />
            </div>
          </div>
          <h3 className="text-xl font-bold text-zinc-900 dark:text-white">
            {isTimedOut ? "Time's Up!" : "Responses are Locked"}
          </h3>
          {correctLabels ? (
            <p className="text-sm font-medium mt-2 text-zinc-600 dark:text-zinc-300">
              The correct answer was:{" "}
              <span className="font-bold text-emerald-600 dark:text-emerald-400">
                {correctLabels}
              </span>
            </p>
          ) : (
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
              Presenter has locked or concluded answers for this question.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
