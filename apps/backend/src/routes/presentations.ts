import { Router, Request, Response } from "express";
import { requireAuth } from "../middleware/auth";
import Presentation from "../models/Presentation";
import Slide from "../models/Slide";
import { uploadFileToAzure, deleteFileFromAzure } from "../services/azure";
import multer from "multer";
import crypto from "crypto";
import { Types } from "mongoose";

const router = Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
});

// Helper to generate unique codes
const generateShareId = () => crypto.randomBytes(8).toString("hex");
const generateSessionCode = () =>
  Math.random().toString(36).substring(2, 8).toUpperCase();

// ── 1. Create Presentation ──
router.post("/", requireAuth, async (req: any, res: any): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { title, description, category, visibility, tags, theme } = req.body;

    const newPresentation = new Presentation({
      owner: userId,
      title: title || "Untitled Presentation",
      description: description || "",
      category: category || "General",
      visibility: visibility || "private",
      tags: tags || [],
      theme: theme || "default",
      shareId: generateShareId(),
      versionHistory: [],
    });

    await newPresentation.save();
    res.status(201).json(newPresentation);
  } catch (error) {
    console.error("Create presentation error:", error);
    res.status(500).json({ error: "Failed to create presentation" });
  }
});

// ── 2. List Presentations (with filters/pagination) ──
router.get("/", requireAuth, async (req: any, res: any): Promise<void> => {
  try {
    const userId = req.user!.id;
    const {
      search,
      status,
      category,
      page = "1",
      limit = "12",
      sort = "updatedAt",
    } = req.query;

    const query: any = { owner: userId, isDeleted: false };

    if (search) {
      query.title = { $regex: search as string, $options: "i" };
    }
    if (status) {
      query.status = status;
    }
    if (category) {
      query.category = category;
    }

    const sortOption: any = {};
    if (sort === "createdAt") sortOption.createdAt = -1;
    else if (sort === "alphabetical") sortOption.title = 1;
    else sortOption.updatedAt = -1; // default

    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

    const presentations = await Presentation.find(query)
      .sort(sortOption)
      .skip(skip)
      .limit(parseInt(limit as string));

    const total = await Presentation.countDocuments(query);

    res.json({
      presentations,
      pagination: {
        total,
        page: parseInt(page as string),
        pages: Math.ceil(total / parseInt(limit as string)),
      },
    });
  } catch (error) {
    console.error("List presentations error:", error);
    res.status(500).json({ error: "Failed to list presentations" });
  }
});

// ── 3. Get Single Presentation ──
router.get("/:id", requireAuth, async (req: any, res: any): Promise<void> => {
  try {
    const presentation = await Presentation.findOne({
      _id: req.params.id,
      owner: req.user!.id,
    });
    if (!presentation) {
      res.status(404).json({ error: "Presentation not found" });
      return;
    }
    res.json(presentation);
  } catch (error) {
    console.error("Get presentation error:", error);
    res.status(500).json({ error: "Failed to get presentation" });
  }
});

// ── 4. Update Presentation (Auto-save) ──
router.put("/:id", requireAuth, async (req: any, res: any): Promise<void> => {
  try {
    // Only allow specific fields to be updated
    const { title, description, category, visibility, tags, theme, status } =
      req.body;

    const updateData: any = {};
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (category !== undefined) updateData.category = category;
    if (visibility !== undefined) updateData.visibility = visibility;
    if (tags !== undefined) updateData.tags = tags;
    if (theme !== undefined) updateData.theme = theme;
    if (status !== undefined) updateData.status = status;

    const presentation = await Presentation.findOneAndUpdate(
      { _id: req.params.id, owner: req.user!.id, isDeleted: false },
      { $set: updateData },
      { new: true },
    );

    if (!presentation) {
      res.status(404).json({ error: "Presentation not found" });
      return;
    }
    res.json(presentation);
  } catch (error) {
    console.error("Update presentation error:", error);
    res.status(500).json({ error: "Failed to update presentation" });
  }
});

// ── 5. Soft Delete ──
router.delete(
  "/:id",
  requireAuth,
  async (req: any, res: any): Promise<void> => {
    try {
      const presentation = await Presentation.findOneAndUpdate(
        { _id: req.params.id, owner: req.user!.id },
        { isDeleted: true, deletedAt: new Date() },
        { new: true },
      );

      if (!presentation) {
        res.status(404).json({ error: "Presentation not found" });
        return;
      }
      res.json({ success: true, presentation });
    } catch (error) {
      console.error("Delete presentation error:", error);
      res.status(500).json({ error: "Failed to delete presentation" });
    }
  },
);

