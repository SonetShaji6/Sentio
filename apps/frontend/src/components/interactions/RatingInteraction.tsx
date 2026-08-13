"use client";

import React, { useState } from "react";
import { Star, CheckCircle2 } from "lucide-react";

interface RatingInteractionProps {
  slideId: string;
  ratingRange?: { min: number; max: number; type?: string };
  hasSubmitted: boolean;
  responseLocked: boolean;
  onSubmit: (rating: number) => void;
  results?: {
    average: number;
    totalResponses: number;
    distribution: Record<number, number>;
  } | null;
}

export function RatingInteraction({
  slideId,
  ratingRange = { min: 1, max: 5 },
  hasSubmitted,
  responseLocked,
  onSubmit,
  results,
}: RatingInteractionProps) {
  const [hoveredRating, setHoveredRating] = useState<number | null>(null);
  const [selectedRating, setSelectedRating] = useState<number | null>(null);

  const maxVal = ratingRange.max || 5;
  const ratingType = ratingRange.type || "star";

  const handleSelect = (rating: number) => {
    if (hasSubmitted || responseLocked) return;
    setSelectedRating(rating);
  };

  const handleSubmit = () => {
    if (selectedRating === null || hasSubmitted || responseLocked) return;
    onSubmit(selectedRating);
  };

  if (hasSubmitted && results) {
    return (
      <div className="w-full text-center py-6 space-y-4">
        <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto" />
        <h3 className="text-xl font-bold text-gray-900 dark:text-white">
          Rating submitted!
        </h3>
        <div className="bg-gray-50 dark:bg-gray-800/50 rounded-2xl p-6 max-w-sm mx-auto">
          <div className="text-4xl font-bold text-blue-600">
            {results.average.toFixed(1)}
          </div>
          <div className="flex justify-center mt-2">
            {Array.from({ length: maxVal }, (_, i) => (
              <Star
                key={i}
                className={`w-5 h-5 ${
                  i < Math.round(results.average)
                    ? "text-amber-400 fill-amber-400"
                    : "text-gray-300"
                }`}
              />
            ))}
          </div>
          <p className="text-sm text-gray-500 mt-2">
            {results.totalResponses} response
            {results.totalResponses !== 1 ? "s" : ""}
          </p>
        </div>
      </div>
    );
  }

  if (hasSubmitted) {
    return (
      <div className="w-full text-center py-8">
        <CheckCircle2 className="w-16 h-16 text-emerald-500 mx-auto mb-4" />
        <h3 className="text-xl font-bold text-gray-900 dark:text-white">
          Rating submitted!
        </h3>
      </div>
    );
  }

  return (
    <div className="w-full space-y-6">
      {ratingType === "star" || maxVal <= 5 ? (
        /* Star rating */
        <div className="flex justify-center gap-2">
          {Array.from({ length: maxVal }, (_, i) => {
            const value = i + 1;
            const isActive = value <= (hoveredRating ?? selectedRating ?? 0);
            return (
              <button
                key={i}
                onClick={() => handleSelect(value)}
                onMouseEnter={() => setHoveredRating(value)}
                onMouseLeave={() => setHoveredRating(null)}
                disabled={responseLocked}
                className={`transition-all transform hover:scale-110 ${responseLocked ? "opacity-50 cursor-not-allowed" : ""}`}
              >
                <Star
                  className={`w-12 h-12 ${
                    isActive
                      ? "text-amber-400 fill-amber-400"
                      : "text-gray-300 dark:text-gray-600"
                  }`}
                />
              </button>
            );
          })}
        </div>
      ) : (
        /* Numeric rating for scales > 5 */
        <div className="flex flex-wrap justify-center gap-2">
          {Array.from({ length: maxVal }, (_, i) => {
            const value = i + 1;
            return (
              <button
                key={i}
                onClick={() => handleSelect(value)}
                disabled={responseLocked}
                className={`w-12 h-12 rounded-xl font-bold text-lg transition-all ${
                  selectedRating === value
                    ? "bg-blue-600 text-white scale-110"
                    : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-blue-100 dark:hover:bg-blue-900/30"
                } ${responseLocked ? "opacity-50 cursor-not-allowed" : ""}`}
              >
                {value}
              </button>
            );
          })}
        </div>
      )}

      {selectedRating !== null && (
        <p className="text-center text-lg font-medium text-gray-600 dark:text-gray-300">
          Your rating:{" "}
          <span className="text-blue-600 font-bold">{selectedRating}</span> /{" "}
          {maxVal}
        </p>
      )}

      <button
        onClick={handleSubmit}
        disabled={selectedRating === null || responseLocked}
        className="w-full py-4 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-bold rounded-2xl transition-all"
      >
        Submit Rating
      </button>

      {responseLocked && (
        <p className="text-center text-amber-500 font-medium">
          Responses are currently locked
        </p>
      )}
    </div>
  );
}
