"use client";

import React from "react";
import {
  BarChart3,
  CheckCircle2,
  XCircle,
  Star,
  Users,
  Trophy,
  Check,
  Award,
  Sparkles,
  Flame,
} from "lucide-react";

interface PresenterResultsProps {
  slideType: string;
  results: any;
  leaderboard?: any[];
  participantCount: number;
}

const OPTION_COLORS = [
  "bg-blue-500",
  "bg-emerald-500",
  "bg-amber-500",
  "bg-rose-500",
  "bg-violet-500",
  "bg-cyan-500",
];

export function PresenterResults({
  slideType,
  results,
  leaderboard,
  participantCount,
}: PresenterResultsProps) {
  if (!results || results.totalResponses === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-zinc-400 dark:text-zinc-500 p-6 text-center">
        <div className="w-14 h-14 rounded-2xl bg-zinc-800/50 flex items-center justify-center mb-3">
          <BarChart3 className="w-7 h-7 opacity-40 animate-pulse text-zinc-400" />
        </div>
        <p className="text-sm font-semibold text-zinc-300 dark:text-zinc-400">
          Waiting for live responses...
        </p>
        <p className="text-xs text-zinc-500 mt-1">
          {participantCount > 0
            ? `${participantCount} participant${participantCount === 1 ? "" : "s"} connected`
            : "Invite audience with the room code"}
        </p>
      </div>
    );
  }

  switch (slideType) {
    case "poll":
    case "imagepoll":
      return (
        <PollResults results={results} participantCount={participantCount} />
      );
    case "quiz":
      return <QuizResults results={results} leaderboard={leaderboard} />;
    case "wordcloud":
      return <WordCloudResults results={results} />;
    case "opentext":
      return <OpenTextResults results={results} />;
    case "rating":
      return <RatingResults results={results} />;
    default:
      return null;
  }
}

