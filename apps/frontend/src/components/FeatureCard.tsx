import { type ReactNode } from "react";

interface FeatureCardProps {
  icon: ReactNode;
  title: string;
  description: string;
}

export function FeatureCard({ icon, title, description }: FeatureCardProps) {
  return (
    <div className="group relative flex flex-col items-start p-6 sm:p-8 bg-white dark:bg-[#10121a] rounded-3xl shadow-sm border border-zinc-200/80 dark:border-[#232838] transition-all hover:border-zinc-300 dark:hover:border-zinc-700 hover:shadow-md hover:-translate-y-0.5">
      <div className="inline-flex items-center justify-center rounded-2xl bg-zinc-100 dark:bg-[#171a24] p-3.5 text-zinc-900 dark:text-white mb-6 border border-zinc-200/60 dark:border-[#262b3a] group-hover:scale-105 transition-transform">
        {icon}
      </div>
      <h3 className="text-xl font-bold text-zinc-950 dark:text-white mb-2 tracking-tight">
        {title}
      </h3>
      <p className="text-zinc-600 dark:text-zinc-400 text-sm leading-relaxed">
        {description}
      </p>
    </div>
  );
}
