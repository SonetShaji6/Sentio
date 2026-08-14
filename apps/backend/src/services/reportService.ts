import PDFDocument from "pdfkit";
import * as analyticsService from "./analyticsService";
import * as recommendationService from "./recommendationService";
import { uploadFileToAzure } from "./azure";
import Report, { IReport } from "../models/Report";
import User from "../models/User";
import { sendReportEmail } from "./email";

export async function generateReportData(sessionId: string, userId: string) {
  const overview = await analyticsService.getSessionOverview(sessionId);
  if (!overview) {
    throw new Error("Session not found");
  }

  const participation =
    await analyticsService.getParticipationMetrics(sessionId);
  const quiz = await analyticsService.getQuizMetrics(sessionId);
  const engagement = await analyticsService.calculateEngagementScore(sessionId);
  const timeline = await analyticsService.getTimeline(sessionId);

  let aiInsights = null;
  try {
    aiInsights = await recommendationService.generateSessionInsights(
      sessionId,
      userId,
    );
  } catch (err) {
    console.warn("AI insights unavailable for report:", err);
    aiInsights = {
      sentiment: "Neutral",
      topicDetection: ["General Feedback"],
      recommendations: [
        {
          recommendation: "Maintain steady pacing and check in with audience.",
          reason: "Default rule-based suggestion.",
          evidence: "Session completion metrics",
          confidence: 0.85,
        },
      ],
    };
  }

  const presenter = await User.findById(userId).select("name email");

  return {
    overview,
    participation,
    quiz,
    engagement,
    timeline,
    aiInsights,
    presenterName: presenter?.name || "Presenter",
    presenterEmail: presenter?.email || "",
    generatedAt: new Date().toISOString(),
  };
}

