"use client";

import React from "react";
import { X, Command, Keyboard } from "lucide-react";

interface KeyboardShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
  isHost?: boolean;
}

export function KeyboardShortcutsModal({
  isOpen,
  onClose,
  isHost = false,
}: KeyboardShortcutsModalProps) {
  if (!isOpen) return null;

  const editorShortcuts = [
    { key: "← / ↑", desc: "Previous Slide" },
    { key: "→ / ↓", desc: "Next Slide" },
    { key: "Esc", desc: "Close Modals / Exit to Dashboard" },
    { key: "⌘ + S", desc: "Force Save Presentation" },
    { key: "A", desc: "Add New Slide" },
    { key: "T", desc: "Open Theme & Color Settings" },
    { key: "I", desc: "Open Sentio AI Assistant" },
    { key: "P / ⌘ + Enter", desc: "Launch Live Presentation" },
    { key: "?", desc: "Show / Hide Keyboard Shortcuts" },
  ];

  const hostShortcuts = [
    { key: "→ / Space / N", desc: "Next Slide" },
    { key: "← / P", desc: "Previous Slide" },
    { key: "Esc", desc: "Exit Presentation / Close Modal" },
    { key: "F", desc: "Toggle Fullscreen" },
    { key: "L", desc: "Lock / Unlock Audience Responses" },
    { key: "R", desc: "Toggle Live Results Panel" },
    { key: "Q", desc: "Toggle Q&A Panel" },
    { key: "M", desc: "Toggle Join QR Code Modal" },
    { key: "?", desc: "Show / Hide Keyboard Shortcuts" },
  ];

  const shortcuts = isHost ? hostShortcuts : editorShortcuts;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-5 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400">
              <Keyboard className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                Keyboard Shortcuts
              </h3>
              <p className="text-xs text-zinc-500">
                {isHost ? "Live Presenter Mode" : "Slide Editor Studio"}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-2.5 max-h-[70vh] overflow-y-auto">
          {shortcuts.map((s, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between p-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200/80 dark:border-zinc-750 text-xs"
            >
              <span className="font-medium text-zinc-700 dark:text-zinc-300">
                {s.desc}
              </span>
              <kbd className="px-2.5 py-1 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 shadow-2xs font-mono font-bold text-zinc-900 dark:text-zinc-100 text-[11px]">
                {s.key}
              </kbd>
            </div>
          ))}
        </div>

        <div className="p-4 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-colors"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
}
