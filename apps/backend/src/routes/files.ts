import { Router } from "express";
import multer from "multer";
import { requireAuth } from "../middleware/auth";
import FileResource from "../models/FileResource";
import * as fileService from "../services/fileService";

const router = Router();

// Configure multer memory storage (25MB max)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 25 * 1024 * 1024 },
});

// ── Upload File ──
router.post(
  "/upload",
  requireAuth,
  upload.single("file"),
  async (req: any, res: any): Promise<void> => {
    try {
      if (!req.file) {
        res
          .status(400)
          .json({
            message: "No file provided in form-data ('file' key expected).",
          });
        return;
      }

      const { presentationId, category } = req.body;
      const fileDoc = await fileService.uploadAndProcessFile(
        req.user.id,
        req.file,
        {
          presentationId,
          category,
        },
      );

      res.status(201).json(fileDoc);
    } catch (error: any) {
      console.error("File upload route error:", error);
      res
        .status(400)
        .json({ message: error.message || "Failed to upload file" });
    }
  },
);

// ── List Files ──
router.get("/", requireAuth, async (req: any, res: any): Promise<void> => {
  try {
    const { presentationId, category } = req.query;
    const filter: any = { owner: req.user.id, isLatestVersion: true };

    if (presentationId) filter.presentationId = presentationId;
    if (category) filter.category = category;

    const files = await FileResource.find(filter).sort({ createdAt: -1 });
    res.json(files);
  } catch (error) {
    console.error("List files error:", error);
    res.status(500).json({ message: "Failed to retrieve files" });
  }
});

// ── Search Knowledge Base ──
router.get(
  "/search",
  requireAuth,
  async (req: any, res: any): Promise<void> => {
    try {
      const { q, presentationId } = req.query;
      const files = await fileService.searchKnowledgeBase(
        req.user.id,
        (q as string) || "",
        presentationId as string,
      );
      res.json(files);
    } catch (error) {
      console.error("Search files error:", error);
      res.status(500).json({ message: "Failed to search files" });
    }
  },
);

// ── Get File Details & Text Preview ──
router.get("/:id", requireAuth, async (req: any, res: any): Promise<void> => {
  try {
    const fileDoc = await FileResource.findOne({
      _id: req.params.id,
      owner: req.user.id,
    });
    if (!fileDoc) {
      res.status(404).json({ message: "File not found" });
      return;
    }
    res.json(fileDoc);
  } catch (error) {
    console.error("Get file error:", error);
    res.status(500).json({ message: "Failed to retrieve file details" });
  }
});

// ── Upload New Version ──
router.post(
  "/:id/version",
  requireAuth,
  upload.single("file"),
  async (req: any, res: any): Promise<void> => {
    try {
      if (!req.file) {
        res.status(400).json({ message: "No file provided" });
        return;
      }

      const newVersion = await fileService.createFileVersion(
        req.params.id,
        req.user.id,
        req.file,
      );
      res.status(201).json(newVersion);
    } catch (error: any) {
      console.error("Create version error:", error);
      res
        .status(400)
        .json({ message: error.message || "Failed to upload new version" });
    }
  },
);

// ── Get Version History ──
router.get(
  "/:id/versions",
  requireAuth,
  async (req: any, res: any): Promise<void> => {
    try {
      const fileDoc = await FileResource.findOne({
        _id: req.params.id,
        owner: req.user.id,
      });
      if (!fileDoc) {
        res.status(404).json({ message: "File not found" });
        return;
      }

      const rootId = fileDoc.parentFileId || fileDoc._id;
      const history = await FileResource.find({
        owner: req.user.id,
        $or: [{ _id: rootId }, { parentFileId: rootId }],
      }).sort({ version: -1 });

      res.json(history);
    } catch (error) {
      console.error("Version history error:", error);
      res.status(500).json({ message: "Failed to retrieve version history" });
    }
  },
);

// ── Delete File ──
router.delete(
  "/:id",
  requireAuth,
  async (req: any, res: any): Promise<void> => {
    try {
      await fileService.deleteFileResource(req.params.id, req.user.id);
      res.json({ message: "File deleted successfully" });
    } catch (error: any) {
      console.error("Delete file error:", error);
      res
        .status(400)
        .json({ message: error.message || "Failed to delete file" });
    }
  },
);

export default router;