// ── 6. Duplicate ──
router.post(
  "/:id/duplicate",
  requireAuth,
  async (req: any, res: any): Promise<void> => {
    try {
      const original = await Presentation.findOne({
        _id: req.params.id,
        owner: req.user!.id,
      });
      if (!original) {
        res.status(404).json({ error: "Presentation not found" });
        return;
      }

      const duplicate = new Presentation({
        owner: req.user!.id,
        title: `${original.title} (Copy)`,
        description: original.description,
        category: original.category,
        visibility: "private", // Default to private for copies
        tags: original.tags,
        theme: original.theme,
        status: "draft", // Copies are drafts
        coverImage: original.coverImage,
        pdfUrl: original.pdfUrl,
        shareId: generateShareId(),
        versionHistory: [], // Do not copy history
      });

      await duplicate.save();
      res.status(201).json(duplicate);
    } catch (error) {
      console.error("Duplicate presentation error:", error);
      res.status(500).json({ error: "Failed to duplicate presentation" });
    }
  },
);

// ── 7. Restore ──
router.post(
  "/:id/restore",
  requireAuth,
  async (req: any, res: any): Promise<void> => {
    try {
      const presentation = await Presentation.findOneAndUpdate(
        { _id: req.params.id, owner: req.user!.id },
        { isDeleted: false, $unset: { deletedAt: "" } },
        { new: true },
      );

      if (!presentation) {
        res.status(404).json({ error: "Presentation not found" });
        return;
      }
      res.json({ success: true, presentation });
    } catch (error) {
      console.error("Restore presentation error:", error);
      res.status(500).json({ error: "Failed to restore presentation" });
    }
  },
);

// ── 8. Archive ──
router.post(
  "/:id/archive",
  requireAuth,
  async (req: any, res: any): Promise<void> => {
    try {
      const presentation = await Presentation.findOneAndUpdate(
        { _id: req.params.id, owner: req.user!.id, isDeleted: false },
        { status: "archived" },
        { new: true },
      );

      if (!presentation) {
        res.status(404).json({ error: "Presentation not found" });
        return;
      }
      res.json({ success: true, presentation });
    } catch (error) {
      console.error("Archive presentation error:", error);
      res.status(500).json({ error: "Failed to archive presentation" });
    }
  },
);

// ── 9. Upload Files (Cover Image, PDF) ──
router.post(
  "/:id/files",
  requireAuth,
  upload.single("file"),
  async (req: any, res: any): Promise<void> => {
    try {
      const fileType = req.body.type as "coverImage" | "pdf";
      if (!req.file || !["coverImage", "pdf"].includes(fileType)) {
        res.status(400).json({ error: "Invalid file or file type" });
        return;
      }

      const presentation = await Presentation.findOne({
        _id: req.params.id,
        owner: req.user!.id,
      });
      if (!presentation) {
        res.status(404).json({ error: "Presentation not found" });
        return;
      }

      const extension = req.file.mimetype.split("/")[1] || "bin";
      const fileName = `${presentation._id}-${fileType}-${Date.now()}.${extension}`;

      const fileUrl = await uploadFileToAzure(
        "presentations",
        fileName,
        req.file.buffer,
        req.file.mimetype,
      );

      // If there's an existing file, we could try to delete it from Azure here to save space
      const existingFile =
        fileType === "coverImage"
          ? presentation.coverImage
          : presentation.pdfUrl;
      if (existingFile) {
        await deleteFileFromAzure("presentations", existingFile);
      }

      if (fileType === "coverImage") {
        presentation.coverImage = fileUrl;
      } else {
        presentation.pdfUrl = fileUrl;
      }
      await presentation.save();

      res.json(presentation);
    } catch (error) {
      console.error("Upload file error:", error);
      res.status(500).json({ error: "Failed to upload file" });
    }
  },
);