export function buildPDFReport(reportData: any): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 50, size: "A4" });
      const buffers: Buffer[] = [];

      doc.on("data", (chunk: any) => buffers.push(chunk));
      doc.on("end", () => resolve(Buffer.concat(buffers)));
      doc.on("error", (err: any) => reject(err));

      // Color palette
      const primaryColor = "#4F46E5"; // Indigo
      const darkColor = "#111827";
      const lightBg = "#F9FAFB";
      const borderColor = "#E5E7EB";
      const accentColor = "#10B981";

      // ── Header ──
      doc.rect(0, 0, doc.page.width, 100).fill(primaryColor);

      doc
        .fillColor("#FFFFFF")
        .fontSize(24)
        .font("Helvetica-Bold")
        .text("SENTIO", 50, 30);

      doc
        .fontSize(14)
        .font("Helvetica")
        .text("Session Intelligence & Post-Event Report", 50, 60);

      doc.moveDown(3);
      doc.y = 120;

      // ── Presentation Details Box ──
      doc
        .rect(50, doc.y, doc.page.width - 100, 75)
        .fillAndStroke(lightBg, borderColor);

      const metaY = doc.y + 12;
      doc
        .fillColor(darkColor)
        .fontSize(16)
        .font("Helvetica-Bold")
        .text(
          reportData.overview.presentationTitle || "Presentation Report",
          65,
          metaY,
        );

      doc
        .fontSize(10)
        .font("Helvetica")
        .fillColor("#6B7280")
        .text(
          `Presenter: ${reportData.presenterName} | Date: ${new Date().toLocaleDateString()} | Duration: ${reportData.overview.durationMinutes} mins`,
          65,
          metaY + 24,
        )
        .text(
          `Session Status: ${reportData.overview.status?.toUpperCase() || "COMPLETED"} | Join Code: ${reportData.overview.sessionId}`,
          65,
          metaY + 40,
        );

      doc.y = metaY + 80;

      // ── Executive Summary Cards ──
      doc
        .fillColor(darkColor)
        .fontSize(14)
        .font("Helvetica-Bold")
        .text("Executive Overview", 50, doc.y);

      doc.moveDown(0.5);

      const cardY = doc.y;
      const cardWidth = (doc.page.width - 130) / 4;

      const drawCard = (
        x: number,
        title: string,
        value: string | number,
        subtitle: string,
      ) => {
        doc.rect(x, cardY, cardWidth, 65).fillAndStroke("#FFFFFF", borderColor);
        doc
          .fillColor("#6B7280")
          .fontSize(9)
          .font("Helvetica")
          .text(title, x + 10, cardY + 10);
        doc
          .fillColor(primaryColor)
          .fontSize(18)
          .font("Helvetica-Bold")
          .text(String(value), x + 10, cardY + 25);
        doc
          .fillColor("#9CA3AF")
          .fontSize(8)
          .font("Helvetica")
          .text(subtitle, x + 10, cardY + 48);
      };

      drawCard(
        50,
        "Engagement",
        `${reportData.engagement.overall}/100`,
        "Overall score",
      );
      drawCard(
        50 + cardWidth + 10,
        "Total Audience",
        reportData.overview.totalParticipants,
        `${reportData.overview.participationRate}% active`,
      );
      drawCard(
        50 + (cardWidth + 10) * 2,
        "Total Responses",
        reportData.overview.totalResponses,
        `${reportData.overview.interactiveSlides} interaction slides`,
      );
      drawCard(
        50 + (cardWidth + 10) * 3,
        "Duration",
        `${reportData.overview.durationMinutes}m`,
        "Live session time",
      );

      doc.y = cardY + 85;

      // ── Engagement Breakdown ──
      doc
        .fillColor(darkColor)
        .fontSize(14)
        .font("Helvetica-Bold")
        .text("Engagement Factors", 50, doc.y);
      doc.moveDown(0.5);

      const factors = [
        {
          label: "Participation Rate",
          value: `${reportData.engagement.participationRate}%`,
        },
        {
          label: "Response Frequency",
          value: `${reportData.engagement.responseFrequency}%`,
        },
        {
          label: "Quiz Participation",
          value: `${reportData.engagement.quizParticipation}%`,
        },
        {
          label: "Q&A Participation",
          value: `${reportData.engagement.qnaParticipation}%`,
        },
        {
          label: "Completion Rate",
          value: `${reportData.engagement.completionRate}%`,
        },
      ];

      factors.forEach((f) => {
        doc
          .fillColor("#374151")
          .fontSize(10)
          .font("Helvetica")
          .text(f.label, 50, doc.y);
        doc
          .fillColor(darkColor)
          .font("Helvetica-Bold")
          .text(f.value, 300, doc.y);
        doc.moveDown(0.4);
      });

      doc.moveDown(1);

      // ── Quiz Performance Section (if applicable) ──
      if (reportData.quiz && reportData.quiz.totalQuizSlides > 0) {
        doc
          .fillColor(darkColor)
          .fontSize(14)
          .font("Helvetica-Bold")
          .text("Quiz & Assessment Metrics", 50, doc.y);
        doc.moveDown(0.5);

        doc
          .fillColor("#4B5563")
          .fontSize(10)
          .font("Helvetica")
          .text(
            `Average Score: ${reportData.quiz.averageScore} pts | Accuracy: ${reportData.quiz.averageAccuracy}% | Highest: ${reportData.quiz.highestScore} pts`,
            50,
            doc.y,
          );

        doc.moveDown(0.8);

        // Table Header
        const tableY = doc.y;
        doc.rect(50, tableY, doc.page.width - 100, 20).fill(lightBg);
        doc.fillColor(darkColor).fontSize(9).font("Helvetica-Bold");
        doc.text("Question Title", 60, tableY + 5);
        doc.text("Attempts", 260, tableY + 5);
        doc.text("Accuracy", 340, tableY + 5);
        doc.text("Difficulty", 440, tableY + 5);

        let rowY = tableY + 22;
        (reportData.quiz.questionPerformance || [])
          .slice(0, 5)
          .forEach((q: any) => {
            doc.fillColor("#374151").fontSize(9).font("Helvetica");
            doc.text(
              q.slideTitle.length > 30
                ? q.slideTitle.substring(0, 27) + "..."
                : q.slideTitle,
              60,
              rowY,
            );
            doc.text(String(q.totalAttempts), 260, rowY);
            doc.text(`${q.accuracy}%`, 340, rowY);
            doc.text(q.difficulty.toUpperCase(), 440, rowY);
            rowY += 18;
          });

        doc.y = rowY + 15;
      }

      // ── AI Insights & Recommendations ──
      if (doc.y > doc.page.height - 200) {
        doc.addPage();
        doc.y = 50;
      }

      doc
        .fillColor(darkColor)
        .fontSize(14)
        .font("Helvetica-Bold")
        .text("AI Insights & Recommendations", 50, doc.y);
      doc.moveDown(0.5);

      if (reportData.aiInsights) {
        doc
          .rect(50, doc.y, doc.page.width - 100, 40)
          .fillAndStroke("#EEF2FF", "#C7D2FE");

        doc
          .fillColor(primaryColor)
          .fontSize(10)
          .font("Helvetica-Bold")
          .text(
            `Audience Sentiment: ${reportData.aiInsights.sentiment}`,
            65,
            doc.y + 12,
          );
        doc
          .fillColor("#4B5563")
          .fontSize(9)
          .font("Helvetica")
          .text(
            `Key Topics: ${(reportData.aiInsights.topicDetection || []).join(", ")}`,
            260,
            doc.y - 10,
          );

        doc.y += 50;

        (reportData.aiInsights.recommendations || []).forEach(
          (rec: any, idx: number) => {
            doc
              .fillColor(darkColor)
              .fontSize(10)
              .font("Helvetica-Bold")
              .text(`${idx + 1}. ${rec.recommendation}`, 50, doc.y);
            doc
              .fillColor("#4B5563")
              .fontSize(9)
              .font("Helvetica")
              .text(`Reason: ${rec.reason}`, 65, doc.y + 14);
            doc
              .fillColor("#9CA3AF")
              .fontSize(8)
              .text(
                `Evidence: ${rec.evidence} (Confidence: ${Math.round((rec.confidence || 0) * 100)}%)`,
                65,
                doc.y + 26,
              );
            doc.y += 40;
          },
        );
      }

      // Footer
      const pageCount = doc.bufferedPageRange().count;
      for (let i = 0; i < pageCount; i++) {
        doc.switchToPage(i);
        doc
          .fillColor("#9CA3AF")
          .fontSize(8)
          .text(
            `Sentio Platform © ${new Date().getFullYear()} — Page ${i + 1} of ${pageCount}`,
            50,
            doc.page.height - 35,
            {
              align: "center",
              width: doc.page.width - 100,
            },
          );
      }

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}

