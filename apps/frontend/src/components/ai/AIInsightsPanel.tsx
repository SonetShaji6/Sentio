"use client";

import React, { useEffect, useState } from "react";
import { getAccessToken, API_URL } from "@/lib/auth";

export default function AIInsightsPanel({ sessionId }: { sessionId: string }) {
  const [insights, setInsights] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchInsights = async () => {
      setLoading(true);
      setError(null);
      try {
        const token = getAccessToken();
        const res = await fetch(`${API_URL}/api/ai/insights/${sessionId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        setInsights(data);
      } catch (err: any) {
        console.error(err);
        setError("AI Insights are currently unavailable or still processing.");
      } finally {
        setLoading(false);
      }
    };

    if (sessionId) {
      fetchInsights();
    }
  }, [sessionId]);

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-6 flex items-center justify-center min-h-[300px]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin"></div>
          <p className="text-sm text-gray-500 font-medium animate-pulse">
            Sentio AI is analyzing the session...
          </p>
        </div>
      </div>
    );
  }

  if (error || !insights) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="text-amber-600 flex items-center gap-2">
          <span>⚠️</span> {error || "No insights available"}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl border border-purple-100 p-6 shadow-sm">
      <div className="flex items-center gap-2 mb-6">
        <span className="text-2xl">✨</span>
        <h3 className="text-lg font-bold text-gray-800">AI Session Insights</h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* Sentiment */}
        <div className="bg-white p-4 rounded-lg border border-purple-100 shadow-sm">
          <h4 className="text-xs uppercase text-gray-500 font-semibold mb-2">
            Audience Sentiment
          </h4>
          <p className="text-xl font-bold text-purple-700">
            {insights.sentiment}
          </p>
        </div>

        {/* Topics Detected */}
        <div className="bg-white p-4 rounded-lg border border-purple-100 shadow-sm">
          <h4 className="text-xs uppercase text-gray-500 font-semibold mb-2">
            Key Topics Detected
          </h4>
          <div className="flex flex-wrap gap-2">
            {insights.topicDetection?.map((topic: string, i: number) => (
              <span
                key={i}
                className="bg-purple-100 text-purple-700 text-xs px-2 py-1 rounded-full font-medium"
              >
                {topic}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Recommendations */}
      <div className="bg-white p-5 rounded-lg border border-purple-100 shadow-sm">
        <h4 className="text-sm font-bold text-gray-800 mb-4 flex items-center gap-2">
          💡 Recommended Actions
        </h4>
        <div className="space-y-4">
          {insights.recommendations?.map((rec: any, i: number) => (
            <div
              key={i}
              className="pb-4 border-b border-gray-100 last:border-0 last:pb-0"
            >
              <p className="font-semibold text-gray-800 text-sm mb-1">
                {rec.recommendation}
              </p>
              <p className="text-gray-600 text-sm mb-2">{rec.reason}</p>
              <div className="flex items-center gap-2 text-xs text-gray-400">
                <span>Evidence: {rec.evidence}</span>
                <span>•</span>
                <span>Confidence: {Math.round(rec.confidence * 100)}%</span>
              </div>
            </div>
          ))}
          {(!insights.recommendations ||
            insights.recommendations.length === 0) && (
            <p className="text-sm text-gray-500 italic">
              No specific recommendations at this time.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
