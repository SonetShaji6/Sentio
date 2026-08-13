"use client";

import React from "react";
import { Check, EyeOff, Star } from "lucide-react";

interface OpenTextResponse {
  id: string;
  displayName: string;
  text: string;
  status: "visible" | "hidden" | "highlighted" | "approved";
  createdAt: string;
}

interface ModerationPanelProps {
  responses: OpenTextResponse[];
  onModerate: (
    interactionId: string,
    action: "approve" | "hide" | "highlight",
  ) => void;
}

export function ModerationPanel({
  responses,
  onModerate,
}: ModerationPanelProps) {
  if (responses.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-40 text-gray-500">
        <p className="text-sm">No responses yet</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="p-3 border-b border-gray-800 font-semibold text-sm text-gray-300">
        Moderation ({responses.length})
      </div>
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {responses.map((r) => (
          <div
            key={r.id}
            className={`p-3 rounded-lg border text-sm ${
              r.status === "highlighted"
                ? "border-amber-500 bg-amber-900/20"
                : r.status === "hidden"
                  ? "border-gray-700 bg-gray-800/50 opacity-50"
                  : "border-gray-700 bg-gray-800"
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="font-semibold text-gray-300">
                {r.displayName}
              </span>
              <span className="text-xs text-gray-500">
                {new Date(r.createdAt).toLocaleTimeString()}
              </span>
            </div>
            <p className="text-white mb-3">{r.text}</p>

            <div className="flex gap-2 border-t border-gray-700 pt-2">
              {r.status !== "highlighted" && (
                <button
                  onClick={() => onModerate(r.id, "highlight")}
                  className="flex items-center gap-1 text-xs px-2 py-1 bg-amber-900/30 text-amber-400 hover:bg-amber-900/50 rounded"
                >
                  <Star className="w-3 h-3" /> Highlight
                </button>
              )}
              {r.status !== "approved" && r.status !== "highlighted" && (
                <button
                  onClick={() => onModerate(r.id, "approve")}
                  className="flex items-center gap-1 text-xs px-2 py-1 bg-emerald-900/30 text-emerald-400 hover:bg-emerald-900/50 rounded"
                >
                  <Check className="w-3 h-3" /> Approve
                </button>
              )}
              {r.status !== "hidden" && (
                <button
                  onClick={() => onModerate(r.id, "hide")}
                  className="flex items-center gap-1 text-xs px-2 py-1 bg-red-900/30 text-red-400 hover:bg-red-900/50 rounded"
                >
                  <EyeOff className="w-3 h-3" /> Hide
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
