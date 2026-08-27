import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Sparkles, Target, Compass, Cpu } from "lucide-react";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "About Us - Sentio",
  description:
    "Learn about Sentio's mission to transform presentations from one-way broadcasts into interactive, data-driven conversations.",
};

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-slate-50/70 dark:bg-[#090a0f] text-slate-900 dark:text-slate-100 flex flex-col transition-colors">
      <Navbar />

      <main className="flex-grow py-20 sm:py-28 relative overflow-hidden">
        {/* Ambient Glow */}
        <div className="absolute top-12 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-indigo-500/5 dark:bg-indigo-500/10 rounded-full blur-[120px] pointer-events-none" />

        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 relative z-10 space-y-12">
          <div className="text-center max-w-2xl mx-auto">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-200 text-xs font-semibold mb-5 shadow-xs">
              <Sparkles className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
              <span>Our Mission & Vision</span>
            </div>
            <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-zinc-950 dark:text-white">
              Making Presentations Truly Conversational
            </h1>
            <p className="mt-4 text-base sm:text-lg text-zinc-600 dark:text-zinc-400 leading-relaxed">
              We believe the most memorable ideas are built together. Sentio
              turns passive lectures and meetings into collaborative, engaging
              moments.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 gap-6 pt-4">
            <div className="p-8 rounded-3xl bg-white dark:bg-zinc-900/60 border border-zinc-200/80 dark:border-zinc-800/80 shadow-xs space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 border border-indigo-200/60 dark:border-indigo-800/60 flex items-center justify-center">
                <Target className="w-6 h-6" />
              </div>
              <h2 className="text-xl font-bold text-zinc-950 dark:text-white">
                The Problem
              </h2>
              <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
                Traditional presentations are one-way monologues. Presenters
                struggle to gauge true comprehension, and feedback arrives too
                late to adjust.
              </p>
            </div>

            <div className="p-8 rounded-3xl bg-white dark:bg-zinc-900/60 border border-zinc-200/80 dark:border-zinc-800/80 shadow-xs space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/60 flex items-center justify-center">
                <Compass className="w-6 h-6" />
              </div>
              <h2 className="text-xl font-bold text-zinc-950 dark:text-white">
                The Sentio Solution
              </h2>
              <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
                We bridge the gap with real-time polling, AI-assisted quizzes,
                live Q&A, and sentiment analysis so speakers can adapt instantly
                on the fly.
              </p>
            </div>
          </div>

          <div className="p-8 sm:p-10 rounded-3xl bg-white dark:bg-zinc-900/60 border border-zinc-200/80 dark:border-zinc-800/80 shadow-xs space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border border-amber-200/60 dark:border-amber-800/60 flex items-center justify-center">
              <Cpu className="w-6 h-6" />
            </div>
            <h2 className="text-2xl font-bold text-zinc-950 dark:text-white">
              Engineered for Real-Time Reliability
            </h2>
            <p className="text-sm sm:text-base text-zinc-600 dark:text-zinc-400 leading-relaxed">
              Built on a high-performance stack with low-latency WebSockets,
              distributed clustering, and state-of-the-art generative AI models.
              Whether presenting to 10 colleagues or 10,000 conference
              attendees, Sentio delivers lightning-fast synchronization.
            </p>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