// ── 10. Versions (Snapshot) ──
router.post(
  "/:id/versions",
  requireAuth,
  async (req: any, res: any): Promise<void> => {
    try {
      const presentation = await Presentation.findOne({
        _id: req.params.id,
        owner: req.user!.id,
      });
      if (!presentation) {
        res.status(404).json({ error: "Presentation not found" });
        return;
      }

      const slides = await Slide.find({
        presentationId: presentation._id,
      }).sort({ order: 1 });

      const newVersion = {
        versionId: `v-${Date.now()}`,
        createdAt: new Date(),
        title: presentation.title,
        description: presentation.description,
        contentSnapshot: {
          slides: slides,
        },
      };

      presentation.versionHistory.push(newVersion);
      await presentation.save();

      res.status(201).json(newVersion);
    } catch (error) {
      console.error("Create version error:", error);
      res.status(500).json({ error: "Failed to create version snapshot" });
    }
  },
);

// ════════════════════════════════════════════════════
//    SLIDES API
// ════════════════════════════════════════════════════

// ── 11. Get all slides for presentation ──
router.get(
  "/:id/slides",
  requireAuth,
  async (req: any, res: any): Promise<void> => {
    try {
      const presentation = await Presentation.findOne({
        _id: req.params.id,
        owner: req.user!.id,
      });
      if (!presentation) {
        res.status(404).json({ error: "Presentation not found" });
        return;
      }

      const slides = await Slide.find({
        presentationId: presentation._id,
      }).sort({ order: 1 });
      res.json(slides);
    } catch (error) {
      console.error("Get slides error:", error);
      res.status(500).json({ error: "Failed to get slides" });
    }
  },
);

// ── 12. Create slide ──
router.post(
  "/:id/slides",
  requireAuth,
  async (req: any, res: any): Promise<void> => {
    try {
      const presentation = await Presentation.findOne({
        _id: req.params.id,
        owner: req.user!.id,
      });
      if (!presentation) {
        res.status(404).json({ error: "Presentation not found" });
        return;
      }

      const { type, order, title, description, config } = req.body;

      let newOrder = order;
      if (newOrder === undefined) {
        const lastSlide = await Slide.findOne({
          presentationId: presentation._id,
        }).sort({ order: -1 });
        newOrder = lastSlide ? lastSlide.order + 1 : 0;
      }

      const slide = new Slide({
        presentationId: presentation._id,
        type: type || "title",
        order: newOrder,
        title: title || "",
        description: description || "",
        config: config || {},
      });

      await slide.save();
      res.status(201).json(slide);
    } catch (error) {
      console.error("Create slide error:", error);
      res.status(500).json({ error: "Failed to create slide" });
    }
  },
);

// ── 13. Reorder slides ──
router.put(
  "/:id/slides/reorder",
  requireAuth,
  async (req: any, res: any): Promise<void> => {
    try {
      const presentation = await Presentation.findOne({
        _id: req.params.id,
        owner: req.user!.id,
      });
      if (!presentation) {
        res.status(404).json({ error: "Presentation not found" });
        return;
      }

      const { slideIds } = req.body;
      if (!Array.isArray(slideIds)) {
        res.status(400).json({ error: "slideIds must be an array" });
        return;
      }

      const bulkOps = slideIds.map((slideId, index) => ({
        updateOne: {
          filter: { _id: slideId, presentationId: presentation._id },
          update: { $set: { order: index } },
        },
      }));

      if (bulkOps.length > 0) {
        await Slide.bulkWrite(bulkOps);
      }

      res.json({ success: true });
    } catch (error) {
      console.error("Reorder slides error:", error);
      res.status(500).json({ error: "Failed to reorder slides" });
    }
  },
);

// ── 14. Get single slide ──
router.get(
  "/:id/slides/:slideId",
  requireAuth,
  async (req: any, res: any): Promise<void> => {
    try {
      const presentation = await Presentation.findOne({
        _id: req.params.id,
        owner: req.user!.id,
      });
      if (!presentation) {
        res.status(404).json({ error: "Presentation not found" });
        return;
      }

      const slide = await Slide.findOne({
        _id: req.params.slideId,
        presentationId: presentation._id,
      });
      if (!slide) {
        res.status(404).json({ error: "Slide not found" });
        return;
      }

      res.json(slide);
    } catch (error) {
      console.error("Get slide error:", error);
      res.status(500).json({ error: "Failed to get slide" });
    }
  },
);

