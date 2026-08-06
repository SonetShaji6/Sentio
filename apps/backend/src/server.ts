import express from "express";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";
import helmet from "helmet";
import dotenv from "dotenv";

dotenv.config();

import mongoose from "mongoose";
import cookieParser from "cookie-parser";
import { APP_NAME } from "@sentio/shared";
import authRoutes from "./routes/auth";
import presentationRoutes from "./routes/presentations";
import notificationRoutes from "./routes/notifications";
import Session from "./models/Session";

const app = express();
const server = http.createServer(app);
// ── CORS origins ──
const allowedOrigins = (process.env.CLIENT_URL || "http://localhost:3000")
  .split(",")
  .map((o) => o.trim().replace(/\/+$/, ""));

const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    credentials: true,
  },
});

// ── Middleware ──
app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
  }),
);
app.use(helmet());
app.use(express.json());
app.use(cookieParser());

// ── Routes ──
app.get("/health", (_req, res) => {
  res.status(200).json({ status: "ok", app: APP_NAME });
});

app.use("/api/auth", authRoutes);
app.use("/api/presentations", presentationRoutes);
app.use("/api/notifications", notificationRoutes);

// ── Socket.IO ──
io.on("connection", (socket) => {
  console.log("A user connected:", socket.id);

  // --- HOST EVENTS ---

  socket.on("host-start", async ({ presentationId, joinCode }) => {
    try {
      let session = await Session.findOne({
        presentationId,
        status: { $ne: "ended" },
      });
      if (!session) {
        session = new Session({
          presentationId,
          joinCode,
          status: "live",
          startedAt: new Date(),
          hostSocketId: socket.id,
        });
      } else {
        session.status = "live";
        session.hostSocketId = socket.id;
      }
      await session.save();

      socket.join(joinCode);
      io.to(joinCode).emit("session-started", { session });
    } catch (error) {
      console.error("host-start error:", error);
    }
  });

  socket.on("host-slide-change", async ({ joinCode, slideIndex }) => {
    try {
      const session = await Session.findOneAndUpdate(
        { joinCode },
        { currentSlideIndex: slideIndex },
        { new: true },
      );
      if (session) {
        io.to(joinCode).emit("slide-changed", { slideIndex });
      }
    } catch (error) {
      console.error("host-slide-change error:", error);
    }
  });

  socket.on("host-pause", async ({ joinCode }) => {
    await Session.updateOne({ joinCode }, { status: "paused" });
    io.to(joinCode).emit("session-paused");
  });

  socket.on("host-resume", async ({ joinCode }) => {
    await Session.updateOne({ joinCode }, { status: "live" });
    io.to(joinCode).emit("session-resumed");
  });

  socket.on("host-end", async ({ joinCode }) => {
    await Session.updateOne(
      { joinCode },
      { status: "ended", endedAt: new Date() },
    );
    io.to(joinCode).emit("session-ended");
  });

  // --- AUDIENCE EVENTS ---

  socket.on("join-session", async ({ joinCode, displayName }) => {
    try {
      const session = await Session.findOne({
        joinCode,
        status: { $ne: "ended" },
      });
      if (!session) {
        socket.emit("join-error", "Session not found or has ended.");
        return;
      }

      socket.join(joinCode);

      const existingParticipant = session.participants.find(
        (p) => p.displayName === displayName,
      );

      if (existingParticipant) {
        existingParticipant.socketId = socket.id;
        existingParticipant.isOnline = true;
      } else {
        session.participants.push({
          socketId: socket.id,
          displayName,
          joinedAt: new Date(),
          isOnline: true,
          score: 0,
          responses: [],
        });
      }

      await session.save();

      socket.emit("join-success", { session });
      io.to(joinCode).emit("audience-updated", {
        count: session.participants.filter((p) => p.isOnline).length,
      });
    } catch (error) {
      console.error("join-session error:", error);
      socket.emit("join-error", "An error occurred while joining.");
    }
  });

  socket.on("audience-submit", async ({ joinCode, response }) => {
    try {
      const session = await Session.findOne({ joinCode });
      if (session) {
        const participant = session.participants.find(
          (p) => p.socketId === socket.id,
        );
        if (participant) {
          participant.responses.push(response);
          // Example of generic scoring if it was a quiz
          if (response.isCorrect) participant.score += 10;
          await session.save();

          // Notify host of updated results
          io.to(joinCode).emit("results-updated", { session });
        }
      }
    } catch (error) {
      console.error("audience-submit error:", error);
    }
  });

  socket.on("disconnect", async () => {
    console.log("User disconnected:", socket.id);

    try {
      // Find session where this socket was a participant
      const session = await Session.findOne({
        "participants.socketId": socket.id,
      });
      if (session) {
        const participant = session.participants.find(
          (p) => p.socketId === socket.id,
        );
        if (participant) {
          participant.isOnline = false;
          await session.save();

          io.to(session.joinCode).emit("audience-updated", {
            count: session.participants.filter((p) => p.isOnline).length,
          });
        }
      }

      // Also check if this socket was a host
      const hostSession = await Session.findOne({
        hostSocketId: socket.id,
        status: { $ne: "ended" },
      });
      if (hostSession) {
        // Optionally emit something if the host drops
        // io.to(hostSession.joinCode).emit("host-disconnected");
      }
    } catch (error) {
      console.error("disconnect error:", error);
    }
  });
});

// ── Start ──
const PORT = process.env.PORT || 4000;
const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/sentio";

async function start() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log(`[${APP_NAME}] Connected to MongoDB`);
  } catch (err) {
    console.warn(`[${APP_NAME}] MongoDB not available – running without DB`);
  }

  server.listen(PORT, () => {
    console.log(`[${APP_NAME}] Backend server is running on port ${PORT}`);
  });
}

start();
