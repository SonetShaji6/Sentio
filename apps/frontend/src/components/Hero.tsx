import Link from "next/link";
import { ArrowRight, Sparkles, ShieldCheck, Zap } from "lucide-react";
import { JoinCodeCard } from "./JoinCodeCard";

interface HeroProps {
  title: string;
  subtitle: string;
  primaryCtaText: string;
  primaryCtaLink: string;
  secondaryCtaText?: string;
  secondaryCtaLink?: string;
}

export function Hero({
  title,
  subtitle,
  primaryCtaText,
  primaryCtaLink,
  secondaryCtaText,
  secondaryCtaLink,
}: HeroProps) {
  return (
    <div className="relative overflow-hidden bg-white dark:bg-black pt-16 pb-20 lg:pt-24 lg:pb-32 border-b border-zinc-200/80 dark:border-zinc-900 transition-colors">
      {/* Subtle monochrome ambient light */}
      <div className="absolute top-0 left-1/3 w-[500px] h-[300px] bg-zinc-200/40 dark:bg-zinc-800/20 rounded-full blur-[120px] pointer-events-none" />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          {/* Left Column: Heading & Value Prop */}
          <div className="lg:col-span-7 text-center lg:text-left">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-200 text-xs font-semibold mb-6 shadow-sm">
              <Sparkles className="w-3.5 h-3.5 text-zinc-950 dark:text-white" />
              <span>Real-Time AI Audience Engagement Platform</span>
            </div>

            <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-zinc-950 dark:text-white leading-[1.08]">
              {title}
            </h1>

            <p className="mt-6 text-lg sm:text-xl text-zinc-600 dark:text-zinc-400 max-w-2xl leading-relaxed">
              {subtitle}
            </p>

            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
              <Link
                href={primaryCtaLink}
                className="w-full sm:w-auto px-8 py-3.5 bg-zinc-950 hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-200 text-white dark:text-zinc-950 font-bold rounded-2xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-black/10 dark:shadow-white/5 hover:scale-[1.02]"
              >
                <span>{primaryCtaText}</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              {secondaryCtaText && secondaryCtaLink && (
                <Link
                  href={secondaryCtaLink}
                  className="w-full sm:w-auto px-6 py-3.5 bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-850 text-zinc-900 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-800 font-semibold rounded-2xl transition-all text-center"
                >
                  {secondaryCtaText}
                </Link>
              )}
            </div>

            {/* Feature bullets */}
            <div className="mt-10 pt-8 border-t border-zinc-100 dark:border-zinc-900 grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs font-medium text-zinc-500 dark:text-zinc-400">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-zinc-900 dark:text-white" />
                <span>Zero app install</span>
              </div>
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-zinc-900 dark:text-white" />
                <span>No sign-in to join</span>
              </div>
              <div className="flex items-center gap-2 col-span-2 sm:col-span-1">
                <Sparkles className="w-4 h-4 text-zinc-900 dark:text-white" />
                <span>Sub-50ms live sync</span>
              </div>
            </div>
          </div>

          {/* Right Column: Interactive Join / Scan Widget */}
          <div className="lg:col-span-5">
            <JoinCodeCard />
          </div>
        </div>
      </div>
    </div>
  );
}