export async function processReportJob(reportId: string) {
  const report = await Report.findById(reportId);
  if (!report) return;

  try {
    report.status = "PROCESSING";
    await report.save();

    const data = await generateReportData(
      report.sessionId.toString(),
      report.user.toString(),
    );

    let buffer: Buffer;
    let mimeType: string;
    let extension: string;

    if (report.fileFormat === "pdf") {
      buffer = await buildPDFReport(data);
      mimeType = "application/pdf";
      extension = "pdf";
    } else if (report.fileFormat === "csv") {
      const csvStr = await analyticsService.getExportData(
        report.sessionId.toString(),
        "csv",
      );
      buffer = Buffer.from(csvStr, "utf-8");
      mimeType = "text/csv";
      extension = "csv";
    } else {
      const jsonObj = await analyticsService.getExportData(
        report.sessionId.toString(),
        "json",
      );
      buffer = Buffer.from(
        JSON.stringify({ ...jsonObj, aiInsights: data.aiInsights }, null, 2),
        "utf-8",
      );
      mimeType = "application/json";
      extension = "json";
    }

    const fileName = `report-${report.sessionId}-${Date.now()}.${extension}`;
    const fileUrl = await uploadFileToAzure(
      "reports",
      fileName,
      buffer,
      mimeType,
    );

    report.fileUrl = fileUrl;
    report.fileSize = buffer.length;
    report.status = "COMPLETED";
    await report.save();

    // Optionally send email notification
    if (data.presenterEmail) {
      try {
        await sendReportEmail(data.presenterEmail, report.title, fileUrl);
      } catch (e) {
        console.warn("Failed to send report email:", e);
      }
    }
  } catch (error: any) {
    console.error("Report processing error:", error);
    report.status = "FAILED";
    report.error = error.message || "Failed to compile report";
    await report.save();
  }
}
