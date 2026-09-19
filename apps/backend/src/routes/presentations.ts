import { Router, Request, Response } from "express";
import { requireAuth } from "../middleware/auth";
import Presentation from "../models/Presentation";
import Slide from "../models/Slide";
import Session from "../models/Session";
import Report from "../models/Report";
import OrganizationMember from "../models/OrganizationMember";
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

// Helper to escape regex characters
function escapeRegex(text: string) {
  return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
}

// Helper to check user access to a presentation (either as owner or through organization membership)
async function getAccessiblePresentation(id: string, userId: string) {
  const userMemberships = await OrganizationMember.find({ user: userId });
  const orgIds = userMemberships.map((m) => m.organization);

  return Presentation.findOne({
    _id: id,
    isDeleted: false,
    $or: [{ owner: userId }, { organization: { $in: orgIds } }],
  });
}

// Helper to check duplicate presentation title in the scope (owner personal or organization)
async function isTitleDuplicate(
  title: string,
  ownerId: string,
  organizationId?: string,
  excludePresentationId?: string,
): Promise<boolean> {
  const trimmed = title.trim();
  if (!trimmed) return false;

  const query: any = {
    title: { $regex: new RegExp(`^${escapeRegex(trimmed)}$`, "i") },
    isDeleted: false,
  };

  if (excludePresentationId) {
    query._id = { $ne: excludePresentationId };
  }

  if (organizationId) {
    query.organization = organizationId;
  } else {
    query.owner = ownerId;
  }

  const existing = await Presentation.findOne(query);
  return !!existing;
}

// Helper to find the next available untitled name
async function getNextUntitledName(
  ownerId: string,
  organizationId?: string,
): Promise<string> {
  const base = "Untitled Presentation";
  if (!(await isTitleDuplicate(base, ownerId, organizationId))) {
    return base;
  }
  let count = 2;
  while (await isTitleDuplicate(`${base} ${count}`, ownerId, organizationId)) {
    count++;
  }
  return `${base} ${count}`;
}