function PollResults({
  results,
  participantCount,
}: {
  results: any;
  participantCount: number;
}) {
  const options = results.options || [];
  const optionCounts = results.optionCounts || [];
  const optionPercentages = results.optionPercentages || [];

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between text-xs text-zinc-400 border-b border-zinc-800 pb-3">
        <span className="flex items-center gap-1.5 font-medium">
          <Users className="w-3.5 h-3.5 text-blue-400" />
          <strong className="text-white">
            {results.totalResponses}
          </strong> / {participantCount || results.totalResponses} responded
        </span>
        <span className="font-bold text-blue-400">
          {results.participationPercentage || 100}%
        </span>
      </div>

      <div className="space-y-3">
        {optionCounts.map((count: number, i: number) => {
          const optionText =
            options[i] || `Option ${String.fromCharCode(65 + i)}`;
          const pct = optionPercentages[i] || 0;

          return (
            <div
              key={i}
              className="space-y-1.5 bg-zinc-900/60 p-2.5 rounded-xl border border-zinc-800/80"
            >
              <div className="flex justify-between items-center text-xs">
                <span className="text-zinc-200 font-semibold truncate max-w-[200px] flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-md bg-white/10 text-white flex items-center justify-center font-bold text-[10px] shrink-0">
                    {String.fromCharCode(65 + i)}
                  </span>
                  <span className="truncate">{optionText}</span>
                </span>
                <span className="text-zinc-400 font-mono font-bold shrink-0 ml-2">
                  {count}{" "}
                  <span className="text-zinc-500 font-normal">({pct}%)</span>
                </span>
              </div>
              <div className="h-2.5 bg-zinc-800 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-700 ease-out ${
                    OPTION_COLORS[i % OPTION_COLORS.length]
                  }`}
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function QuizResults({
  results,
  leaderboard,
}: {
  results: any;
  leaderboard?: any[];
}) {
  const options: string[] = results.options || [];
  const correctAnswers: number[] = results.correctAnswers || [];
  const optionCounts: number[] = results.optionCounts || [];
  const optionPercentages: number[] = results.optionPercentages || [];

  return (
    <div className="p-4 space-y-4">
      {/* Accuracy Header Cards */}
      <div className="grid grid-cols-2 gap-2.5">
        <div className="bg-emerald-950/30 border border-emerald-500/30 rounded-2xl p-3 text-center">
          <div className="flex items-center justify-center gap-1 text-emerald-400 text-xs font-semibold mb-1">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Correct</span>
          </div>
          <span className="text-2xl font-black text-emerald-300">
            {results.correctCount || 0}
          </span>
        </div>
        <div className="bg-rose-950/30 border border-rose-500/30 rounded-2xl p-3 text-center">
          <div className="flex items-center justify-center gap-1 text-rose-400 text-xs font-semibold mb-1">
            <XCircle className="w-3.5 h-3.5" />
            <span>Incorrect</span>
          </div>
          <span className="text-2xl font-black text-rose-300">
            {results.incorrectCount || 0}
          </span>
        </div>
      </div>

      <div className="flex items-center justify-between text-xs text-zinc-400 px-1">
        <span>Accuracy Rate</span>
        <span className="font-extrabold text-white text-sm">
          {results.accuracy ?? 0}%
        </span>
      </div>

      {/* Option Breakdown if available */}
      {optionCounts.length > 0 && (
        <div className="space-y-2 pt-1 border-t border-zinc-800">
          <h5 className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">
            Responses Breakdown
          </h5>
          {optionCounts.map((count, i) => {
            const isCorrect = correctAnswers.includes(i);
            const pct = optionPercentages[i] || 0;
            const text = options[i] || `Option ${String.fromCharCode(65 + i)}`;

            return (
              <div
                key={i}
                className={`p-2 rounded-xl border text-xs transition-all ${
                  isCorrect
                    ? "bg-emerald-950/40 border-emerald-500/40 text-emerald-200"
                    : "bg-zinc-900/60 border-zinc-800 text-zinc-300"
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="flex items-center gap-1.5 font-medium truncate max-w-[180px]">
                    <span
                      className={`w-4 h-4 rounded text-[10px] font-black flex items-center justify-center ${
                        isCorrect
                          ? "bg-emerald-500 text-black"
                          : "bg-zinc-700 text-white"
                      }`}
                    >
                      {String.fromCharCode(65 + i)}
                    </span>
                    <span className="truncate">{text}</span>
                  </span>
                  <div className="flex items-center gap-1.5 shrink-0 ml-2">
                    {isCorrect && (
                      <span className="text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-1.5 py-0.2 rounded">
                        ✓ Correct
                      </span>
                    )}
                    <span className="font-mono font-bold">
                      {count} <span className="text-zinc-500">({pct}%)</span>
                    </span>
                  </div>
                </div>
                <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      isCorrect ? "bg-emerald-400" : "bg-zinc-600"
                    }`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Live Leaderboard Top 5 */}
      {leaderboard && leaderboard.length > 0 && (
        <div className="mt-4 pt-3 border-t border-zinc-800">
          <h4 className="text-xs font-bold text-zinc-300 flex items-center gap-1.5 mb-2.5">
            <Trophy className="w-3.5 h-3.5 text-amber-400" />
            <span>Top Performers</span>
          </h4>
          <div className="space-y-1.5">
            {leaderboard.slice(0, 5).map((entry, i) => (
              <div
                key={i}
                className="flex items-center justify-between py-1.5 px-2.5 bg-zinc-900/80 border border-zinc-800 rounded-xl text-xs"
              >
                <div className="flex items-center gap-2">
                  <span
                    className={`w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-black ${
                      i === 0
                        ? "bg-amber-400 text-black shadow-sm"
                        : i === 1
                          ? "bg-zinc-300 text-black"
                          : i === 2
                            ? "bg-amber-700 text-white"
                            : "bg-zinc-800 text-zinc-400"
                    }`}
                  >
                    {entry.rank || i + 1}
                  </span>
                  <span className="text-zinc-200 font-semibold truncate max-w-[140px]">
                    {entry.displayName}
                  </span>
                </div>
                <span className="text-amber-400 font-mono font-black">
                  {entry.score} pts
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function WordCloudResults({ results }: { results: any }) {
  const maxCount = results.words?.[0]?.count || 1;
  return (
    <div className="p-4 space-y-3">
      <div className="text-xs font-semibold text-zinc-400 flex items-center justify-between">
        <span>Submissions Stream</span>
        <span className="font-bold text-white">
          {results.totalSubmissions} words
        </span>
      </div>
      <div className="flex flex-wrap gap-2 p-3 bg-zinc-900/60 border border-zinc-800 rounded-2xl min-h-[140px] items-center justify-center">
        {(results.words || []).slice(0, 30).map((w: any, i: number) => {
          const scale = Math.max(
            0.75,
            Math.min(2.0, (w.count / maxCount) * 1.6),
          );
          return (
            <span
              key={i}
              className="inline-block font-bold text-blue-400 hover:text-blue-300 transition-transform cursor-default"
              style={{ fontSize: `${scale}rem` }}
            >
              {w.displayWord}
              {w.count > 1 && (
                <span className="text-[10px] text-zinc-500 ml-1 font-normal">
                  ({w.count})
                </span>
              )}
            </span>
          );
        })}
      </div>
    </div>
  );
}

function OpenTextResults({ results }: { results: any }) {
  return (
    <div className="p-4 space-y-3">
      <div className="text-xs font-semibold text-zinc-400 flex items-center justify-between">
        <span>Audience Thoughts</span>
        <span className="font-bold text-white">
          {results.totalResponses} responses
        </span>
      </div>
      <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
        {(results.responses || []).map((r: any) => (
          <div
            key={r.id}
            className={`p-3 rounded-xl text-xs border ${
              r.status === "highlighted"
                ? "bg-amber-500/10 border-amber-500/40 text-amber-200"
                : r.status === "hidden"
                  ? "bg-zinc-900/40 border-zinc-800 opacity-40 text-zinc-500"
                  : "bg-zinc-900/80 border-zinc-800/80 text-zinc-200"
            }`}
          >
            <div className="font-bold text-zinc-400 text-[10px] mb-1">
              {r.displayName}
            </div>
            <p className="leading-relaxed whitespace-pre-wrap">{r.text}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function RatingResults({ results }: { results: any }) {
  const avg = Number(results.average) || 0;
  const max = results.max || 5;

  return (
    <div className="p-4 text-center space-y-3">
      <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-4">
        <div className="text-4xl font-black text-white mb-1">
          {avg.toFixed(1)}
        </div>
        <div className="flex justify-center gap-1 mb-2">
          {Array.from({ length: max }, (_, i) => (
            <Star
              key={i}
              className={`w-5 h-5 ${
                i < Math.round(avg)
                  ? "text-amber-400 fill-amber-400"
                  : "text-zinc-700"
              }`}
            />
          ))}
        </div>
        <p className="text-xs text-zinc-400">
          <strong className="text-white">{results.totalResponses}</strong> total
          ratings
        </p>
      </div>

      {/* Distribution Histogram */}
      {results.distribution && (
        <div className="space-y-1.5 text-left pt-2">
          {Array.from({ length: max }, (_, idx) => max - idx).map((starNum) => {
            const count = results.distribution[starNum] || 0;
            const pct =
              results.totalResponses > 0
                ? Math.round((count / results.totalResponses) * 100)
                : 0;

            return (
              <div key={starNum} className="flex items-center gap-2 text-xs">
                <span className="w-6 font-mono text-zinc-400 flex items-center gap-0.5">
                  {starNum}
                  <Star className="w-2.5 h-2.5 fill-current text-amber-400" />
                </span>
                <div className="flex-1 h-2 bg-zinc-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-amber-400 rounded-full transition-all duration-500"
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <span className="w-8 text-right font-mono text-zinc-500 text-[10px]">
                  {count}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
