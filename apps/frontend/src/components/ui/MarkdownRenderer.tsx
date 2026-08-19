"use client";

import React, { useState } from "react";
import { Check, Copy, Sparkles, Plus } from "lucide-react";

interface MarkdownRendererProps {
  content: string;
  className?: string;
  onAddSlideSuggestion?: (suggestion: {
    type: "quiz" | "poll" | "information";
    title: string;
    options?: string[];
    description?: string;
  }) => void;
}

export function MarkdownRenderer({
  content,
  className = "",
  onAddSlideSuggestion,
}: MarkdownRendererProps) {
  const [copiedBlock, setCopiedBlock] = useState<number | null>(null);

  const handleCopy = (text: string, index: number) => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedBlock(index);
      setTimeout(() => setCopiedBlock(null), 2000);
    }
  };

  // Helper to parse inline styles (bold, italic, code)
  const parseInline = (text: string): React.ReactNode[] => {
    // Regex splits by bold (**text**), italic (*text*), inline code (`code`)
    const parts: React.ReactNode[] = [];
    const regex = /(\*\*.*?\*\*|\*.*?\*|`.*?`)/g;
    let lastIdx = 0;
    let match: RegExpExecArray | null;

    while ((match = regex.exec(text)) !== null) {
      if (match.index > lastIdx) {
        parts.push(text.substring(lastIdx, match.index));
      }
      const token = match[0];
      if (token.startsWith("**") && token.endsWith("**")) {
        parts.push(
          <strong
            key={match.index}
            className="font-bold text-zinc-900 dark:text-zinc-100"
          >
            {token.slice(2, -2)}
          </strong>,
        );
      } else if (token.startsWith("*") && token.endsWith("*")) {
        parts.push(
          <em
            key={match.index}
            className="italic text-zinc-800 dark:text-zinc-200"
          >
            {token.slice(1, -1)}
          </em>,
        );
      } else if (token.startsWith("`") && token.endsWith("`")) {
        parts.push(
          <code
            key={match.index}
            className="px-1.5 py-0.5 rounded-md bg-zinc-200/80 dark:bg-zinc-800 text-purple-600 dark:text-purple-300 font-mono text-[11px] border border-zinc-300/60 dark:border-zinc-700/60"
          >
            {token.slice(1, -1)}
          </code>,
        );
      }
      lastIdx = match.index + token.length;
    }

    if (lastIdx < text.length) {
      parts.push(text.substring(lastIdx));
    }

    return parts.length > 0 ? parts : [text];
  };

  // Parse lines and blocks
  const lines = content.split("\n");
  const elements: React.ReactNode[] = [];
  let inCodeBlock = false;
  let codeBlockLines: string[] = [];
  let codeBlockLang = "";
  let listItems: { text: string; ordered: boolean; num?: string }[] = [];

  const flushList = () => {
    if (listItems.length === 0) return;
    const isOrdered = listItems[0].ordered;
    const key = `list-${elements.length}`;
    if (isOrdered) {
      elements.push(
        <ol
          key={key}
          className="space-y-1.5 my-2 pl-4 list-decimal marker:text-purple-500 font-medium"
        >
          {listItems.map((item, idx) => (
            <li key={idx} className="leading-relaxed">
              {parseInline(item.text)}
            </li>
          ))}
        </ol>,
      );
    } else {
      elements.push(
        <ul key={key} className="space-y-1.5 my-2 pl-2">
          {listItems.map((item, idx) => (
            <li key={idx} className="flex items-start gap-2 leading-relaxed">
              <span className="w-1.5 h-1.5 rounded-full bg-purple-500 mt-1.5 shrink-0" />
              <span>{parseInline(item.text)}</span>
            </li>
          ))}
        </ul>,
      );
    }
    listItems = [];
  };

  lines.forEach((line, lineIdx) => {
    const trimmed = line.trim();

    // Code block start / end
    if (trimmed.startsWith("```")) {
      flushList();
      if (inCodeBlock) {
        const fullCode = codeBlockLines.join("\n");
        const blockIdx = lineIdx;
        elements.push(
          <div
            key={`code-${lineIdx}`}
            className="my-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-200 overflow-hidden text-[11px] font-mono shadow-md"
          >
            <div className="flex items-center justify-between px-3 py-1.5 bg-zinc-950/80 border-b border-zinc-800/80 text-[10px] text-zinc-400">
              <span>{codeBlockLang || "snippet"}</span>
              <button
                onClick={() => handleCopy(fullCode, blockIdx)}
                className="flex items-center gap-1 hover:text-white transition-colors"
              >
                {copiedBlock === blockIdx ? (
                  <>
                    <Check className="w-3 h-3 text-emerald-400" />
                    <span className="text-emerald-400">Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3" />
                    <span>Copy</span>
                  </>
                )}
              </button>
            </div>
            <pre className="p-3 overflow-x-auto leading-relaxed">
              <code>{fullCode}</code>
            </pre>
          </div>,
        );
        codeBlockLines = [];
        codeBlockLang = "";
        inCodeBlock = false;
      } else {
        inCodeBlock = true;
        codeBlockLang = trimmed.slice(3).trim();
      }
      return;
    }

    if (inCodeBlock) {
      codeBlockLines.push(line);
      return;
    }

    // Check for unordered lists (- or *)
    const unorderedMatch = line.match(/^(\s*)[-*]\s+(.+)/);
    if (unorderedMatch) {
      listItems.push({ text: unorderedMatch[2], ordered: false });
      return;
    }

    // Check for ordered lists (1. 2. etc)
    const orderedMatch = line.match(/^(\s*)(\d+)\.\s+(.+)/);
    if (orderedMatch) {
      listItems.push({
        text: orderedMatch[3],
        ordered: true,
        num: orderedMatch[2],
      });
      return;
    }

    flushList();

    // Headers
    if (trimmed.startsWith("### ")) {
      elements.push(
        <h4
          key={`h3-${lineIdx}`}
          className="text-xs font-bold text-purple-600 dark:text-purple-400 uppercase tracking-wide mt-3 mb-1.5 flex items-center gap-1.5"
        >
          <Sparkles className="w-3 h-3" />
          <span>{parseInline(trimmed.slice(4))}</span>
        </h4>,
      );
      return;
    }

    if (trimmed.startsWith("## ")) {
      elements.push(
        <h3
          key={`h2-${lineIdx}`}
          className="text-sm font-bold text-zinc-900 dark:text-zinc-100 mt-3.5 mb-1.5 border-b border-zinc-200 dark:border-zinc-800 pb-1"
        >
          {parseInline(trimmed.slice(3))}
        </h3>,
      );
      return;
    }

    if (trimmed.startsWith("# ")) {
      elements.push(
        <h2
          key={`h1-${lineIdx}`}
          className="text-base font-extrabold text-zinc-900 dark:text-zinc-100 mt-4 mb-2"
        >
          {parseInline(trimmed.slice(2))}
        </h2>,
      );
      return;
    }

    // Blockquote
    if (trimmed.startsWith("> ")) {
      elements.push(
        <blockquote
          key={`quote-${lineIdx}`}
          className="pl-3 py-1 my-2 border-l-2 border-purple-500 bg-purple-50/50 dark:bg-purple-950/30 rounded-r-lg text-xs italic text-zinc-700 dark:text-zinc-300"
        >
          {parseInline(trimmed.slice(2))}
        </blockquote>,
      );
      return;
    }

    // Empty line
    if (trimmed === "") {
      elements.push(<div key={`space-${lineIdx}`} className="h-1.5" />);
      return;
    }

    // Regular paragraph
    elements.push(
      <p key={`p-${lineIdx}`} className="leading-relaxed my-1">
        {parseInline(line)}
      </p>,
    );
  });

  flushList();

  return (
    <div
      className={`text-xs text-zinc-800 dark:text-zinc-200 leading-relaxed break-words space-y-0.5 ${className}`}
    >
      {elements}
    </div>
  );
}
