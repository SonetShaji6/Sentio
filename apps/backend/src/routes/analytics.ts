import { Router } from "express";
import { requireAuth } from "../middleware/auth";
import Session from "../models/Session";
import Presentation from "../models/Presentation";
import * as analyticsService from "../services/analyticsService";

const router = Router();

// Helper to verify session ownership
async function verifySessionOwnership(
  sessionId: string,
  userId: string,
): Promise<{ session: any; error?: string }> {
  const session = await Session.findById(sessionId);
  if (!session) return { session: null, error: "Session not found" };

  const presentation = await Presentation.findById(session.presentationId);
  if (!presentation || presentation.owner.toString() !== userId) {
    return { session: null, error: "Access denied" };
  }

  return { session };
}

// ── Session Overview ──
router.get(
  "/sessions/:id/overview",
  requireAuth,
  async (req: any, res: any): Promise<void> => {
    try {
      const { error } = await verifySessionOwnership(
        req.params.id,
        req.user.id,
      );
      if (error) {
        res
          .status(error === "Access denied" ? 403 : 404)
          .json({ message: error });
        return;
      }

      const overview = await analyticsService.getSessionOverview(req.params.id);
      res.json(overview);
    } catch (err) {
      console.error("analytics overview error:", err);
      res.status(500).json({ message: "Failed to fetch analytics" });
    }
  },
);

// ── Participation Metrics ──
router.get(
  "/sessions/:id/participation",
  requireAuth,
  async (req: any, res: any): Promise<void> => {
    try {
      const { error } = await verifySessionOwnership(
        req.params.id,
        req.user.id,
      );
      if (error) {
        res
          .status(error === "Access denied" ? 403 : 404)
          .json({ message: error });
        return;
      }

      const metrics = await analyticsService.getParticipationMetrics(
        req.params.id,
      );
      res.json(metrics);
    } catch (err) {
      console.error("participation metrics error:", err);
      res.status(500).json({ message: "Failed to fetch metrics" });
    }
  },
);

// ── Quiz Metrics ──
router.get(
  "/sessions/:id/quiz",
  requireAuth,
  async (req: any, res: any): Promise<void> => {
    try {
      const { error } = await verifySessionOwnership(
        req.params.id,
        req.user.id,
      );
      if (error) {
        res
          .status(error === "Access denied" ? 403 : 404)
          .json({ message: error });
        return;
      }

      const metrics = await analyticsService.getQuizMetrics(req.params.id);
      res.json(metrics);
    } catch (err) {
      console.error("quiz metrics error:", err);
      res.status(500).json({ message: "Failed to fetch quiz metrics" });
    }
  },
);

// ── Engagement Score ──
router.get(
  "/sessions/:id/engagement",
  requireAuth,
  async (req: any, res: any): Promise<void> => {
    try {
      const { error } = await verifySessionOwnership(
        req.params.id,
        req.user.id,
      );
      if (error) {
        res
          .status(error === "Access denied" ? 403 : 404)
          .json({ message: error });
        return;
      }

      const engagement = await analyticsService.calculateEngagementScore(
        req.params.id,
      );
      res.json(engagement);
    } catch (err) {
      console.error("engagement score error:", err);
      res.status(500).json({ message: "Failed to calculate engagement" });
    }
  },
);

// ── Timeline ──
router.get(
  "/sessions/:id/timeline",
  requireAuth,
  async (req: any, res: any): Promise<void> => {
    try {
      const { error } = await verifySessionOwnership(
        req.params.id,
        req.user.id,
      );
      if (error) {
        res
          .status(error === "Access denied" ? 403 : 404)
          .json({ message: error });
        return;
      }

      const timeline = await analyticsService.getTimeline(req.params.id);
      res.json(timeline);
    } catch (err) {
      console.error("timeline error:", err);
      res.status(500).json({ message: "Failed to fetch timeline" });
    }
  },
);

// ── Word Cloud Frequencies ──
router.get(
  "/sessions/:id/wordcloud/:slideId",
  requireAuth,
  async (req: any, res: any): Promise<void> => {
    try {
      const { error } = await verifySessionOwnership(
        req.params.id,
        req.user.id,
      );
      if (error) {
        res
          .status(error === "Access denied" ? 403 : 404)
          .json({ message: error });
        return;
      }

      const { getWordCloudResults } =
        await import("../services/interactionService");
      const result = await getWordCloudResults(
        req.params.id,
        req.params.slideId,
      );
      res.json(result);
    } catch (err) {
      console.error("wordcloud analytics error:", err);
      res.status(500).json({ message: "Failed to fetch word cloud data" });
    }
  },
);

// ── Export ──
router.get(
  "/sessions/:id/export",
  requireAuth,
  async (req: any, res: any): Promise<void> => {
    try {
      const { error } = await verifySessionOwnership(
        req.params.id,
        req.user.id,
      );
      if (error) {
        res
          .status(error === "Access denied" ? 403 : 404)
          .json({ message: error });
        return;
      }

      const format = (req.query.format as string) === "csv" ? "csv" : "json";
      const data = await analyticsService.getExportData(req.params.id, format);

      if (format === "csv") {
        res.setHeader("Content-Type", "text/csv");
        res.setHeader(
          "Content-Disposition",
          `attachment; filename=sentio-session-${req.params.id}.csv`,
        );
        res.send(data);
      } else {
        res.setHeader("Content-Type", "application/json");
        res.setHeader(
          "Content-Disposition",
          `attachment; filename=sentio-session-${req.params.id}.json`,
        );
        res.json(data);
      }
    } catch (err) {
      console.error("export error:", err);
      res.status(500).json({ message: "Failed to export data" });
    }
  },
);

export default router;
