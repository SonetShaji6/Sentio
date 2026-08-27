"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";

interface AccordionProps {
  items: { question: string; answer: string }[];
}

export function Accordion({ items }: AccordionProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggle = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <div className="w-full max-w-3xl mx-auto space-y-4">
      {items.map((item, index) => {
        const isOpen = openIndex === index;
        return (
          <div
            key={index}
            className={`border rounded-2xl overflow-hidden transition-all duration-200 ${
              isOpen
                ? "bg-white dark:bg-zinc-900/80 border-zinc-300 dark:border-zinc-700 shadow-md"
                : "bg-white/80 dark:bg-zinc-900/40 border-zinc-200/80 dark:border-zinc-800/80 hover:border-zinc-300 dark:hover:border-zinc-700"
            }`}
          >
            <button
              onClick={() => toggle(index)}
              className="w-full flex items-center justify-between p-5 sm:p-6 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 transition-colors"
              aria-expanded={isOpen}
            >
              <span className="font-bold text-zinc-950 dark:text-white text-base sm:text-lg pr-4">
                {item.question}
              </span>
              <div
                className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 transition-all ${
                  isOpen
                    ? "bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 rotate-180"
                    : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400"
                }`}
              >
                <ChevronDown className="w-4 h-4" />
              </div>
            </button>
            <div
              className={`transition-all duration-300 ease-in-out ${
                isOpen
                  ? "max-h-96 opacity-100 pb-6 px-5 sm:px-6"
                  : "max-h-0 opacity-0 px-5 sm:px-6"
              } overflow-hidden`}
            >
              <div className="text-zinc-600 dark:text-zinc-400 text-sm sm:text-base leading-relaxed border-t border-zinc-100 dark:border-zinc-800/80 pt-4">
                {item.answer}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
