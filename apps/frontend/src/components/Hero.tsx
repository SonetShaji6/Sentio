import Link from "next/link";
import { ArrowRight } from "lucide-react";

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
    <div className="relative overflow-hidden bg-white pt-[120px] pb-[100px] lg:pt-[150px]">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
        <h1 className="mx-auto max-w-4xl font-display text-5xl font-bold tracking-tight text-slate-900 sm:text-7xl">
          {title}
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg tracking-tight text-slate-700">
          {subtitle}
        </p>
        <div className="mt-10 flex justify-center gap-x-6">
          <Link
            href={primaryCtaLink}
            className="btn btn-primary px-8 py-3 text-base flex items-center gap-2 rounded-full"
          >
            {primaryCtaText} <ArrowRight className="w-4 h-4" />
          </Link>
          {secondaryCtaText && secondaryCtaLink && (
            <Link
              href={secondaryCtaLink}
              className="btn btn-secondary px-8 py-3 text-base rounded-full"
            >
              {secondaryCtaText}
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
