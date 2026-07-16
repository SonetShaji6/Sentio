import { type ReactNode } from "react";

interface FeatureCardProps {
  icon: ReactNode;
  title: string;
  description: string;
}

export function FeatureCard({ icon, title, description }: FeatureCardProps) {
  return (
    <div className="relative flex flex-col items-start p-6 bg-white rounded-2xl shadow-sm border border-gray-100 transition-all hover:shadow-md">
      <div className="inline-flex items-center justify-center rounded-xl bg-blue-50 p-3 text-blue-600 mb-5">
        {icon}
      </div>
      <h3 className="text-xl font-semibold text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-600 leading-relaxed">{description}</p>
    </div>
  );
}
