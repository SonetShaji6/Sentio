import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { FeatureCard } from "@/components/FeatureCard";
import {
  BarChart3,
  Users,
  Zap,
  LayoutDashboard,
  MessageSquare,
  LineChart,
} from "lucide-react";
import { Metadata } from "next";

export const metadata: Metadata = {
  title:
    "Features — Interactive Presentations, AI Quizzes & Live Audience Polling",
  description:
    "Explore Sentio features: AI slide generation, live audience polling, real-time Q&A, sentiment analytics, and seamless document-to-presentation conversions.",
  keywords: [
    "interactive presentation features",
    "AI quiz generator",
    "live polling tool",
    "audience engagement analytics",
    "real-time Q&A system",
  ],
  alternates: {
    canonical: "/features",
  },
};

export default function FeaturesPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-[#090a0f] text-zinc-900 dark:text-zinc-100 flex flex-col transition-colors">
      <Navbar />

      <main className="flex-grow py-20 sm:py-28 relative overflow-hidden">
        {/* Ambient Glow */}
        <div className="absolute top-12 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-indigo-500/5 dark:bg-indigo-500/10 rounded-full blur-[140px] pointer-events-none" />

        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h1 className="text-4xl font-black tracking-tight text-zinc-950 dark:text-white sm:text-5xl">
              Powerful tools for modern presenters
            </h1>
            <p className="mt-6 text-lg text-zinc-600 dark:text-zinc-400 leading-relaxed">
              Everything you need to engage, analyze, and understand your
              audience in real-time with AI-driven intelligence.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <FeatureCard
              icon={
                <BarChart3 className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
              }
              title="Live Polling"
              description="Create multiple-choice, word cloud, and open-ended polls that update instantly as your audience votes. Visualize responses in beautiful charts."
            />
            <FeatureCard
              icon={<Zap className="w-6 h-6 text-amber-500" />}
              title="AI-Generated Quizzes"
              description="Turn any topic or uploaded file into an interactive quiz instantly with our AI assistant. Sentio generates relevant questions automatically."
            />
            <FeatureCard
              icon={<LineChart className="w-6 h-6 text-emerald-500" />}
              title="Audience Analytics"
              description="Track engagement levels, understand drop-off points, and measure comprehension in real-time with comprehensive post-session reports."
            />
            <FeatureCard
              icon={<MessageSquare className="w-6 h-6 text-blue-500" />}
              title="Interactive Q&A"
              description="Let your audience ask questions anonymously, upvote the best ones, and address them live. Keep conversations structured."
            />
            <FeatureCard
              icon={<LayoutDashboard className="w-6 h-6 text-purple-500" />}
              title="Real-Time Dashboards"
              description="Minimalist, responsive dashboards that present data clearly to both you and your audience. Seamlessly match your brand."
            />
            <FeatureCard
              icon={<Users className="w-6 h-6 text-rose-500" />}
              title="Role-Based Access"
              description="Securely manage permissions for administrators, presenters, and participants. Ensure sensitive workspace data is protected."
            />
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
