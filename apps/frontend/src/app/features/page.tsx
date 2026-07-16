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
  title: "Features - Sentio",
  description:
    "Explore the powerful features of Sentio, designed to make your presentations interactive and engaging.",
};

export default function FeaturesPage() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar />

      <main className="flex-grow py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl">
              Powerful tools for modern presenters
            </h1>
            <p className="mt-6 text-xl text-gray-600">
              Everything you need to engage, analyze, and understand your
              audience in real-time.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <FeatureCard
              icon={<BarChart3 className="w-6 h-6" />}
              title="Live Polling"
              description="Create multiple-choice, word cloud, and open-ended polls that update instantly as your audience votes. Visualize responses in beautiful, customizable charts."
            />
            <FeatureCard
              icon={<Zap className="w-6 h-6" />}
              title="AI-Generated Quizzes"
              description="Turn any topic into an interactive quiz instantly with our AI assistant. Upload your presentation deck and let Sentio generate relevant questions automatically."
            />
            <FeatureCard
              icon={<LineChart className="w-6 h-6" />}
              title="Audience Analytics"
              description="Track engagement levels, understand drop-off points, and measure comprehension in real-time with comprehensive post-session reports."
            />
            <FeatureCard
              icon={<MessageSquare className="w-6 h-6" />}
              title="Interactive Q&A"
              description="Let your audience ask questions anonymously, upvote the best ones, and address them during your presentation. Keep the conversation organized."
            />
            <FeatureCard
              icon={<LayoutDashboard className="w-6 h-6" />}
              title="Real-Time Dashboards"
              description="Beautiful, responsive dashboards that present data clearly to both you and your audience. Customize the look and feel to match your brand."
            />
            <FeatureCard
              icon={<Users className="w-6 h-6" />}
              title="Role-Based Access"
              description="Securely manage permissions for administrators, presenters, and participants. Ensure sensitive data is only accessible to authorized personnel."
            />
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
