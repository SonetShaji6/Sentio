"use client";

import React, { useState, useEffect, useRef } from "react";
import { Check, X, Clock, Trophy } from "lucide-react";

interface QuizInteractionProps {
  slideId: string;
  options: string[];
  timer?: number | null; // seconds
  hasSubmitted: boolean;
  responseLocked: boolean;
  onSubmit: (selectedOptions: number[], responseTimeMs: number) => void;
  feedback?: { isCorrect: boolean; scoreAwarded: number } | null;
}

const OPTION_COLORS = [
  "bg-blue-500",
  "bg-emerald-500",
  "bg-amber-500",
  "bg-rose-500",
];

export function QuizInteraction({
  slideId,
  options,
  timer,
  hasSubmitted,
  responseLocked,
  onSubmit,
  feedback,
}: QuizInteractionProps) {
  const [selected, setSelected] = useState<number | null>(null);
  const [timeLeft, setTimeLeft] = useState(timer || 0);
  const [startTime] = useState(Date.now());
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!timer || timer <= 0 || hasSubmitted) return;

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
  }, [timer, hasSubmitted, slideId]);

  const handleSelect = (index: number) => {
    if (hasSubmitted || responseLocked || (timer && timeLeft <= 0)) return;
    setSelected(index);
  };

  const handleSubmit = () => {
    if (selected === null || hasSubmitted || responseLocked) return;
    const responseTimeMs = Date.now() - startTime;
    if (timerRef.current) clearInterval(timerRef.current);
    onSubmit([selected], responseTimeMs);
  };

  const timerPercent = timer ? (timeLeft / timer) * 100 : 100;

  return (
    <div className="w-full space-y-4">
      {/* Timer */}
      {timer && timer > 0 && !hasSubmitted && (
        <div className="flex items-center gap-3 mb-2">
          <Clock
            className={`w-5 h-5 ${timeLeft <= 5 ? "text-red-500 animate-pulse" : "text-gray-400"}`}
          />
          <div className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-1000 ${timeLeft <= 5 ? "bg-red-500" : "bg-blue-500"}`}
              style={{ width: `${timerPercent}%` }}
            />
          </div>
          <span
            className={`text-lg font-bold min-w-[2ch] ${timeLeft <= 5 ? "text-red-500" : "text-gray-600 dark:text-gray-300"}`}
          >
            {timeLeft}s
          </span>
        </div>
      )}

      {/* Options */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {options.map((opt, i) => (
          <button
            key={i}
            onClick={() => handleSelect(i)}
            disabled={
              hasSubmitted || responseLocked || (timer ? timeLeft <= 0 : false)
            }
            className={`py-5 px-6 rounded-2xl font-medium text-lg transition-all flex items-center gap-3 ${
              selected === i
                ? "ring-2 ring-white ring-offset-2 ring-offset-gray-950 scale-[1.02]"
                : "hover:scale-[1.01]"
            } ${OPTION_COLORS[i % OPTION_COLORS.length]} text-white ${
              hasSubmitted || responseLocked
                ? "opacity-70 cursor-not-allowed"
                : ""
            }`}
          >
            <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center font-bold text-sm">
              {String.fromCharCode(65 + i)}
            </div>
            <span>{opt || `Option ${i + 1}`}</span>
          </button>
        ))}
      </div>

      {/* Submit */}
      {!hasSubmitted && !responseLocked && (
        <button
          onClick={handleSubmit}
          disabled={selected === null || (timer ? timeLeft <= 0 : false)}
          className="w-full py-4 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-bold rounded-2xl transition-all"
        >
          Submit Answer
        </button>
      )}

      {/* Feedback */}
      {hasSubmitted && feedback && (
        <div
          className={`p-6 rounded-2xl text-center ${
            feedback.isCorrect
              ? "bg-emerald-500/10 border border-emerald-500/30"
              : "bg-rose-500/10 border border-rose-500/30"
          }`}
        >
          <div className="flex justify-center mb-3">
            {feedback.isCorrect ? (
              <div className="w-16 h-16 rounded-full bg-emerald-500 flex items-center justify-center">
                <Check className="w-8 h-8 text-white" />
              </div>
            ) : (
              <div className="w-16 h-16 rounded-full bg-rose-500 flex items-center justify-center">
                <X className="w-8 h-8 text-white" />
              </div>
            )}
          </div>
          <h3
            className={`text-2xl font-bold ${feedback.isCorrect ? "text-emerald-500" : "text-rose-500"}`}
          >
            {feedback.isCorrect ? "Correct!" : "Incorrect"}
          </h3>
          {feedback.scoreAwarded > 0 && (
            <div className="flex items-center justify-center gap-2 mt-2 text-amber-500">
              <Trophy className="w-5 h-5" />
              <span className="font-bold text-lg">
                +{feedback.scoreAwarded} points
              </span>
            </div>
          )}
        </div>
      )}

      {responseLocked && !hasSubmitted && (
        <p className="text-center text-amber-500 font-medium">
          Responses are currently locked
        </p>
      )}

      {timer && timeLeft <= 0 && !hasSubmitted && (
        <p className="text-center text-red-500 font-bold text-lg">
          Time&apos;s up!
        </p>
      )}
    </div>
  );
}
