import { Router } from "express";
import { requireAuth } from "../middleware/auth";
import Report from "../models/Report";
import Session from "../models/Session";
import Presentation from "../models/Presentation";
import * as reportService from "../services/reportService";
import { processReportJob } from "../services/reportService";
import { deleteFileFromAzure } from "../services/azure";
import { sendReportEmail } from "../services/email";

const router = Router();

// ── Trigger Report Generation Job ──
router.post(
  "/generate",
  requireAuth,
  async (req: any, res: any): Promise<void> => {
    try {
      const { sessionId, format, type, sendEmail } = req.body;

      if (!sessionId || !format) {
        res.status(400).json({
          message: "sessionId and format (pdf, csv, json) are required.",
        });
        return;
      }

      const session =
        await Session.findById(sessionId).populate("presentationId");
      if (!session) {
        res.status(404).json({ message: "Session not found" });
        return;
      }

      const presentation = session.presentationId as any;
      if (!presentation || presentation.owner?.toString() !== req.user.id) {
        res.status(403).json({
          message: "Access denied. You do not own this presentation session.",
        });
        return;
      }

      const title = presentation.title || "Session Report";

      const report = new Report({
        user: req.user.id,
        presentationId: session.presentationId,
        sessionId: session._id,
        title,
        type: type || "full",
        fileFormat: format,
        status: "PENDING",
      });

      await report.save();

      // Trigger async job
      processReportJob(report._id.toString()).catch((err) =>
        console.error("[ReportJob] Background processing failed:", err),
      );

      res.status(202).json({
        message: "Report generation started",
        reportId: report._id,
        status: report.status,
      });
    } catch (error) {
      console.error("Report generation trigger error:", error);
      res
        .status(500)
        .json({ message: "Failed to initialize report generation" });
    }
  },
);

// ── Generate Report for a Presentation directly (from presentations list) ──
router.post(
  "/presentation/:presentationId",
  requireAuth,
  async (req: any, res: any): Promise<void> => {
    try {
      const { presentationId } = req.params;
      const presentation = await Presentation.findById(presentationId);
      if (!presentation) {
        res.status(404).json({ message: "Presentation not found" });
        return;
      }

      if (presentation.owner?.toString() !== req.user.id) {
        res.status(403).json({ message: "Access denied" });
        return;
      }

      // Find the most recent session for this presentation
      let session = await Session.findOne({ presentationId }).sort({
        createdAt: -1,
      });

      // If no session exists, create a completed mock/snapshot session so report can be generated
      if (!session) {
        session = await Session.create({
          presentationId: presentation._id,
          hostSocketId: "manual-export",
          joinCode: Math.random().toString(36).substring(2, 8).toUpperCase(),
          status: "ended",
          startedAt: new Date(Date.now() - 30 * 60000),
          endedAt: new Date(),
          participants: [],
        });
      }

      const startTime = Date.now();
      const result = await reportService.generateAndSaveSessionReport(
        session._id.toString(),
      );

      const processingTimeMs = Date.now() - startTime;

      if (!result || !result.report) {
        res.status(500).json({ message: "Failed to generate report" });
        return;
      }

      res.json({
        message: "Report generated successfully",
        report: result.report,
        fileResource: result.fileResource,
        fileUrl: result.report.fileUrl,
        processingTimeMs,
      });
    } catch (error) {
      console.error("Generate presentation report error:", error);
      res.status(500).json({ message: "Failed to generate report" });
    }
  },
);

// ── List User Reports ──
router.get("/", requireAuth, async (req: any, res: any): Promise<void> => {
  try {
    const { sessionId, presentationId } = req.query;
    const filter: any = { user: req.user.id };

    if (sessionId) filter.sessionId = sessionId;
    if (presentationId) filter.presentationId = presentationId;

    const reports = await Report.find(filter).sort({ createdAt: -1 });
    res.json(reports);
  } catch (error) {
    console.error("List reports error:", error);
    res.status(500).json({ message: "Failed to retrieve reports" });
  }
});

// ── Get Single Report Status / Metadata ──
router.get("/:id", requireAuth, async (req: any, res: any): Promise<void> => {
  try {
    const report = await Report.findOne({
      _id: req.params.id,
      user: req.user.id,
    });
    if (!report) {
      res.status(404).json({ message: "Report not found" });
      return;
    }
    res.json(report);
  } catch (error) {
    console.error("Get report error:", error);
    res.status(500).json({ message: "Failed to get report" });
  }
});

// ── Send Report Email ──
router.post(
  "/:id/email",
  requireAuth,
  async (req: any, res: any): Promise<void> => {
    try {
      const report = await Report.findOne({
        _id: req.params.id,
        user: req.user.id,
      });
      if (!report || !report.fileUrl) {
        res.status(400).json({ message: "Report not ready or not found" });
        return;
      }

      await sendReportEmail(req.user.email, report.title, report.fileUrl);
      res.json({ message: "Report email sent successfully" });
    } catch (error) {
      console.error("Send report email error:", error);
      res.status(500).json({ message: "Failed to send report email" });
    }
  },
);

// ── Delete Report ──
router.delete(
  "/:id",
  requireAuth,
  async (req: any, res: any): Promise<void> => {
    try {
      const report = await Report.findOne({
        _id: req.params.id,
        user: req.user.id,
      });
      if (!report) {
        res.status(404).json({ message: "Report not found" });
        return;
      }

      if (report.fileUrl) {
        await deleteFileFromAzure("reports", report.fileUrl);
      }

      await Report.deleteOne({ _id: report._id });
      res.json({ message: "Report deleted" });
    } catch (error) {
      console.error("Delete report error:", error);
      res.status(500).json({ message: "Failed to delete report" });
    }
  },
);

export default router;