// ── 1. Create Presentation ──
router.post("/", requireAuth, async (req: any, res: any): Promise<void> => {
  try {
    const userId = req.user!.id;
    const {
      title,
      description,
      category,
      visibility,
      tags,
      theme,
      organizationId,
    } = req.body;

    let finalTitle = (title || "").trim();

    if (!finalTitle || finalTitle.toLowerCase() === "untitled presentation") {
      finalTitle = await getNextUntitledName(userId, organizationId);
    } else {
      const isDuplicate = await isTitleDuplicate(
        finalTitle,
        userId,
        organizationId,
      );
      if (isDuplicate) {
        res
          .status(400)
          .json({ error: "A presentation with this name already exists" });
        return;
      }
    }

    const newPresentation = new Presentation({
      owner: userId,
      organization: organizationId || undefined,
      title: finalTitle,
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
      organizationId,
      page = "1",
      limit = "12",
      sort = "updatedAt",
    } = req.query;

    const userMemberships = await OrganizationMember.find({ user: userId });
    const orgIds = userMemberships.map((m) => m.organization);

    const query: any = { isDeleted: false };

    if (organizationId) {
      query.organization = organizationId;
    } else {
      query.$or = [{ owner: userId }, { organization: { $in: orgIds } }];
    }

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
      .populate("organization", "name slug")
      .populate("owner", "name email avatar")
      .sort(sortOption)
      .skip(skip)
      .limit(parseInt(limit as string));

    const total = await Presentation.countDocuments(query);
    const presIds = presentations.map((p) => p._id);

    // Fetch slide preview info (first 8 slides per presentation)
    const slides = await Slide.find({
      presentationId: { $in: presIds },
    })
      .select("_id presentationId type order title isHidden themeOverrides")
      .sort({ order: 1 });

    // Fetch session stats for each presentation
    const sessions = await Session.find({
      presentationId: { $in: presIds },
    })
      .select(
        "_id presentationId status joinCode participants startedAt endedAt createdAt",
      )
      .sort({ createdAt: -1 });

    const slidesByPresId: Record<string, any[]> = {};
    for (const slide of slides) {
      const pid = slide.presentationId.toString();
      if (!slidesByPresId[pid]) slidesByPresId[pid] = [];
      slidesByPresId[pid].push(slide);
    }

    const sessionsByPresId: Record<string, any[]> = {};
    for (const sess of sessions) {
      const pid = sess.presentationId ? sess.presentationId.toString() : "";
      if (!pid) continue;
      if (!sessionsByPresId[pid]) sessionsByPresId[pid] = [];
      sessionsByPresId[pid].push(sess);
    }

    const enrichedPresentations = presentations.map((p) => {
      const pObj = p.toObject();
      const pSlides = slidesByPresId[p._id.toString()] || [];
      const pSessions = sessionsByPresId[p._id.toString()] || [];
      const liveSession = pSessions.find((s) => s.status === "live");
      const totalParticipants = pSessions.reduce(
        (acc, s) => acc + (s.participants?.length || 0),
        0,
      );

      return {
        ...pObj,
        slideCount: pSlides.length,
        previewSlides: pSlides.slice(0, 8),
        sessionsCount: pSessions.length,
        totalParticipants,
        liveSession: liveSession
          ? {
              _id: liveSession._id,
              joinCode: liveSession.joinCode,
              participantsCount: liveSession.participants?.length || 0,
            }
          : null,
        recentSession: pSessions[0]
          ? {
              _id: pSessions[0]._id,
              joinCode: pSessions[0].joinCode,
              status: pSessions[0].status,
              createdAt: pSessions[0].createdAt,
              participantsCount: pSessions[0].participants?.length || 0,
            }
          : null,
      };
    });

    res.json({
      presentations: enrichedPresentations,
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

// ── 2b. Get Presentation Activity Timeline ──
router.get(
  "/:id/timeline",
  requireAuth,
  async (req: any, res: any): Promise<void> => {
    try {
      const presentation = await getAccessiblePresentation(
        req.params.id,
        req.user!.id,
      );
      if (!presentation) {
        res.status(404).json({ error: "Presentation not found" });
        return;
      }

      const [slides, sessions, reports] = await Promise.all([
        Slide.find({ presentationId: presentation._id })
          .select("_id title type order createdAt updatedAt")
          .sort({ order: 1 }),
        Session.find({ presentationId: presentation._id })
          .select(
            "_id status joinCode participants startedAt endedAt createdAt updatedAt",
          )
          .sort({ createdAt: -1 }),
        Report.find({ presentationId: presentation._id })
          .select("_id title type status fileFormat fileUrl createdAt")
          .sort({ createdAt: -1 }),
      ]);

      const events: any[] = [];

      // 1. Deck Created Event
      events.push({
        id: `created-${presentation._id}`,
        type: "created",
        title: "Presentation Created",
        description: `Deck initialized with title "${presentation.title}"`,
        timestamp: presentation.createdAt,
        badge: "Created",
        meta: {
          category: presentation.category,
          visibility: presentation.visibility,
        },
      });

      // 2. Version Snapshots
      if (
        presentation.versionHistory &&
        presentation.versionHistory.length > 0
      ) {
        presentation.versionHistory.forEach((v: any, index: number) => {
          events.push({
            id: `version-${v.versionId || index}`,
            type: "version",
            title: `Milestone Snapshot: ${v.title || "Version Snapshot"}`,
            description: v.changeReason || "Milestone version captured",
            timestamp: v.createdAt || presentation.updatedAt,
            badge: "Version Snapshot",
            meta: {
              versionId: v.versionId,
              slidesCount: v.contentSnapshot?.slides?.length || 0,
            },
          });
        });
      }

      // 3. Live Sessions Hosted
      sessions.forEach((s: any) => {
        const durationMin =
          s.startedAt && s.endedAt
            ? Math.max(
                1,
                Math.round(
                  (new Date(s.endedAt).getTime() -
                    new Date(s.startedAt).getTime()) /
                    60000,
                ),
              )
            : null;

        events.push({
          id: `session-${s._id}`,
          type: "session",
          title:
            s.status === "live"
              ? "Live Session in Progress"
              : s.status === "ended"
                ? "Live Presentation Concluded"
                : "Presentation Session Hosted",
          description: `Room: ${s.joinCode} • ${s.participants?.length || 0} participants joined`,
          timestamp: s.startedAt || s.createdAt,
          badge: s.status === "live" ? "Live Now" : "Session Run",
          status: s.status,
          meta: {
            sessionId: s._id,
            joinCode: s.joinCode,
            participantsCount: s.participants?.length || 0,
            durationMin,
            status: s.status,
          },
        });
      });

      // 4. Intelligence Reports
      reports.forEach((r: any) => {
        events.push({
          id: `report-${r._id}`,
          type: "report",
          title: `Session Report Compiled (${r.fileFormat?.toUpperCase() || "PDF"})`,
          description:
            r.title || "Session analytics & engagement summary generated",
          timestamp: r.createdAt,
          badge: "Report",
          status: r.status,
          meta: {
            reportId: r._id,
            fileUrl: r.fileUrl,
            fileFormat: r.fileFormat,
            status: r.status,
          },
        });
      });

      // 5. Recent Modification Event
      if (
        new Date(presentation.updatedAt).getTime() -
          new Date(presentation.createdAt).getTime() >
        120000
      ) {
        events.push({
          id: `updated-${presentation._id}`,
          type: "updated",
          title: "Content & Slides Updated",
          description: `Last modified and saved with latest slide configurations`,
          timestamp: presentation.updatedAt,
          badge: "Saved",
        });
      }

      // Sort newest first
      events.sort(
        (a, b) =>
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
      );

      res.json({
        presentation: {
          _id: presentation._id,
          title: presentation.title,
          description: presentation.description,
          status: presentation.status,
          category: presentation.category,
          visibility: presentation.visibility,
          coverImage: presentation.coverImage,
          createdAt: presentation.createdAt,
          updatedAt: presentation.updatedAt,
        },
        stats: {
          slidesCount: slides.length,
          sessionsCount: sessions.length,
          participantsCount: sessions.reduce(
            (acc, s) => acc + (s.participants?.length || 0),
            0,
          ),
          reportsCount: reports.length,
          versionsCount: presentation.versionHistory?.length || 0,
        },
        slides: slides.map((s) => ({
          _id: s._id,
          order: s.order,
          type: s.type,
          title: s.title,
        })),
        events,
      });
    } catch (error) {
      console.error("Get presentation timeline error:", error);
      res.status(500).json({ error: "Failed to get presentation timeline" });
    }
  },
);

// ── 3. Get Single Presentation ──
router.get("/:id", requireAuth, async (req: any, res: any): Promise<void> => {
  try {
    const presentation = await getAccessiblePresentation(
      req.params.id,
      req.user!.id,
    );
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
    const presentation = await getAccessiblePresentation(
      req.params.id,
      req.user!.id,
    );
    if (!presentation) {
      res.status(404).json({ error: "Presentation not found" });
      return;
    }

    // Only allow specific fields to be updated
    const {
      title,
      description,
      category,
      visibility,
      tags,
      theme,
      status,
      organizationId,
    } = req.body;

    if (title !== undefined) {
      const trimmedTitle = title.trim();
      if (!trimmedTitle) {
        res.status(400).json({ error: "Presentation title cannot be empty" });
        return;
      }

      if (trimmedTitle.toLowerCase() !== presentation.title.toLowerCase()) {
        const isDuplicate = await isTitleDuplicate(
          trimmedTitle,
          presentation.owner.toString(),
          organizationId !== undefined
            ? organizationId
            : presentation.organization?.toString(),
          presentation._id.toString(),
        );

        if (isDuplicate) {
          res
            .status(400)
            .json({ error: "A presentation with this name already exists" });
          return;
        }
      }
      presentation.title = trimmedTitle;
    }

    if (description !== undefined) presentation.description = description;
    if (category !== undefined) presentation.category = category;
    if (visibility !== undefined) presentation.visibility = visibility;
    if (tags !== undefined) presentation.tags = tags;
    if (theme !== undefined) presentation.theme = theme;
    if (status !== undefined) presentation.status = status;
    if (organizationId !== undefined)
      presentation.organization = organizationId || undefined;

    await presentation.save();
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
      const user = req.user!;
      const presentation = await Presentation.findOne({
        _id: req.params.id,
        isDeleted: false,
      });

      if (!presentation) {
        res.status(404).json({ error: "Presentation not found" });
        return;
      }

      let canDelete = false;
      if (user.role === "admin" || presentation.owner.toString() === user.id) {
        canDelete = true;
      } else if (presentation.organization) {
        const membership = await OrganizationMember.findOne({
          organization: presentation.organization,
          user: user.id,
          role: { $in: ["owner", "admin"] },
        });
        if (membership) canDelete = true;
      }

      if (!canDelete) {
        res
          .status(403)
          .json({ error: "Permission denied to delete this presentation" });
        return;
      }

      presentation.isDeleted = true;
      presentation.deletedAt = new Date();
      await presentation.save();

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

      let copyTitle = `${original.title} (Copy)`;
      let copyCount = 2;
      while (
        await isTitleDuplicate(
          copyTitle,
          req.user!.id,
          original.organization?.toString(),
        )
      ) {
        copyTitle = `${original.title} (Copy ${copyCount})`;
        copyCount++;
      }

      const duplicate = new Presentation({
        owner: req.user!.id,
        organization: original.organization,
        title: copyTitle,
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

      // Duplicate slides
      const originalSlides = await Slide.find({
        presentationId: original._id,
      }).sort({ order: 1 });

      const duplicatedSlides = originalSlides.map((slide) => ({
        presentationId: duplicate._id,
        type: slide.type,
        order: slide.order,
        title: slide.title,
        description: slide.description,
        config: slide.config,
        isHidden: slide.isHidden,
        isLocked: false, // Unlock duplicated slides by default
        themeOverrides: slide.themeOverrides,
      }));

      if (duplicatedSlides.length > 0) {
        await Slide.insertMany(duplicatedSlides);
      }

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
        { returnDocument: "after" },
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
        { returnDocument: "after" },
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

      const { changeReason } = req.body;

      const newVersion = {
        versionId: `v-${Date.now()}`,
        createdAt: new Date(),
        title: presentation.title,
        description: presentation.description,
        contentSnapshot: {
          slides: slides,
        },
        user: req.user!.id,
        changeReason: changeReason || "Manual snapshot",
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

// ── 10a. Get Versions ──
router.get(
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

      // Return history sorted by newest first
      const history = [...presentation.versionHistory].sort(
        (a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
      );

      res.json(history);
    } catch (error) {
      console.error("Get versions error:", error);
      res.status(500).json({ error: "Failed to get version history" });
    }
  },
);

// ── 10b. Restore Version ──
router.post(
  "/:id/versions/:versionId/restore",
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

      const version = presentation.versionHistory.find(
        (v) => v.versionId === req.params.versionId,
      );

      if (!version) {
        res.status(404).json({ error: "Version not found" });
        return;
      }

      // Delete existing slides
      await Slide.deleteMany({ presentationId: presentation._id });

      // Recreate slides from snapshot
      const snapshotSlides = version.contentSnapshot?.slides || [];
      const restoredSlides = snapshotSlides.map((slide: any) => {
        // Exclude _id to let mongo generate new ones
        const { _id, createdAt, updatedAt, ...rest } = slide;
        return {
          ...rest,
          presentationId: presentation._id,
        };
      });

      if (restoredSlides.length > 0) {
        await Slide.insertMany(restoredSlides);
      }

      // Restore metadata
      presentation.title = version.title;
      presentation.description = version.description;
      await presentation.save();

      res.json({ success: true, presentation });
    } catch (error) {
      console.error("Restore version error:", error);
      res.status(500).json({ error: "Failed to restore version" });
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
      const presentation = await getAccessiblePresentation(
        req.params.id,
        req.user!.id,
      );
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
      const presentation = await getAccessiblePresentation(
        req.params.id,
        req.user!.id,
      );
      if (!presentation) {
        res.status(404).json({ error: "Presentation not found" });
        return;
      }

      const { type, order, title, description, config } = req.body;

      let newOrder = order;
      if (newOrder === undefined || newOrder === null) {
        const lastSlide = await Slide.findOne({
          presentationId: presentation._id,
        }).sort({ order: -1 });
        newOrder = lastSlide ? lastSlide.order + 1 : 0;
      } else {
        newOrder = Number(newOrder);
        // Shift existing slides at or after this position
        await Slide.updateMany(
          {
            presentationId: presentation._id,
            order: { $gte: newOrder },
          },
          { $inc: { order: 1 } },
        );
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
      const presentation = await getAccessiblePresentation(
        req.params.id,
        req.user!.id,
      );
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
      const presentation = await getAccessiblePresentation(
        req.params.id,
        req.user!.id,
      );
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
      const presentation = await getAccessiblePresentation(
        req.params.id,
        req.user!.id,
      );
      if (!presentation) {
        res.status(404).json({ error: "Presentation not found" });
        return;
      }

      const existingSlide = await Slide.findOne({
        _id: req.params.slideId,
        presentationId: presentation._id,
      });

      if (!existingSlide) {
        res.status(404).json({ error: "Slide not found" });
        return;
      }

      const { title, description, config, isHidden, isLocked, themeOverrides } =
        req.body;

      // If slide is locked, only allow unlocking
      if (existingSlide.isLocked && isLocked !== false) {
        res.status(403).json({ error: "Slide is locked and cannot be edited" });
        return;
      }

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
        { returnDocument: "after" },
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
      const presentation = await getAccessiblePresentation(
        req.params.id,
        req.user!.id,
      );
      if (!presentation) {
        res.status(404).json({ error: "Presentation not found" });
        return;
      }

      const existingSlide = await Slide.findOne({
        _id: req.params.slideId,
        presentationId: presentation._id,
      });

      if (!existingSlide) {
        res.status(404).json({ error: "Slide not found" });
        return;
      }

      if (existingSlide.isLocked) {
        res.status(403).json({ error: "Cannot delete a locked slide" });
        return;
      }

      await Slide.deleteOne({ _id: existingSlide._id });

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
      const presentation = await getAccessiblePresentation(
        req.params.id,
        req.user!.id,
      );
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

      const presentation = await getAccessiblePresentation(
        req.params.id,
        req.user!.id,
      );
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
