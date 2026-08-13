"use client";

import React from "react";
import {
  BarChart3,
  CheckCircle2,
  XCircle,
  Star,
  Users,
  Trophy,
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
  if (!results) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-gray-500 p-4">
        <BarChart3 className="w-10 h-10 mb-2 opacity-30" />
        <p className="text-sm">Waiting for responses...</p>
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
  return (
    <div className="p-4 space-y-3">
      <div className="flex items-center justify-between text-sm text-gray-400 mb-2">
        <span className="flex items-center gap-1">
          <Users className="w-4 h-4" />
          {results.totalResponses} / {participantCount} responded
        </span>
        <span>{results.participationPercentage}%</span>
      </div>
      {(results.optionCounts || []).map((count: number, i: number) => (
        <div key={i} className="space-y-1">
          <div className="flex justify-between text-sm">
            <span className="text-white font-medium">
              Option {String.fromCharCode(65 + i)}
            </span>
            <span className="text-gray-400">
              {count} ({results.optionPercentages?.[i] || 0}%)
            </span>
          </div>
          <div className="h-3 bg-gray-800 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${OPTION_COLORS[i % OPTION_COLORS.length]}`}
              style={{
                width: `${results.optionPercentages?.[i] || 0}%`,
              }}
            />
          </div>
        </div>
      ))}
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
  return (
    <div className="p-4 space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-gray-800 rounded-xl p-3 text-center">
          <div className="flex items-center justify-center gap-1 text-emerald-400 mb-1">
            <CheckCircle2 className="w-4 h-4" />
            <span className="text-sm">Correct</span>
          </div>
          <span className="text-2xl font-bold text-white">
            {results.correctCount}
          </span>
        </div>
        <div className="bg-gray-800 rounded-xl p-3 text-center">
          <div className="flex items-center justify-center gap-1 text-rose-400 mb-1">
            <XCircle className="w-4 h-4" />
            <span className="text-sm">Incorrect</span>
          </div>
          <span className="text-2xl font-bold text-white">
            {results.incorrectCount}
          </span>
        </div>
      </div>
      <div className="text-center text-sm text-gray-400">
        Accuracy:{" "}
        <span className="text-white font-bold">{results.accuracy}%</span>
      </div>

      {/* Leaderboard top 5 */}
      {leaderboard && leaderboard.length > 0 && (
        <div className="mt-4">
          <h4 className="text-sm font-semibold text-gray-400 flex items-center gap-1 mb-2">
            <Trophy className="w-4 h-4 text-amber-400" /> Leaderboard
          </h4>
          <div className="space-y-1">
            {leaderboard.slice(0, 5).map((entry, i) => (
              <div
                key={i}
                className="flex items-center justify-between py-2 px-3 bg-gray-800 rounded-lg"
              >
                <div className="flex items-center gap-2">
                  <span
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                      i === 0
                        ? "bg-amber-500 text-white"
                        : i === 1
                          ? "bg-gray-300 text-gray-800"
                          : i === 2
                            ? "bg-amber-700 text-white"
                            : "bg-gray-700 text-gray-300"
                    }`}
                  >
                    {entry.rank}
                  </span>
                  <span className="text-white text-sm font-medium">
                    {entry.displayName}
                  </span>
                </div>
                <span className="text-amber-400 font-bold text-sm">
                  {entry.score}
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
    <div className="p-4">
      <div className="text-sm text-gray-400 mb-3">
        {results.totalSubmissions} submissions
      </div>
      <div className="flex flex-wrap gap-2 min-h-[100px]">
        {(results.words || []).slice(0, 30).map((w: any, i: number) => {
          const scale = Math.max(0.75, (w.count / maxCount) * 1.5);
          return (
            <span
              key={i}
              className="text-blue-400 font-semibold"
              style={{ fontSize: `${scale}rem` }}
            >
              {w.displayWord}
            </span>
          );
        })}
      </div>
    </div>
  );
}

function OpenTextResults({ results }: { results: any }) {
  return (
    <div className="p-4">
      <div className="text-sm text-gray-400 mb-3">
        {results.totalResponses} responses
      </div>
      <div className="space-y-2 max-h-60 overflow-y-auto">
        {(results.responses || []).map((r: any) => (
          <div
            key={r.id}
            className={`p-3 rounded-lg text-sm ${
              r.status === "highlighted"
                ? "bg-amber-900/20 border border-amber-600"
                : r.status === "hidden"
                  ? "bg-gray-800 opacity-40"
                  : "bg-gray-800"
            }`}
          >
            <span className="text-gray-400 text-xs">{r.displayName}: </span>
            <span className="text-white">{r.text}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function RatingResults({ results }: { results: any }) {
  return (
    <div className="p-4 text-center">
      <div className="text-4xl font-bold text-white mb-2">
        {results.average?.toFixed(1)}
      </div>
      <div className="flex justify-center mb-2">
        {Array.from({ length: results.max || 5 }, (_, i) => (
          <Star
            key={i}
            className={`w-5 h-5 ${
              i < Math.round(results.average || 0)
                ? "text-amber-400 fill-amber-400"
                : "text-gray-600"
            }`}
          />
        ))}
      </div>
      <p className="text-sm text-gray-400">
        {results.totalResponses} responses (Min: {results.min}, Max:{" "}
        {results.max})
      </p>
    </div>
  );
}