// ── 15. Update slide ──
router.put(
  "/:id/slides/:slideId",
  requireAuth,
  async (req: any, res: any): Promise<void> => {
    try {
      const presentation = await Presentation.findOne({
        _id: req.params.id,
        owner: req.user!.id,
      });
      if (!presentation) {
        res.status(404).json({ error: "Presentation not found" });
        return;
      }

      const { title, description, config, isHidden, isLocked, themeOverrides } =
        req.body;

      const updateData: any = {};
      if (title !== undefined) updateData.title = title;
      if (description !== undefined) updateData.description = description;
      if (config !== undefined) updateData.config = config;
      if (isHidden !== undefined) updateData.isHidden = isHidden;
      if (isLocked !== undefined) updateData.isLocked = isLocked;
      if (themeOverrides !== undefined)
        updateData.themeOverrides = themeOverrides;

      const slide = await Slide.findOneAndUpdate(
        { _id: req.params.slideId, presentationId: presentation._id },
        { $set: updateData },
        { new: true },
      );

      if (!slide) {
        res.status(404).json({ error: "Slide not found" });
        return;
      }

      res.json(slide);
    } catch (error) {
      console.error("Update slide error:", error);
      res.status(500).json({ error: "Failed to update slide" });
    }
  },
);

// ── 16. Delete slide ──
router.delete(
  "/:id/slides/:slideId",
  requireAuth,
  async (req: any, res: any): Promise<void> => {
    try {
      const presentation = await Presentation.findOne({
        _id: req.params.id,
        owner: req.user!.id,
      });
      if (!presentation) {
        res.status(404).json({ error: "Presentation not found" });
        return;
      }

      const slide = await Slide.findOneAndDelete({
        _id: req.params.slideId,
        presentationId: presentation._id,
      });
      if (!slide) {
        res.status(404).json({ error: "Slide not found" });
        return;
      }

      res.json({ success: true });
    } catch (error) {
      console.error("Delete slide error:", error);
      res.status(500).json({ error: "Failed to delete slide" });
    }
  },
);

// ── 17. Duplicate slide ──
router.post(
  "/:id/slides/:slideId/duplicate",
  requireAuth,
  async (req: any, res: any): Promise<void> => {
    try {
      const presentation = await Presentation.findOne({
        _id: req.params.id,
        owner: req.user!.id,
      });
      if (!presentation) {
        res.status(404).json({ error: "Presentation not found" });
        return;
      }

      const originalSlide = await Slide.findOne({
        _id: req.params.slideId,
        presentationId: presentation._id,
      });
      if (!originalSlide) {
        res.status(404).json({ error: "Slide not found" });
        return;
      }

      await Slide.updateMany(
        {
          presentationId: presentation._id,
          order: { $gt: originalSlide.order },
        },
        { $inc: { order: 1 } },
      );

      const duplicate = new Slide({
        presentationId: presentation._id,
        type: originalSlide.type,
        order: originalSlide.order + 1,
        title: `${originalSlide.title} (Copy)`,
        description: originalSlide.description,
        config: originalSlide.config,
        isHidden: originalSlide.isHidden,
        isLocked: false,
        themeOverrides: originalSlide.themeOverrides,
      });

      await duplicate.save();
      res.status(201).json(duplicate);
    } catch (error) {
      console.error("Duplicate slide error:", error);
      res.status(500).json({ error: "Failed to duplicate slide" });
    }
  },
);

// ── 18. Upload Slide Media ──
router.post(
  "/:id/slides/:slideId/image",
  requireAuth,
  upload.single("file"),
  async (req: any, res: any): Promise<void> => {
    try {
      if (!req.file) {
        res.status(400).json({ error: "No file provided" });
        return;
      }

      const presentation = await Presentation.findOne({
        _id: req.params.id,
        owner: req.user!.id,
      });
      if (!presentation) {
        res.status(404).json({ error: "Presentation not found" });
        return;
      }

      const slide = await Slide.findOne({
        _id: req.params.slideId,
        presentationId: presentation._id,
      });
      if (!slide) {
        res.status(404).json({ error: "Slide not found" });
        return;
      }

      const extension = req.file.mimetype.split("/")[1] || "bin";
      const fileName = `slide-${slide._id}-${Date.now()}.${extension}`;

      const fileUrl = await uploadFileToAzure(
        "presentations",
        fileName,
        req.file.buffer,
        req.file.mimetype,
      );

      res.json({ url: fileUrl });
    } catch (error) {
      console.error("Upload slide media error:", error);
      res.status(500).json({ error: "Failed to upload media" });
    }
  },
);

export default router;
