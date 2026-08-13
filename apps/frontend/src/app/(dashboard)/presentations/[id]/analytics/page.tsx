"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { getAccessToken, API_URL } from "@/lib/auth";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
} from "recharts";
import {
  ArrowLeft,
  Users,
  Activity,
  Award,
  Clock,
  Download,
  AlertCircle,
} from "lucide-react";
import Link from "next/link";
import AIInsightsPanel from "@/components/ai/AIInsightsPanel";
import ReportGeneratorModal from "@/components/reports/ReportGeneratorModal";
import ReportListPanel from "@/components/reports/ReportListPanel";

export default function AnalyticsDashboard() {
  const params = useParams();
  const router = useRouter();
  const presentationId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [sessions, setSessions] = useState<any[]>([]);
  const [selectedSessionId, setSelectedSessionId] = useState<string>("");
  const [overview, setOverview] = useState<any>(null);
  const [participation, setParticipation] = useState<any[]>([]);
  const [quiz, setQuiz] = useState<any>(null);
  const [engagement, setEngagement] = useState<any>(null);
  const [timeline, setTimeline] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);

  useEffect(() => {
    const fetchSessions = async () => {
      const token = getAccessToken();
      if (!token) return router.replace("/login");

      try {
        const res = await fetch(
          `${API_URL}/api/sessions/presentation/${presentationId}`,
          { headers: { Authorization: `Bearer ${token}` } },
        );
        if (res.ok) {
          const data = await res.json();
          setSessions(data);
          if (data.length > 0) {
            setSelectedSessionId(data[0]._id);
          } else {
            setLoading(false);
          }
        } else {
          setError("Failed to load sessions");
          setLoading(false);
        }
      } catch (err) {
        setError("Error connecting to server");
        setLoading(false);
      }
    };

    fetchSessions();
  }, [presentationId, router]);

  useEffect(() => {
    if (!selectedSessionId) return;

    const fetchAnalytics = async () => {
      setLoading(true);
      const token = getAccessToken();

      try {
        const [overviewRes, partRes, quizRes, engRes, timeRes] =
          await Promise.all([
            fetch(
              `${API_URL}/api/analytics/sessions/${selectedSessionId}/overview`,
              {
                headers: { Authorization: `Bearer ${token}` },
              },
            ),
            fetch(
              `${API_URL}/api/analytics/sessions/${selectedSessionId}/participation`,
              {
                headers: { Authorization: `Bearer ${token}` },
              },
            ),
            fetch(
              `${API_URL}/api/analytics/sessions/${selectedSessionId}/quiz`,
              {
                headers: { Authorization: `Bearer ${token}` },
              },
            ),
            fetch(
              `${API_URL}/api/analytics/sessions/${selectedSessionId}/engagement`,
              {
                headers: { Authorization: `Bearer ${token}` },
              },
            ),
            fetch(
              `${API_URL}/api/analytics/sessions/${selectedSessionId}/timeline`,
              {
                headers: { Authorization: `Bearer ${token}` },
              },
            ),
          ]);

        if (overviewRes.ok) setOverview(await overviewRes.json());
        if (partRes.ok) setParticipation(await partRes.json());
        if (quizRes.ok) setQuiz(await quizRes.json());
        if (engRes.ok) setEngagement(await engRes.json());
        if (timeRes.ok) {
          // Format timeline data for Recharts
          const rawTimeline = await timeRes.json();
          // Group by minute
          const grouped = new Map();
          rawTimeline.forEach((event: any) => {
            const time = new Date(event.timestamp).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            });
            if (!grouped.has(time)) {
              grouped.set(time, { time, responses: 0, joins: 0, qna: 0 });
            }
            const data = grouped.get(time);
            if (event.type === "response") data.responses += event.count;
            if (event.type === "join") data.joins += event.count;
            if (event.type === "qna") data.qna += event.count;
          });
          setTimeline(Array.from(grouped.values()));
        }
      } catch (err) {
        console.error("Failed to load analytics", err);
        setError("Failed to load complete analytics data");
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, [selectedSessionId]);

  const handleExport = (format: "csv" | "json") => {
    if (!selectedSessionId) return;
    const token = getAccessToken();

    // Create a temporary link to trigger download
    fetch(
      `${API_URL}/api/analytics/sessions/${selectedSessionId}/export?format=${format}`,
      {
        headers: { Authorization: `Bearer ${token}` },
      },
    )
      .then((res) => res.blob())
      .then((blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `sentio-session-${selectedSessionId}.${format}`;
        document.body.appendChild(a);
        a.click();
        a.remove();
      });
  };

  if (loading && sessions.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-950">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (sessions.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col p-8">
        <Link
          href={`/presentations/${presentationId}/edit`}
          className="flex items-center gap-2 text-gray-500 hover:text-gray-900 dark:hover:text-white w-fit mb-8"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Editor
        </Link>
        <div className="flex-1 flex flex-col items-center justify-center text-center max-w-md mx-auto">
          <Activity className="w-16 h-16 text-gray-300 dark:text-gray-700 mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            No Analytics Available
          </h2>
          <p className="text-gray-500 dark:text-gray-400">
            You need to host at least one live session of this presentation
            before analytics are generated.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-white pb-12">
      {/* Header */}
      <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href={`/presentations/${presentationId}/edit`}
              className="p-2 -ml-2 text-gray-500 hover:text-gray-900 dark:hover:text-white rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-xl font-bold">Analytics & Intelligence</h1>
              <p className="text-sm text-gray-500">
                {overview?.presentationTitle || "Presentation"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <select
              value={selectedSessionId}
              onChange={(e) => setSelectedSessionId(e.target.value)}
              className="px-4 py-2 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm font-medium outline-none focus:ring-2 focus:ring-blue-500"
            >
              {sessions.map((s) => (
                <option key={s._id} value={s._id}>
                  {new Date(s.createdAt).toLocaleDateString()} - {s.joinCode} (
                  {s.status})
                </option>
              ))}
            </select>

            <button
              onClick={() => setIsReportModalOpen(true)}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg text-sm transition-colors shadow-sm flex items-center gap-2"
            >
              <Download className="w-4 h-4" /> Generate Report
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
          <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-4 rounded-xl flex items-center gap-3">
            <AlertCircle className="w-5 h-5" />
            <p>{error}</p>
          </div>
        </div>
      )}

      {loading && !error ? (
        <div className="flex justify-center mt-20">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        overview && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8 space-y-8">
            {/* AI Insights Panel (Module 11) */}
            {selectedSessionId && (
              <AIInsightsPanel sessionId={selectedSessionId} />
            )}

            {/* Generated Reports Panel (Module 12) */}
            {selectedSessionId && (
              <ReportListPanel sessionId={selectedSessionId} />
            )}

            {/* Top Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm">
                <div className="flex items-center gap-3 text-gray-500 mb-2">
                  <Activity className="w-5 h-5 text-blue-500" />
                  <h3 className="font-medium">Engagement Score</h3>
                </div>
                <div className="flex items-end gap-2">
                  <span className="text-4xl font-bold text-gray-900 dark:text-white">
                    {engagement?.overall || 0}
                  </span>
                  <span className="text-gray-500 mb-1">/ 100</span>
                </div>
              </div>

              <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm">
                <div className="flex items-center gap-3 text-gray-500 mb-2">
                  <Users className="w-5 h-5 text-emerald-500" />
                  <h3 className="font-medium">Total Participants</h3>
                </div>
                <div className="flex items-end gap-2">
                  <span className="text-4xl font-bold text-gray-900 dark:text-white">
                    {overview.totalParticipants}
                  </span>
                </div>
                <p className="text-sm text-gray-500 mt-2">
                  {overview.activeParticipants} active (
                  {overview.participationRate}%)
                </p>
              </div>

              <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm">
                <div className="flex items-center gap-3 text-gray-500 mb-2">
                  <BarChart className="w-5 h-5 text-amber-500" />
                  <h3 className="font-medium">Total Responses</h3>
                </div>
                <div className="flex items-end gap-2">
                  <span className="text-4xl font-bold text-gray-900 dark:text-white">
                    {overview.totalResponses}
                  </span>
                </div>
                <p className="text-sm text-gray-500 mt-2">
                  Across {overview.interactiveSlides} interactive slides
                </p>
              </div>

              <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm">
                <div className="flex items-center gap-3 text-gray-500 mb-2">
                  <Clock className="w-5 h-5 text-violet-500" />
                  <h3 className="font-medium">Duration</h3>
                </div>
                <div className="flex items-end gap-2">
                  <span className="text-4xl font-bold text-gray-900 dark:text-white">
                    {overview.durationMinutes}
                  </span>
                  <span className="text-gray-500 mb-1">mins</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Timeline Chart */}
              <div className="lg:col-span-2 bg-white dark:bg-gray-900 p-6 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm">
                <h3 className="text-lg font-bold mb-6">Session Timeline</h3>
                <div className="h-72 w-full">
                  {timeline.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart
                        data={timeline}
                        margin={{ top: 5, right: 20, bottom: 5, left: 0 }}
                      >
                        <CartesianGrid
                          strokeDasharray="3 3"
                          stroke="#374151"
                          vertical={false}
                        />
                        <XAxis dataKey="time" stroke="#6b7280" />
                        <YAxis stroke="#6b7280" />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "#111827",
                            borderColor: "#374151",
                            color: "#fff",
                            borderRadius: "8px",
                          }}
                        />
                        <Line
                          type="monotone"
                          dataKey="responses"
                          stroke="#3b82f6"
                          strokeWidth={3}
                          dot={{ r: 4 }}
                          activeDot={{ r: 6 }}
                          name="Responses"
                        />
                        <Line
                          type="monotone"
                          dataKey="joins"
                          stroke="#10b981"
                          strokeWidth={2}
                          name="Joins"
                        />
                        <Line
                          type="monotone"
                          dataKey="qna"
                          stroke="#f59e0b"
                          strokeWidth={2}
                          name="Q&A"
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex items-center justify-center h-full text-gray-500">
                      Not enough data points yet
                    </div>
                  )}
                </div>
              </div>

              {/* Engagement Breakdown */}
              <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm">
                <h3 className="text-lg font-bold mb-6">Engagement Factors</h3>
                <div className="space-y-4">
                  <EngagementBar
                    label="Participation Rate"
                    value={engagement?.participationRate || 0}
                    color="bg-blue-500"
                  />
                  <EngagementBar
                    label="Response Frequency"
                    value={engagement?.responseFrequency || 0}
                    color="bg-emerald-500"
                  />
                  <EngagementBar
                    label="Quiz Participation"
                    value={engagement?.quizParticipation || 0}
                    color="bg-amber-500"
                  />
                  <EngagementBar
                    label="Q&A Participation"
                    value={engagement?.qnaParticipation || 0}
                    color="bg-rose-500"
                  />
                  <EngagementBar
                    label="Reaction Activity"
                    value={engagement?.reactionActivity || 0}
                    color="bg-violet-500"
                  />
                  <EngagementBar
                    label="Completion Rate"
                    value={engagement?.completionRate || 0}
                    color="bg-cyan-500"
                  />
                </div>
              </div>
            </div>

            {/* Quiz Performance (if applicable) */}
            {quiz && quiz.totalQuizSlides > 0 && (
              <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm">
                <div className="flex items-center gap-3 mb-6">
                  <Award className="w-6 h-6 text-amber-500" />
                  <h3 className="text-lg font-bold">Quiz Performance</h3>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                  <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
                    <div className="text-sm text-gray-500 mb-1">
                      Average Score
                    </div>
                    <div className="text-2xl font-bold">
                      {quiz.averageScore}
                    </div>
                  </div>
                  <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
                    <div className="text-sm text-gray-500 mb-1">
                      Highest Score
                    </div>
                    <div className="text-2xl font-bold">
                      {quiz.highestScore}
                    </div>
                  </div>
                  <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
                    <div className="text-sm text-gray-500 mb-1">Accuracy</div>
                    <div className="text-2xl font-bold text-emerald-500">
                      {quiz.averageAccuracy}%
                    </div>
                  </div>
                  <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
                    <div className="text-sm text-gray-500 mb-1">Avg Time</div>
                    <div className="text-2xl font-bold">
                      {(quiz.averageResponseTimeMs / 1000).toFixed(1)}s
                    </div>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="text-xs text-gray-500 uppercase bg-gray-50 dark:bg-gray-800/50">
                      <tr>
                        <th className="px-6 py-3 rounded-tl-lg">Question</th>
                        <th className="px-6 py-3">Attempts</th>
                        <th className="px-6 py-3">Correct</th>
                        <th className="px-6 py-3">Accuracy</th>
                        <th className="px-6 py-3 rounded-tr-lg">Difficulty</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(quiz.questionPerformance || []).map(
                        (q: any, i: number) => (
                          <tr
                            key={i}
                            className="border-b border-gray-100 dark:border-gray-800 last:border-0"
                          >
                            <td className="px-6 py-4 font-medium">
                              {q.slideTitle}
                            </td>
                            <td className="px-6 py-4">{q.totalAttempts}</td>
                            <td className="px-6 py-4 text-emerald-500 font-medium">
                              {q.correctCount}
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-2">
                                <span>{q.accuracy}%</span>
                                <div className="w-16 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full">
                                  <div
                                    className="h-full bg-blue-500 rounded-full"
                                    style={{ width: `${q.accuracy}%` }}
                                  />
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <span
                                className={`px-2 py-1 rounded text-xs font-medium ${
                                  q.difficulty === "hard"
                                    ? "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400"
                                    : q.difficulty === "easy"
                                      ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                                      : "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                                }`}
                              >
                                {q.difficulty.toUpperCase()}
                              </span>
                            </td>
                          </tr>
                        ),
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Slide Participation Chart */}
            {participation.length > 0 && (
              <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm">
                <h3 className="text-lg font-bold mb-6">
                  Participation by Slide
                </h3>
                <div className="h-80 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={participation}
                      layout="vertical"
                      margin={{ top: 5, right: 30, left: 40, bottom: 5 }}
                    >
                      <CartesianGrid
                        strokeDasharray="3 3"
                        horizontal={true}
                        vertical={false}
                        stroke="#374151"
                      />
                      <XAxis type="number" hide />
                      <YAxis
                        dataKey="slideTitle"
                        type="category"
                        stroke="#6b7280"
                        tick={{ fontSize: 12 }}
                        width={120}
                      />
                      <Tooltip
                        cursor={{ fill: "rgba(255, 255, 255, 0.05)" }}
                        contentStyle={{
                          backgroundColor: "#111827",
                          borderColor: "#374151",
                          color: "#fff",
                          borderRadius: "8px",
                        }}
                      />
                      <Bar
                        dataKey="responseCount"
                        name="Responses"
                        fill="#3b82f6"
                        radius={[0, 4, 4, 0]}
                        barSize={24}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}
          </div>
        )
      )}

      {selectedSessionId && (
        <ReportGeneratorModal
          isOpen={isReportModalOpen}
          onClose={() => setIsReportModalOpen(false)}
          sessionId={selectedSessionId}
          presentationTitle={
            overview?.presentationTitle || "Presentation Session"
          }
        />
      )}
    </div>
  );
}

function EngagementBar({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: string;
}) {
  return (
    <div>
      <div className="flex justify-between text-sm mb-1">
        <span className="text-gray-600 dark:text-gray-400">{label}</span>
        <span className="font-bold">{value}%</span>
      </div>
      <div className="h-2 w-full bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
        <div
          className={`h-full ${color} rounded-full transition-all duration-1000`}
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  );
}
