import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Hero } from "@/components/Hero";
import { FeatureCard } from "@/components/FeatureCard";
import { Testimonial } from "@/components/Testimonial";
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
  title: "Sentio - AI-Enhanced Audience Engagement",
  description:
    "Sentio empowers teams with secure, fast, and intelligent cloud dashboards and live audience engagement tools.",
};

export default function Home() {
  return (
    <div className="min-h-screen bg-white dark:bg-black text-zinc-900 dark:text-zinc-100 flex flex-col transition-colors">
      <Navbar />

      <main className="flex-grow">
        {/* Hero Section */}
        <Hero
          title="Intelligence that drives audience action"
          subtitle="Transform your raw data into structured dashboards and engage your audience in real-time. Sentio provides AI-powered tools for modern presentations."
          primaryCtaText="Get Started for Free"
          primaryCtaLink="/register"
          secondaryCtaText="See Features"
          secondaryCtaLink="/features"
        />

        {/* Product Overview / How it Works */}
        <section className="py-24 bg-zinc-50 dark:bg-zinc-950/60 border-b border-zinc-200/80 dark:border-zinc-900 transition-colors">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <h2 className="text-3xl font-extrabold tracking-tight text-zinc-950 dark:text-white sm:text-4xl">
                Engage audiences like never before
              </h2>
              <p className="mt-4 text-base sm:text-lg text-zinc-600 dark:text-zinc-400">
                Sentio enables presenters to create interactive sessions,
                collect live responses, and analyze audience sentiment in
                real-time using AI.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8 text-center">
              <div className="p-8 bg-white dark:bg-zinc-900/40 rounded-3xl border border-zinc-200/80 dark:border-zinc-800/80 shadow-sm">
                <div className="w-12 h-12 bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 rounded-2xl flex items-center justify-center mx-auto mb-5 text-lg font-black shadow-md">
                  1
                </div>
                <h3 className="text-xl font-bold text-zinc-950 dark:text-white mb-2">
                  Create
                </h3>
                <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
                  Build presentations and add interactive polls, quizzes, and
                  Q&A sessions in seconds.
                </p>
              </div>
              <div className="p-8 bg-white dark:bg-zinc-900/40 rounded-3xl border border-zinc-200/80 dark:border-zinc-800/80 shadow-sm">
                <div className="w-12 h-12 bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 rounded-2xl flex items-center justify-center mx-auto mb-5 text-lg font-black shadow-md">
                  2
                </div>
                <h3 className="text-xl font-bold text-zinc-950 dark:text-white mb-2">
                  Engage
                </h3>
                <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
                  Participants join your live session via a 6-digit code or QR
                  scan from any device without signing in.
                </p>
              </div>
              <div className="p-8 bg-white dark:bg-zinc-900/40 rounded-3xl border border-zinc-200/80 dark:border-zinc-800/80 shadow-sm">
                <div className="w-12 h-12 bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 rounded-2xl flex items-center justify-center mx-auto mb-5 text-lg font-black shadow-md">
                  3
                </div>
                <h3 className="text-xl font-bold text-zinc-950 dark:text-white mb-2">
                  Analyze
                </h3>
                <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
                  Get AI-generated insights and comprehensive reports on
                  audience engagement.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Features Grid */}
        <section className="py-24 bg-white dark:bg-black border-b border-zinc-200/80 dark:border-zinc-900 transition-colors">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-2xl mx-auto mb-16">
              <h2 className="text-3xl font-extrabold tracking-tight text-zinc-950 dark:text-white sm:text-4xl">
                Everything you need
              </h2>
              <p className="mt-4 text-base sm:text-lg text-zinc-600 dark:text-zinc-400">
                Powerful features designed for professional presenters,
                speakers, and educators.
              </p>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              <FeatureCard
                icon={<BarChart3 className="w-6 h-6" />}
                title="Live Polling"
                description="Create multiple-choice, word cloud, and open-ended polls that update instantly as your audience votes."
              />
              <FeatureCard
                icon={<Zap className="w-6 h-6" />}
                title="AI-Generated Quizzes"
                description="Turn any topic into an interactive quiz instantly with our AI assistant, saving hours of prep time."
              />
              <FeatureCard
                icon={<LineChart className="w-6 h-6" />}
                title="Audience Analytics"
                description="Track engagement levels, understand drop-off points, and measure comprehension in real-time."
              />
              <FeatureCard
                icon={<MessageSquare className="w-6 h-6" />}
                title="Interactive Q&A"
                description="Let your audience ask questions anonymously, upvote the best ones, and address them during your presentation."
              />
              <FeatureCard
                icon={<LayoutDashboard className="w-6 h-6" />}
                title="Real-Time Dashboards"
                description="Beautiful, responsive dashboards that present data clearly to both you and your audience."
              />
              <FeatureCard
                icon={<Users className="w-6 h-6" />}
                title="Role-Based Access"
                description="Securely manage permissions for administrators, presenters, and participants across your organization."
              />
            </div>
          </div>
        </section>

        {/* Testimonials */}
        <section className="py-24 bg-zinc-50 dark:bg-zinc-950/60 transition-colors">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-extrabold tracking-tight text-zinc-950 dark:text-white sm:text-4xl text-center mb-16">
              Loved by presenters everywhere
            </h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Testimonial
                quote="Sentio completely transformed how I run my weekly all-hands meetings. The AI quizzes alone save me hours."
                author="Sarah Jenkins"
                role="VP of Engineering"
                company="TechFlow"
                avatarUrl="https://api.dicebear.com/9.x/notionists/svg?seed=sarah"
              />
              <Testimonial
                quote="The real-time analytics let me know exactly when I'm losing the audience so I can pivot my presentation instantly."
                author="Marcus Chen"
                role="Professor"
                company="State University"
                avatarUrl="https://api.dicebear.com/9.x/notionists/svg?seed=marcus"
              />
              <Testimonial
                quote="As an event organizer, having a reliable, secure engagement platform is critical. Sentio delivers every time."
                author="Elena Rodriguez"
                role="Event Director"
                company="Global Summits"
                avatarUrl="https://api.dicebear.com/9.x/notionists/svg?seed=elena"
              />
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
